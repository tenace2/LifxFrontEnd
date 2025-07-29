# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-07-29

### Added

- **Enhanced Log Formatting System**: Intelligent JSON parsing and syntax highlighting for server logs
  - Smart detection and parsing of multiple levels of JSON stringification
  - Color-coded syntax highlighting for JSON keys, values, timestamps, URLs, and log levels
  - Automatic formatting of complex MCP JSON-RPC responses
  - Dark theme support with adaptive color schemes
  - Clean text copying (HTML tags automatically stripped)
  - New utility: `src/utils/logFormatter.js` with comprehensive parsing functions
  - New styles: `src/styles/log-formatting.css` with full syntax highlighting
  - Enhanced `ServerLogs.vue` component with HTML rendering support

### Changed

- Server logs now display with proper indentation and color coding instead of raw JSON
- Log copying functionality now provides clean text output without HTML tags
- Updated documentation in README.md and client_copilot_instructions.md

### Technical Details

- Added `formatLogEntry()` function for standard log formatting
- Added `formatRawLogOutput()` function for complex nested JSON parsing
- Added `extractMcpInfo()` function for MCP response data extraction
- Implemented `deepJsonParse()` for recursive JSON string parsing
- Added comprehensive CSS classes for syntax highlighting
- Enhanced `useServerLogs.js` composable with formatting integration

## [1.2.0] - 2024-12-XX

### Fixed

- **Session ID Consistency**: Fixed session ID inconsistency where different API requests were using different session IDs
- Centralized session ID management through `useSessionTracking` composable
- Updated `useBackendApi.js` to use centralized `getSessionId()` function
- Eliminated duplicate session ID generation in API request functions

### Changed

- All API requests now use the same session ID displayed in the Session Manager
- Improved session consistency across all frontend-backend communications
- Prevented "multiple sessions" errors from backend session tracking

## [1.1.0] - 2024-XX-XX

### Added

- Dynamic backend configuration through UI
- Time-delimited server logs with configurable time frames
- Session-based usage tracking
- Enhanced error handling and user feedback

### Changed

- Migrated from monolithic to client-server architecture
- Updated deployment to GitHub Pages
- Improved responsive design and mobile compatibility

## [1.0.0] - 2024-XX-XX

### Added

- Initial release of LIFX-Claude Frontend
- Vue.js 3 application with Quasar Framework
- Claude AI integration for natural language light control
- Direct LIFX light control interface
- API key management system
- Backend server status monitoring
