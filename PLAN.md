# Quoter rearchitecture plan

## Goal

Rebuild Quoter around a small, testable application core while preserving its current Discord feature set and familiar user experience. The new system should use stable quote numbers, query only the data each operation needs, recover cleanly from failures, and support repeatable releases and VPS operation.

## Initial implementation boundary

The initial implementation includes:

- A Bun workspace monorepo with the bot under `apps/bot`.
- The current Discord commands and context-menu command.
- SQLite storage and a tested MongoDB-to-SQLite migration tool.
- Stable per-guild quote numbers.
- Automated tests that do not require Discord credentials.
- CI, compiled Linux amd64 release artifacts, and versioned GitHub Releases.
- Pull-based production update tooling.
- VPS setup, security, backup, restore, and operations scripts and documentation.

The following work remains visible in this plan but cannot be completed during the initial implementation:

- The website app is deferred. The monorepo should be ready for a future `apps/web` workspace, but the initial repository should contain only `apps/bot`.
- Live Discord tests are deferred because no bot token or test guild credentials are available. Local tests must cover the application and persistence behavior without Discord.
- Production migration and deployment are deferred because there is no VPS, MongoDB, Backblaze B2, or GitHub production access. The initial implementation must prepare and test the scripts and runbooks with local fixtures.

## Decisions

- Keep TypeScript, Bun, and discord.js.
- Use Bun as the package manager and runtime.
- Use Bun workspaces for the monorepo. Do not add Turborepo during the initial implementation.
- Use SQLite through Bun's built-in SQLite support.
- Run one bot process against one local SQLite database on the VPS.
- Keep Fuse.js for typo-tolerant quote search. Load only the searchable fields for one guild before running Fuse.
- Give every quote a stable number within its guild. Deleted numbers are never reused.
- Keep guild data for 30 days after the bot last sees the guild.
- Compile the bot as a Linux amd64 Bun executable for releases.
- Run the executable directly under systemd. Docker remains an independent future option if the VPS later hosts services that benefit from containers.
- Use pull-based production updates. The VPS checks GitHub for releases and downloads them.
- Deploy production only from stable, versioned GitHub Releases.
- Treat Semantic Versioning releases as product and announcement milestones.
- Keep a human-written changelog.

## Target repository layout

```text
quoter/
├── apps/
│   └── bot/
│       ├── package.json
│       ├── src/
│       ├── test/
│       └── tsconfig.json
├── scripts/
│   ├── migration/
│   └── server/
├── docs/
│   ├── development.md
│   ├── deployment.md
│   ├── migration.md
│   ├── operations.md
│   ├── backup-and-restore.md
│   └── vps-setup.md
├── .github/
│   └── workflows/
├── package.json
├── bun.lock
├── biome.jsonc
├── CHANGELOG.md
└── README.md
```

Use one root lockfile. Keep the root package private and configure `apps/*` as workspaces. Add `packages/*` only when two applications need the same code. Keep shared lint and TypeScript settings at the root where Bun and the tools support that layout cleanly.

Root scripts should provide one entry point for common work:

- `bun run check`
- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build`
- `bun run start`
- `bun run deploy-commands`

## Application structure

Keep discord.js at the edge of the application. Commands should parse Discord input, call application functions, and render Discord responses.

Create plain TypeScript types and use cases for:

- Creating a quote.
- Fetching a quote by stable number.
- Selecting a random quote, with an optional author filter.
- Listing a page of quotes.
- Searching quotes.
- Editing and deleting quotes with ownership and permission checks supplied as input.
- Importing and exporting quotes.
- Counting guild and global quotes.
- Recording guild activity and deleting expired guild data.

Put SQL behind focused repository functions that accept primitive values and return plain objects. Avoid a generic repository layer. Each function should match a real operation, such as `getQuote`, `listQuotes`, `createQuote`, or `searchCandidates`.

Move input cleaning, quote validation, pagination, authorization decisions, import parsing, and response data construction into functions that can run without a Discord client. Keep Discord-specific builders and interaction calls in command modules.

Preserve the current command names and broad behavior:

- `/8-ball`
- `/about`
- `/bugs`
- `/create-quote`
- `/delete-own-quote`
- `/delete-quote`
- `/edit-own-quote`
- `/edit-quote`
- `/export`
- `/import`
- `/inspire`
- `/list-quotes`
- `/quote`
- `/search`
- `/who-quoted`
- `Quote This`

Review messages, permissions, cooldowns, and ephemeral response behavior while moving each command. Keep user-visible changes deliberate and record them in the changelog.

## SQLite data model

Create a migration system that runs before the Discord client logs in. Track each applied schema version in the database. Migrations must be ordered, transactional where SQLite permits it, and safe to run more than once through the normal startup path.

Use a `guilds` table with these fields:

- `guild_id TEXT PRIMARY KEY`
- `next_quote_number INTEGER NOT NULL DEFAULT 1`
- `max_quotes INTEGER NULL`
- `max_quote_length INTEGER NULL`
- `last_seen_at INTEGER NOT NULL`
- `left_at INTEGER NULL`
- `created_at INTEGER NOT NULL`

Use a `quotes` table with these fields:

- `guild_id TEXT NOT NULL`
- `quote_number INTEGER NOT NULL`
- `text TEXT NOT NULL`
- `author TEXT NULL`
- `quoter_id TEXT NULL`
- `editor_id TEXT NULL`
- `original_message_id TEXT NULL`
- `original_channel_id TEXT NULL`
- `created_at INTEGER NOT NULL`
- `edited_at INTEGER NULL`
- `PRIMARY KEY (guild_id, quote_number)`
- A foreign key from `guild_id` to `guilds.guild_id` with cascading deletion.

Add indexes for the queries that need them. This includes case-insensitive author filtering and any cleanup query based on guild activity. Confirm index use with SQLite query plans after the repository functions exist.

Enable foreign keys. Use WAL mode and a suitable busy timeout. Keep the database connection and prepared statements owned by one storage module. Close the connection during graceful shutdown.

Store Discord snowflakes as text. Store timestamps in one documented format, preferably integer Unix milliseconds to preserve the current values without lossy conversion.

## Stable quote numbers

Allocate quote numbers inside the same transaction that inserts the quote:

1. Ensure that the guild row exists.
2. Read and reserve `next_quote_number`.
3. Increment `next_quote_number`.
4. Insert the quote with the reserved number.
5. Commit the transaction.

Deletion must remove only the selected row. It must never decrement the counter or renumber another quote. Editing, viewing, ownership checks, search results, image generation, and list output must address quotes by their stored `quote_number`.

During MongoDB migration, assign each existing quote its current one-based array position. This preserves every quote number that users know at migration time. Set `next_quote_number` to one more than the highest migrated number. An empty guild starts at 1.

Imports should allocate fresh consecutive numbers from the guild counter in one transaction. Keep the existing import format compatible. Exports may include stable quote numbers as additional data, but re-importing an export must allocate new numbers unless a future restore-only mode defines stronger rules.

## Query behavior

Replace full guild-document reads with operation-specific SQL:

- Fetch a specific quote with `guild_id` and `quote_number`.
- Count quotes with `COUNT(*)`.
- Enforce the guild quote limit inside the create or import transaction.
- List quotes with a deterministic `ORDER BY quote_number`, `LIMIT`, and `OFFSET`.
- Select random quotes in SQL for the current data size. Preserve the stored number in the response.
- Apply case-insensitive author filtering in SQL.
- Calculate global quote totals with `COUNT(*)` for `/about`.
- Fetch all guild quotes only for export, where the full result is the requested output.

For `/search`, select only `quote_number`, `text`, and `author` for the current guild. Run Fuse.js over those plain objects and return the best five matches. Add tests for common typos, author matches, stable result numbers, and the current minimum search length. Benchmark with a fixture larger than the current largest guild. Consider SQLite FTS only if that measurement shows a real problem.

Avoid changing values returned from the repository when truncating list or search text. Presentation code should create shortened strings without mutating quote objects.

## Guild lifecycle and retention

Remove immediate guild deletion from the ready and guild-delete handlers.

Update `last_seen_at` and clear `left_at` when:

- A guild appears in the ready-time guild cache.
- The bot receives `guildCreate`.
- A guild interaction reaches Quoter.

When a confirmed `guildDelete` occurs and the guild is available, record `left_at`. Leave the data in place. Ignore unavailable guild-delete events because they can represent Discord outages.

Run a cleanup job at startup and then on a low-frequency timer. Delete guilds whose `last_seen_at` is older than 30 days. The foreign key should remove their quotes in the same database transaction. Log the number of deleted guilds without logging quote contents.

Set `last_seen_at` to the migration time for every migrated guild. This gives migrated data a full retention period before it can expire.

Document the retention rule in user-facing privacy information when the website work resumes.

## MongoDB migration

Build an offline migration command that reads the current MongoDB schema and writes a new SQLite database. Keep this tool separate from normal bot startup.

The migration command should support:

- Explicit source MongoDB URI and destination SQLite path.
- A dry-run mode that performs validation without replacing production data.
- A refusal to overwrite an existing destination unless an explicit safe option is supplied.
- Progress and summary output without quote text or credentials.
- Per-guild counts and a total count.
- Validation of required fields, timestamp ranges, limits, and quote ordering.
- A transaction that prevents a partially migrated destination from appearing complete.
- A machine-readable report for the deployment runbook.

Create sanitized MongoDB fixtures that cover empty guilds, custom limits, optional quote fields, Unicode, long text, and malformed records. Test the resulting SQLite rows and counters.

Prepare this production migration sequence in `docs/migration.md`:

1. Announce a short maintenance window if needed.
2. Stop the current PM2 bot so MongoDB stops changing.
3. Create and upload a final `mongodump` backup.
4. Run the migration into a new SQLite file.
5. Compare total and per-guild counts.
6. Check stable number assignments and selected records.
7. Install the new release and start the systemd service.
8. Check startup migrations, Discord readiness, logs, and representative commands.
9. Keep MongoDB and its final dump untouched through the rollback window.

Write rollback steps that stop the new service, restore the old PM2 process and MongoDB configuration, and preserve the new SQLite file for diagnosis.

The initial implementation can test this flow only with local fixtures. The production migration requires VPS and database access.

## Tests

Use Bun's test runner. Tests should run from a clean checkout without Discord, MongoDB, Backblaze, or other network credentials.

Add unit tests for:

- Quote text trimming and escaping.
- Length and guild-limit validation.
- Pagination and page bounds.
- Ownership rules for edit and delete operations.
- Import parsing and limits.
- Search ranking and typo tolerance.
- Discord response data built from application results.

Add SQLite integration tests using a fresh temporary database for each test or suite:

- Schema migration from an empty database.
- Stable number allocation.
- Concurrent or interleaved creates without duplicate numbers.
- Deletion without number reuse.
- Editing and fetching by stable number after earlier quotes are deleted.
- Random selection and case-insensitive author filtering.
- SQL pagination across gaps in quote numbers.
- Atomic imports and rollback after invalid input.
- Export ordering and compatibility.
- Guild last-seen updates and 30-day cleanup.
- Foreign-key cascades.
- Global and per-guild counts.

Add migration tests that compare MongoDB-shaped fixtures with expected SQLite records. Include a regression test for every production migration bug found later.

Keep a small set of command adapter tests with typed interaction fakes. Test parsing, defer/reply behavior, and error rendering. Avoid broad discord.js mocks that reproduce the framework.

Add a Linux build smoke test that starts the compiled executable in a mode that validates configuration, opens a temporary database, runs migrations, and exits before Discord login. This confirms that native canvas dependencies and packaged assets load correctly.

Live tests with a Discord application and test guild remain deferred. Document a manual smoke-test checklist for later use. It should cover command registration, each quote mutation, stable numbers, search, import/export, image generation, permission checks, and guild lifecycle events.

## Runtime resilience

Validate all configuration at startup with a schema. Report missing or invalid fields before connecting to Discord. Include the SQLite path, default quote limits, admin IDs, release version, and build SHA in the typed configuration.

Use one explicit startup sequence:

1. Validate configuration.
2. Open SQLite.
3. Apply schema migrations.
4. Initialize repositories and commands.
5. Log in to Discord.
6. Record readiness.

Handle `SIGINT` and `SIGTERM`. Stop timers, destroy the Discord client, close SQLite, and exit after a bounded shutdown period.

Log uncaught exceptions and unhandled promise rejections with stack traces and process context. Exit after an unrecoverable error so systemd can restart a clean process. Ensure every interaction reply, edit, and update promise is awaited or deliberately handled.

Use structured, single-line logs with severity, event name, command name, guild ID where useful, version, and build SHA. Exclude tokens, attachment URLs, quote text, author text, and exported data. Make command failures traceable through journal logs.

Review commands that can exceed Discord's initial response window. Defer early when database work, downloads, imports, exports, or image rendering may take long enough to miss it. Add timeouts and clear errors around imported attachment downloads.

Keep the current conservative discord.js cache limits. Confirm that the guild cache needed for guild presence still remains populated. Record cache behavior in a testable helper where possible.

Remove PM2-specific runtime files after the systemd deployment path is ready.

## Build and executable

Create a production build that compiles `apps/bot` into one Bun executable for Ubuntu 24.04 amd64.

The build must:

- Pin a supported Bun version in development and CI.
- Build on a compatible Linux amd64 runner.
- Include or place the image and font assets where the executable can load them.
- Include the package version and Git commit SHA.
- Load `@napi-rs/canvas` successfully on the target system.
- Produce a deterministic artifact name.
- Produce a SHA-256 checksum.
- Exclude secrets and the SQLite database.

Add a local development path that continues to run TypeScript directly with Bun. Keep executable-specific path handling out of command logic.

## CI

Add a pull-request workflow that:

- Installs the pinned Bun version.
- Uses the lockfile in frozen mode.
- Runs formatting and lint checks.
- Runs TypeScript checking.
- Runs all credential-free tests.
- Builds the Linux amd64 executable.
- Runs the executable smoke test.

Run the same validation after each merge to `main`. Upload a short-lived snapshot artifact named with the commit SHA. A `main` build is a CI artifact and does not create a GitHub Release or deploy production.

Protect `main` with required CI checks and reviewed pull requests. Development work should happen in branches.

## Versions, changelog, and GitHub Releases

Keep the bot version in `apps/bot/package.json`. Use tags such as `v6.0.0` while Quoter has one released application. The future website can deploy independently without its own package version unless a real need appears.

Maintain `CHANGELOG.md` for users and operators. Keep an `Unreleased` section. Relevant pull requests should add concise entries for user-visible behavior, security changes, migrations, or operator action. Internal work can remain in Git history when it has no effect on users or operation.

Create releases through a reviewed release PR that:

- Chooses the next Semantic Versioning number.
- Updates `apps/bot/package.json`.
- Moves completed changelog entries from `Unreleased` to a dated version section.
- Creates a fresh `Unreleased` section.

After that PR reaches `main`, a release workflow should detect that the version has no matching tag. It should validate the repository, build the exact commit, create a draft GitHub Release, attach the executable and checksum, use the curated changelog section as release notes, and publish the release. Enable immutable GitHub Releases after the workflow has been proven in a test repository or prerelease.

Use stable releases for production. Reserve GitHub prereleases such as `v6.0.0-beta.1` for builds that people can meaningfully test. The production updater must ignore prereleases and drafts.

Expose both identities in `/about` and startup logs:

```text
Quoter 6.1.0
Build a19c27f
```

Keep a manual release workflow trigger only for recovery or an intentional rerun. The version and changelog committed to the repository remain the release source.

## Pull-based production updates

Create a small updater script and systemd timer. The updater should:

- Query the public GitHub repository for the latest stable release.
- Ignore drafts and prereleases.
- Compare the release tag with the installed version.
- Use a lock so two updates cannot run together.
- Download the Linux amd64 executable and checksum into a temporary location.
- Verify the checksum before installation.
- Install releases into versioned directories.
- Switch the active executable through an atomic symlink update.
- Restart the bot service.
- Check that the service reaches a healthy running state.
- Restore the previous symlink and restart the old release after a failed check.
- Retain a small documented number of previous executables.
- Log the installed version and failure reason to journald.

Database schema migrations run when the new bot starts. Each SQLite migration must support the release rollback policy. A release that makes an irreversible schema change needs an explicit database backup and rollback note.

Do not place GitHub credentials on the VPS for a public repository unless API limits require them. If a token becomes necessary, give it read-only access and store it in a root-owned environment file.

The initial implementation should include and locally test the updater with fixture release metadata and a fake service command. Installing its timer and performing a production update require VPS access.

## VPS layout and systemd

Target Ubuntu 24.04.3 LTS on amd64.

Use separate locations and ownership:

```text
/opt/quoter/releases/        root-owned release binaries
/opt/quoter/current          symlink to the active release
/var/lib/quoter/             quoter-owned SQLite data
/etc/quoter/quoter.env       root-owned secrets and configuration
/var/backups/quoter/         restricted temporary backup staging
```

Create a dedicated `quoter` system user with no interactive shell. Run the bot service as that user. Give it write access only to its data directory. Keep release binaries and configuration protected from the service account.

Create systemd units for:

- The Quoter bot service.
- The release updater service and timer.
- The backup service and timer.
- Any low-frequency maintenance task that should run outside the bot process.

Configure the bot service with restart-on-failure, a bounded restart delay, startup limits, a working directory, the environment file, and systemd hardening that still permits Discord network access, SQLite writes, and canvas asset reads. Send stdout and stderr to journald.

The VPS can host other services later. Give each service its own Unix account, directories, systemd units, and firewall needs. The direct systemd design does not reserve the server for Quoter.

## VPS security

Write an idempotent or safely repeatable setup script and a manual verification guide. The guide must require the operator to keep the Bloom Host recovery console available and verify a second SSH session before closing the original session.

Configure:

- A named administrator account with sudo access and the existing SSH public key.
- SSH key authentication.
- Disabled SSH password authentication.
- Disabled direct root SSH login after administrator access is verified.
- UFW with incoming traffic denied by default, outgoing traffic allowed, and only SSH opened initially.
- Automatic Ubuntu security updates.
- A documented reboot policy for updates that require it.
- Time synchronization.
- Restricted permissions for service files, database files, backups, and credentials.
- Persistent journald limits so a noisy failure cannot fill the disk.

Add verification commands for SSH configuration, firewall state, pending updates, service ownership, open ports, disk space, timers, and recent failed units.

Avoid installing a general administration platform. Keep each setup step visible in scripts and documentation.

The initial implementation cannot apply or verify these changes on the production VPS.

## Backup and restore

Replace the current daily `mongodump` job after the production migration. Continue uploading one backup per day to Backblaze B2 with 30-day retention.

Create a consistent SQLite backup through SQLite's online backup facility or another SQLite-aware method. Do not copy only the main database file while WAL writes can be active.

The backup job should:

- Create a consistent database snapshot in a restricted staging directory.
- Run an integrity check on the snapshot.
- Record the application version and database schema version in backup metadata.
- Compress the snapshot and metadata.
- Upload them to the existing private B2 bucket.
- Verify that the upload completed.
- Remove local staging data after success according to a short local retention policy.
- Emit a clear systemd failure when any step fails.

Store B2 credentials in a root-owned file that the backup service can read. Keep them out of the repository, process arguments, and logs.

Write a restore script and runbook that restore into a new path, verify integrity, stop Quoter, replace the database safely, set ownership, start Quoter, and check logs. Test restoration regularly with a temporary local database. Production restore testing requires access to B2 and the VPS.

Bloom Host snapshots are optional. The documented rebuild path, release artifacts, configuration inventory, and B2 database backups must be sufficient when provider snapshots are unavailable.

## Documentation

Update `README.md` after the code moves. It should describe Bun workspaces, SQLite, local development, tests, command registration, and self-hosting with systemd. Remove MongoDB and PM2 instructions when their replacements work.

Add:

- `docs/development.md` for local setup, scripts, architecture, and tests.
- `docs/migration.md` for MongoDB conversion, validation, cutover, and rollback.
- `docs/deployment.md` for CI artifacts, release PRs, GitHub Releases, and updater behavior.
- `docs/operations.md` for service status, logs, manual rollback, command deployment, disk checks, and incident diagnosis.
- `docs/backup-and-restore.md` for B2 setup, backup verification, and restoration.
- `docs/vps-setup.md` for Ubuntu hardening and repeatable server setup.

Document every environment variable with its type, default, sensitivity, and whether a restart is required after changing it.

## Implementation sequence

### Phase 1: Monorepo and development baseline

- Move the bot into `apps/bot`.
- Configure Bun workspaces and root scripts.
- Add a dedicated type-check script and make current linting accurate.
- Pin the Bun version used by developers and CI.
- Add the initial CI workflow.
- Update paths for assets, package metadata, command deployment, and TypeScript aliases.
- Confirm that the bot can start far enough to validate missing credentials cleanly.

### Phase 2: Testable application boundaries

- Define plain quote, guild, pagination, and import/export types.
- Extract validation and formatting logic from Discord command modules.
- Define focused storage interfaces from the needs of each use case.
- Add Bun unit tests for the extracted behavior.
- Keep command output compatible while adapters become thinner.

### Phase 3: SQLite storage

- Add the database connection and schema migration runner.
- Create the guild and quote tables and indexes.
- Implement prepared, operation-specific queries.
- Implement transactional stable quote allocation.
- Add SQLite integration tests.
- Add last-seen tracking and retention cleanup.

### Phase 4: Command migration

- Move every quote command from Mongoose documents to application use cases.
- Update list, random, author, and search behavior to preserve stored quote numbers.
- Keep Fuse.js search over selected guild fields.
- Update `/about` counts and build information.
- Review interaction timing, awaited replies, permissions, and error handling.
- Remove Mongoose and MongoDB runtime configuration after every command uses SQLite.

### Phase 5: Data migration tooling

- Build the offline MongoDB-to-SQLite migration command.
- Add sanitized migration fixtures and automated validation tests.
- Produce migration reports and document production cutover and rollback.
- Keep execution against production MongoDB deferred.

### Phase 6: Resilience and observability

- Add typed startup configuration.
- Add structured logs and process-level failure reporting.
- Implement graceful `SIGINT` and `SIGTERM` shutdown.
- Add download timeouts and safer import failures.
- Add the credential-free executable smoke-test mode.
- Verify clean recovery after simulated storage and command failures.

### Phase 7: Build, CI, and releases

- Compile and verify the Ubuntu amd64 executable.
- Package assets, version metadata, build SHA, and checksum.
- Upload main-branch snapshot artifacts.
- Add the release PR convention and changelog.
- Add the version-triggered stable GitHub Release workflow.
- Keep production deployment restricted to stable versioned releases.

### Phase 8: VPS automation and runbooks

- Add systemd service, updater, backup, and timer templates.
- Add the pull updater with checksum verification and rollback.
- Add Ubuntu setup and security scripts.
- Adapt the B2 backup flow for SQLite and add restore tooling.
- Test scripts locally or in a disposable Ubuntu environment.
- Leave production installation, migration, live Discord testing, and deployment deferred until access is available.

### Phase 9: Deferred website

- Add `apps/web` when website work begins.
- Decide its framework, hosting, and data needs at that time.
- Extract shared packages only when the bot and website have concrete shared code.
- Update privacy documentation with the 30-day guild-data retention policy.

## Initial implementation completion criteria

The code implementation is ready for a credentialed rollout when:

- The repository is a Bun workspace monorepo with `apps/bot` as its only app.
- All current commands compile against the new application and SQLite layers.
- Existing MongoDB array positions migrate to stable quote numbers.
- Deleting one quote cannot change another quote's number.
- Routine commands no longer load every field for every guild quote.
- Typo-tolerant search works with Fuse.js and preserves stable numbers.
- Guild data expires only after 30 days without being seen.
- Unit, SQLite integration, migration, and executable smoke tests pass without credentials.
- Pull requests and `main` run the complete CI suite.
- Stable version bumps can produce a draft, checksummed Linux amd64 GitHub Release in a safe test context.
- The updater, systemd units, VPS setup, SQLite backup, restore, migration, and rollback paths have scripts and runbooks.
- `README.md` and the operations documentation match the new architecture.
- The remaining credentialed Discord tests and production steps are clearly marked and can be followed without reconstructing design decisions.
