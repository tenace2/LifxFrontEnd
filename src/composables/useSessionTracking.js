import { ref } from 'vue'

const requestsUsed = ref(0)
const requestsRemaining = ref(100)
const dailyLimit = ref(100)

export function useSessionTracking() {
  // Generate or retrieve session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('demo_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('demo_session_id', sessionId)
    }
    return sessionId
  }

  // Update usage from response headers
  const updateUsageFromResponse = (response) => {
    if (response.headers) {
      const used = parseInt(response.headers['x-requests-used'] || response.headers.get('X-Requests-Used') || 0)
      const remaining = parseInt(response.headers['x-requests-remaining'] || response.headers.get('X-Requests-Remaining') || 100)
      const limit = parseInt(response.headers['x-daily-limit'] || response.headers.get('X-Daily-Limit') || 100)
      
      requestsUsed.value = used
      requestsRemaining.value = remaining
      dailyLimit.value = limit
    }
  }

  // Check if user can send more requests
  const canSendRequest = () => {
    return requestsRemaining.value > 0
  }

  // Reset session (for testing)
  const resetSession = () => {
    sessionStorage.removeItem('demo_session_id')
    requestsUsed.value = 0
    requestsRemaining.value = 100
    dailyLimit.value = 100
  }

  // Get usage percentage
  const usagePercentage = () => {
    if (dailyLimit.value === 0) return 0
    return Math.round((requestsUsed.value / dailyLimit.value) * 100)
  }

  return {
    requestsUsed,
    requestsRemaining,
    dailyLimit,
    getSessionId,
    updateUsageFromResponse,
    canSendRequest,
    resetSession,
    usagePercentage
  }
}
