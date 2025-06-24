# LIFX-Claude Frontend

A Vue.js client-side application for controlling LIFX smart lights through Claude AI, showcasing Model Context Protocol (MCP) integration.

## 🚀 Features

- **Natural Language Control**: Use Claude AI to control your LIFX lights with natural language
- **Direct Light Control**: Manual control interface for immediate light adjustments
- **Real-time Status**: Live monitoring of backend server connection and light status
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

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_BACKEND_URL=https://your-railway-app.railway.app
```

### Backend Server

Update the backend URL in `vite.config.js` once your Railway server is deployed:

```javascript
define: {
  'process.env': {
    BACKEND_URL: JSON.stringify('https://your-railway-app.railway.app')
  }
}
```

## 🔒 Security Features

- **Session-only API key storage**: Keys are stored in sessionStorage, not localStorage
- **Client-side validation**: Input validation before sending to backend
- **Keyword filtering**: Pre-filter messages for light-related content
- **Rate limiting**: Visual usage indicators and request limits
- **Error handling**: Comprehensive error messages and recovery

## 🎯 Usage

1. **Enter API Keys**: Input your LIFX and Claude API keys in the Token Manager
2. **Test Connection**: Verify your LIFX connection and discover lights
3. **Control Lights**: Use either:
   - **Manual Controls**: Direct light manipulation with sliders and color pickers
   - **Claude Chat**: Natural language commands like "Turn on the living room lights"

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
│   ├── TokenManager.vue      # API key management
│   ├── ClaudeChat.vue        # Claude AI chat interface
│   ├── LightControls.vue     # Manual light controls
│   └── UsageIndicator.vue    # Session usage display
├── composables/
│   ├── useBackendApi.js      # Backend communication
│   ├── useApiKeys.js         # API key management
│   └── useSessionTracking.js # Usage tracking
└── App.vue                   # Main application
```

## 🧪 Development Notes

This is an **educational demo** showcasing:

- Model Context Protocol (MCP) integration
- Client-server architecture patterns
- Vue.js 3 Composition API best practices
- Secure API key handling in SPAs
- Real-time status monitoring

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
