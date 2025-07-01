import { ref } from 'vue';

const requestsUsed = ref(0);
const requestsRemaining = ref(100);
const dailyLimit = ref(100);

export function useSessionTracking() {
	// Generate or retrieve session ID
	const getSessionId = () => {
		console.log('🔍 Getting session ID...');
		let sessionId = sessionStorage.getItem('demo_session_id');
		console.log('📋 Current session ID from storage:', sessionId);

		if (!sessionId) {
			sessionId = `session_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;
			console.log('🆕 Generated new session ID:', sessionId);
			sessionStorage.setItem('demo_session_id', sessionId);
			console.log('💾 Saved new session ID to storage');
		} else {
			console.log('♻️ Using existing session ID:', sessionId);
		}
		return sessionId;
	};

	// Update usage from response headers
	const updateUsageFromResponse = (response) => {
		if (response.headers) {
			const used = parseInt(
				response.headers['x-requests-used'] ||
					response.headers.get('X-Requests-Used') ||
					0
			);
			const remaining = parseInt(
				response.headers['x-requests-remaining'] ||
					response.headers.get('X-Requests-Remaining') ||
					100
			);
			const limit = parseInt(
				response.headers['x-daily-limit'] ||
					response.headers.get('X-Daily-Limit') ||
					100
			);

			requestsUsed.value = used;
			requestsRemaining.value = remaining;
			dailyLimit.value = limit;
		}
	};

	// Check if user can send more requests
	const canSendRequest = () => {
		return requestsRemaining.value > 0;
	};

	// Reset session (for testing)
	const resetSession = () => {
		console.log('🔄 RESETTING SESSION...');
		console.log(
			'📋 Current session ID before reset:',
			sessionStorage.getItem('demo_session_id')
		);

		// Clear the old session
		sessionStorage.removeItem('demo_session_id');
		console.log('🗑️ Removed session ID from storage');

		// Create a brand new session ID immediately
		const newSessionId = `session_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		sessionStorage.setItem('demo_session_id', newSessionId);
		console.log('🆕 Created new session ID:', newSessionId);

		requestsUsed.value = 0;
		requestsRemaining.value = 100;
		dailyLimit.value = 100;

		console.log('📊 Reset usage counters:', {
			used: requestsUsed.value,
			remaining: requestsRemaining.value,
			limit: dailyLimit.value,
		});

		console.log('✅ Session reset complete');
		console.log(
			'📋 New session ID after reset:',
			sessionStorage.getItem('demo_session_id')
		);

		return newSessionId;
	};

	// Force complete session reset (more aggressive)
	const forceSessionReset = async () => {
		console.log('💥 FORCE SESSION RESET...');

		// First, try to tell the backend to clear this session
		const currentSessionId = sessionStorage.getItem('demo_session_id');
		if (currentSessionId) {
			console.log('🔔 Notifying backend to clear session:', currentSessionId);
			try {
				await fetch('/api/clear-session', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-demo-key': 'LifxDemo',
						'x-session-id': currentSessionId,
					},
					body: '{}',
				});
				console.log('✅ Backend session clear request sent');
			} catch (error) {
				console.log(
					'⚠️ Backend session clear failed (continuing anyway):',
					error.message
				);
			}
		}

		// Clear ALL session storage
		console.log('🧹 Clearing ALL session storage...');
		sessionStorage.clear();

		// Clear ALL local storage (just in case)
		console.log('🧹 Clearing ALL local storage...');
		localStorage.clear();

		// Wait a moment for backend to process
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Create completely new session with extra randomness
		const timestamp = Date.now();
		const randomPart1 = Math.random().toString(36).substr(2, 9);
		const randomPart2 = Math.random().toString(36).substr(2, 5);
		const newSessionId = `session_${timestamp}_${randomPart1}_${randomPart2}`;
		sessionStorage.setItem('demo_session_id', newSessionId);

		requestsUsed.value = 0;
		requestsRemaining.value = 100;
		dailyLimit.value = 100;

		console.log('💥 Force reset complete with new session:', newSessionId);

		return newSessionId;
	};

	// Get usage percentage
	const usagePercentage = () => {
		if (dailyLimit.value === 0) return 0;
		return Math.round((requestsUsed.value / dailyLimit.value) * 100);
	};

	return {
		requestsUsed,
		requestsRemaining,
		dailyLimit,
		getSessionId,
		updateUsageFromResponse,
		canSendRequest,
		resetSession,
		forceSessionReset,
		usagePercentage,
	};
}
