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
						@click="() => checkBackendHealth(true, 'manual-health-check')"
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
				<q-chip
					v-if="lastUpdated"
					size="sm"
					color="info"
					text-color="white"
					icon="schedule"
					class="q-ml-sm"
				>
					{{ selectedTimeFrame.label }}
				</q-chip>
			</div>

			<!-- Controls -->
			<div class="row q-gutter-sm q-mb-md">
				<q-btn-dropdown
					icon="refresh"
					:label="selectedTimeFrame.label"
					color="primary"
					:loading="isLoading"
					size="sm"
					split
					@click="refreshLogs(selectedTimeFrame.value)"
				>
					<q-list>
						<q-item
							v-for="timeFrame in timeFrameOptions"
							:key="timeFrame.value"
							clickable
							v-close-popup
							@click="selectTimeFrame(timeFrame)"
							:class="{
								'bg-blue-1': timeFrame.value === selectedTimeFrame.value,
							}"
						>
							<q-item-section>
								<q-item-label>{{ timeFrame.label }}</q-item-label>
								<q-item-label caption>{{ timeFrame.description }}</q-item-label>
							</q-item-section>
							<q-item-section
								side
								v-if="timeFrame.value === selectedTimeFrame.value"
							>
								<q-icon name="check" color="primary" />
							</q-item-section>
						</q-item>
					</q-list>
				</q-btn-dropdown>
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
						<div
							v-else
							class="enhanced-log-display"
							v-html="combinedLogsText"
						></div>
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
						<div
							v-else
							class="enhanced-log-display"
							v-html="backendLogsText"
						></div>
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
						<div v-else class="enhanced-log-display" v-html="mcpLogsText"></div>
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

	// Import CSS for log formatting
	import '../styles/log-formatting.css';

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
		formatLogEntryEnhanced,
	} = useServerLogs();

	const activeTab = ref('combined');

	// Time frame options for log filtering
	const timeFrameOptions = [
		{
			value: 15,
			label: 'Last 15 minutes',
			description: 'Recent activity and errors',
		},
		{
			value: 60,
			label: 'Last 1 hour',
			description: 'Extended troubleshooting view',
		},
		{
			value: 240,
			label: 'Last 4 hours',
			description: 'Comprehensive session logs',
		},
	];

	const selectedTimeFrame = ref(timeFrameOptions[0]); // Default to 15 minutes

	// Computed properties for formatted log text with HTML rendering
	const backendLogsText = computed(() => {
		return backendLogs.value
			.map((log) => formatLogEntryEnhanced(log))
			.join('\n\n');
	});

	const mcpLogsText = computed(() => {
		return mcpLogs.value.map((log) => formatLogEntryEnhanced(log)).join('\n\n');
	});

	const combinedLogs = computed(() => getCombinedLogs());

	const combinedLogsText = computed(() => {
		return combinedLogs.value
			.map((log) => log.htmlContent || log.displayText)
			.join('\n\n');
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
	const refreshLogs = async (
		timeFrameMinutes = selectedTimeFrame.value.value
	) => {
		if (backendStatus.value !== 'connected') {
			$q.notify({
				type: 'warning',
				message: 'Backend server is not connected. Cannot fetch logs.',
				timeout: 3000,
			});
			return;
		}

		try {
			// Calculate the 'since' timestamp based on time frame
			const since = new Date(
				Date.now() - timeFrameMinutes * 60 * 1000
			).toISOString();

			await fetchAllLogs({
				backend: { limit: 100, since }, // Increased limit for time-based filtering
				mcp: { limit: 100, since },
			});

			$q.notify({
				type: 'positive',
				message: `Server logs refreshed (${selectedTimeFrame.value.label})`,
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

	const selectTimeFrame = (timeFrame) => {
		selectedTimeFrame.value = timeFrame;
		// Automatically refresh logs with new time frame
		refreshLogs(timeFrame.value);
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
