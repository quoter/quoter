# Changelog

## Unreleased

### Added

- Added stable per-server quote numbers that remain valid after deletions.
- Added typed SQLite storage and a MongoDB migration command.
- Added automated checks, release builds, and repeatable server operations.

### Changed

- Quote operations now query only the data they need.
- Guild data is retained for 30 days after Quoter last sees the guild.
- Production deployments use stable, versioned GitHub Releases.

## 5.2.1

- Previous release. See the Git history for older changes.
