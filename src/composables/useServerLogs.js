import { ref } from 'vue';
import { useBackendApi } from './useBackendApi';
import { useSessionTracking } from './useSessionTracking';
import {
	formatLogEntry,
	formatRawLogOutput,
	extractMcpInfo,
} from '../utils/logFormatter';

export function useServerLogs() {
	const { makeApiRequest } = useBackendApi();
	const { updateUsageFromResponse } = useSessionTracking();

	const backendLogs = ref([]);
	const mcpLogs = ref([]);
	const isLoading = ref(false);
	const error = ref(null);
	const lastUpdated = ref(null);
	const endpointStatus = ref({
		backend: 'unknown', // 'available', 'unavailable', 'unknown'
		mcp: 'unknown',
	});

	// Fetch backend server logs
	const fetchBackendLogs = async (options = {}) => {
		try {
			console.log('📊 Fetching backend logs...');
			const { limit = 25, level, since } = options;

			// Build query parameters
			const params = new URLSearchParams();
			if (limit) params.append('limit', limit.toString());
			if (level) params.append('level', level);
			if (since) params.append('since', since);

			const queryString = params.toString();
			const endpoint = `/api/logs/backend${
				queryString ? '?' + queryString : ''
			}`;

			const response = await makeApiRequest(endpoint, {}, 'GET');
			updateUsageFromResponse(response);

			if (response.data.success) {
				backendLogs.value = response.data.logs || [];
				endpointStatus.value.backend = 'available';
				console.log('✅ Backend logs fetched:', response.data.count, 'entries');
				return response.data;
			} else {
				throw new Error(response.data.error || 'Failed to fetch backend logs');
			}
		} catch (err) {
			// Handle 404 errors specifically (endpoint not implemented)
			if (err.response?.status === 404) {
				console.warn('⚠️ Backend logs endpoint not implemented (404)');
				backendLogs.value = [];
				endpointStatus.value.backend = 'unavailable';
				return {
					success: true,
					logs: [],
					count: 0,
					message: 'Backend logs endpoint not yet implemented on server',
				};
			}

			endpointStatus.value.backend = 'error';
			console.error('❌ Error fetching backend logs:', err);
			error.value = err.message;
			throw err;
		}
	};

	// Fetch MCP server logs
	const fetchMcpLogs = async (options = {}) => {
		try {
			console.log('📊 Fetching MCP logs...');
			const { limit = 20, level, since } = options;

			// Build query parameters
			const params = new URLSearchParams();
			if (limit) params.append('limit', limit.toString());
			if (level) params.append('level', level);
			if (since) params.append('since', since);

			const queryString = params.toString();
			const endpoint = `/api/logs/mcp${queryString ? '?' + queryString : ''}`;

			const response = await makeApiRequest(endpoint, {}, 'GET');
			updateUsageFromResponse(response);

			if (response.data.success) {
				mcpLogs.value = response.data.logs || [];
				endpointStatus.value.mcp = 'available';
				console.log('✅ MCP logs fetched:', response.data.count, 'entries');
				return response.data;
			} else {
				throw new Error(response.data.error || 'Failed to fetch MCP logs');
			}
		} catch (err) {
			// Handle 404 errors specifically (endpoint not implemented)
			if (err.response?.status === 404) {
				console.warn('⚠️ MCP logs endpoint not implemented (404)');
				mcpLogs.value = [];
				endpointStatus.value.mcp = 'unavailable';
				return {
					success: true,
					logs: [],
					count: 0,
					message: 'MCP logs endpoint not yet implemented on server',
				};
			}

			endpointStatus.value.mcp = 'error';
			console.error('❌ Error fetching MCP logs:', err);
			error.value = err.message;
			throw err;
		}
	};

	// Fetch logs info
	const fetchLogsInfo = async () => {
		try {
			console.log('📊 Fetching logs info...');
			const response = await makeApiRequest('/api/logs', {}, 'GET');
			updateUsageFromResponse(response);
			return response.data;
		} catch (err) {
			console.error('❌ Error fetching logs info:', err);
			error.value = err.message;
			throw err;
		}
	};

	// Fetch both backend and MCP logs
	const fetchAllLogs = async (options = {}) => {
		isLoading.value = true;
		error.value = null;

		try {
			console.log('🔄 Fetching all server logs...');

			// Fetch both types of logs, allowing partial success
			const results = await Promise.allSettled([
				fetchBackendLogs(options.backend || {}),
				fetchMcpLogs(options.mcp || {}),
			]);

			// Process results
			const backendResult =
				results[0].status === 'fulfilled' ? results[0].value : null;
			const mcpResult =
				results[1].status === 'fulfilled' ? results[1].value : null;

			// Check for any failures that weren't 404s
			const failures = results
				.filter((r) => r.status === 'rejected')
				.map((r) => r.reason);
			const criticalFailures = failures.filter(
				(err) => err.response?.status !== 404
			);

			if (criticalFailures.length > 0) {
				// Only show error for non-404 failures
				const errorMessage = criticalFailures
					.map((err) => err.message)
					.join('; ');
				error.value = errorMessage;
				console.warn('⚠️ Some log endpoints failed:', errorMessage);
			} else {
				// Success or only 404s (expected during development)
				error.value = null;
			}

			lastUpdated.value = new Date();

			if (backendResult || mcpResult) {
				console.log('✅ Server logs fetched (partial success allowed)');
			} else {
				console.log('⚠️ No log endpoints available yet');
			}

			return {
				backend: backendResult,
				mcp: mcpResult,
				timestamp: lastUpdated.value,
				partialSuccess: !!(backendResult || mcpResult),
			};
		} catch (err) {
			console.error('❌ Error fetching all logs:', err);
			error.value = err.message;
			throw err;
		} finally {
			isLoading.value = false;
		}
	};

	// Format log entry for display with enhanced formatting
	const formatLogEntryEnhanced = (log) => {
		// Use the enhanced formatter
		return formatLogEntry(log);
	};

	// Format raw log output (for complex nested JSON)
	const formatRawLogEnhanced = (rawData) => {
		return formatRawLogOutput(JSON.stringify(rawData));
	};

	// Combine logs from both sources with timestamps and enhanced formatting
	const getCombinedLogs = () => {
		const combined = [];

		// Add backend logs with source prefix
		backendLogs.value.forEach((log) => {
			// Try to extract MCP info if it's an MCP-related log
			const mcpInfo = extractMcpInfo(log);

			combined.push({
				...log,
				source: 'backend',
				displayText: `[BACKEND] ${formatLogEntryEnhanced(log)}`,
				htmlContent: `<span class="log-source backend">[BACKEND]</span> ${formatLogEntryEnhanced(
					log
				)}`,
				mcpInfo: mcpInfo,
			});
		});

		// Add MCP logs with source prefix
		mcpLogs.value.forEach((log) => {
			const mcpInfo = extractMcpInfo(log);

			combined.push({
				...log,
				source: 'mcp',
				displayText: `[MCP] ${formatLogEntryEnhanced(log)}`,
				htmlContent: `<span class="log-source mcp">[MCP]</span> ${formatLogEntryEnhanced(
					log
				)}`,
				mcpInfo: mcpInfo,
			});
		});

		// Sort by timestamp (newest first)
		return combined.sort(
			(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
		);
	};

	// Get formatted text for copying
	const getFormattedLogsText = (source = 'all') => {
		let logs = [];

		switch (source) {
			case 'backend':
				logs = backendLogs.value.map(
					(log) => `[BACKEND] ${formatLogEntry(log).replace(/<[^>]*>/g, '')}`
				);
				break;
			case 'mcp':
				logs = mcpLogs.value.map(
					(log) => `[MCP] ${formatLogEntry(log).replace(/<[^>]*>/g, '')}`
				);
				break;
			case 'all':
			default:
				logs = getCombinedLogs().map((log) =>
					log.displayText.replace(/<[^>]*>/g, '')
				);
				break;
		}

		const header = `=== LIFX MCP Server Logs (${source.toUpperCase()}) ===\n`;
		const timestamp = `Generated: ${new Date().toLocaleString()}\n`;
		const separator = '='.repeat(50) + '\n\n';

		return header + timestamp + separator + logs.join('\n\n');
	};

	// Copy logs to clipboard
	const copyLogsToClipboard = async (source = 'all') => {
		try {
			const text = getFormattedLogsText(source);
			await navigator.clipboard.writeText(text);
			console.log('✅ Logs copied to clipboard');
			return true;
		} catch (err) {
			console.error('❌ Failed to copy logs:', err);
			error.value = 'Failed to copy logs to clipboard';
			return false;
		}
	};

	return {
		// State
		backendLogs,
		mcpLogs,
		isLoading,
		error,
		lastUpdated,
		endpointStatus,

		// Methods
		fetchBackendLogs,
		fetchMcpLogs,
		fetchAllLogs,
		fetchLogsInfo,
		getCombinedLogs,
		copyLogsToClipboard,
		formatLogEntryEnhanced,
		formatRawLogEnhanced,
		getFormattedLogsText,
	};
}
