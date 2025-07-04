import { ref, computed } from 'vue';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

console.log('Backend URL configured as:', BACKEND_URL || 'Using Vite proxy');

const backendStatus = ref('checking');

// Extract port information for display
const getBackendPort = () => {
	if (BACKEND_URL) {
		try {
			const url = new URL(BACKEND_URL);
			return url.port || (url.protocol === 'https:' ? '443' : '80');
		} catch (e) {
			return 'unknown';
		}
	}
	// For development with Vite proxy, we know it's proxying to port 3001
	return '3001';
};

const backendPort = computed(() => getBackendPort());

export function useBackendApi() {
	const checkBackendHealth = async () => {
		try {
			backendStatus.value = 'checking';
			console.log('Checking backend health at:', `${BACKEND_URL}/health`);

			const response = await axios.get(`${BACKEND_URL}/health`, {
				timeout: 5000,
			});

			console.log('Backend health response:', response.status, response.data);
			backendStatus.value = response.status === 200 ? 'connected' : 'error';
		} catch (error) {
			console.error('Backend health check failed:', {
				message: error.message,
				code: error.code,
				response: error.response?.status,
				url: `${BACKEND_URL}/health`,
			});
			backendStatus.value = 'disconnected';
		}
	};

	const makeApiRequest = async (endpoint, data = {}, method = 'POST') => {
		console.log('🚀 Starting API request to:', endpoint);

		const sessionId =
			sessionStorage.getItem('demo_session_id') ||
			`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		console.log('📋 Current session ID:', sessionId);
		console.log('💾 Saving session ID to sessionStorage');
		sessionStorage.setItem('demo_session_id', sessionId);

		const headers = {
			'Content-Type': 'application/json',
			'X-Session-ID': sessionId,
			'X-Demo-Key': 'LifxDemo',
		};

		console.log('📤 Request headers:', headers);
		console.log('📤 Request data:', data);
		console.log('📤 Full URL:', `${BACKEND_URL}${endpoint}`);

		try {
			const config = {
				headers,
				timeout: 30000,
			};

			let response;
			if (method.toUpperCase() === 'GET') {
				response = await axios.get(`${BACKEND_URL}${endpoint}`, config);
			} else {
				response = await axios.post(`${BACKEND_URL}${endpoint}`, data, config);
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

		const sessionId =
			sessionStorage.getItem('demo_session_id') ||
			`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		console.log('📋 Session ID for force reset:', sessionId);
		sessionStorage.setItem('demo_session_id', sessionId);

		const headers = {
			'Content-Type': 'application/json',
			'X-Session-ID': sessionId,
			'X-Demo-Key': 'LifxDemo',
			'X-Force-New-Session': 'true', // Special header to force new session
			'X-Reset-Session': 'true', // Alternative header
			'X-Development-Mode': 'true', // Development flag
		};

		console.log('📤 Force reset headers:', headers);
		console.log('📤 Request data:', data);

		try {
			const response = await axios.post(`${BACKEND_URL}${endpoint}`, data, {
				headers,
				timeout: 30000,
			});

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
		checkBackendHealth,
		makeApiRequest,
		makeApiRequestWithSessionReset,
		BACKEND_URL,
	};
}
