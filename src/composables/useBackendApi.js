import { ref, computed } from 'vue';
import axios from 'axios';
import { useSessionTracking } from './useSessionTracking';

// Dynamic backend configuration - will be set by SessionManager
const backendUrl = ref(
	localStorage.getItem('demo_backend_url') || 'http://localhost:3001'
);
const demoKey = ref(localStorage.getItem('demo_key') || 'LifxDemo');
const backendStatus = ref('checking');

// Environment detection for optimizing health checks
const isProduction = () => {
	return (
		process.env.NODE_ENV === 'production' ||
		backendUrl.value.includes('railway.app') ||
		backendUrl.value.includes('heroku') ||
		backendUrl.value.includes('vercel') ||
		!backendUrl.value.includes('localhost')
	);
};

// Extract port information for display
const getBackendPort = () => {
	if (backendUrl.value) {
		try {
			const url = new URL(backendUrl.value);
			return url.port || (url.protocol === 'https:' ? '443' : '80');
		} catch (e) {
			return 'unknown';
		}
	}
	return '3001';
};

const backendPort = computed(() => getBackendPort());

// Function to update backend configuration
const updateBackendConfig = (newUrl, newDemoKey) => {
	backendUrl.value = newUrl;
	demoKey.value = newDemoKey;

	// Store in localStorage for persistence across browser sessions
	localStorage.setItem('demo_backend_url', newUrl);
	localStorage.setItem('demo_key', newDemoKey);

	// Reset connection status when config changes
	backendStatus.value = 'checking';

	console.log('Backend config updated:', {
		url: newUrl,
		demoKey: newDemoKey,
		status: backendStatus.value,
	});
};

export function useBackendApi() {
	// Get session tracking for centralized session ID management
	const { getSessionId } = useSessionTracking();

	// Rate limiting for health checks - prevent excessive requests
	let lastHealthCheck = 0;
	let initialHealthCheckDone = false; // Prevent multiple initial checks

	const checkBackendHealth = async (force = false, source = 'unknown') => {
		const now = Date.now();

		// Adaptive cooldown: much longer to minimize hosting costs
		const HEALTH_CHECK_COOLDOWN = isProduction() ? 300000 : 120000; // 5 min prod, 2 min dev

		// Prevent multiple initial health checks from App.vue mount
		if (source === 'initial' && initialHealthCheckDone && !force) {
			console.log('⚠️ Initial health check already completed, skipping');
			return;
		}

		// Only log health checks in development for debugging
		if (!isProduction()) {
			const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
			console.log('🩺 Health check called:', {
				force,
				source,
				timeSinceLastCheck: now - lastHealthCheck,
				cooldownPeriod: HEALTH_CHECK_COOLDOWN,
				calledBy: caller.includes('at ') ? caller.split('at ')[1] : caller,
				willSkip: !force && now - lastHealthCheck < HEALTH_CHECK_COOLDOWN,
				timestamp: new Date().toISOString(),
			});
		}

		// Skip if within cooldown period (unless forced)
		if (!force && now - lastHealthCheck < HEALTH_CHECK_COOLDOWN) {
			console.log(
				`⏱️ Health check skipped - within ${
					HEALTH_CHECK_COOLDOWN / 1000
				}s cooldown period`
			);
			return;
		}

		try {
			backendStatus.value = 'checking';
			lastHealthCheck = now;

			// Mark initial check as done
			if (source === 'initial') {
				initialHealthCheckDone = true;
			}

			if (isProduction()) {
				console.log(
					'🌐 Production health check:',
					`${backendUrl.value}/health`
				);
			} else {
				console.log(
					'🔧 Development health check:',
					`${backendUrl.value}/health`
				);
			}

			const response = await axios.get(`${backendUrl.value}/health`, {
				timeout: 5000,
			});

			console.log('Backend health response:', response.status, response.data);
			backendStatus.value = response.status === 200 ? 'connected' : 'error';
		} catch (error) {
			console.error('Backend health check failed:', {
				message: error.message,
				code: error.code,
				response: error.response?.status,
				url: `${backendUrl.value}/health`,
			});
			backendStatus.value = 'disconnected';
		}
	};

	const makeApiRequest = async (endpoint, data = {}, method = 'POST') => {
		console.log('🚀 Starting API request to:', endpoint);

		// Use centralized session ID management
		const sessionId = getSessionId();
		console.log('� Using session ID from centralized tracking:', sessionId);

		const headers = {
			'Content-Type': 'application/json',
			'X-Session-ID': sessionId,
			'X-Demo-Key': demoKey.value,
		};

		console.log('📤 Request headers:', headers);
		console.log('📤 Request data:', data);
		console.log('📤 Full URL:', `${backendUrl.value}${endpoint}`);

		try {
			const config = {
				headers,
				timeout: 30000,
			};

			let response;
			if (method.toUpperCase() === 'GET') {
				response = await axios.get(`${backendUrl.value}${endpoint}`, config);
			} else {
				response = await axios.post(
					`${backendUrl.value}${endpoint}`,
					data,
					config
				);
			}

			console.log('✅ API request successful:', {
				status: response.status,
				endpoint: endpoint,
				responseData: response.data,
			});

			return response;
		} catch (error) {
			console.error('❌ API request failed:', {
				endpoint: endpoint,
				error: error.message,
				status: error.response?.status,
				responseData: error.response?.data,
				headers: error.response?.headers,
			});

			if (error.response?.status === 429) {
				const errorData = error.response.data;
				console.error('🚫 Rate limit error:', errorData);

				if (errorData.code === 'SESSION_LIMIT') {
					console.error('📊 Session limit reached');
					throw new Error(
						'Session request limit reached. Please try again later.'
					);
				}
				if (errorData.code === 'MULTIPLE_SESSIONS') {
					console.error('👥 Multiple sessions detected');
					throw new Error(
						'MULTIPLE_SESSIONS_ERROR' // Special error code for handling
					);
				}
			}
			throw error;
		}
	};

	// Make API request with force session reset headers
	const makeApiRequestWithSessionReset = async (endpoint, data = {}) => {
		console.log('💥 Making API request WITH FORCE SESSION RESET to:', endpoint);

		// Use centralized session ID management for force reset too
		const sessionId = getSessionId();
		console.log(
			'📋 Using session ID from centralized tracking for force reset:',
			sessionId
		);

		const headers = {
			'Content-Type': 'application/json',
			'X-Session-ID': sessionId,
			'X-Demo-Key': demoKey.value,
			'X-Force-New-Session': 'true', // Special header to force new session
			'X-Reset-Session': 'true', // Alternative header
			'X-Development-Mode': 'true', // Development flag
		};

		console.log('📤 Force reset headers:', headers);
		console.log('📤 Request data:', data);

		try {
			const response = await axios.post(
				`${backendUrl.value}${endpoint}`,
				data,
				{
					headers,
					timeout: 30000,
				}
			);

			console.log('✅ Force reset API request successful:', {
				status: response.status,
				endpoint: endpoint,
				responseData: response.data,
			});

			return response;
		} catch (error) {
			console.error('❌ Force reset API request failed:', {
				endpoint: endpoint,
				error: error.message,
				status: error.response?.status,
				responseData: error.response?.data,
				headers: error.response?.headers,
			});
			throw error;
		}
	};

	return {
		backendStatus,
		backendPort,
		backendUrl: computed(() => backendUrl.value),
		demoKey: computed(() => demoKey.value),
		checkBackendHealth,
		updateBackendConfig,
		makeApiRequest,
		makeApiRequestWithSessionReset,
	};
}
