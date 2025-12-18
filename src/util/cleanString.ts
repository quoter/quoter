/**
 * Removes hyperlinks & (optionally) newlines from a string
 * @param string The string to clean
 * @param replaceNewlines Whether to replace newlines with spaces
 * @returns The cleaned string
 */
export default function cleanString(
	string: string,
	replaceNewlines: boolean = true,
): string {
	if (!string) return string;

	string = string.replaceAll("\\", "\\\\");
	string = string.replaceAll("[", "\\[");
	if (replaceNewlines) string = string.replaceAll("\n", " ");

	return string;
}
