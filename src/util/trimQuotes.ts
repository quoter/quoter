/*
Copyright (C) 2020-2023 Nick Oates

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Removes double quotes from the start and end of a string if both are present
 * @param string Text to trim
 * @returns The trimmed string
 */
export default function trimQuotes(string: string) {
	if (string.startsWith('"') && string.endsWith('"')) {
		string = string.slice(1, -1);
	}

	return string;
}
