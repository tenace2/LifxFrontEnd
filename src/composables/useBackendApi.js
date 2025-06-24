import { ref } from 'vue';
import axios from 'axios';

const BACKEND_URL =
	import.meta.env.VITE_BACKEND_URL || 'https://your-app.railway.app';

const backendStatus = ref('checking');

export function useBackendApi() {
	const checkBackendHealth = async () => {
		try {
			backendStatus.value = 'checking';
			const response = await axios.get(`${BACKEND_URL}/health`, {
				timeout: 5000,
			});
			backendStatus.value = response.status === 200 ? 'connected' : 'error';
		} catch (error) {
			console.warn('Backend health check failed:', error.message);
			backendStatus.value = 'disconnected';
		}
	};

	const makeApiRequest = async (endpoint, data = {}) => {
		const sessionId =
			sessionStorage.getItem('demo_session_id') ||
			`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		sessionStorage.setItem('demo_session_id', sessionId);

		const headers = {
			'Content-Type': 'application/json',
			'X-Session-ID': sessionId,
			'X-Demo-Key': 'LifxDemo',
		};

		try {
			const response = await axios.post(`${BACKEND_URL}${endpoint}`, data, {
				headers,
				timeout: 30000,
			});
			return response;
		} catch (error) {
			if (error.response?.status === 429) {
				const errorData = error.response.data;
				if (errorData.code === 'SESSION_LIMIT') {
					throw new Error(
						'Session request limit reached. Please try again later.'
					);
				}
				if (errorData.code === 'MULTIPLE_SESSIONS') {
					throw new Error(
						'Multiple sessions detected from your IP. Please close other tabs.'
					);
				}
			}
			throw error;
		}
	};

	return {
		backendStatus,
		checkBackendHealth,
		makeApiRequest,
		BACKEND_URL,
	};
}
