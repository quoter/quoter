/*
Copyright (C) 2020-2022 Nicholas Christopher

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
 * Trims any double quotes (") from the start & end of a string. Only trims if quotes are present on both sides.
 * @param {string} string The text to trim
 * @returns {string} The trimmed string
 */
module.exports = (string) => {
	if (string.startsWith('"') && string.endsWith('"')) {
		string = string.slice(1, -1);
	}

	return string;
};
