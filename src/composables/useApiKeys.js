import { ref, computed } from 'vue';

const lifxApiKey = ref('');
const claudeApiKey = ref('');

export function useApiKeys() {
	// Load API keys from localStorage on initialization (persistent across browser sessions)
	const loadApiKeys = () => {
		lifxApiKey.value = localStorage.getItem('lifx_api_key') || '';
		claudeApiKey.value = localStorage.getItem('claude_api_key') || '';
	};

	// Save API keys to localStorage (persistent across browser sessions)
	const saveApiKeys = () => {
		if (lifxApiKey.value) {
			localStorage.setItem('lifx_api_key', lifxApiKey.value);
		} else {
			localStorage.removeItem('lifx_api_key');
		}

		if (claudeApiKey.value) {
			localStorage.setItem('claude_api_key', claudeApiKey.value);
		} else {
			localStorage.removeItem('claude_api_key');
		}
	};

	// Validation functions
	const validateLifxApiKey = (key) => {
		if (!key) return 'LIFX API key is required';
		if (key.length < 20) return 'LIFX API key appears to be too short';
		return null;
	};

	const validateClaudeApiKey = (key) => {
		if (!key) return 'Claude API key is required';
		if (!key.startsWith('sk-ant-'))
			return 'Claude API key should start with "sk-ant-"';
		return null;
	};

	// Computed validation states
	const isLifxKeyValid = computed(
		() => validateLifxApiKey(lifxApiKey.value) === null
	);
	const isClaudeKeyValid = computed(
		() => validateClaudeApiKey(claudeApiKey.value) === null
	);
	const areKeysValid = computed(
		() => isLifxKeyValid.value && isClaudeKeyValid.value
	);

	// Clear all API keys
	const clearApiKeys = () => {
		lifxApiKey.value = '';
		claudeApiKey.value = '';
		localStorage.removeItem('lifx_api_key');
		localStorage.removeItem('claude_api_key');
	};

	// Initialize on first load
	loadApiKeys();

	return {
		lifxApiKey,
		claudeApiKey,
		saveApiKeys,
		loadApiKeys,
		clearApiKeys,
		validateLifxApiKey,
		validateClaudeApiKey,
		isLifxKeyValid,
		isClaudeKeyValid,
		areKeysValid,
	};
}
