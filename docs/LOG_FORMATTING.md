# Log Formatting System Documentation

## Overview

The enhanced log formatting system provides intelligent parsing and syntax highlighting for server logs, specifically designed to handle complex nested JSON structures common in MCP (Model Context Protocol) responses and backend logging systems.

## Architecture

### Core Components

1. **`/src/utils/logFormatter.js`** - Core formatting utilities
2. **`/src/styles/log-formatting.css`** - Syntax highlighting styles
3. **`/src/composables/useServerLogs.js`** - Integration with Vue components
4. **`/src/components/ServerLogs.vue`** - UI component for log display

## Features

### 🔍 Smart JSON Parsing

The system automatically detects and handles multiple levels of JSON stringification:

```javascript
// Input: Complex nested stringified JSON
{
  "output": "{\"jsonrpc\":\"2.0\",\"result\":{\"content\":[{\"text\":\"{\\\"results\\\":[...]}"}]}}"
}

// Output: Properly parsed and formatted structure
{
  "output": {
    "jsonrpc": "2.0",
    "result": {
      "content": [
        {
          "text": {
            "results": [...]
          }
        }
      ]
    }
  }
}
```

### 🎨 Syntax Highlighting

#### Color Scheme (Light Theme)

- **JSON Keys**: Blue (#0451a5)
- **Strings**: Dark blue (#032f62)
- **Numbers**: Green (#098658)
- **Booleans**: Blue (#0000ff)
- **Null values**: Blue italic (#0000ff)
- **Timestamps**: Purple with background (#7c4dff)
- **URLs**: Blue underlined (#1976d2)
- **Log levels**: Color-coded badges with backgrounds

#### Log Level Colors

- **ERROR**: Red (#d32f2f) with light red background
- **WARN**: Orange (#f57c00) with light orange background
- **INFO**: Blue (#1976d2) with light blue background
- **DEBUG**: Gray (#666) with light gray background

### 🌙 Dark Theme Support

All colors automatically adapt to dark themes:

- **JSON Keys**: Light blue (#9cdcfe)
- **Strings**: Peach (#ce9178)
- **Numbers**: Light green (#b5cea8)
- **Timestamps**: Purple (#c586c0)
- And more...

## API Reference

### `formatLogEntry(log)`

Formats a standard log entry with timestamp, level, message, and metadata.

```javascript
const formatted = formatLogEntry({
	timestamp: '2025-07-29T06:08:42.000Z',
	level: 'debug',
	message: 'MCP server response',
	meta: { nested: { json: 'data' } },
});
```

**Returns**: HTML string with syntax highlighting

### `formatRawLogOutput(rawOutput)`

Formats raw JSON output by detecting and parsing nested stringification.

```javascript
const formatted = formatRawLogOutput('{"output": "{\\"jsonrpc\\":\\"2.0\\"}"}');
```

**Returns**: HTML string with parsed and formatted JSON

### `extractMcpInfo(logData)`

Extracts meaningful information from MCP JSON-RPC responses.

```javascript
const mcpInfo = extractMcpInfo({
	output: '{"jsonrpc":"2.0","result":{"content":[...]}}',
	pid: 241,
	logType: 'system',
});
```

**Returns**: Object with extracted MCP response data or null

## CSS Classes

### JSON Structure

- `.json-key` - Object property names
- `.json-string` - String values
- `.json-number` - Numeric values
- `.json-boolean` - Boolean values
- `.json-null` - Null values
- `.json-bracket` - Brackets and braces `{}[]`
- `.json-colon` - Colons in key-value pairs

### Special Values

- `.json-timestamp` - Detected timestamp strings
- `.json-url` - Detected URL strings

### Log Components

- `.log-timestamp` - Log entry timestamps
- `.log-level` - Log level badges
- `.log-level-error` - Error level styling
- `.log-level-warn` - Warning level styling
- `.log-level-info` - Info level styling
- `.log-level-debug` - Debug level styling
- `.log-message` - Log message text
- `.log-source` - Source prefixes ([BACKEND], [MCP])

### Container

- `.enhanced-log-display` - Main container with monospace font and styling

## Integration Example

### In Vue Component

```vue
<template>
	<div class="enhanced-log-display" v-html="formattedLogs"></div>
</template>

<script setup>
	import { computed } from 'vue';
	import { formatLogEntry } from '@/utils/logFormatter';

	const logs = ref([
		{
			timestamp: '2025-07-29T06:08:42.000Z',
			level: 'info',
			message: 'Light control successful',
			meta: { lightId: 'd073d58529b9', status: 'ok' },
		},
	]);

	const formattedLogs = computed(() => {
		return logs.value.map((log) => formatLogEntry(log)).join('\n\n');
	});
</script>

<style>
	@import '@/styles/log-formatting.css';
</style>
```

### With Copy Functionality

```javascript
// When copying, strip HTML tags for clean text
const copyLogs = async () => {
	const cleanText = formattedLogs.value.replace(/<[^>]*>/g, '');
	await navigator.clipboard.writeText(cleanText);
};
```

## Performance Considerations

- **Lazy Processing**: Logs are only formatted when displayed
- **Efficient Parsing**: Smart parsing stops at the first non-JSON string
- **Memory Friendly**: No unnecessary object duplication
- **CSS Classes**: Uses CSS classes instead of inline styles for better performance

## Troubleshooting

### Common Issues

1. **HTML Not Rendering**: Ensure you're using `v-html` directive in Vue templates
2. **Styles Not Applied**: Import the CSS file or verify CSS class names
3. **Parsing Errors**: Check console for JSON parsing errors (gracefully handled)
4. **Dark Theme**: Ensure your app has proper dark theme detection

### Debug Mode

Enable debug logging in development:

```javascript
// In logFormatter.js, uncomment debug lines for detailed parsing info
console.log('Parsing JSON:', str);
console.log('Parsed result:', parsed);
```

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome 80+, Firefox 75+, Safari 13+)
- **CSS Classes**: Uses standard CSS, no experimental features
- **JavaScript**: ES6+ features (const, let, arrow functions, template literals)

## Future Enhancements

Potential improvements for future versions:

1. **Collapsible JSON Trees**: Click to expand/collapse large objects
2. **Search Functionality**: Highlight search terms in logs
3. **Export Options**: Export formatted logs in multiple formats
4. **Custom Themes**: User-configurable color schemes
5. **Performance Optimization**: Virtual scrolling for large log sets
