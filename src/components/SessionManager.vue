<template>
	<q-card>
		<q-card-section>
			<div class="text-h6 q-mb-md">
				<q-icon name="settings" class="q-mr-sm" />
				Server Access & Session Management
			</div>
			<div class="text-caption text-grey-6 q-mb-md">
				Configure backend server connection and manage your session
			</div>

			<!-- Server Access Configuration -->
			<q-expansion-item
				v-model="serverConfigExpanded"
				icon="cloud"
				label="Server Configuration"
				header-class="text-primary"
				class="q-mb-md"
			>
				<q-card-section class="q-pt-none">
					<!-- Backend Server URL -->
					<q-input
						v-model="localBackendUrl"
						label="Backend Server URL"
						outlined
						class="q-mb-md"
						:error="!!urlError"
						:error-message="urlError"
						@update:model-value="validateUrl"
						placeholder="http://localhost:3001"
					>
						<template v-slot:prepend>
							<q-icon name="link" />
						</template>
					</q-input>

					<!-- Demo Key -->
					<q-input
						v-model="localDemoKey"
						label="Demo Key"
						outlined
						class="q-mb-md"
						:error="!!demoKeyError"
						:error-message="demoKeyError"
						@update:model-value="validateDemoKey"
						placeholder="LifxDemo"
						maxlength="10"
					>
						<template v-slot:prepend>
							<q-icon name="key" />
						</template>
					</q-input>

					<!-- Connection Controls -->
					<div class="row q-gutter-sm">
						<q-btn
							:color="backendStatus === 'connected' ? 'positive' : 'primary'"
							:label="backendStatus === 'connected' ? 'Connected' : 'Connect'"
							:icon="backendStatusIcon"
							@click="connectToServer"
							:loading="backendStatus === 'checking'"
							:disable="!!urlError || !!demoKeyError"
							class="col"
						/>
						<q-btn
							color="warning"
							label="Disconnect"
							icon="cloud_off"
							@click="disconnectFromServer"
							:disable="backendStatus === 'disconnected'"
							outline
							class="col"
						/>
					</div>

					<!-- Connection Status -->
					<div class="q-mt-md">
						<q-chip
							:color="backendStatusColor"
							text-color="white"
							:icon="backendStatusIcon"
							size="sm"
						>
							{{ backendStatusText }}
						</q-chip>
					</div>
				</q-card-section>
			</q-expansion-item>

			<!-- Session Actions -->
			<div class="text-subtitle2 q-mb-sm">Session Actions</div>
			<div class="row q-gutter-sm q-mb-md">
				<q-btn
					color="warning"
					label="Reset Session"
					icon="refresh"
					@click="confirmResetSession"
					outline
					class="col"
				/>
				<q-btn
					color="negative"
					label="Force Reset"
					icon="restart_alt"
					@click="confirmForceReset"
					outline
					class="col"
				/>
			</div>

			<div class="row q-gutter-sm q-mb-md">
				<q-btn
					color="grey-7"
					label="Clear All Data"
					icon="clear_all"
					@click="confirmClearAll"
					outline
					class="full-width"
				/>
			</div>

			<!-- Session Debug Information -->
			<q-expansion-item
				icon="info"
				label="Session Debug Info"
				header-class="text-grey-7"
			>
				<q-card-section class="q-pt-none">
					<div class="q-mb-sm">
						<strong>Current Backend URL:</strong>
						<div class="text-caption text-mono q-mt-xs">{{ backendUrl }}</div>
					</div>
					<div class="q-mb-sm">
						<strong>Current Demo Key:</strong>
						<div class="text-caption text-mono q-mt-xs">{{ demoKey }}</div>
					</div>
					<div class="q-mb-sm">
						<strong>Session ID:</strong>
						<div class="text-caption text-mono q-mt-xs">{{ sessionId }}</div>
					</div>
					<div class="q-mb-sm">
						<strong>Requests Used:</strong> {{ requestsUsed }} /
						{{ dailyLimit }}
					</div>
					<div class="q-mb-sm">
						<strong>Requests Remaining:</strong> {{ requestsRemaining }}
					</div>
					<div class="q-mb-sm">
						<strong>Usage Percentage:</strong> {{ usagePercentage() }}%
					</div>
					<div class="q-mb-sm">
						<strong>Session Start:</strong>
						<div class="text-caption q-mt-xs">{{ sessionStartTime }}</div>
					</div>
				</q-card-section>
			</q-expansion-item>
		</q-card-section>
	</q-card>
</template>

<script setup>
	import { ref, computed, watch, onMounted } from 'vue';
	import { useQuasar } from 'quasar';
	import { useSessionTracking } from '../composables/useSessionTracking';
	import { useApiKeys } from '../composables/useApiKeys';
	import { useBackendApi } from '../composables/useBackendApi';

	const $q = useQuasar();
	const {
		requestsUsed,
		requestsRemaining,
		dailyLimit,
		getSessionId,
		resetSession,
		usagePercentage,
	} = useSessionTracking();

	const { clearApiKeys } = useApiKeys();

	const {
		backendStatus,
		backendUrl,
		demoKey,
		checkBackendHealth,
		updateBackendConfig,
	} = useBackendApi();

	// Local reactive state for form inputs
	const localBackendUrl = ref('');
	const localDemoKey = ref('');
	const serverConfigExpanded = ref(false);

	// Validation errors
	const urlError = ref('');
	const demoKeyError = ref('');

	const sessionId = getSessionId();
	const sessionStartTime = computed(() => {
		const timestamp = sessionStorage.getItem('session_start_time');
		if (timestamp) {
			return new Date(parseInt(timestamp)).toLocaleString();
		}
		// Set current time as session start if not already set
		const now = Date.now().toString();
		sessionStorage.setItem('session_start_time', now);
		return new Date(parseInt(now)).toLocaleString();
	});

	// Backend status computed properties
	const backendStatusColor = computed(() => {
		switch (backendStatus.value) {
			case 'connected':
				return 'positive';
			case 'disconnected':
				return 'negative';
			case 'error':
				return 'warning';
			default:
				return 'grey';
		}
	});

	const backendStatusIcon = computed(() => {
		switch (backendStatus.value) {
			case 'connected':
				return 'cloud_done';
			case 'disconnected':
				return 'cloud_off';
			case 'error':
				return 'warning';
			default:
				return 'cloud_queue';
		}
	});

	const backendStatusText = computed(() => {
		switch (backendStatus.value) {
			case 'connected':
				return 'Connected';
			case 'disconnected':
				return 'Disconnected';
			case 'error':
				return 'Connection Error';
			default:
				return 'Checking...';
		}
	});

	// Validation functions
	const validateUrl = () => {
		const url = localBackendUrl.value.trim();
		if (!url) {
			urlError.value = 'URL is required';
			return false;
		}

		try {
			new URL(url);
			urlError.value = '';
			return true;
		} catch (e) {
			urlError.value = 'Please enter a valid URL (e.g., http://localhost:3001)';
			return false;
		}
	};

	const validateDemoKey = () => {
		const key = localDemoKey.value.trim();
		if (!key) {
			demoKeyError.value = 'Demo key is required';
			return false;
		}

		if (key.length < 4) {
			demoKeyError.value = 'Demo key must be at least 4 characters';
			return false;
		}

		if (key.length > 10) {
			demoKeyError.value = 'Demo key must be no more than 10 characters';
			return false;
		}

		if (!/^[a-zA-Z]+$/.test(key)) {
			demoKeyError.value = 'Demo key must contain only letters';
			return false;
		}

		demoKeyError.value = '';
		return true;
	};

	// Server connection functions
	const connectToServer = async () => {
		if (!validateUrl() || !validateDemoKey()) {
			return;
		}

		try {
			// Update backend configuration
			updateBackendConfig(
				localBackendUrl.value.trim(),
				localDemoKey.value.trim()
			);

			// Test connection
			await checkBackendHealth(true); // Force check after manual connection

			if (backendStatus.value === 'connected') {
				$q.notify({
					type: 'positive',
					message: 'Successfully connected to backend server',
					timeout: 2000,
				});
			} else {
				$q.notify({
					type: 'negative',
					message: 'Failed to connect to backend server',
					timeout: 3000,
				});
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Connection failed',
				timeout: 3000,
			});
		}
	};

	const disconnectFromServer = () => {
		// Set status to disconnected without changing the URL/key values
		// This allows user to keep their settings but manually disconnect
		backendStatus.value = 'disconnected';

		$q.notify({
			type: 'info',
			message: 'Disconnected from backend server',
			timeout: 2000,
		});
	};

	// Initialize local values from current backend config
	onMounted(() => {
		localBackendUrl.value = backendUrl.value || 'http://localhost:3001';
		localDemoKey.value = demoKey.value || 'LifxDemo';

		// Validate initial values
		validateUrl();
		validateDemoKey();
	});

	// Watch for changes to sync local values with backend config
	watch([backendUrl, demoKey], () => {
		localBackendUrl.value = backendUrl.value || 'http://localhost:3001';
		localDemoKey.value = demoKey.value || 'LifxDemo';
	});

	const confirmResetSession = () => {
		$q.dialog({
			title: 'Reset Session',
			message:
				'Are you sure you want to reset your current session? This will clear usage counters but keep your API keys and server settings.',
			cancel: true,
			persistent: true,
		}).onOk(() => {
			resetSession();
			$q.notify({
				type: 'info',
				message: 'Session reset successfully',
				timeout: 2000,
			});
		});
	};

	const confirmForceReset = () => {
		$q.dialog({
			title: 'Force Reset Session',
			message:
				'This will completely reset your session including generating a new session ID and disconnect from server. Continue?',
			cancel: true,
			persistent: true,
		}).onOk(() => {
			// Clear session storage completely
			sessionStorage.removeItem('demo_session_id');
			sessionStorage.removeItem('session_start_time');
			sessionStorage.removeItem('demo_backend_url');
			sessionStorage.removeItem('demo_key');
			resetSession();
			// Force page reload to ensure clean state
			window.location.reload();
		});
	};

	const confirmClearAll = () => {
		$q.dialog({
			title: 'Clear All Data',
			message:
				'This will clear ALL stored data including API keys, session data, server settings, and usage information. This cannot be undone!',
			cancel: true,
			persistent: true,
			color: 'negative',
		}).onOk(() => {
			// Clear all session storage
			sessionStorage.clear();
			// Clear API keys
			clearApiKeys();
			// Reset session tracking
			resetSession();
			$q.notify({
				type: 'warning',
				message: 'All data cleared successfully',
				timeout: 3000,
			});
			// Reload page to ensure completely fresh state
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		});
	};
</script>

<style scoped>
	.text-mono {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.85em;
		background-color: #f5f5f5;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
		word-break: break-all;
	}
</style>
