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
 * Removes hyperlinks & (optionally) newlines from a string
 * @param {string} string - The string to clean
 * @param {boolean} replaceNewlines - Whether to replace newlines with spaces
 * @returns {string} - The cleaned string
 */
module.exports = (string, replaceNewlines = true) => {
	if (!string) return string;

	string = string.replaceAll("\\", "\\\\");
	string = string.replaceAll("[", "\\[");
	if (replaceNewlines) string = string.replaceAll("\n", " ");

	return string;
};
