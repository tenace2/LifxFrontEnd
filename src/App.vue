<template>
	<q-layout view="lHh Lpr lFf">
		<q-header elevated>
			<q-toolbar>
				<q-icon name="lightbulb" size="md" class="q-mr-sm" />
				<q-toolbar-title> LIFX-Claude Demo </q-toolbar-title>

				<!-- Backend Status Indicator -->
				<q-chip
					:color="backendStatusColor"
					text-color="white"
					:icon="backendStatusIcon"
					size="sm"
				>
					{{ backendStatusText }}
				</q-chip>

				<!-- Theme Toggle -->
				<q-btn
					flat
					round
					:icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
					@click="$q.dark.toggle()"
				/>
			</q-toolbar>
		</q-header>

		<q-page-container>
			<q-page class="q-pa-md">
				<!-- Connection Status Banner -->
				<q-banner
					v-if="backendStatus === 'disconnected'"
					type="warning"
					class="q-mb-md"
				>
					<template v-slot:avatar>
						<q-icon name="cloud_off" />
					</template>
					Backend server is disconnected. Some features may not work.
					<template v-slot:action>
						<q-btn flat @click="checkBackendHealth">Retry</q-btn>
					</template>
				</q-banner>

				<!-- Session Usage Display -->
				<UsageIndicator class="q-mb-md" />

				<!-- Main Content Grid -->
				<div class="row q-gutter-md">
					<!-- Left Column: API Keys & Light Controls -->
					<div class="col-12 col-md-4">
						<TokenManager class="q-mb-md" />
						<LightControls />
					</div>

					<!-- Right Column: Claude Chat -->
					<div class="col-12 col-md-8">
						<ClaudeChat />
					</div>
				</div>
			</q-page>
		</q-page-container>

		<!-- Footer -->
		<q-footer bordered class="bg-grey-8 text-white">
			<q-toolbar>
				<q-toolbar-title class="text-caption">
					Educational demo showcasing MCP integration with LIFX lights and
					Claude AI
				</q-toolbar-title>
				<q-space />
				<q-btn flat dense icon="info" @click="showInfoDialog = true" />
			</q-toolbar>
		</q-footer>

		<!-- Info Dialog -->
		<q-dialog v-model="showInfoDialog">
			<q-card style="min-width: 350px">
				<q-card-section>
					<div class="text-h6">About This Demo</div>
				</q-card-section>

				<q-card-section class="q-pt-none">
					<p>
						This is an educational demonstration of Model Context Protocol (MCP)
						integration.
					</p>
					<p><strong>Features:</strong></p>
					<ul>
						<li>Control LIFX smart lights through Claude AI</li>
						<li>Natural language processing for light commands</li>
						<li>Real-time usage tracking and rate limiting</li>
						<li>Secure API key handling</li>
					</ul>
					<p><strong>Requirements:</strong></p>
					<ul>
						<li>LIFX API token from cloud.lifx.com/settings</li>
						<li>Claude API key from console.anthropic.com</li>
					</ul>
				</q-card-section>

				<q-card-actions align="right">
					<q-btn flat label="Close" color="primary" v-close-popup />
				</q-card-actions>
			</q-card>
		</q-dialog>
	</q-layout>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue';
	import { useQuasar } from 'quasar';
	import TokenManager from './components/TokenManager.vue';
	import ClaudeChat from './components/ClaudeChat.vue';
	import LightControls from './components/LightControls.vue';
	import UsageIndicator from './components/UsageIndicator.vue';
	import { useBackendApi } from './composables/useBackendApi';

	const $q = useQuasar();
	const { backendStatus, checkBackendHealth } = useBackendApi();
	const showInfoDialog = ref(false);

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

	onMounted(() => {
		checkBackendHealth();

		// Check backend health every 30 seconds
		setInterval(() => {
			checkBackendHealth();
		}, 30000);
	});
</script>

<style scoped>
	.q-layout {
		min-height: 100vh;
	}
</style>
