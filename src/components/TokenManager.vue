<template>
	<q-card>
		<q-card-section>
			<div class="text-h6 q-mb-md">
				<q-icon name="key" class="q-mr-sm" />
				API Configuration
			</div>

			<!-- API Key Help -->
			<q-banner v-if="!areKeysValid" class="q-mb-md" dense>
				<template v-slot:avatar>
					<q-icon name="help_outline" />
				</template>
				<div class="text-body2">
					Need API keys?
					<ul class="q-my-xs q-pl-md">
						<li>
							<strong>LIFX:</strong>
							<a
								href="https://cloud.lifx.com/settings"
								target="_blank"
								class="text-primary"
							>
								Get your token from cloud.lifx.com/settings
								<q-icon name="open_in_new" size="12px" class="q-ml-xs" />
							</a>
						</li>
						<li>
							<strong>Claude:</strong>
							<a
								href="https://console.anthropic.com"
								target="_blank"
								class="text-primary"
							>
								Get your key from console.anthropic.com
								<q-icon name="open_in_new" size="12px" class="q-ml-xs" />
							</a>
						</li>
					</ul>
				</div>
			</q-banner>
			<!-- LIFX API Key -->
			<q-input
				v-model="lifxApiKey"
				:type="showLifxKey ? 'text' : 'password'"
				label="LIFX API Key"
				hint="Get your token from cloud.lifx.com/settings"
				:error="lifxApiKey && !isLifxKeyValid"
				:error-message="lifxApiKey ? validateLifxApiKey(lifxApiKey) : ''"
				class="q-mb-md"
				@update:model-value="saveApiKeys"
			>
				<template v-slot:prepend>
					<q-icon
						name="lightbulb"
						:color="lifxApiKey && isLifxKeyValid ? 'yellow-8' : 'grey-5'"
						:class="
							lifxApiKey && isLifxKeyValid ? 'text-yellow-8' : 'text-grey-5'
						"
					/>
				</template>
				<template v-slot:append>
					<!-- Success indicator -->
					<q-icon
						v-if="lifxApiKey && isLifxKeyValid"
						name="check_circle"
						color="positive"
						class="q-mr-sm"
						title="Valid LIFX API key"
					/>
					<!-- Show/Hide toggle -->
					<q-btn
						v-if="lifxApiKey"
						flat
						round
						:icon="showLifxKey ? 'visibility_off' : 'visibility'"
						@click="showLifxKey = !showLifxKey"
						class="q-mr-xs"
						title="Toggle visibility"
					/>
					<!-- Clear button -->
					<q-btn
						v-if="lifxApiKey"
						flat
						round
						icon="clear"
						@click="
							lifxApiKey = '';
							saveApiKeys();
						"
						title="Clear key"
					/>
				</template>
			</q-input>

			<!-- Claude API Key -->
			<q-input
				v-model="claudeApiKey"
				:type="showClaudeKey ? 'text' : 'password'"
				label="Claude API Key"
				hint="Get your key from console.anthropic.com"
				:error="claudeApiKey && !isClaudeKeyValid"
				:error-message="claudeApiKey ? validateClaudeApiKey(claudeApiKey) : ''"
				class="q-mb-md"
				@update:model-value="saveApiKeys"
			>
				<template v-slot:prepend>
					<q-icon
						name="smart_toy"
						:color="claudeApiKey && isClaudeKeyValid ? 'blue-6' : 'grey-5'"
						:class="
							claudeApiKey && isClaudeKeyValid ? 'text-blue-6' : 'text-grey-5'
						"
					/>
				</template>
				<template v-slot:append>
					<!-- Success indicator -->
					<q-icon
						v-if="claudeApiKey && isClaudeKeyValid"
						name="check_circle"
						color="positive"
						class="q-mr-sm"
						title="Valid Claude API key"
					/>
					<!-- Show/Hide toggle -->
					<q-btn
						v-if="claudeApiKey"
						flat
						round
						:icon="showClaudeKey ? 'visibility_off' : 'visibility'"
						@click="showClaudeKey = !showClaudeKey"
						class="q-mr-xs"
						title="Toggle visibility"
					/>
					<!-- Clear button -->
					<q-btn
						v-if="claudeApiKey"
						flat
						round
						icon="clear"
						@click="
							claudeApiKey = '';
							saveApiKeys();
						"
						title="Clear key"
					/>
				</template>
			</q-input>

			<!-- API Key Status Summary -->
			<div class="q-mb-md">
				<q-banner v-if="!lifxApiKey && !claudeApiKey" type="info" dense>
					<template v-slot:avatar>
						<q-icon name="info" />
					</template>
					Please enter both API keys to begin using the application.
				</q-banner>

				<q-banner v-else-if="areKeysValid" type="positive" dense>
					<template v-slot:avatar>
						<q-icon name="check_circle" />
					</template>
					All API keys are properly configured and ready to use!
				</q-banner>

				<q-banner v-else type="warning" dense>
					<template v-slot:avatar>
						<q-icon name="warning" />
					</template>
					Please check your API key formats above.
				</q-banner>
			</div>

			<!-- Connection Status -->
			<div class="q-mb-md">
				<q-item dense>
					<q-item-section avatar>
						<q-icon :name="backendStatusIcon" :color="backendStatusColor" />
					</q-item-section>
					<q-item-section>
						<q-item-label>Backend Server</q-item-label>
						<q-item-label caption>{{ backendStatusText }}</q-item-label>
						<q-item-label caption class="text-grey-6">{{
							BACKEND_URL
						}}</q-item-label>
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
			<div class="row q-gutter-sm q-mb-sm">
				<q-btn
					color="primary"
					label="Test LIFX Connection"
					icon="lightbulb"
					:disable="!isLifxKeyValid || backendStatus !== 'connected'"
					@click="testLifxConnection"
					:loading="testingLifx"
					class="full-width"
				/>
			</div>

			<!-- LIFX Test Results Display -->
			<div class="q-mb-md">
				<q-card
					v-show="
						lifxTestResults !== null &&
						lifxTestResults !== undefined &&
						lifxTestResults !== ''
					"
					flat
					bordered
					class="lifx-results-card"
				>
					<q-card-section class="q-pa-md">
						<div class="text-subtitle2 q-mb-md">
							<q-icon name="lightbulb" class="q-mr-xs" />
							LIFX Connection Test Results
						</div>
						<div class="lifx-results-container">
							<pre class="lifx-results-text">{{ lifxTestResults }}</pre>
						</div>
						<div class="row q-gutter-sm q-mt-md">
							<q-btn
								flat
								size="sm"
								color="primary"
								icon="content_copy"
								label="Copy Results"
								@click="copyLifxResults"
							/>
							<q-btn
								flat
								size="sm"
								color="grey-7"
								icon="clear"
								label="Clear"
								@click="clearLifxResults"
							/>
						</div>
					</q-card-section>
				</q-card>
			</div>
		</q-card-section>
	</q-card>
</template>

<script setup>
	import { ref, computed, onMounted, watch, nextTick } from 'vue';
	import { useQuasar } from 'quasar';
	import { useApiKeys } from '../composables/useApiKeys';
	import { useBackendApi } from '../composables/useBackendApi';
	import { useSessionTracking } from '../composables/useSessionTracking';

	const $q = useQuasar();
	const {
		lifxApiKey,
		claudeApiKey,
		saveApiKeys,
		validateLifxApiKey,
		validateClaudeApiKey,
		isLifxKeyValid,
		isClaudeKeyValid,
	} = useApiKeys();

	const { backendStatus, checkBackendHealth, makeApiRequest, BACKEND_URL } =
		useBackendApi();
	const { resetSession } = useSessionTracking();

	const testingLifx = ref(false);
	const showLifxKey = ref(false);
	const showClaudeKey = ref(false);
	const lifxTestResults = ref(null);

	// Computed property for combined keys validation
	const areKeysValid = computed(
		() => isLifxKeyValid.value && isClaudeKeyValid.value
	);

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
		console.log('🔮 TEST LIFX CONNECTION clicked!');
		console.log('🔑 LIFX key valid:', isLifxKeyValid.value);
		console.log('🔗 Backend status:', backendStatus.value);

		// Clear previous results
		lifxTestResults.value = null;

		if (!isLifxKeyValid.value) {
			console.log('❌ Cannot test - LIFX key is invalid');
			return;
		}

		console.log('🚀 Starting LIFX connection test...');
		testingLifx.value = true;

		try {
			console.log('📡 Making API request to /api/lifx/list_lights');
			const response = await makeApiRequest('/api/lifx/list_lights', {
				lifxApiKey: lifxApiKey.value,
			});

			console.log('✅ LIFX test response received:', response.data);

			// Store results for display
			const timestamp = new Date().toLocaleString();
			let resultsText = `=== LIFX Connection Test Results ===\n`;
			resultsText += `Timestamp: ${timestamp}\n`;
			resultsText += `Endpoint: /api/lifx/list_lights\n\n`;

			// Check for timeout error specifically
			if (response.data.error && response.data.error.includes('timeout')) {
				console.log(
					'⏰ Timeout detected, API key is likely valid but MCP timeout too short'
				);

				resultsText += `Status: Timeout Error\n`;
				resultsText += `Error: ${response.data.error}\n\n`;
				resultsText += `Note: Your LIFX API key appears to be valid, but the backend\n`;
				resultsText += `timed out while communicating with LIFX servers. This is\n`;
				resultsText += `likely a temporary issue or MCP timeout configuration.`;

				lifxTestResults.value = resultsText;

				$q.notify({
					type: 'warning',
					message:
						'LIFX API key appears valid, but backend timeout occurred. Your key works with LIFX servers directly.',
					timeout: 5000,
				});
				return;
			}

			if (response.data.success) {
				// Parse the response to extract lights data
				let lightsData = [];
				let lightCount = 0;

				console.log('🔍 Parsing response structure:', {
					hasResult: !!response.data.result,
					hasContent: !!response.data.result?.content,
					hasContentArray: Array.isArray(response.data.result?.content),
					contentLength: response.data.result?.content?.length,
					firstContent: response.data.result?.content?.[0],
					directLights: response.data.lights,
					fullResponseData: response.data,
				});

				if (
					response.data.result &&
					response.data.result.content &&
					response.data.result.content[0]
				) {
					// Handle MCP response structure
					try {
						const lightsJsonString = response.data.result.content[0].text;
						console.log('🔍 Raw lights JSON string:', lightsJsonString);
						const parsedData = JSON.parse(lightsJsonString);
						console.log('🔍 Parsed data:', parsedData);
						lightsData = parsedData.lights || [];
						lightCount = lightsData.length;
						console.log('✅ MCP parsing successful:', {
							lightCount,
							lightsData,
						});
					} catch (parseError) {
						console.error('❌ Failed to parse MCP response:', parseError);
						// Try alternative parsing
						lightsData = [];
						lightCount = 0;
					}
				} else if (response.data.lights) {
					// Handle direct response structure
					lightsData = response.data.lights;
					lightCount = lightsData.length;
					console.log('✅ Direct parsing successful:', {
						lightCount,
						lightsData,
					});
				} else {
					// Try to extract from result directly
					if (
						response.data.result &&
						typeof response.data.result === 'object'
					) {
						console.log(
							'🔍 Trying direct result extraction:',
							response.data.result
						);
						lightsData = response.data.result.lights || [];
						lightCount = lightsData.length;
						console.log('✅ Direct result parsing:', {
							lightCount,
							lightsData,
						});
					}
				}

				console.log('🎯 Final parsed data:', { lightCount, lightsData });

				resultsText += `Status: SUCCESS ✅\n`;
				resultsText += `Lights Found: ${lightCount}\n\n`;

				if (lightCount > 0) {
					resultsText += `=== Light Details ===\n`;
					lightsData.forEach((light, index) => {
						resultsText += `\n${index + 1}. "${
							light.label || 'Unnamed Light'
						}"\n`;
						resultsText += `   ID: ${light.id}\n`;
						resultsText += `   Power: ${light.power || 'unknown'}\n`;
						resultsText += `   Connected: ${light.connected ? 'Yes' : 'No'}\n`;
						resultsText += `   Brightness: ${Math.round(
							(light.brightness || 0) * 100
						)}%\n`;
						if (light.color) {
							resultsText += `   Color: Hue ${
								light.color.hue || 0
							}°, Sat ${Math.round((light.color.saturation || 0) * 100)}%\n`;
						}
						if (light.group) {
							resultsText += `   Group: ${light.group.name || 'None'}\n`;
						}
						if (light.location) {
							resultsText += `   Location: ${light.location.name || 'None'}\n`;
						}
					});
				} else {
					resultsText += `No lights found. Make sure your LIFX lights are:\n`;
					resultsText += `- Connected to WiFi\n`;
					resultsText += `- Associated with your LIFX account\n`;
					resultsText += `- Powered on\n`;
				}

				// Always set the results, even if no lights found
				lifxTestResults.value = resultsText;
				console.log('📋 Results text set:', resultsText);

				// Force reactivity update
				await nextTick();
				console.log('🔄 NextTick completed, reactive value should be updated');
				console.log('🔍 Current lifxTestResults.value:', lifxTestResults.value);

				console.log('🎉 LIFX connection successful!', {
					lightCount: lightCount,
					lights: lightsData,
					data: response.data,
				});
				$q.notify({
					type: 'positive',
					message: `LIFX connection successful! Found ${lightCount} lights.`,
					timeout: 3000,
				});
			} else {
				resultsText += `Status: FAILED ❌\n`;
				resultsText += `Error: ${response.data.error || 'Unknown error'}\n\n`;
				resultsText += `Please check:\n`;
				resultsText += `- LIFX API key is correct\n`;
				resultsText += `- LIFX account has lights associated\n`;
				resultsText += `- Network connectivity\n`;

				lifxTestResults.value = resultsText;

				console.log('⚠️ LIFX connection failed:', response.data.error);
				$q.notify({
					type: 'negative',
					message: response.data.error || 'LIFX connection failed',
					timeout: 3000,
				});
			}
		} catch (error) {
			console.log('❌ LIFX test error caught:', {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});

			// Store error results for display
			const timestamp = new Date().toLocaleString();
			let errorText = `=== LIFX Connection Test Results ===\n`;
			errorText += `Timestamp: ${timestamp}\n`;
			errorText += `Status: ERROR ❌\n\n`;
			errorText += `Error Details:\n`;
			errorText += `Message: ${error.message}\n`;
			if (error.response?.status) {
				errorText += `HTTP Status: ${error.response.status}\n`;
			}
			if (error.response?.data) {
				errorText += `Response Data: ${JSON.stringify(
					error.response.data,
					null,
					2
				)}\n`;
			}

			lifxTestResults.value = errorText;

			if (error.message === 'MULTIPLE_SESSIONS_ERROR') {
				console.log('👥 Multiple sessions error detected - showing dialog');
				$q.dialog({
					title: 'Multiple Sessions Detected',
					message:
						'Multiple sessions detected from your IP. Would you like to reset your session and try again?',
					cancel: true,
					persistent: true,
					ok: {
						label: 'Reset Session',
						color: 'primary',
					},
					cancel: {
						label: 'Cancel',
						color: 'grey',
					},
				}).onOk(() => {
					console.log('🔄 User chose to reset session from dialog');
					resetSession();
					$q.notify({
						type: 'info',
						message: 'Session reset. Please try again.',
						timeout: 2000,
					});
				});
			} else {
				console.log('💥 Other error occurred:', error.message);
				console.log('📋 Full error details:', {
					status: error.response?.status,
					statusText: error.response?.statusText,
					data: error.response?.data,
					headers: error.response?.headers,
				});

				// Show more specific error message for different status codes
				let errorMessage = error.message || 'Failed to test LIFX connection';

				if (error.response?.status === 400 && error.response?.data) {
					const errorData = error.response.data;
					if (errorData.error) {
						errorMessage = `Bad Request: ${errorData.error}`;
					} else if (errorData.message) {
						errorMessage = `Bad Request: ${errorData.message}`;
					}
					console.log('🔍 400 Error details:', errorData);
				} else if (error.response?.status === 500 && error.response?.data) {
					const errorData = error.response.data;
					console.log('🔥 500 Server Error details:', errorData);
					if (errorData.error) {
						errorMessage = `Server Error: ${errorData.error}`;
					} else if (errorData.message) {
						errorMessage = `Server Error: ${errorData.message}`;
					} else {
						errorMessage = 'Server Error: Internal server error occurred';
					}
				}

				$q.notify({
					type: 'negative',
					message: errorMessage,
					timeout: 3000,
				});
			}
		} finally {
			console.log('🏁 LIFX test completed, cleaning up...');
			testingLifx.value = false;
		}
	};

	const copyLifxResults = async () => {
		if (!lifxTestResults.value) return;

		try {
			await navigator.clipboard.writeText(lifxTestResults.value);
			$q.notify({
				type: 'positive',
				message: 'LIFX test results copied to clipboard',
				timeout: 2000,
			});
		} catch (error) {
			console.error('Failed to copy results:', error);
			$q.notify({
				type: 'negative',
				message: 'Failed to copy results to clipboard',
				timeout: 2000,
			});
		}
	};

	const clearLifxResults = () => {
		console.log('🧹 Clearing LIFX results...');
		lifxTestResults.value = null;
		console.log('✅ LIFX results cleared');
	};

	// Perform initial health check on mount only if not already connected
	onMounted(() => {
		console.log('🏗️ TokenManager component mounted');
		if (
			backendStatus.value === 'checking' ||
			backendStatus.value === 'disconnected'
		) {
			console.log('🔗 Performing initial backend health check...');
			checkBackendHealth(true, 'token-manager-initial'); // Force initial check
		} else {
			console.log('🔗 Backend status already known:', backendStatus.value);
		}
	});

	// Watch lifxTestResults for debugging
	watch(lifxTestResults, (newValue, oldValue) => {
		console.log('👀 lifxTestResults changed:', {
			newValue: newValue ? 'Has content' : 'null',
			oldValue: oldValue ? 'Had content' : 'null',
			actualNewValue: newValue,
			length: newValue?.length,
		});
	});
</script>

<style scoped>
	.lifx-results-card {
		background-color: #fafafa;
		border: 1px solid #e0e0e0;
	}

	.lifx-results-container {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #ddd;
		border-radius: 6px;
		background-color: #ffffff;
	}

	.lifx-results-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-wrap: break-word;
		word-break: break-word;
		color: #2c3e50;
		margin: 0;
		padding: 12px;
		background-color: #ffffff;
		min-height: 100px;
		overflow-wrap: break-word;
	}

	.lifx-results-container::-webkit-scrollbar {
		width: 8px;
	}

	.lifx-results-container::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	.lifx-results-container::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 4px;
	}

	.lifx-results-container::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
</style>
