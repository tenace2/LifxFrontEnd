<template>
	<q-card>
		<q-card-section>
			<div class="text-h6 q-mb-md">
				<q-icon name="key" class="q-mr-sm" />
				API Configuration
			</div>

			<!-- LIFX API Key -->
			<q-input
				v-model="lifxApiKey"
				type="password"
				label="LIFX API Key"
				hint="Get your token from cloud.lifx.com/settings"
				:error="lifxApiKey && !isLifxKeyValid"
				:error-message="lifxApiKey ? validateLifxApiKey(lifxApiKey) : ''"
				class="q-mb-md"
				@update:model-value="saveApiKeys"
			>
				<template v-slot:prepend>
					<q-icon name="lightbulb" />
				</template>
				<template v-slot:append>
					<q-btn
						v-if="lifxApiKey"
						flat
						round
						icon="clear"
						@click="
							lifxApiKey = '';
							saveApiKeys();
						"
					/>
				</template>
			</q-input>

			<!-- Claude API Key -->
			<q-input
				v-model="claudeApiKey"
				type="password"
				label="Claude API Key"
				hint="Get your key from console.anthropic.com"
				:error="claudeApiKey && !isClaudeKeyValid"
				:error-message="claudeApiKey ? validateClaudeApiKey(claudeApiKey) : ''"
				class="q-mb-md"
				@update:model-value="saveApiKeys"
			>
				<template v-slot:prepend>
					<q-icon name="smart_toy" />
				</template>
				<template v-slot:append>
					<q-btn
						v-if="claudeApiKey"
						flat
						round
						icon="clear"
						@click="
							claudeApiKey = '';
							saveApiKeys();
						"
					/>
				</template>
			</q-input>

			<!-- Connection Status -->
			<div class="q-mb-md">
				<q-item dense>
					<q-item-section avatar>
						<q-icon :name="backendStatusIcon" :color="backendStatusColor" />
					</q-item-section>
					<q-item-section>
						<q-item-label>Backend Server</q-item-label>
						<q-item-label caption>{{ backendStatusText }}</q-item-label>
					</q-item-section>
					<q-item-section side>
						<q-btn
							flat
							round
							icon="refresh"
							size="sm"
							@click="checkBackendHealth"
							:loading="backendStatus === 'checking'"
						/>
					</q-item-section>
				</q-item>
			</div>

			<!-- Action Buttons -->
			<div class="row q-gutter-sm">
				<q-btn
					color="primary"
					label="Test LIFX Connection"
					:disable="!isLifxKeyValid || backendStatus !== 'connected'"
					@click="testLifxConnection"
					:loading="testingLifx"
					class="col"
				/>
				<q-btn
					color="negative"
					label="Clear All"
					@click="clearAllKeys"
					outline
					class="col-auto"
				/>
			</div>
		</q-card-section>

		<!-- Server Logs Section -->
		<q-expansion-item
			v-if="backendStatus === 'connected'"
			icon="terminal"
			label="Server Logs"
			header-class="text-primary"
		>
			<q-card-section>
				<q-scroll-area style="height: 200px">
					<div
						v-if="serverLogs.length === 0"
						class="text-grey-6 text-center q-pa-md"
					>
						No logs available
					</div>
					<div v-else>
						<div
							v-for="(log, index) in serverLogs"
							:key="index"
							class="q-mb-xs"
						>
							<q-chip
								:color="getLogColor(log.level)"
								text-color="white"
								size="xs"
								class="q-mr-xs"
							>
								{{ log.level }}
							</q-chip>
							<span class="text-caption text-grey-7">{{
								formatTimestamp(log.timestamp)
							}}</span>
							<div class="q-mt-xs">{{ log.message }}</div>
						</div>
					</div>
				</q-scroll-area>
				<q-btn
					flat
					color="primary"
					label="Refresh Logs"
					@click="fetchServerLogs"
					:loading="loadingLogs"
					size="sm"
					class="q-mt-sm"
				/>
			</q-card-section>
		</q-expansion-item>
	</q-card>
</template>

<script setup>
	import { ref, computed } from 'vue';
	import { useQuasar } from 'quasar';
	import { useApiKeys } from '../composables/useApiKeys';
	import { useBackendApi } from '../composables/useBackendApi';

	const $q = useQuasar();
	const {
		lifxApiKey,
		claudeApiKey,
		saveApiKeys,
		clearApiKeys,
		validateLifxApiKey,
		validateClaudeApiKey,
		isLifxKeyValid,
		isClaudeKeyValid,
	} = useApiKeys();

	const { backendStatus, checkBackendHealth, makeApiRequest } = useBackendApi();

	const testingLifx = ref(false);
	const serverLogs = ref([]);
	const loadingLogs = ref(false);

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
				return 'Error';
			default:
				return 'Checking...';
		}
	});

	const testLifxConnection = async () => {
		if (!isLifxKeyValid.value) return;

		testingLifx.value = true;
		try {
			const response = await makeApiRequest('/api/lifx/test', {
				lifxApiKey: lifxApiKey.value,
			});

			if (response.data.success) {
				$q.notify({
					type: 'positive',
					message: `LIFX connection successful! Found ${
						response.data.lightCount || 0
					} lights.`,
					timeout: 3000,
				});
			} else {
				$q.notify({
					type: 'negative',
					message: response.data.error || 'LIFX connection failed',
					timeout: 3000,
				});
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Failed to test LIFX connection',
				timeout: 3000,
			});
		} finally {
			testingLifx.value = false;
		}
	};

	const clearAllKeys = () => {
		$q.dialog({
			title: 'Clear API Keys',
			message:
				'Are you sure you want to clear all API keys? This action cannot be undone.',
			cancel: true,
			persistent: true,
		}).onOk(() => {
			clearApiKeys();
			$q.notify({
				type: 'info',
				message: 'API keys cleared',
				timeout: 2000,
			});
		});
	};

	const fetchServerLogs = async () => {
		if (backendStatus.value !== 'connected') return;

		loadingLogs.value = true;
		try {
			const response = await makeApiRequest('/api/logs');
			serverLogs.value = response.data.logs || [];
		} catch (error) {
			console.error('Failed to fetch server logs:', error);
			$q.notify({
				type: 'warning',
				message: 'Failed to fetch server logs',
				timeout: 2000,
			});
		} finally {
			loadingLogs.value = false;
		}
	};

	const getLogColor = (level) => {
		switch (level?.toLowerCase()) {
			case 'error':
				return 'negative';
			case 'warn':
				return 'warning';
			case 'info':
				return 'info';
			case 'debug':
				return 'grey';
			default:
				return 'primary';
		}
	};

	const formatTimestamp = (timestamp) => {
		return new Date(timestamp).toLocaleTimeString();
	};
</script>
