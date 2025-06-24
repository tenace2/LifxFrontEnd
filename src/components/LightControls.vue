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

				<!-- Quick Actions -->
				<div class="row q-gutter-sm">
					<q-btn
						color="positive"
						label="All On"
						icon="lightbulb"
						@click="allLightsAction('on')"
						:disable="lights.length === 0 || !canSendRequest()"
						class="col"
					/>
					<q-btn
						color="negative"
						label="All Off"
						icon="lightbulb_outline"
						@click="allLightsAction('off')"
						:disable="lights.length === 0 || !canSendRequest()"
						class="col"
					/>
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
			const response = await makeApiRequest('/api/lifx/lights', {
				lifxApiKey: lifxApiKey.value,
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				lights.value = response.data.lights || [];
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
			const response = await makeApiRequest('/api/lifx/power', {
				lifxApiKey: lifxApiKey.value,
				lightId: light.id,
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
			const response = await makeApiRequest('/api/lifx/brightness', {
				lifxApiKey: lifxApiKey.value,
				lightId: selectedLight.value.id,
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
			const response = await makeApiRequest('/api/lifx/color', {
				lifxApiKey: lifxApiKey.value,
				lightId: selectedLight.value.id,
				hue: preset.hue / 360, // LIFX expects 0-1
				saturation: preset.saturation,
				brightness: brightness.value,
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

		// Convert hex to HSB
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
			const response = await makeApiRequest('/api/lifx/color', {
				lifxApiKey: lifxApiKey.value,
				lightId: selectedLight.value.id,
				color: customColor.value,
				brightness: brightness.value,
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

	const allLightsAction = async (action) => {
		if (lights.value.length === 0 || !canSendRequest()) return;

		try {
			const response = await makeApiRequest('/api/lifx/all', {
				lifxApiKey: lifxApiKey.value,
				action: action,
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				// Update local state
				lights.value.forEach((light) => {
					light.power = action;
				});
				$q.notify({
					type: 'positive',
					message: `All lights turned ${action}`,
					timeout: 2000,
				});
			} else {
				throw new Error(
					response.data.error || `Failed to turn all lights ${action}`
				);
			}
		} catch (error) {
			$q.notify({
				type: 'negative',
				message: error.message || `Failed to turn all lights ${action}`,
				timeout: 3000,
			});
		}
	};
</script>
