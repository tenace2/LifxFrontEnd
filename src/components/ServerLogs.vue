<template>
	<q-card>
		<q-card-section>
			<div class="row items-center q-mb-md">
				<div class="col">
					<div class="text-h6">
						<q-icon name="description" class="q-mr-sm" />
						Combined Server Logs
					</div>
				</div>
				<div class="col-auto">
					<q-btn
						@click="() => checkBackendHealth(true)"
						icon="health_and_safety"
						label="Health Check"
						color="primary"
						size="sm"
						:loading="backendStatus === 'checking'"
						outline
					/>
				</div>
			</div>
			<div class="text-caption text-grey-6 q-mb-md">
				Backend Manager + LIFX MCP Server Output
			</div>

			<!-- Controls -->
			<div class="row q-gutter-sm q-mb-md">
				<q-btn
					@click="refreshLogs"
					icon="refresh"
					label="Refresh Logs"
					color="primary"
					:loading="isLoading"
					size="sm"
				/>
				<q-btn
					@click="copyLogs"
					icon="content_copy"
					label="Copy All"
					color="grey-7"
					size="sm"
					:disable="!hasLogs"
				/>
				<q-btn
					@click="clearDisplay"
					icon="clear"
					label="Clear Display"
					color="grey-7"
					size="sm"
					:disable="!hasLogs"
				/>
				<q-space />
				<div v-if="lastUpdated" class="text-caption text-grey-6 self-center">
					Last updated: {{ formatTimestamp(lastUpdated) }}
				</div>
			</div>

			<!-- Error Display -->
			<div v-if="error" class="q-mb-md">
				<q-banner type="negative" dense>
					<template v-slot:avatar>
						<q-icon name="error" />
					</template>
					{{ error }}
				</q-banner>
			</div>

			<!-- Development Notice -->
			<div v-if="showDevelopmentNotice" class="q-mb-md">
				<q-banner type="info" dense>
					<template v-slot:avatar>
						<q-icon name="info" />
					</template>
					<div>
						<div class="text-body2">Server logs feature is in development</div>
						<div class="text-caption">
							Log endpoints
							<span v-if="endpointStatus.backend === 'unavailable'">
								<code>/api/logs/backend</code>
							</span>
							<span
								v-if="
									endpointStatus.backend === 'unavailable' &&
									endpointStatus.mcp === 'unavailable'
								"
							>
								and
							</span>
							<span v-if="endpointStatus.mcp === 'unavailable'">
								<code>/api/logs/mcp</code>
							</span>
							not yet implemented on backend server.
						</div>
					</div>
				</q-banner>
			</div>

			<!-- Tabbed Log Views -->
			<q-tabs
				v-model="activeTab"
				dense
				class="text-grey-6 bg-grey-2"
				active-color="primary"
			>
				<q-tab name="combined" label="Combined View" />
				<q-tab name="backend" label="Backend Manager" />
				<q-tab name="mcp" label="LIFX MCP Server" />
			</q-tabs>

			<q-separator />

			<q-tab-panels
				v-model="activeTab"
				animated
				class="bg-grey-1"
				style="min-height: 400px"
			>
				<!-- Combined View -->
				<q-tab-panel name="combined" class="q-pa-sm">
					<q-scroll-area
						style="height: 380px"
						class="bg-white q-pa-sm rounded-borders"
					>
						<div
							v-if="combinedLogs.length === 0"
							class="text-center q-pa-lg text-grey-6"
						>
							<q-icon name="info" size="48px" class="q-mb-md" />
							<div>No logs available</div>
							<div class="text-caption q-mt-sm">
								Click "Refresh Logs" to fetch server logs
							</div>
						</div>
						<pre v-else class="log-content">{{ combinedLogsText }}</pre>
					</q-scroll-area>
					<div class="row q-gutter-sm q-mt-sm">
						<q-btn
							@click="copyLogs('all')"
							icon="content_copy"
							label="Copy Combined"
							size="xs"
							color="grey-7"
							:disable="combinedLogs.length === 0"
						/>
						<q-chip
							v-if="combinedLogs.length > 0"
							size="sm"
							color="info"
							text-color="white"
						>
							{{ combinedLogs.length }} entries
						</q-chip>
					</div>
				</q-tab-panel>

				<!-- Backend Manager Logs -->
				<q-tab-panel name="backend" class="q-pa-sm">
					<q-scroll-area
						style="height: 380px"
						class="bg-white q-pa-sm rounded-borders"
					>
						<div
							v-if="backendLogs.length === 0"
							class="text-center q-pa-lg text-grey-6"
						>
							<q-icon name="settings" size="48px" class="q-mb-md" />
							<div>No backend logs available</div>
							<div class="text-caption q-mt-sm">
								Backend manager logs will appear here
							</div>
						</div>
						<pre v-else class="log-content">{{ backendLogsText }}</pre>
					</q-scroll-area>
					<div class="row q-gutter-sm q-mt-sm">
						<q-btn
							@click="copyLogs('backend')"
							icon="content_copy"
							label="Copy Backend"
							size="xs"
							color="grey-7"
							:disable="backendLogs.length === 0"
						/>
						<q-chip
							v-if="backendLogs.length > 0"
							size="sm"
							color="primary"
							text-color="white"
						>
							{{ backendLogs.length }} entries
						</q-chip>
					</div>
				</q-tab-panel>

				<!-- LIFX MCP Server Logs -->
				<q-tab-panel name="mcp" class="q-pa-sm">
					<q-scroll-area
						style="height: 380px"
						class="bg-white q-pa-sm rounded-borders"
					>
						<div
							v-if="mcpLogs.length === 0"
							class="text-center q-pa-lg text-grey-6"
						>
							<q-icon name="lightbulb" size="48px" class="q-mb-md" />
							<div>No MCP logs available</div>
							<div class="text-caption q-mt-sm">
								LIFX MCP server process logs will appear here
							</div>
						</div>
						<pre v-else class="log-content">{{ mcpLogsText }}</pre>
					</q-scroll-area>
					<div class="row q-gutter-sm q-mt-sm">
						<q-btn
							@click="copyLogs('mcp')"
							icon="content_copy"
							label="Copy MCP"
							size="xs"
							color="grey-7"
							:disable="mcpLogs.length === 0"
						/>
						<q-chip
							v-if="mcpLogs.length > 0"
							size="sm"
							color="secondary"
							text-color="white"
						>
							{{ mcpLogs.length }} entries
						</q-chip>
					</div>
				</q-tab-panel>
			</q-tab-panels>
		</q-card-section>
	</q-card>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue';
	import { useQuasar } from 'quasar';
	import { useServerLogs } from '../composables/useServerLogs';
	import { useBackendApi } from '../composables/useBackendApi';

	const $q = useQuasar();
	const { backendStatus, checkBackendHealth } = useBackendApi();
	const {
		backendLogs,
		mcpLogs,
		isLoading,
		error,
		lastUpdated,
		endpointStatus,
		fetchAllLogs,
		getCombinedLogs,
		copyLogsToClipboard,
		formatLogEntry,
	} = useServerLogs();

	const activeTab = ref('combined');

	// Computed properties for formatted log text
	const backendLogsText = computed(() => {
		return backendLogs.value
			.map(
				(log) =>
					`[${new Date(log.timestamp).toLocaleString()}] ${log.level
						.toUpperCase()
						.padEnd(5)} ${log.message}${
						log.meta ? '\n' + JSON.stringify(log.meta, null, 2) : ''
					}`
			)
			.join('\n\n');
	});

	const mcpLogsText = computed(() => {
		return mcpLogs.value
			.map(
				(log) =>
					`[${new Date(log.timestamp).toLocaleString()}] ${log.level
						.toUpperCase()
						.padEnd(5)} ${log.message}${
						log.meta ? '\n' + JSON.stringify(log.meta, null, 2) : ''
					}`
			)
			.join('\n\n');
	});

	const combinedLogs = computed(() => getCombinedLogs());

	const combinedLogsText = computed(() => {
		return combinedLogs.value.map((log) => log.displayText).join('\n\n');
	});

	const hasLogs = computed(() => {
		return backendLogs.value.length > 0 || mcpLogs.value.length > 0;
	});

	const showDevelopmentNotice = computed(() => {
		return (
			endpointStatus.value.backend === 'unavailable' ||
			endpointStatus.value.mcp === 'unavailable'
		);
	});

	// Methods
	const refreshLogs = async () => {
		if (backendStatus.value !== 'connected') {
			$q.notify({
				type: 'warning',
				message: 'Backend server is not connected. Cannot fetch logs.',
				timeout: 3000,
			});
			return;
		}

		try {
			await fetchAllLogs({
				backend: { limit: 25 },
				mcp: { limit: 20 },
			});

			$q.notify({
				type: 'positive',
				message: 'Server logs refreshed successfully',
				timeout: 2000,
			});
		} catch (err) {
			$q.notify({
				type: 'negative',
				message: `Failed to fetch logs: ${err.message}`,
				timeout: 4000,
			});
		}
	};

	const copyLogs = async (source = 'all') => {
		const success = await copyLogsToClipboard(source);

		if (success) {
			$q.notify({
				type: 'positive',
				message: `${
					source === 'all' ? 'Combined' : source
				} logs copied to clipboard`,
				timeout: 2000,
			});
		} else {
			$q.notify({
				type: 'negative',
				message: 'Failed to copy logs to clipboard',
				timeout: 3000,
			});
		}
	};

	const clearDisplay = () => {
		backendLogs.value = [];
		mcpLogs.value = [];
		error.value = null;
		lastUpdated.value = null;

		$q.notify({
			type: 'info',
			message: 'Log display cleared',
			timeout: 1500,
		});
	};

	const formatTimestamp = (date) => {
		return new Date(date).toLocaleString();
	};

	// Auto-refresh logs on component mount if backend is connected
	onMounted(() => {
		if (backendStatus.value === 'connected') {
			refreshLogs();
		}
	});
</script>

<style scoped>
	.log-content {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 12px;
		line-height: 1.4;
		white-space: pre-wrap;
		word-wrap: break-word;
		color: #333;
		margin: 0;
		padding: 0;
	}

	.q-tab-panel {
		padding: 8px;
	}

	.rounded-borders {
		border-radius: 4px;
		border: 1px solid #e0e0e0;
	}

	/* Syntax highlighting for log levels */
	.log-content:deep(.error) {
		color: #d32f2f;
		font-weight: bold;
	}

	.log-content:deep(.warn) {
		color: #f57c00;
		font-weight: bold;
	}

	.log-content:deep(.info) {
		color: #1976d2;
	}

	.log-content:deep(.debug) {
		color: #666;
	}
</style>
