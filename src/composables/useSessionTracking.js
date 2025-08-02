import { ref } from 'vue';

const requestsUsed = ref(0);
const requestsRemaining = ref(100);
const dailyLimit = ref(100);

export function useSessionTracking() {
	// Generate or retrieve session ID
	const getSessionId = () => {
		console.log('🔍 Getting session ID...');
		console.log('🕒 Current timestamp:', Date.now());
		console.log(
			'📍 Called from:',
			new Error().stack?.split('\n')[2]?.trim() || 'unknown'
		);

		let sessionId = sessionStorage.getItem('demo_session_id');
		console.log('📋 Current session ID from storage:', sessionId);

		if (!sessionId) {
			sessionId = `session_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;
			console.log('🆕 Generated new session ID:', sessionId);
			console.log('🕒 Generation timestamp:', Date.now());
			sessionStorage.setItem('demo_session_id', sessionId);
			console.log('💾 Saved new session ID to storage');

			// Log what's in sessionStorage after setting
			console.log(
				'🔍 Verification - session ID after setting:',
				sessionStorage.getItem('demo_session_id')
			);
		} else {
			console.log('♻️ Using existing session ID:', sessionId);
			console.log(
				'📊 Session ID age:',
				Date.now() - parseInt(sessionId.split('_')[1]) + 'ms'
			);
		}
		return sessionId;
	};

	// Update usage from response headers
	const updateUsageFromResponse = (response) => {
		console.log('📊 SESSION TRACKING: Checking for session headers...');
		console.log('📊 DEBUG: Full response object:', response);
		console.log('📊 DEBUG: Response type:', typeof response);

		if (response.headers) {
			// First, let's see ALL headers that are actually present
			console.log('📊 DEBUG: Raw response.headers object:', response.headers);
			console.log('📊 DEBUG: response.headers type:', typeof response.headers);
			console.log(
				'📊 DEBUG: response.headers constructor:',
				response.headers.constructor?.name
			);

			// Special handling for Axios AxiosHeaders
			if (response.headers.constructor?.name === 'AxiosHeaders') {
				console.log('📊 DEBUG: Detected Axios headers - using toJSON()');
				const axiosHeaders = response.headers.toJSON
					? response.headers.toJSON()
					: response.headers;
				console.log('📊 DEBUG: Axios headers as JSON:', axiosHeaders);
			}

			// Show all available headers in detail
			const allHeaders = {};
			if (response.headers.forEach) {
				response.headers.forEach((value, key) => {
					allHeaders[key] = value;
					console.log(`📊 DEBUG: Header "${key}" = "${value}"`);
				});
			} else if (typeof response.headers === 'object') {
				Object.entries(response.headers).forEach(([key, value]) => {
					allHeaders[key] = value;
					console.log(`📊 DEBUG: Header "${key}" = "${value}"`);
				});
			}
			console.log('📊 DEBUG: All headers object:', allHeaders);

			// Check specifically for session tracking headers (try multiple case variations)
			const getHeader = (headerName) => {
				console.log(`📊 DEBUG: Looking for header "${headerName}"`);

				// Try different case variations
				const variations = [
					headerName.toLowerCase(),
					headerName.toUpperCase(),
					headerName.replace(/^(.)/, (match) => match.toUpperCase()), // Capitalize first letter
					headerName.replace(
						/-(.)/g,
						(match, letter) => `-${letter.toUpperCase()}`
					), // Pascal-Case
				];

				console.log(
					`📊 DEBUG: Trying variations for "${headerName}":`,
					variations
				);

				for (const variant of variations) {
					// Try multiple access methods for Axios headers
					const value1 = response.headers[variant];
					const value2 = response.headers.get && response.headers.get(variant);
					const value3 =
						response.headers.has && response.headers.has(variant)
							? response.headers.get(variant)
							: undefined;

					console.log(
						`📊 DEBUG: Variant "${variant}" -> direct: "${value1}", get(): "${value2}", has+get(): "${value3}"`
					);

					if (value1 !== null && value1 !== undefined) {
						console.log(
							`📊 DEBUG: Found header "${variant}" with value "${value1}" (direct access)`
						);
						return value1;
					}
					if (value2 !== null && value2 !== undefined) {
						console.log(
							`📊 DEBUG: Found header "${variant}" with value "${value2}" (get method)`
						);
						return value2;
					}
					if (value3 !== null && value3 !== undefined) {
						console.log(
							`📊 DEBUG: Found header "${variant}" with value "${value3}" (has+get method)`
						);
						return value3;
					}
				}
				console.log(`📊 DEBUG: No value found for "${headerName}"`);
				return null;
			};

			const sessionHeaders = {
				'x-requests-used': getHeader('x-requests-used'),
				'x-requests-remaining': getHeader('x-requests-remaining'),
				'x-daily-limit': getHeader('x-daily-limit'),
			};

			console.log('📊 Session tracking headers found:', sessionHeaders);

			const hasSessionHeaders = Object.values(sessionHeaders).some(
				(value) => value !== null && value !== undefined
			);

			if (hasSessionHeaders) {
				console.log('✅ SESSION HEADERS FOUND! Backend is working correctly.');
			} else {
				console.log(
					'❌ NO SESSION TRACKING HEADERS! Backend may not be sending session usage data.'
				);
				console.log('📊 All available headers:', allHeaders);
				console.log('📊 This is why session tracking values never update.');
			}

			const used = parseInt(sessionHeaders['x-requests-used'] || 0);
			const remaining = parseInt(sessionHeaders['x-requests-remaining'] || 100);
			const limit = parseInt(sessionHeaders['x-daily-limit'] || 100);

			const changed =
				used !== requestsUsed.value ||
				remaining !== requestsRemaining.value ||
				limit !== dailyLimit.value;

			requestsUsed.value = used;
			requestsRemaining.value = remaining;
			dailyLimit.value = limit;

			if (changed) {
				console.log('📊 Session values UPDATED:', { used, remaining, limit });
			} else {
				console.log('📊 Session values UNCHANGED (using defaults):', {
					used,
					remaining,
					limit,
				});
			}
		} else {
			console.log('❌ NO HEADERS in response at all!');
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
	const forceSessionReset = async (makeApiRequest = null) => {
		console.log('💥 FORCE SESSION RESET...');

		// First, try to tell the backend to clear this session
		const currentSessionId = sessionStorage.getItem('demo_session_id');
		if (currentSessionId && makeApiRequest) {
			console.log('🔔 Notifying backend to clear session:', currentSessionId);
			try {
				// Use centralized API if provided
				await makeApiRequest('/clear-session', {}, 'POST');
				console.log('✅ Backend session clear request sent');
			} catch (error) {
				console.log(
					'⚠️ Backend session clear failed (continuing anyway):',
					error.message
				);
			}
		} else if (currentSessionId) {
			console.log(
				'🔔 Notifying backend to clear session (fallback method):',
				currentSessionId
			);
			try {
				// Fallback to direct fetch if makeApiRequest not provided
				// NOTE: This uses relative URL which may not work correctly
				await fetch('/api/clear-session', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-demo-key': 'LifxDemo',
						'x-session-id': currentSessionId,
					},
					body: '{}',
				});
				console.log('✅ Backend session clear request sent (fallback)');
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

	// Test function to verify session headers from /api/session-info
	const testSessionInfo = async () => {
		console.log('🧪 TESTING: Fetching session info to verify headers...');
		try {
			// Import useBackendApi to make the request
			const { useBackendApi } = await import('./useBackendApi.js');
			const { makeApiRequest } = useBackendApi();

			const response = await makeApiRequest('/session-info', {}, 'GET');
			console.log('🧪 TEST: Session info response received');

			// Check if this response has session headers
			updateUsageFromResponse(response);

			return response;
		} catch (error) {
			console.log('🧪 TEST: Session info request failed:', error.message);
		}
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
		testSessionInfo, // Add test function for debugging
	};
}
