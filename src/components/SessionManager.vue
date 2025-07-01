<template>
	<q-card>
		<q-card-section>
			<div class="text-h6 q-mb-md">
				<q-icon name="settings" class="q-mr-sm" />
				Session Management
			</div>
			<div class="text-caption text-grey-6 q-mb-md">
				Manage your current session and debug information
			</div>

			<!-- Session Actions -->
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
	import { ref, computed } from 'vue';
	import { useQuasar } from 'quasar';
	import { useSessionTracking } from '../composables/useSessionTracking';
	import { useApiKeys } from '../composables/useApiKeys';

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

	const confirmResetSession = () => {
		$q.dialog({
			title: 'Reset Session',
			message:
				'Are you sure you want to reset your current session? This will clear usage counters but keep your API keys.',
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
				'This will completely reset your session including generating a new session ID. Continue?',
			cancel: true,
			persistent: true,
		}).onOk(() => {
			// Clear session storage completely
			sessionStorage.removeItem('demo_session_id');
			sessionStorage.removeItem('session_start_time');
			resetSession();
			// Force page reload to ensure clean state
			window.location.reload();
		});
	};

	const confirmClearAll = () => {
		$q.dialog({
			title: 'Clear All Data',
			message:
				'This will clear ALL stored data including API keys, session data, and usage information. This cannot be undone!',
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
