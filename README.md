# LIFX-Claude Frontend

<!-- Force rebuild: 2025-06-24 -->

A Vue.js client-side application for controlling LIFX smart lights through Claude AI, showcasing Model Context Protocol (MCP) integration.

## 🚀 Features

- **Natural Language Control**: Use Claude AI to control your LIFX lights with natural language
- **Direct Light Control**: Manual control interface for immediate light adjustments
- **Dynamic Backend Configuration**: Configure and switch between different backend servers at runtime
- **Real-time Status**: Live monitoring of backend server connection and light status
- **Enhanced Server Logs**: View backend and MCP server logs with intelligent JSON parsing, syntax highlighting, and time-based filtering
- **Usage Tracking**: Session-based request tracking with visual indicators
- **Secure API Handling**: Session-only storage of API keys with proper validation
- **Responsive Design**: Mobile-friendly interface built with Quasar Framework

## 🛠️ Technology Stack

- **Vue.js 3** with Composition API
- **Quasar Framework** for UI components
- **Vite** for fast development and building
- **Pinia** for state management
- **Axios** for HTTP requests
- **GitHub Pages** for hosting

## 🏗️ Architecture

This is the **client-side** portion of a split architecture:

- **Frontend**: Vue.js SPA hosted on GitHub Pages (this repository)
- **Backend**: Node.js server hosted on Railway (separate repository)

## 📋 Prerequisites

Before using this application, you'll need:

1. **LIFX API Token**: Get yours at [cloud.lifx.com/settings](https://cloud.lifx.com/settings)
2. **Claude API Key**: Get yours at [console.anthropic.com](https://console.anthropic.com)
3. **LIFX Smart Lights**: At least one LIFX light on your network

## 🚀 Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/tenace2/LifxFrontEnd.git
   cd LifxFrontEnd
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Open in browser**: http://localhost:5173

## 🏗️ Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to GitHub Pages.

## 📦 Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Automatic Deployment

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be available at: `https://tenace2.github.io/LifxFrontEnd/`

### Manual Deployment

```bash
npm run deploy
```

## ⚙️ Configuration

### Environment Variables (Optional)

The application has dynamic backend configuration through the UI, but you can optionally set a default backend URL:

```env
VITE_BACKEND_URL=https://your-railway-app.railway.app
```

**Note**: The backend URL is configurable at runtime through the "Server Access & Session Management" component, so environment variables are only used as defaults.

### Backend Server Configuration

The frontend connects to configurable backend servers through the **Server Access & Session Management** component in the UI. No code changes are required - simply configure your backend URL through the interface:

1. **Development**: Use `http://localhost:3001` (default) when running a local backend
2. **Production**: Use your Railway server URL (e.g., `https://your-app.railway.app`)

The application automatically uses the configured backend URL for all API requests. The `vite.config.js` `BACKEND_URL` is only used as a fallback default value.

## 🔒 Security Features

- **Session-only API key storage**: Keys are stored in sessionStorage, not localStorage
- **Client-side validation**: Input validation before sending to backend
- **Keyword filtering**: Pre-filter messages for light-related content
- **Rate limiting**: Visual usage indicators and request limits
- **Error handling**: Comprehensive error messages and recovery
- **Centralized Session Management**: Consistent session ID tracking across all API requests to prevent session conflicts

## 🔧 Recent Improvements

### Enhanced Log Formatting (v1.3.0)

**New Features**:

- **Smart JSON Parser**: Automatically detects and parses multiple levels of JSON stringification
- **Syntax Highlighting**: Color-coded display for JSON keys, values, timestamps, URLs, and log levels
- **Improved Readability**: Complex nested JSON structures are properly formatted and indented
- **Dark Theme Support**: All syntax highlighting adapts to light/dark themes
- **Clean Copy**: When copying logs, HTML tags are automatically stripped for clean text output

**Technical Implementation**:

- New `logFormatter.js` utility with recursive JSON parsing
- Enhanced CSS styling in `log-formatting.css` with comprehensive color schemes
- Updated `ServerLogs.vue` component to render HTML-formatted logs
- Maintains backward compatibility while significantly improving log readability

### Session ID Consistency Fix (v1.2.0)

**Issue Resolved**: Fixed session ID inconsistency where different API requests were using different session IDs, causing backend session tracking problems.

**Changes Made**:

- Centralized session ID management through `useSessionTracking` composable
- Updated `useBackendApi.js` to use centralized `getSessionId()` function
- Eliminated duplicate session ID generation in API request functions
- Improved session consistency across all frontend-backend communications

**Impact**: All API requests now use the same session ID that's displayed in the Session Manager, ensuring proper backend session tracking and preventing "multiple sessions" errors.

## 🎯 Usage

1. **Configure Backend Server**: Set your backend server URL in the "Server Access & Session Management" section
2. **Enter API Keys**: Input your LIFX and Claude API keys in the Token Manager
3. **Test Connection**: Verify your LIFX connection and discover lights
4. **Control Lights**: Use either:
   - **Manual Controls**: Direct light manipulation with sliders and color pickers
   - **Claude Chat**: Natural language commands like "Turn on the living room lights"

### Enhanced Server Logs (v1.3.0)

The **Combined Server Logs** component now features intelligent log formatting with syntax highlighting for improved readability:

**🎨 Visual Enhancements**:

- **Syntax Highlighting**: JSON keys, values, timestamps, and URLs are color-coded
- **Smart JSON Parsing**: Automatically detects and unpacks nested stringified JSON (multiple levels)
- **Log Level Badges**: Color-coded badges for ERROR (red), WARN (orange), INFO (blue), DEBUG (gray)
- **Source Prefixes**: Distinct styling for `[BACKEND]` and `[MCP]` log sources
- **Dark Theme Support**: All colors adapt to light/dark themes

**🔧 Processing Features**:

- **Nested JSON Handling**: Intelligently parses complex log structures like:
  ```json
  {
  	"output": "{\"jsonrpc\":\"2.0\",\"result\":{\"content\":[{\"text\":\"{\\\"results\\\":[...]}\"}]}}"
  }
  ```
  Into properly formatted, readable JSON with full syntax highlighting

**📋 Time Frame Options**:

- **Last 15 minutes**: Recent activity and errors (default)
- **Last 1 hour**: Extended troubleshooting view
- **Last 4 hours**: Comprehensive session logs

**⚡ Additional Features**:

- **Dropdown Selection**: Click the dropdown arrow on the refresh button to choose time frames
- **Automatic Refresh**: Logs automatically refresh when switching time frames
- **Combined View**: See both backend manager and LIFX MCP server logs in chronological order
- **Separate Views**: Individual tabs for backend and MCP logs
- **Copy Functionality**: Copy logs to clipboard (HTML tags automatically stripped for clean text)
- **Visual Indicators**: Shows selected time frame and entry counts

This enhancement significantly improves log readability, especially for complex MCP JSON-RPC responses and nested data structures.

### Example Commands

- "Turn on all lights"
- "Set the bedroom light to blue"
- "Dim the kitchen lights to 20%"
- "Make all lights warm white"
- "Turn off the living room lamp"

## 🔧 Project Structure

```
src/
├── components/
│   ├── SessionManager.vue    # Backend server configuration
│   ├── TokenManager.vue      # API key management
│   ├── ClaudeChat.vue        # Claude AI chat interface
│   ├── LightControls.vue     # Manual light controls
│   ├── ServerLogs.vue        # Enhanced server logs viewer with syntax highlighting
│   └── UsageIndicator.vue    # Session usage display
├── composables/
│   ├── useBackendApi.js      # Backend communication
│   ├── useApiKeys.js         # API key management
│   ├── useServerLogs.js      # Server logs fetching and formatting
│   └── useSessionTracking.js # Usage tracking
├── utils/
│   └── logFormatter.js       # Smart JSON parsing and syntax highlighting utilities
├── styles/
│   └── log-formatting.css    # Syntax highlighting styles for logs
└── App.vue                   # Main application
```

## 🧪 Development Notes

This is an **educational demo** showcasing:

- Model Context Protocol (MCP) integration
- Client-server architecture patterns
- Dynamic backend configuration without hardcoded proxies
- Vue.js 3 Composition API best practices
- Secure API key handling in SPAs
- Real-time status monitoring

### Architecture Changes

- **No Development Proxy**: The application connects directly to configured backend servers in both development and production
- **Runtime Configuration**: Backend servers can be changed through the UI without code modifications
- **Consistent Behavior**: Development and production modes behave identically

## 🔗 Related Repositories

- **Backend Server**: [Coming Soon] - Railway-hosted Node.js server
- **Original Project**: [lifx-claude-vue](https://github.com/tenace2/lifx-claude-vue) - Monolithic version

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is primarily an educational project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## ⚠️ Disclaimer

This is a demonstration application. Users are responsible for their own API usage and costs. The application includes usage limits to prevent abuse.

## 📞 Support

For issues and questions:

- Check the [Issues](https://github.com/tenace2/LifxFrontEnd/issues) page
- Review the [client_copilot_instructions.md](client_copilot_instructions.md) for detailed specifications
  trigger-rebuild-1750784796
