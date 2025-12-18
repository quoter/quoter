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
