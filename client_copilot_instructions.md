# LIFX-Claude Client-Side Copilot Instructions

## Project Overview

This is the **client-side Vue.js SPA** portion of a split LIFX-Claude smart light control application. The client will be deployed on **GitHub Pages** and communicates with a separate backend server hosted on Railway.

### Original Project Context

- **Source**: Migrated from https://github.com/tenace2/lifx-claude-vue
- **Architecture**: Split from monolithic local dev app to client-server production architecture
- **Purpose**: Educational/demo app showcasing MCP (Model Context Protocol) integration with LIFX lights and Claude AI

### Technology Stack

- **Frontend Framework**: Vue.js 3 + Composition API
- **UI Framework**: Quasar Framework
- **Build Tool**: Vite
- **Deployment**: GitHub Pages (static hosting)
- **API Communication**: HTTP/REST to Railway backend

## Key Features to Implement

### 1. User API Key Management

```vue
<!-- Users must provide their own API keys -->
<template>
	<q-input
		v-model="lifxApiKey"
		type="password"
		label="LIFX API Key"
		hint="Enter your LIFX API token (from cloud.lifx.com/settings)"
	/>
	<q-input
		v-model="claudeApiKey"
		type="password"
		label="Claude API Key"
		hint="Enter your Claude API key (from console.anthropic.com)"
	/>
</template>
```

### 2. Backend Server Status Monitoring

```javascript
// Monitor Railway backend server health
const backendStatus = ref('disconnected');
const checkBackendHealth = async () => {
	try {
		const response = await fetch(`${BACKEND_URL}/health`);
		backendStatus.value = response.ok ? 'connected' : 'error';
	} catch (error) {
		backendStatus.value = 'disconnected';
	}
};
```

### 3. Session Management & Usage Tracking

```javascript
// Generate unique session ID for rate limiting
const sessionId =
	sessionStorage.getItem('demo_session_id') ||
	`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
sessionStorage.setItem('demo_session_id', sessionId);

// Track API usage
const requestsUsed = ref(0);
const requestsRemaining = ref(100);
```

### 4. Core Components

#### TokenManager.vue

- LIFX API key input (password field)
- Backend server status indicator
- Connection testing

#### ServerLogs.vue (Enhanced Formatting)

- **Intelligent JSON Parsing**: Automatically detects and parses nested stringified JSON from MCP responses
- **Syntax Highlighting**: Color-coded display for JSON keys, values, timestamps, URLs, and log levels
- **Time-based Filtering**: 15 minutes, 1 hour, and 4 hours options
- **Multi-source Display**: Combined view and separate tabs for backend/MCP logs
- **Copy Functionality**: HTML tags automatically stripped for clean text copying
- **Dark Theme Support**: All colors adapt to light/dark themes
- **Smart Formatting**: Handles complex log structures like:
  ```json
  {
  	"output": "{\"jsonrpc\":\"2.0\",\"result\":{\"content\":[{\"text\":\"{\\\"results\\\":[...]}\"}]}}"
  }
  ```
  Into properly formatted, readable JSON with full syntax highlighting

#### ClaudeChat.vue

- Claude API key input (password field)
- Chat interface with message history
- System prompt controls (enable/disable guardrails)
- Client-side keyword filtering
- Token counting and cost estimation
- Usage quota display (requests used/remaining)

#### LightControls.vue

- Quick light control interface
- Color picker, brightness slider
- On/off toggles
- Direct LIFX control (bypass Claude)

### 5. API Communication Patterns

#### Backend API Endpoints

```javascript
const BACKEND_URL =
	process.env.NODE_ENV === 'production'
		? 'https://your-app.railway.app'
		: 'http://localhost:3001';

// All requests include session ID and access key
const apiHeaders = {
	'Content-Type': 'application/json',
	'X-Session-ID': sessionId,
	'X-Demo-Key': 'LifxDemo', // Simple access control
};
```

#### Claude Chat API Call

```javascript
const sendClaudeMessage = async (message) => {
	const response = await fetch(`${BACKEND_URL}/api/claude`, {
		method: 'POST',
		headers: apiHeaders,
		body: JSON.stringify({
			message,
			claudeApiKey: claudeApiKey.value,
			lifxApiKey: lifxApiKey.value,
			systemPromptEnabled: systemPromptEnabled.value,
			maxTokens: maxTokens.value,
		}),
	});

	// Update usage counters from response headers
	requestsUsed.value = parseInt(response.headers.get('X-Requests-Used') || 0);
	requestsRemaining.value = parseInt(
		response.headers.get('X-Requests-Remaining') || 100
	);

	return response.json();
};
```

## Security & Rate Limiting

### Client-Side Protections

1. **Keyword Filtering**: Pre-filter messages before sending to backend

```javascript
const lightKeywords = [
	'light',
	'lamp',
	'color',
	'bright',
	'dim',
	'on',
	'off',
	'lifx',
];
const hasLightKeywords = (message) =>
	lightKeywords.some((keyword) => message.toLowerCase().includes(keyword));
```

2. **Input Validation**: Validate API key formats before sending

```javascript
const validateApiKeys = () => {
	if (claudeApiKey.value && !claudeApiKey.value.startsWith('sk-ant-')) {
		throw new Error('Invalid Claude API key format');
	}
	if (lifxApiKey.value && lifxApiKey.value.length < 20) {
		throw new Error('Invalid LIFX API key format');
	}
};
```

3. **Request Limiting**: Show usage quotas and prevent over-usage

```javascript
const canSendRequest = computed(() => requestsRemaining.value > 0);
```

### Error Handling

```javascript
// Handle rate limiting responses
if (response.status === 429) {
	const error = await response.json();
	if (error.code === 'SESSION_LIMIT') {
		// Show session limit reached dialog
		showSessionLimitDialog();
		return;
	}
	if (error.code === 'MULTIPLE_SESSIONS') {
		// Show IP session conflict dialog
		showSessionConflictDialog();
		return;
	}
}
```

## GitHub Pages Deployment

### Build Configuration

```javascript
// vite.config.js for GitHub Pages
export default defineConfig({
	base: '/lifx-claude-client/', // Repository name
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
	},
	define: {
		'process.env': {
			NODE_ENV: JSON.stringify(process.env.NODE_ENV),
			BACKEND_URL: JSON.stringify(
				process.env.BACKEND_URL || 'https://your-app.railway.app'
			),
		},
	},
});
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Development Guidelines

### State Management

- Use Vue 3 Composition API with `ref()` and `reactive()`
- Store API keys in component state (not localStorage - session only)
- Persist session ID in sessionStorage
- Use Pinia if complex state management is needed

### Component Structure

```
src/
├── components/
│   ├── TokenManager.vue      # LIFX API key & server status
│   ├── ClaudeChat.vue        # Claude chat interface
│   ├── LightControls.vue     # Quick light controls
│   └── UsageIndicator.vue    # Session usage display
├── composables/
│   ├── useBackendApi.js      # Backend API communication
│   ├── useApiKeys.js         # API key management
│   └── useSessionTracking.js # Session and usage tracking
├── services/
│   ├── claudeApi.js          # Claude API integration
│   └── lifxApi.js            # LIFX API integration
└── utils/
    ├── validation.js         # Input validation helpers
    └── security.js           # Security utilities
```

## Enhanced Log Formatting System

### Overview

The application includes an intelligent log formatting system designed to handle complex nested JSON structures common in MCP responses and backend logging.

### Core Components

```
src/
├── utils/
│   └── logFormatter.js      # Smart JSON parsing and formatting utilities
├── styles/
│   └── log-formatting.css   # Syntax highlighting styles
└── components/
    └── ServerLogs.vue       # Enhanced log display component
```

### Key Features

#### Smart JSON Parsing

```javascript
// Handles multiple levels of JSON stringification automatically
const complexLog = {
	output:
		'{"jsonrpc":"2.0","result":{"content":[{"text":"{\\"lights\\":[...]}"}]}}',
};

// Automatically parsed into readable structure:
const formatted = formatRawLogOutput(JSON.stringify(complexLog));
// Results in properly indented, color-coded JSON
```

#### Syntax Highlighting Implementation

```vue
<!-- In ServerLogs.vue -->
<template>
	<div class="enhanced-log-display" v-html="formattedLogs"></div>
</template>

<script setup>
	import { formatLogEntry } from '@/utils/logFormatter';
	import '@/styles/log-formatting.css';

	const formattedLogs = computed(() => {
		return logs.value.map((log) => formatLogEntry(log)).join('\n\n');
	});
</script>
```

#### CSS Class Structure

```css
/* JSON syntax highlighting */
.json-key {
	color: #0451a5;
} /* Property names */
.json-string {
	color: #032f62;
} /* String values */
.json-number {
	color: #098658;
} /* Numbers */
.json-timestamp {
	color: #7c4dff;
} /* Detected timestamps */
.json-url {
	color: #1976d2;
} /* Detected URLs */

/* Log level badges */
.log-level-error {
	color: #d32f2f;
	background: rgba(211, 47, 47, 0.1);
}
.log-level-warn {
	color: #f57c00;
	background: rgba(245, 124, 0, 0.1);
}
.log-level-info {
	color: #1976d2;
	background: rgba(25, 118, 210, 0.1);
}
.log-level-debug {
	color: #666;
	background: rgba(102, 102, 102, 0.1);
}
```

#### Integration Pattern

```javascript
// In useServerLogs.js
import { formatLogEntry, extractMcpInfo } from '@/utils/logFormatter';

const getCombinedLogs = () => {
	const combined = [];

	backendLogs.value.forEach((log) => {
		const mcpInfo = extractMcpInfo(log);
		combined.push({
			...log,
			source: 'backend',
			htmlContent: `<span class="log-source backend">[BACKEND]</span> ${formatLogEntry(
				log
			)}`,
			mcpInfo,
		});
	});

	return combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};
```

### Styling & UI

- Use Quasar components for consistent design
- Implement responsive design for mobile devices
- Use dark/light theme support
- Add loading states and error messages
- Include usage indicators and progress bars

### Testing

- Test with both valid and invalid API keys
- Test rate limiting scenarios
- Test backend disconnection handling
- Test session management across browser tabs
- Test GitHub Pages deployment with production backend

## Important Notes

### API Key Security

- **NEVER** store API keys in localStorage or commit them to git
- API keys should only exist in password input fields during session
- Users are responsible for their own API usage and costs
- Clear API keys when user closes browser/tab

### Backend Communication

- Always include session ID in requests for rate limiting
- Handle backend unavailability gracefully
- Show clear error messages for network issues
- Implement retry logic for transient failures

### User Experience

- Show clear setup instructions for API keys
- Display real-time usage quotas
- Provide helpful error messages
- Include loading indicators for API calls
- Make it obvious when backend is disconnected

### Performance

- Debounce user inputs to prevent excessive API calls
- Cache light status to reduce backend requests
- Minimize bundle size for faster GitHub Pages loading
- Use lazy loading for non-critical components

## Common Patterns

### Error Boundary Component

```vue
<template>
	<div v-if="error" class="error-boundary">
		<q-banner type="negative">
			{{ error.message }}
			<template v-slot:action>
				<q-btn @click="retry">Retry</q-btn>
			</template>
		</q-banner>
	</div>
	<slot v-else />
</template>
```

### Loading States

```vue
<template>
	<q-btn :loading="isLoading" @click="sendMessage" :disable="!canSendRequest">
		Send Message
		<template v-slot:loading>
			<q-spinner-hourglass />
		</template>
	</q-btn>
</template>
```

This client-side application should feel like a polished demo that educates users about MCP while providing a real, functional smart light control system.
