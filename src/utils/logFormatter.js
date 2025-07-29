/**
 * Log formatting utilities for cleaning up server logs
 * Handles nested JSON parsing and syntax highlighting
 *
 * This module provides intelligent parsing and formatting for complex log structures,
 * particularly those with multiple levels of JSON stringification (common in MCP responses).
 *
 * Key Features:
 * - Smart JSON parsing that handles nested stringification
 * - Syntax highlighting with CSS classes for different data types
 * - Special handling for timestamps, URLs, and MCP JSON-RPC responses
 * - HTML-safe escaping while preserving formatting
 * - Dark theme support through CSS class targeting
 *
 * @example
 * // Basic usage
 * import { formatLogEntry, formatRawLogOutput } from './logFormatter.js';
 *
 * // Format a standard log entry
 * const formatted = formatLogEntry({
 *   timestamp: '2025-07-29T06:08:42.000Z',
 *   level: 'debug',
 *   message: 'MCP server response',
 *   meta: { complex: { nested: { json: "data" } } }
 * });
 *
 * // Format raw JSON output (like MCP responses)
 * const rawFormatted = formatRawLogOutput('{"output": "{\\"jsonrpc\\":\\"2.0\\"}"}');
 */

/**
 * Attempts to parse a string as JSON, handling multiple levels of stringification
 *
 * This function intelligently handles cases where JSON has been stringified multiple times,
 * which is common in logging systems and MCP responses where data flows through
 * multiple serialization layers.
 *
 * @param {string} str - The string to parse as JSON
 * @returns {any} The parsed JSON object, or the original string if parsing fails
 *
 * @example
 * smartJsonParse('{"key": "value"}') // → {key: "value"}
 * smartJsonParse('"{\"key\": \"value\"}"') // → {key: "value"} (double-stringified)
 * smartJsonParse('not json') // → "not json" (returns original)
 */
function smartJsonParse(str) {
	if (typeof str !== 'string') return str;

	try {
		let parsed = JSON.parse(str);

		// If the result is still a string, try parsing again (nested stringification)
		if (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed);
			} catch (e) {
				// If second parse fails, return the first parse result
				return parsed;
			}
		}

		return parsed;
	} catch (e) {
		return str;
	}
}

/**
 * Recursively processes an object to parse any stringified JSON values
 *
 * Walks through all properties of an object, arrays, and nested structures,
 * attempting to parse any string values that might be stringified JSON.
 * This is particularly useful for log data where nested objects may have
 * been serialized at different stages.
 *
 * @param {any} obj - The object to process
 * @returns {any} The processed object with parsed JSON strings
 *
 * @example
 * deepJsonParse({
 *   data: '{"nested": "value"}',
 *   array: ['{"item": 1}', 'plain string'],
 *   number: 42
 * })
 * // → {
 * //   data: {nested: "value"},
 * //   array: [{item: 1}, "plain string"],
 * //   number: 42
 * // }
 */
function deepJsonParse(obj) {
	if (typeof obj === 'string') {
		return smartJsonParse(obj);
	}

	if (Array.isArray(obj)) {
		return obj.map(deepJsonParse);
	}

	if (obj && typeof obj === 'object') {
		const result = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = deepJsonParse(value);
		}
		return result;
	}

	return obj;
}

/**
 * Formats JSON with syntax highlighting classes
 *
 * Converts JSON objects into HTML strings with appropriate CSS classes
 * for syntax highlighting. Handles proper indentation, special value types
 * (timestamps, URLs), and maintains proper JSON structure formatting.
 *
 * CSS Classes Applied:
 * - json-key: Object property names
 * - json-string: String values
 * - json-number: Numeric values
 * - json-boolean: Boolean values
 * - json-null: null values
 * - json-timestamp: Detected timestamp strings
 * - json-url: Detected URL strings
 * - json-bracket: Brackets and braces
 * - json-colon: Colons in key-value pairs
 *
 * @param {any} obj - The object to format
 * @param {number} indent - Current indentation level (for recursion)
 * @returns {string} HTML string with syntax highlighting classes
 *
 * @example
 * formatJsonWithHighlighting({
 *   timestamp: "2025-07-29T06:08:42.000Z",
 *   status: "ok",
 *   count: 42,
 *   active: true
 * })
 * // Returns HTML string with appropriate CSS classes for each value type
 */
function formatJsonWithHighlighting(obj, indent = 0) {
	const spaces = '  '.repeat(indent);

	if (obj === null) return '<span class="json-null">null</span>';
	if (obj === undefined) return '<span class="json-undefined">undefined</span>';

	if (typeof obj === 'boolean') {
		return `<span class="json-boolean">${obj}</span>`;
	}

	if (typeof obj === 'number') {
		return `<span class="json-number">${obj}</span>`;
	}

	if (typeof obj === 'string') {
		// Special handling for timestamps
		if (isTimestamp(obj)) {
			return `<span class="json-timestamp">"${obj}"</span>`;
		}
		// Special handling for URLs
		if (isUrl(obj)) {
			return `<span class="json-url">"${obj}"</span>`;
		}
		return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
	}

	if (Array.isArray(obj)) {
		if (obj.length === 0) return '<span class="json-bracket">[]</span>';

		const items = obj
			.map((item, index) => {
				const comma = index < obj.length - 1 ? ',' : '';
				return `${spaces}  ${formatJsonWithHighlighting(
					item,
					indent + 1
				)}${comma}`;
			})
			.join('\n');

		return `<span class="json-bracket">[</span>\n${items}\n${spaces}<span class="json-bracket">]</span>`;
	}

	if (typeof obj === 'object') {
		const keys = Object.keys(obj);
		if (keys.length === 0) return '<span class="json-bracket">{}</span>';

		const items = keys
			.map((key, index) => {
				const comma = index < keys.length - 1 ? ',' : '';
				return `${spaces}  <span class="json-key">"${escapeHtml(
					key
				)}"</span><span class="json-colon">:</span> ${formatJsonWithHighlighting(
					obj[key],
					indent + 1
				)}${comma}`;
			})
			.join('\n');

		return `<span class="json-bracket">{</span>\n${items}\n${spaces}<span class="json-bracket">}</span>`;
	}

	return String(obj);
}

/**
 * Checks if a string looks like a timestamp
 */
function isTimestamp(str) {
	// ISO 8601 format
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) return true;
	// Common log timestamp formats
	if (/^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/.test(str))
		return true;
	if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) return true;
	return false;
}

/**
 * Checks if a string looks like a URL
 */
function isUrl(str) {
	try {
		new URL(str);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Escapes HTML characters
 */
function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;');
}

/**
 * Formats a timestamp with highlighting
 */
function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	const formatted = date.toLocaleString();
	return `<span class="log-timestamp">[${formatted}]</span>`;
}

/**
 * Formats a log level with appropriate styling
 */
function formatLogLevel(level) {
	const upperLevel = level.toUpperCase().padEnd(5);
	return `<span class="log-level log-level-${level.toLowerCase()}">${upperLevel}</span>`;
}

/**
 * Main function to format a log entry with pretty printing and syntax highlighting
 */
export function formatLogEntry(log) {
	const timestamp = formatTimestamp(log.timestamp);
	const level = formatLogLevel(log.level);
	const message = `<span class="log-message">${escapeHtml(log.message)}</span>`;

	let formattedMeta = '';
	if (log.meta) {
		try {
			// Deep parse any nested JSON in the meta object
			const parsedMeta = deepJsonParse(log.meta);
			formattedMeta = '\n' + formatJsonWithHighlighting(parsedMeta);
		} catch (e) {
			// Fallback to regular JSON formatting if parsing fails
			formattedMeta = '\n' + formatJsonWithHighlighting(log.meta);
		}
	}

	return `${timestamp} ${level} ${message}${formattedMeta}`;
}

/**
 * Formats raw log output (like your sample) by detecting and parsing nested JSON
 */
export function formatRawLogOutput(rawOutput) {
	try {
		// First, try to parse the outer JSON structure
		let parsed = JSON.parse(rawOutput);

		// Deep parse to handle nested stringification
		parsed = deepJsonParse(parsed);

		// Format with syntax highlighting
		return formatJsonWithHighlighting(parsed);
	} catch (e) {
		// If parsing fails, return the original with basic HTML escaping
		return `<span class="log-raw">${escapeHtml(rawOutput)}</span>`;
	}
}

/**
 * Extracts meaningful information from MCP JSON-RPC responses
 */
export function extractMcpInfo(logData) {
	if (!logData || !logData.output) return null;

	try {
		const parsed = deepJsonParse(logData.output);

		// Check if it's a JSON-RPC response
		if (parsed.jsonrpc && parsed.result) {
			const result = parsed.result;

			// Extract content if available
			if (result.content && result.content[0] && result.content[0].text) {
				try {
					const contentData = JSON.parse(result.content[0].text);
					return {
						type: 'mcp-response',
						id: parsed.id,
						content: contentData,
						timestamp: logData.timestamp || new Date().toISOString(),
					};
				} catch (e) {
					return {
						type: 'mcp-response',
						id: parsed.id,
						content: result.content[0].text,
						timestamp: logData.timestamp || new Date().toISOString(),
					};
				}
			}
		}

		return null;
	} catch (e) {
		return null;
	}
}
