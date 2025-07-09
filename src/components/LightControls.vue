<template>
	<q-card>
		<q-card-section>
			<div class="text-h6 q-mb-md">
				<q-icon name="tune" class="q-mr-sm" />
				Quick Light Controls
			</div>

			<!-- Direct LIFX Controls -->
			<div v-if="isLifxKeyValid && backendStatus === 'connected'">
				<!-- Light Discovery -->
				<q-btn
					color="primary"
					label="Discover Lights"
					icon="search"
					@click="discoverLights"
					:loading="discovering"
					class="q-mb-md full-width"
					:disable="!canSendRequest()"
				/>

				<!-- Light List -->
				<div v-if="lights.length > 0" class="q-mb-md">
					<div class="text-subtitle2 q-mb-sm">
						Your LIFX Lights ({{ lights.length }})
					</div>
					<q-list bordered separator>
						<q-item
							v-for="light in lights"
							:key="light.id"
							clickable
							@click="selectLight(light)"
						>
							<q-item-section avatar>
								<q-avatar
									:color="light.connected ? 'positive' : 'grey'"
									icon="lightbulb"
								/>
							</q-item-section>
							<q-item-section>
								<q-item-label>{{ light.label }}</q-item-label>
								<q-item-label caption>
									{{ light.connected ? 'Online' : 'Offline' }} •
									{{ light.power === 'on' ? 'On' : 'Off' }} •
									{{ Math.round(light.brightness * 100) }}%
								</q-item-label>
							</q-item-section>
							<q-item-section side>
								<q-toggle
									:model-value="light.power === 'on'"
									@update:model-value="toggleLight(light)"
									:disable="!light.connected || !canSendRequest()"
								/>
							</q-item-section>
						</q-item>
					</q-list>
				</div>

				<!-- Selected Light Controls -->
				<div v-if="selectedLight" class="q-mb-md">
					<q-separator class="q-mb-md" />
					<div class="text-subtitle2 q-mb-sm">
						Control: {{ selectedLight.label }}
					</div>

					<!-- Power Toggle -->
					<div class="row q-gutter-md q-mb-md">
						<q-btn
							:color="selectedLight.power === 'on' ? 'positive' : 'grey'"
							:label="selectedLight.power === 'on' ? 'Turn Off' : 'Turn On'"
							:icon="
								selectedLight.power === 'on' ? 'lightbulb' : 'lightbulb_outline'
							"
							@click="toggleLight(selectedLight)"
							:disable="!selectedLight.connected || !canSendRequest()"
							class="col"
						/>
					</div>

					<!-- Brightness Control -->
					<div class="q-mb-md">
						<div class="text-caption q-mb-xs">
							Brightness: {{ Math.round(brightness * 100) }}%
							<small style="color: #666">({{ brightness.toFixed(2) }})</small>
						</div>
						<q-slider
							v-model="brightness"
							:min="0.01"
							:max="1"
							:step="0.01"
							:disable="
								selectedLight.power === 'off' || !selectedLight.connected
							"
							@change="updateBrightness"
							color="primary"
							label
							:label-value="`${Math.round(brightness * 100)}%`"
						/>
					</div>

					<!-- Color Picker -->
					<div class="q-mb-md">
						<div class="text-caption q-mb-xs">Color</div>
						<div class="row q-gutter-sm q-mb-sm">
							<q-btn
								v-for="preset in colorPresets"
								:key="preset.name"
								:style="{ backgroundColor: preset.hex }"
								:label="preset.name"
								size="sm"
								@click="setColor(preset)"
								:disable="
									selectedLight.power === 'off' ||
									!selectedLight.connected ||
									!canSendRequest()
								"
								class="col-auto"
							/>
						</div>

						<!-- Custom Color Input -->
						<q-input
							v-model="customColor"
							label="Custom Color (hex)"
							placeholder="#FF0000"
							:disable="
								selectedLight.power === 'off' || !selectedLight.connected
							"
							@keyup.enter="setCustomColor"
						>
							<template v-slot:append>
								<q-btn
									flat
									round
									icon="palette"
									@click="setCustomColor"
									:disable="
										selectedLight.power === 'off' ||
										!selectedLight.connected ||
										!canSendRequest()
									"
								/>
							</template>
						</q-input>
					</div>
				</div>
			</div>

			<!-- Setup Required Message -->
			<div v-else class="text-center q-pa-md">
				<q-icon name="settings" size="48px" color="grey-5" class="q-mb-md" />
				<div class="text-grey-7">
					<div v-if="!isLifxKeyValid">
						Please enter your LIFX API key above to control lights
					</div>
					<div v-else-if="backendStatus !== 'connected'">
						Backend server connection required
					</div>
				</div>
			</div>
		</q-card-section>
	</q-card>
</template>

<script setup>
	import { ref, computed, watch } from 'vue';
	import { useQuasar } from 'quasar';
	import { useApiKeys } from '../composables/useApiKeys';
	import { useBackendApi } from '../composables/useBackendApi';
	import { useSessionTracking } from '../composables/useSessionTracking';

	const $q = useQuasar();
	const { lifxApiKey, isLifxKeyValid } = useApiKeys();
	const { backendStatus, makeApiRequest } = useBackendApi();
	const { canSendRequest, updateUsageFromResponse } = useSessionTracking();

	const discovering = ref(false);
	const lights = ref([]);
	const selectedLight = ref(null);
	const brightness = ref(1);
	const customColor = ref('#FF0000');

	// Color presets
	const colorPresets = [
		{ name: 'Red', hex: '#FF0000', hue: 0, saturation: 1 },
		{ name: 'Green', hex: '#00FF00', hue: 120, saturation: 1 },
		{ name: 'Blue', hex: '#0000FF', hue: 240, saturation: 1 },
		{ name: 'Yellow', hex: '#FFFF00', hue: 60, saturation: 1 },
		{ name: 'Purple', hex: '#FF00FF', hue: 300, saturation: 1 },
		{ name: 'Pink', hex: '#FFC0CB', hue: 350, saturation: 0.25 },
		{ name: 'Cyan', hex: '#00FFFF', hue: 180, saturation: 1 },
		{ name: 'Orange', hex: '#FF8000', hue: 30, saturation: 1 },
		{ name: 'White', hex: '#FFFFFF', hue: 0, saturation: 0 },
	];

	// Watch selected light to update controls
	watch(selectedLight, (newLight) => {
		if (newLight) {
			brightness.value = newLight.brightness || 1;
		}
	});

	const discoverLights = async () => {
		if (!isLifxKeyValid.value || !canSendRequest()) return;

		discovering.value = true;
		try {
			const response = await makeApiRequest('/api/lifx/list_lights', {
				lifxApiKey: lifxApiKey.value,
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				// Handle MCP response structure: result.content[0].text contains JSON string
				let lightsData = [];

				if (
					response.data.result &&
					response.data.result.content &&
					response.data.result.content[0]
				) {
					// Parse the JSON string from MCP response
					const lightsJsonString = response.data.result.content[0].text;
					const parsedData = JSON.parse(lightsJsonString);
					lightsData = parsedData.lights || [];
				} else if (response.data.lights) {
					// Fallback: direct lights array (if backend format changes)
					lightsData = response.data.lights;
				}

				lights.value = lightsData;
				if (lights.value.length > 0 && !selectedLight.value) {
					selectedLight.value = lights.value[0];
				}
				$q.notify({
					type: 'positive',
					message: `Found ${lights.value.length} LIFX lights`,
					timeout: 2000,
				});
			} else {
				throw new Error(response.data.error || 'Failed to discover lights');
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Failed to discover lights',
				timeout: 3000,
			});
		} finally {
			discovering.value = false;
		}
	};

	const selectLight = (light) => {
		selectedLight.value = light;
	};

	const toggleLight = async (light) => {
		if (!canSendRequest()) return;

		try {
			const newPower = light.power === 'on' ? 'off' : 'on';
			const response = await makeApiRequest('/api/lifx/set_light_state', {
				lifxApiKey: lifxApiKey.value,
				selector: `id:${light.id}`,
				power: newPower,
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				light.power = newPower;
				$q.notify({
					type: 'positive',
					message: `${light.label} turned ${newPower}`,
					timeout: 1500,
				});
			} else {
				throw new Error(response.data.error || 'Failed to toggle light');
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Failed to toggle light',
				timeout: 3000,
			});
		}
	};

	const updateBrightness = async () => {
		if (!selectedLight.value || !canSendRequest()) return;

		try {
			const response = await makeApiRequest('/api/lifx/set_brightness', {
				lifxApiKey: lifxApiKey.value,
				selector: `id:${selectedLight.value.id}`,
				brightness: brightness.value,
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				selectedLight.value.brightness = brightness.value;
				$q.notify({
					type: 'positive',
					message: `Brightness set to ${Math.round(brightness.value * 100)}%`,
					timeout: 1500,
				});
			} else {
				throw new Error(response.data.error || 'Failed to update brightness');
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Failed to update brightness',
				timeout: 3000,
			});
		}
	};

	const setColor = async (preset) => {
		if (!selectedLight.value || !canSendRequest()) return;

		try {
			const response = await makeApiRequest('/api/lifx/set_color', {
				lifxApiKey: lifxApiKey.value,
				selector: `id:${selectedLight.value.id}`,
				color: preset.name.toLowerCase(), // Use simple color name like "red", "blue", etc.
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				$q.notify({
					type: 'positive',
					message: `Color set to ${preset.name}`,
					timeout: 1500,
				});
			} else {
				throw new Error(response.data.error || 'Failed to set color');
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Failed to set color',
				timeout: 3000,
			});
		}
	};

	const setCustomColor = async () => {
		if (!selectedLight.value || !customColor.value || !canSendRequest()) return;

		// Validate hex format
		const hex = customColor.value.replace('#', '');
		if (hex.length !== 6) {
			$q.notify({
				type: 'warning',
				message: 'Please enter a valid hex color (e.g., #FF0000)',
				timeout: 2000,
			});
			return;
		}

		try {
			const response = await makeApiRequest('/api/lifx/set_color', {
				lifxApiKey: lifxApiKey.value,
				selector: `id:${selectedLight.value.id}`,
				color: customColor.value, // Send hex color directly
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				$q.notify({
					type: 'positive',
					message: `Custom color applied`,
					timeout: 1500,
				});
			} else {
				throw new Error(response.data.error || 'Failed to set custom color');
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || 'Failed to set custom color',
				timeout: 3000,
			});
		}
	};

	// Refresh light status - called after Claude actions to sync UI
	const refreshLightStatus = async (showNotification = false) => {
		console.log('🔄 refreshLightStatus called!', {
			isLifxKeyValid: isLifxKeyValid.value,
			lightsCount: lights.value.length,
			selectedLightId: selectedLight.value?.id,
		});

		if (!isLifxKeyValid.value || lights.value.length === 0) {
			console.log('❌ Early return from refreshLightStatus:', {
				isLifxKeyValid: isLifxKeyValid.value,
				lightsCount: lights.value.length,
			});
			return;
		}

		console.log('🔄 Refreshing light status after Claude action...');

		try {
			const response = await makeApiRequest('/api/lifx/list_lights', {
				lifxApiKey: lifxApiKey.value,
			});

			console.log('📡 Light status response:', response.data);

			if (response.data.success) {
				// Handle MCP response structure
				let lightsData = [];

				if (
					response.data.result &&
					response.data.result.content &&
					response.data.result.content[0]
				) {
					const lightsJsonString = response.data.result.content[0].text;
					const parsedData = JSON.parse(lightsJsonString);
					lightsData = parsedData.lights || [];
				} else if (response.data.lights) {
					lightsData = response.data.lights;
				}

				console.log('💡 Updated lights data:', lightsData);

				// Debug: Log the raw structure of the first light
				if (lightsData.length > 0) {
					console.log('🔍 First light raw data:', {
						fullLight: lightsData[0],
						availableProperties: Object.keys(lightsData[0]),
						brightness: lightsData[0].brightness,
						power: lightsData[0].power,
						color: lightsData[0].color,
						colorProperties: lightsData[0].color
							? Object.keys(lightsData[0].color)
							: 'no color object',
					});
				}

				// Update lights array
				lights.value = lightsData;

				// Update selected light and sync brightness slider
				if (selectedLight.value && lightsData.length > 0) {
					const updatedLight = lightsData.find(
						(light) => light.id === selectedLight.value.id
					);
					if (updatedLight) {
						// Extract brightness from multiple possible locations
						const extractedBrightness =
							updatedLight.brightness ||
							updatedLight.color?.brightness ||
							updatedLight.color?.b ||
							1; // fallback to 100%

						console.log('🎯 Found selected light:', {
							lightId: updatedLight.id,
							lightLabel: updatedLight.label,
							oldBrightness: selectedLight.value.brightness,
							newBrightness: updatedLight.brightness,
							colorBrightness: updatedLight.color?.brightness,
							colorB: updatedLight.color?.b,
							extractedBrightness: extractedBrightness,
							oldSliderValue: brightness.value,
							updatedLightRaw: updatedLight,
						});

						selectedLight.value = updatedLight;
						const newBrightnessValue = extractedBrightness;

						// Force Vue reactivity update
						brightness.value = newBrightnessValue;

						// Additional force update - trigger reactivity
						setTimeout(() => {
							brightness.value = newBrightnessValue;
						}, 10);

						console.log('✅ Synced brightness slider:', {
							newSliderValue: brightness.value,
							percentage: Math.round(brightness.value * 100) + '%',
							brightnessBefore: brightness.value,
							brightnessAfter: newBrightnessValue,
							sliderReactiveUpdate: brightness.value === newBrightnessValue,
						});
					} else {
						console.log('⚠️ Selected light not found in updated data');
					}
				} else {
					console.log('⚠️ No selected light or no lights data');
				}

				if (showNotification) {
					$q.notify({
						type: 'info',
						message: 'Light status refreshed',
						timeout: 1500,
					});
				}
			} else {
				console.warn('⚠️ Failed to refresh light status:', response.data.error);
			}
		} catch (error) {
			console.error('❌ Error refreshing light status:', error);
		}
	};

	// Expose the refresh function for external components
	defineExpose({
		refreshLightStatus,
	});
</script>
