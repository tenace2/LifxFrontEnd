<template>
	<q-card class="chat-card">
		<q-card-section class="q-pb-none">
			<div class="text-h6 q-mb-md">
				<q-icon name="smart_toy" class="q-mr-sm" />
				Claude AI Chat
			</div>

			<!-- AI Control Panel -->
			<div class="row q-gutter-md q-mb-md">
				<!-- System Prompt Control Card -->
				<div class="col-12 col-md-6">
					<q-card flat bordered class="full-height">
						<q-card-section>
							<div class="text-h6 q-mb-md">
								<q-icon name="security" class="q-mr-sm" />
								System Prompt Control
							</div>

							<!-- What is a System Prompt? -->
							<q-expansion-item
								icon="help_outline"
								label="What is a System Prompt?"
								class="q-mb-md"
								@show="onSystemPromptDialogOpen"
								@hide="onSystemPromptDialogClose"
							>
								<div class="q-pa-md bg-blue-1 rounded-borders">
									<div class="text-body2 q-mb-md">
										When initializing each Claude AI session, a system prompt
										(sometimes called a "system message" or "pre-prompt") sets
										boundaries for the AI assistant's behavior. This ensures
										Claude only responds to lighting control requests and helps
										prevent accidental off-topic conversations. <br /><br />
										This prompt is actually implemented on the server side.
										<br /><br />
										There are two levels of system prompts:
										<br /><br />
										There is a <b>Strict</b> system prompt that is Enabled by
										default, but you can turn it off (Disable). <br /><br />
										Then there is a <b>General</b> system prompt that is
										implemented by the server backend, even if you Disable
										System Prompt on this front end client. <br />
										Note the General prompt is necessary so that Claude can be
										made aware of the LIFX MCP tools. Without a General prompt
										the chat would not be even know of the LIFX capability and
										would not necesarily respond to lighting control requests.
										Note that you can get some very odd behavior if you disable
										the Strict guardrails. The General prompt can possibly allow
										for <i>random misinterpretations</i> of your chats, such an
										off topic chat "Please make be bacon and eggs" can result in
										the "on" in "bacon" being parsed out and turning your lights
										on. But you can also ask for "I need a recipe for potato
										salad, oh, and also turn my lights blue".
									</div>

									<!-- Cost Impact -->
									<div class="text-body2 q-mb-md">
										<strong>Cost Impact:</strong> The system prompt consumes
										approximately
										<a href="#" @click="showTokenDetails" class="text-primary"
											>~2100 tokens per request</a
										>. While this increases costs, it significantly improves
										response quality and keeps conversations focused on LIFX
										lighting control.
									</div>

									<!-- View Current Strict System Prompt -->
									<q-expansion-item
										icon="code"
										label="View Current Strict System Prompt"
										v-model="showSystemPrompt"
										@show="onViewSystemPromptOpen"
										@hide="onViewSystemPromptClose"
									>
										<div class="q-pa-md bg-grey-1 rounded-borders">
											<div class="text-caption text-grey-6 q-mb-sm">
												The prompt below is sent to Claude with every API
												request from the backend server, if the System Prompt is
												Enabled:
											</div>
											<pre class="system-prompt-text">{{
												systemPromptText
											}}</pre>
										</div>
									</q-expansion-item>

									<!-- View General System Prompt -->
									<q-expansion-item
										icon="info"
										label="View General System Prompt"
										v-model="showGeneralPrompt"
										@show="onViewGeneralPromptOpen"
										@hide="onViewGeneralPromptClose"
										class="q-mt-sm"
									>
										<div class="q-pa-md bg-grey-1 rounded-borders">
											<div class="text-caption text-grey-6 q-mb-sm">
												If the System Prompt is Disabled, the General prompt is
												always sent to Claude by the backend server:
											</div>
											<pre class="system-prompt-text">{{
												generalPromptText
											}}</pre>
										</div>
									</q-expansion-item>
								</div>
							</q-expansion-item>

							<!-- Current Setting -->
							<div class="row items-center q-mb-md">
								<div class="col">
									<div class="text-subtitle2">
										Current Setting:
										<span
											:class="
												systemPromptEnabled ? 'text-positive' : 'text-negative'
											"
										>
											{{
												systemPromptEnabled
													? 'System Prompt Enabled'
													: 'System Prompt Disabled'
											}}
										</span>
									</div>
									<div class="text-caption text-grey-6">
										{{
											systemPromptEnabled
												? 'Claude will stay focused on lighting control (~2100 extra tokens)'
												: 'Claude may respond to any topic (no extra tokens)'
										}}
									</div>
								</div>
								<div class="col-auto">
									<q-toggle
										v-model="systemPromptEnabled"
										:color="systemPromptEnabled ? 'positive' : 'negative'"
										size="lg"
										@update:model-value="onSystemPromptToggle"
									/>
								</div>
							</div>
						</q-card-section>
					</q-card>
				</div>

				<!-- Keyword Filter Control Card -->
				<div class="col-12 col-md-6">
					<q-card flat bordered class="full-height">
						<q-card-section>
							<div class="text-h6 q-mb-md">
								<q-icon name="filter_alt" class="q-mr-sm" />
								Keyword Filter Control
							</div>

							<!-- What is Keyword Filtering? -->
							<q-expansion-item
								icon="help_outline"
								label="What is Keyword Filtering?"
								class="q-mb-md"
								@show="onKeywordFilterDialogOpen"
								@hide="onKeywordFilterDialogClose"
							>
								<div class="q-pa-md bg-cyan-1 rounded-borders">
									<div class="text-body2 q-mb-md">
										Pre-filtering checks user messages for lighting-related
										keywords before sending to Claude API. When enabled,
										non-lighting requests are blocked locally, saving tokens and
										API costs. This works independently of the system prompt
										setting.
									</div>

									<div class="text-body2 q-mb-md">
										<strong>Educational Value:</strong> Toggle this to
										understand how client-side filtering compares to server-side
										prompting for controlling AI behavior.
									</div>

									<!-- View Current Keywords -->
									<q-expansion-item
										icon="list"
										label="View Current Keywords"
										v-model="showKeywords"
										@show="onViewKeywordsOpen"
										@hide="onViewKeywordsClose"
									>
										<div class="q-pa-md bg-grey-1 rounded-borders">
											<div class="text-caption text-grey-6 q-mb-sm">
												Messages containing any of these keywords will be sent
												to Claude:
											</div>
											<div class="keyword-list">
												{{ lightKeywords.join(', ') }}
											</div>
										</div>
									</q-expansion-item>
								</div>
							</q-expansion-item>

							<!-- Current Setting -->
							<div class="row items-center q-mb-md">
								<div class="col">
									<div class="text-subtitle2">
										Current Setting:
										<span
											:class="
												keywordFilterEnabled ? 'text-positive' : 'text-negative'
											"
										>
											{{
												keywordFilterEnabled
													? 'Keyword Filter Enabled'
													: 'Keyword Filter Disabled'
											}}
										</span>
									</div>
									<div class="text-caption text-grey-6">
										{{
											keywordFilterEnabled
												? 'Non-lighting requests blocked locally (saves tokens)'
												: 'All messages sent to Claude (uses more tokens)'
										}}
									</div>
								</div>
								<div class="col-auto">
									<q-toggle
										v-model="keywordFilterEnabled"
										:color="keywordFilterEnabled ? 'positive' : 'negative'"
										size="lg"
										@update:model-value="onKeywordFilterToggle"
									/>
								</div>
							</div>
						</q-card-section>
					</q-card>
				</div>
			</div>

			<!-- Token Configuration & Statistics -->
			<q-card flat bordered class="q-mb-md">
				<q-card-section>
					<div class="text-subtitle2 q-mb-sm">Token Settings & Statistics</div>
					<div class="row q-gutter-md items-start">
						<div class="col-auto">
							<q-input
								v-model.number="maxTokens"
								label="Max Tokens"
								type="number"
								:min="100"
								:max="4000"
								:step="100"
								outlined
								dense
								style="width: 120px"
								@update:model-value="onMaxTokensChange"
							/>
						</div>
						<div class="col">
							<div class="row q-gutter-md">
								<div class="col">
									<q-card flat bordered class="text-center q-pa-md">
										<div class="text-h6 text-primary">
											{{ estimatedTokens }}
										</div>
										<div class="text-caption text-grey-6">Total Tokens</div>
									</q-card>
								</div>
								<div class="col">
									<q-card flat bordered class="text-center q-pa-md">
										<div class="text-h6 text-positive">
											${{ estimatedCost.toFixed(4) }}
										</div>
										<div class="text-caption text-grey-6">Est. Cost</div>
									</q-card>
								</div>
								<div class="col">
									<q-card flat bordered class="text-center q-pa-md">
										<div class="text-h6 text-info">{{ messageCount }}</div>
										<div class="text-caption text-grey-6">Messages</div>
									</q-card>
								</div>
							</div>
						</div>
					</div>
				</q-card-section>
			</q-card>
		</q-card-section>

		<!-- Chat Messages -->
		<q-card-section class="chat-container">
			<q-scroll-area
				ref="scrollArea"
				class="chat-scroll"
				:style="{ height: chatHeight }"
			>
				<div
					v-if="messages.length === 0"
					class="text-center q-pa-lg text-grey-6"
				>
					<q-icon name="chat" size="48px" class="q-mb-md" />
					<div>Start a conversation with Claude about your LIFX lights!</div>
					<div class="text-caption q-mt-sm">
						Try: "Turn on the living room lights" or "Set all lights to blue"
					</div>
				</div>

				<div
					v-for="(message, index) in messages"
					:key="index"
					class="message-container"
				>
					<!-- User Message -->
					<div v-if="message.role === 'user'" class="user-message">
						<q-chat-message
							:text="[
								typeof message.content === 'string'
									? message.content
									: JSON.stringify(message.content),
							]"
							sent
							bg-color="primary"
							text-color="white"
							:stamp="formatTimestamp(message.timestamp)"
						>
							<template v-slot:avatar>
								<q-avatar color="primary" text-color="white" icon="person" />
							</template>
						</q-chat-message>
					</div>

					<!-- Claude Message -->
					<div v-else class="claude-message">
						<q-chat-message
							:text="[
								typeof message.content === 'string'
									? message.content
									: JSON.stringify(message.content),
							]"
							bg-color="grey-3"
							text-color="dark"
							:stamp="formatTimestamp(message.timestamp)"
						>
							<template v-slot:avatar>
								<q-avatar
									color="secondary"
									text-color="white"
									icon="smart_toy"
								/>
							</template>
						</q-chat-message>

						<!-- Action Indicators -->
						<div
							v-if="message.actions && message.actions.length > 0"
							class="q-mt-sm q-ml-md"
						>
							<q-chip
								v-for="action in message.actions"
								:key="action"
								color="secondary"
								text-color="white"
								size="sm"
								icon="flash_on"
								class="q-mr-xs q-mb-xs"
							>
								{{ action }}
							</q-chip>
						</div>
					</div>

					<!-- Error Message -->
					<div v-if="message.role === 'error'" class="error-message">
						<q-banner type="negative" dense class="q-ma-sm">
							<template v-slot:avatar>
								<q-icon name="error" />
							</template>
							{{ message.content }}
						</q-banner>
					</div>
				</div>

				<!-- Typing Indicator -->
				<div v-if="isTyping" class="typing-indicator">
					<q-chat-message bg-color="grey-3">
						<template v-slot:avatar>
							<q-avatar color="secondary" text-color="white" icon="smart_toy" />
						</template>
						<q-spinner-dots size="2em" color="grey-6" />
					</q-chat-message>
				</div>
			</q-scroll-area>
		</q-card-section>

		<!-- Message Input -->
		<q-card-section class="q-pt-none">
			<div class="row q-gutter-sm">
				<q-input
					ref="messageInput"
					v-model="currentMessage"
					placeholder="Ask Claude to control your lights..."
					outlined
					dense
					autogrow
					:max-height="100"
					:disable="!canSendMessage"
					@keyup.enter.exact="sendMessage"
					@keyup.enter.shift.exact="currentMessage += '\n'"
					class="col"
				>
					<template v-slot:prepend>
						<q-icon name="chat" />
					</template>
				</q-input>

				<q-btn
					color="primary"
					icon="send"
					round
					:disable="!canSendMessage || !currentMessage.trim()"
					:loading="isTyping"
					@click="sendMessage"
				/>
			</div>

			<!-- Quick Actions -->
			<div class="row q-gutter-xs q-mt-sm">
				<q-btn
					v-for="quickAction in quickActions"
					:key="quickAction"
					size="sm"
					color="grey-6"
					:label="quickAction"
					@click="useQuickAction(quickAction)"
					:disable="!canSendMessage"
					outline
				/>
			</div>

			<!-- Input Validation Warning -->
			<div v-if="validationWarning" class="q-mt-sm">
				<q-banner type="warning" dense>
					<template v-slot:avatar>
						<q-icon name="warning" />
					</template>
					{{ validationWarning }}
				</q-banner>
			</div>
		</q-card-section>
	</q-card>
</template>

<script setup>
	import { ref, computed, watch, nextTick, onMounted } from 'vue';
	import { useQuasar } from 'quasar';
	import { useApiKeys } from '../composables/useApiKeys';
	import { useBackendApi } from '../composables/useBackendApi';
	import { useSessionTracking } from '../composables/useSessionTracking';

	const $q = useQuasar();
	const { claudeApiKey, lifxApiKey, isClaudeKeyValid, isLifxKeyValid } =
		useApiKeys();
	const { backendStatus, makeApiRequest } = useBackendApi();
	const { canSendRequest, updateUsageFromResponse } = useSessionTracking();

	const messages = ref([]);
	const currentMessage = ref('');
	const isTyping = ref(false);
	const systemPromptEnabled = ref(true);
	const maxTokens = ref(1000);
	const scrollArea = ref(null);
	const messageInput = ref(null);
	const chatHeight = ref('400px');
	const showSystemPrompt = ref(false);

	// Keyword Filter Control state
	const keywordFilterEnabled = ref(true);
	const showKeywords = ref(false);

	// General System Prompt state
	const showGeneralPrompt = ref(false);

	// System prompt text constant
	const systemPromptText = `You are a comprehensive LIFX smart lighting assistant with access to the full LIFX API. You can control lights, create effects, manage scenes, and perform advanced lighting operations.

AVAILABLE CAPABILITIES:

**Basic Light Control:**
- set-state: Turn lights on/off, change colors, adjust brightness
- list-lights: Get information about available lights
- toggle-power: Toggle lights on/off
- state-delta: Make relative adjustments to light properties

**Visual Effects:**
- breathe-effect: Slow breathing/fading effect between colors
- pulse-effect: Quick pulsing/flashing effect between colors
- move-effect: Moving color patterns (for LIFX Z strips)
- morph-effect: Color morphing patterns (for LIFX Tiles)
- flame-effect: Flickering flame effect (for LIFX Tiles)
- clouds-effect: Soft cloud-like color transitions (for LIFX Tiles)
- sunrise-effect: Gradual sunrise simulation (for LIFX Tiles)
- sunset-effect: Gradual sunset simulation (for LIFX Tiles)
- effects-off: Stop any running effects

**Scene Management:**
- list-scenes: Show available scenes in user's account
- activate-scene: Activate a saved scene by UUID

**Advanced Features:**
- cycle: Cycle lights through multiple color states
- validate-color: Check if a color string is valid
- clean: Control LIFX Clean devices

**How to Use Tools:**
Always specify the 'tool' parameter first, then provide the appropriate parameters for that tool.

Examples:
- "Turn lights red" → tool: "set-state", color: "red", selector: "all"
- "Create breathing effect with blue and green" → tool: "breathe-effect", color: "blue", from_color: "green", cycles: 10
- "Create infinite breathing effect" → tool: "breathe-effect", color: "red", from_color: "blue" (omit cycles parameter for infinite)
- "Start a sunrise effect" → tool: "sunrise-effect", duration: 300 (5 minutes)
- "List all my lights" → tool: "list-lights", selector: "all"
- "Activate bedroom scene" → tool: "activate-scene", scene_uuid: "[uuid from list-scenes]"

**Important Guidelines:**
- ALWAYS focus on the CURRENT user request - ignore previous conversation context if it conflicts
- ALWAYS use the control_lifx_lights tool when users want to control lights
- ALWAYS provide a friendly confirmation message after using the tool
- For MULTI-STEP requests: Use multiple tool calls in a single response to accomplish all requested actions
- For effects, suggest appropriate durations and parameters
- For infinite effects (breathe, pulse, etc.), OMIT the 'cycles' parameter entirely - do not set it to "infinite"
- If asked about anything non-lighting related, respond: "Sorry, I can only help with controlling your LIFX lights."
- Be creative with effects - you have access to the full LIFX API!
- PAY ATTENTION: If user says "blue", use blue - not any other color from previous requests

**Multi-Step Example:**
- "Turn lights blue then breathe red to green" → Use TWO tool calls: 
  1. tool: "set-state", color: "blue", selector: "all"
  2. tool: "breathe-effect", color: "green", from_color: "red", cycles: 5

**Light Selectors:**
- "all" - All lights in account
- "label:Kitchen" - Lights labeled "Kitchen" 
- "group:Living Room" - Lights in "Living Room" group
- "id:d073d5..." - Specific light by ID

**Color Formats:**
- Named colors: "red", "blue", "green", "purple", "pink", "orange", "yellow", "white"
- Hex codes: "#ff0000", "#00ff00"
- HSB: "hue:120 saturation:1.0 brightness:0.5"
- Kelvin: "kelvin:3500" (warm white to cool white: 2500-9000K)

You have full access to create amazing lighting experiences!`;

	// General system prompt text constant
	const generalPromptText = `You are a helpful AI assistant with access to LIFX smart light controls. You can answer questions on any topic and also help control LIFX smart lights when requested.

Available light control capabilities:
- Turn lights on/off
- Change colors (use color names, hex codes, or RGB values)
- Adjust brightness (0-100%)
- Control specific lights by name or group
- Apply lighting effects

Feel free to answer general questions about any topic. When users ask about lighting, use the available tools to control their LIFX lights.`;

	// ===========================================
	// CONSOLE LOGGING FOR EDUCATIONAL PURPOSES
	// ===========================================

	// Watch System Prompt toggle changes
	watch(systemPromptEnabled, (newValue, oldValue) => {
		console.log('🔧 System Prompt (Safety Guardrails) Toggle CHANGED:', {
			from: oldValue,
			to: newValue,
			description: newValue
				? 'Safety guardrails ENABLED'
				: 'Safety guardrails DISABLED',
			impact: newValue
				? 'Claude will have focused behavior constraints'
				: 'Claude may respond more broadly',
			recommendation: newValue
				? 'Recommended for production use'
				: 'Use carefully - may allow off-topic responses',
		});

		// Additional educational logging
		if (newValue) {
			console.log('✅ Safety Guardrails ENABLED - Benefits:');
			console.log('   • Claude will stay more focused on intended use case');
			console.log('   • Better response quality and relevance');
			console.log('   • Consistent behavior across sessions');
			console.log('   • Recommended for production deployments');
		} else {
			console.log('❌ Safety Guardrails DISABLED - Effects:');
			console.log('   • Claude may respond to any topic');
			console.log('   • More flexible but less predictable');
			console.log('   • May give unexpected responses');
			console.log('   • Use only for testing/experimentation');
		}
	});

	// Watch Max Tokens changes
	watch(maxTokens, (newValue, oldValue) => {
		console.log('🎛️ Max Tokens Setting CHANGED:', {
			from: oldValue,
			to: newValue,
			impact: `Claude responses limited to ${newValue} tokens`,
			costImpact: `Estimated cost: $${((newValue / 1000) * 0.008).toFixed(
				4
			)} per request (output only)`,
			recommendation:
				newValue < 500
					? 'Short responses'
					: newValue < 1500
					? 'Balanced responses'
					: 'Detailed responses',
		});

		// Educational logging about token implications
		if (newValue < 500) {
			console.log('⚡ Short Response Mode (< 500 tokens):');
			console.log('   • Quick, concise answers');
			console.log('   • Lower cost per request');
			console.log('   • May truncate complex responses');
		} else if (newValue < 1500) {
			console.log('⚖️ Balanced Response Mode (500-1500 tokens):');
			console.log('   • Good balance of detail and cost');
			console.log('   • Suitable for most interactions');
			console.log('   • Recommended for general use');
		} else {
			console.log('📝 Detailed Response Mode (> 1500 tokens):');
			console.log('   • Comprehensive, detailed answers');
			console.log('   • Higher cost per request');
			console.log('   • Best for complex explanations');
		}
	});

	// Watch Keyword Filter toggle changes
	watch(keywordFilterEnabled, (newValue, oldValue) => {
		console.log('🔍 Keyword Filter (Client-side Filtering) Toggle CHANGED:', {
			from: oldValue,
			to: newValue,
			description: newValue
				? 'Client-side filtering ENABLED'
				: 'Client-side filtering DISABLED',
			impact: newValue
				? 'Non-lighting messages blocked before API call'
				: 'All messages sent to Claude API',
			tokenSavings: newValue
				? 'Saves tokens by blocking irrelevant requests'
				: 'May waste tokens on off-topic requests',
		});

		if (newValue) {
			console.log('✅ Client-side Filtering ENABLED - Benefits:');
			console.log('   • Immediate feedback for off-topic requests');
			console.log('   • Saves API costs by blocking irrelevant calls');
			console.log('   • Faster response for rejected messages');
			console.log('   • Works independently of system prompt');
		} else {
			console.log('❌ Client-side Filtering DISABLED - Effects:');
			console.log('   • All messages sent to Claude API');
			console.log('   • Relies on server-side filtering only');
			console.log('   • Higher token usage for off-topic requests');
			console.log('   • System prompt becomes more important');
		}
	});

	// Watch current message for analysis
	watch(currentMessage, (newMessage) => {
		if (newMessage && newMessage.length > 3) {
			console.log('💬 Message Input Analysis:', {
				message: newMessage,
				length: newMessage.length,
				estimatedTokens: Math.ceil(newMessage.length / 4),
				containsLightKeywords: [
					'light',
					'lamp',
					'bulb',
					'brightness',
					'color',
					'dimmer',
					'switch',
				].some((keyword) =>
					newMessage.toLowerCase().includes(keyword.toLowerCase())
				),
			});
		}
	});

	// ===========================================
	// EXISTING CODE CONTINUES
	// ===========================================

	// Quick action suggestions
	const quickActions = [
		'Turn on all lights',
		'Turn off all lights',
		'Set lights to red',
		'Dim lights to 20%',
		'Set living room warm white',
		'Make lights blue and bright',
	];

	// Light-related keywords for filtering
	const lightKeywords = [
		'light',
		'lamp',
		'color',
		'bright',
		'dim',
		'on',
		'off',
		'lifx',
		'hue',
		'saturation',
		'warm',
		'cold',
		'red',
		'blue',
		'green',
		'yellow',
		'purple',
		'orange',
		'white',
	];

	// Computed properties
	const canSendMessage = computed(() => {
		return (
			isClaudeKeyValid.value &&
			isLifxKeyValid.value &&
			backendStatus.value === 'connected' &&
			canSendRequest() &&
			!isTyping.value
		);
	});

	// Function to check if a message contains light keywords
	const messageHasLightKeywords = (messageText) => {
		const message = messageText.toLowerCase();
		const foundKeywords = lightKeywords.filter((keyword) =>
			message.includes(keyword)
		);

		console.log('🔍 Keyword Detection Analysis:', {
			originalMessage: messageText,
			lowercaseMessage: message,
			totalKeywords: lightKeywords.length,
			foundKeywords: foundKeywords,
			foundCount: foundKeywords.length,
			hasLightKeywords: foundKeywords.length > 0,
		});

		return foundKeywords.length > 0;
	};

	const hasLightKeywords = computed(() => {
		const message = currentMessage.value.toLowerCase();
		return lightKeywords.some((keyword) => message.includes(keyword));
	});

	const validationWarning = computed(() => {
		if (!currentMessage.value.trim()) return null;

		// Only show warning if keyword filter is enabled
		if (keywordFilterEnabled.value && !hasLightKeywords.value) {
			return "This message doesn't seem to be about lights. Claude is configured to help with LIFX light control.";
		}

		return null;
	});

	const estimatedTokens = computed(() => {
		// Rough estimate: ~4 characters per token
		const messageTokens = Math.ceil(currentMessage.value.length / 4);
		const contextTokens = messages.value.reduce((sum, msg) => {
			return sum + Math.ceil(msg.content.length / 4);
		}, 0);
		return messageTokens + contextTokens + 100; // Add system prompt tokens
	});

	const estimatedCost = computed(() => {
		// Claude pricing (approximate): $0.008 per 1K tokens
		return (estimatedTokens.value / 1000) * 0.008;
	});

	const messageCount = computed(() => {
		// Count user messages only (exclude system/error messages)
		return messages.value.filter((msg) => msg.role === 'user').length;
	});

	// Watch for new messages to scroll to bottom
	watch(
		messages,
		() => {
			nextTick(() => {
				if (scrollArea.value) {
					scrollArea.value.setScrollPosition('vertical', 999999);
				}
			});
		},
		{ deep: true }
	);

	// ===========================================
	// EVENT HANDLERS FOR UI INTERACTIONS
	// ===========================================

	const onSystemPromptToggle = (newValue) => {
		console.log('🔧 System Prompt Toggle CLICKED:', {
			newValue: newValue,
			userAction: 'Manual toggle click',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - System Prompt Control',
			impact: newValue
				? 'System prompt will be included (+~2100 tokens)'
				: 'System prompt will be excluded (0 extra tokens)',
			costImpact: newValue
				? 'Higher cost per request but focused responses'
				: 'Lower cost but potentially unfocused responses',
		});

		// Additional educational logging
		if (newValue) {
			console.log('✅ SYSTEM PROMPT ENABLED - Educational Details:');
			console.log(
				'   • Claude will receive comprehensive LIFX API instructions'
			);
			console.log('   • Responses will be focused on lighting control only');
			console.log('   • Cost impact: ~2100 additional tokens per request');
			console.log('   • Estimated cost increase: ~$0.0168 per request');
			console.log('   • Benefits: Consistent, focused, high-quality responses');
		} else {
			console.log('❌ SYSTEM PROMPT DISABLED - Educational Details:');
			console.log('   • Claude will receive minimal context');
			console.log('   • May respond to any topic, not just lighting');
			console.log('   • Cost impact: 0 additional tokens');
			console.log('   • Trade-off: Lower cost but less predictable behavior');
			console.log('   • Risk: May give irrelevant or unfocused responses');
		}
	};

	const onSystemPromptDialogOpen = () => {
		console.log('📖 System Prompt Control OPENED:', {
			userAction: 'Expanded system prompt explanation',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - System Prompt Control Dialog',
			purpose: 'User viewing educational content about system prompts',
		});
	};

	const onSystemPromptDialogClose = () => {
		console.log('📖 System Prompt Control CLOSED:', {
			userAction: 'Collapsed system prompt explanation',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - System Prompt Control Dialog',
			purpose: 'User finished viewing educational content',
		});
	};

	const onViewSystemPromptOpen = () => {
		console.log('👁️ View System Prompt OPENED:', {
			userAction: 'Viewing actual system prompt text',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - System Prompt Text Viewer',
			promptLength: systemPromptText.length,
			estimatedTokens: Math.ceil(systemPromptText.length / 4),
			purpose: 'Educational - user examining the exact prompt sent to Claude',
		});
	};

	const onViewSystemPromptClose = () => {
		console.log('👁️ View System Prompt CLOSED:', {
			userAction: 'Closed system prompt text viewer',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - System Prompt Text Viewer',
		});
	};

	const onViewGeneralPromptOpen = () => {
		console.log('👁️ View General Prompt OPENED:', {
			userAction: 'Viewing general system prompt text',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - General Prompt Text Viewer',
			promptLength: generalPromptText.length,
			estimatedTokens: Math.ceil(generalPromptText.length / 4),
			purpose:
				'Educational - user examining the general prompt always sent to Claude',
		});
	};

	const onViewGeneralPromptClose = () => {
		console.log('👁️ View General Prompt CLOSED:', {
			userAction: 'Closed general prompt text viewer',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - General Prompt Text Viewer',
		});
	};

	const showTokenDetails = () => {
		console.log('💰 Token Details Link CLICKED:', {
			userAction: 'Clicked on ~2100 tokens link',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Token Details',
			purpose: 'User wants to understand token cost breakdown',
		});

		$q.notify({
			type: 'info',
			message: 'System Prompt: ~2100 tokens ≈ $0.0168 per request',
			caption: 'This ensures Claude stays focused on LIFX lighting control',
			timeout: 4000,
			position: 'top',
		});
	};

	const onMaxTokensChange = (newValue) => {
		// Validate and constrain the value
		if (newValue < 100) {
			maxTokens.value = 100;
		} else if (newValue > 4000) {
			maxTokens.value = 4000;
		} else {
			maxTokens.value = Math.round(newValue / 100) * 100; // Round to nearest 100
		}

		console.log('🎛️ Max Tokens Input CHANGED:', {
			newValue: maxTokens.value,
			userAction: 'Manual input change',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Max Tokens Input',
		});
	};

	// ===========================================
	// KEYWORD FILTER CONTROL EVENT HANDLERS
	// ===========================================

	const onKeywordFilterToggle = (newValue) => {
		console.log('🔍 Keyword Filter Toggle CLICKED:', {
			newValue: newValue,
			userAction: 'Manual toggle click',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Keyword Filter Control',
			impact: newValue
				? 'Non-lighting messages blocked locally (saves tokens)'
				: 'All messages sent to Claude (may use more tokens)',
		});

		if (newValue) {
			console.log('✅ KEYWORD FILTER ENABLED - Educational Details:');
			console.log('   • Client-side pre-filtering active');
			console.log('   • Only lighting-related messages sent to Claude');
			console.log('   • Cost benefit: Prevents wasted API calls');
			console.log('   • UX benefit: Immediate feedback for off-topic requests');
			console.log('   • Keywords checked:', lightKeywords.join(', '));
		} else {
			console.log('❌ KEYWORD FILTER DISABLED - Educational Details:');
			console.log('   • All messages will be sent to Claude');
			console.log('   • Claude API will handle all filtering');
			console.log('   • Higher token usage for off-topic requests');
			console.log('   • Relies on system prompt for behavior control');
		}
	};

	const onKeywordFilterDialogOpen = () => {
		console.log('📖 Keyword Filter Control OPENED:', {
			userAction: 'Expanded keyword filter explanation',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Keyword Filter Control Dialog',
			purpose: 'User viewing educational content about client-side filtering',
		});
	};

	const onKeywordFilterDialogClose = () => {
		console.log('📖 Keyword Filter Control CLOSED:', {
			userAction: 'Collapsed keyword filter explanation',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Keyword Filter Control Dialog',
		});
	};

	const onViewKeywordsOpen = () => {
		console.log('👁️ View Keywords OPENED:', {
			userAction: 'Viewing current keyword list',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Keywords Viewer',
			keywordCount: lightKeywords.length,
			keywords: lightKeywords,
			purpose: 'Educational - user examining filter criteria',
		});
	};

	const onViewKeywordsClose = () => {
		console.log('👁️ View Keywords CLOSED:', {
			userAction: 'Closed keyword list viewer',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Keywords Viewer',
		});
	};

	// ===========================================
	// MESSAGE HANDLING
	// ===========================================

	const sendMessage = async () => {
		if (!canSendMessage.value || !currentMessage.value.trim()) return;

		const messageText = currentMessage.value.trim();
		currentMessage.value = '';

		console.log('👤 User message being sent:', {
			message: messageText,
			length: messageText.length,
			estimatedTokens: Math.ceil(messageText.length / 4),
			timestamp: new Date().toLocaleString(),
		});

		// Add user message
		const userMessage = {
			role: 'user',
			content: messageText,
			timestamp: Date.now(),
		};
		messages.value.push(userMessage);

		// Check for light keywords if keyword filter is enabled
		if (keywordFilterEnabled.value && !messageHasLightKeywords(messageText)) {
			console.log('🚫 Message BLOCKED by Keyword Filter:', {
				message: messageText,
				reason: 'No lighting-related keywords detected',
				keywordsChecked: lightKeywords,
				filterEnabled: keywordFilterEnabled.value,
				timestamp: new Date().toLocaleString(),
			});

			const errorMessage = {
				role: 'error',
				content:
					'Your message was filtered out because it doesn\'t contain lighting-related keywords. Please ask questions about LIFX light control. For example: "Turn on the living room lights" or "Set all lights to blue".',
				timestamp: Date.now(),
			};
			messages.value.push(errorMessage);
			return;
		}

		// Log if keyword filter is disabled but message still doesn't have light keywords
		if (!keywordFilterEnabled.value && !messageHasLightKeywords(messageText)) {
			console.log('⚠️ Non-lighting message ALLOWED (filter disabled):', {
				message: messageText,
				reason: 'Keyword filter disabled - sending to Claude',
				hasLightKeywords: false,
				filterEnabled: keywordFilterEnabled.value,
				note: 'This message may result in off-topic response from Claude',
				timestamp: new Date().toLocaleString(),
			});
		}

		isTyping.value = true;

		try {
			console.log('🚀 Sending Claude request with payload:');
			console.log({
				message: messageText,
				claudeApiKey: '[REDACTED]',
				lifxApiKey: '[REDACTED]',
				systemPromptEnabled: systemPromptEnabled.value,
				maxTokens: maxTokens.value,
				conversationHistoryLength: messages.value.slice(-10).length,
			});

			console.log('🎛️ System Prompt Settings:', {
				enabled: systemPromptEnabled.value,
				impact: systemPromptEnabled.value
					? 'Claude will have safety guardrails'
					: 'Claude operates without specific guardrails',
			});

			const response = await makeApiRequest('/api/claude', {
				message: messageText,
				claudeApiKey: claudeApiKey.value,
				lifxApiKey: lifxApiKey.value,
				systemPromptEnabled: systemPromptEnabled.value,
				maxTokens: maxTokens.value,
				conversationHistory: messages.value.slice(-10), // Send last 10 messages for context
			});

			console.log('✅ Claude response received:', response.data);
			console.log('🔍 Raw response structure:', {
				success: response.data.success,
				responseType: typeof response.data.response,
				responseLength: response.data.response?.length || 0,
				responseValue: response.data.response,
				hasActions: !!(
					response.data.actions && response.data.actions.length > 0
				),
				usage: response.data.usage || 'No usage data',
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				// Ensure response content is a string
				let responseContent = response.data.response;

				console.log('🔧 Response Content Analysis:', {
					rawResponse: response.data.response,
					type: typeof response.data.response,
					isArray: Array.isArray(response.data.response),
					isObject: typeof response.data.response === 'object',
					keys:
						typeof response.data.response === 'object'
							? Object.keys(response.data.response || {})
							: 'N/A',
					// Log the actual object structure
					fullObject: JSON.stringify(response.data.response, null, 2),
				});

				// Handle different response formats
				if (Array.isArray(responseContent)) {
					// If it's an array, join the elements
					responseContent = responseContent
						.map((item) => {
							if (typeof item === 'string') return item;
							if (typeof item === 'object' && item !== null) {
								return item.text || item.content || JSON.stringify(item);
							}
							return String(item);
						})
						.join(' ');
				} else if (
					typeof responseContent === 'object' &&
					responseContent !== null
				) {
					// Handle Claude API response format specifically
					if (
						responseContent.content &&
						Array.isArray(responseContent.content)
					) {
						// Claude API returns content as an array of content blocks
						const textBlocks = responseContent.content
							.filter((block) => block.type === 'text')
							.map((block) => block.text);

						if (textBlocks.length > 0) {
							responseContent = textBlocks.join('\n');
							console.log(
								'🎯 Extracted Claude content from content array:',
								responseContent
							);
						} else {
							console.log(
								'❌ No text blocks found in Claude content array:',
								responseContent.content
							);
							responseContent = JSON.stringify(
								responseContent.content,
								null,
								2
							);
						}
					} else {
						// Fallback: try to extract text content from common properties
						const possibleTextKeys = [
							'text',
							'content',
							'message',
							'response',
							'answer',
							'reply',
							'output',
							'result',
						];
						let foundText = null;

						// Try each possible key
						for (const key of possibleTextKeys) {
							if (
								responseContent[key] &&
								typeof responseContent[key] === 'string'
							) {
								foundText = responseContent[key];
								console.log(
									`🎯 Found text content in property '${key}':`,
									foundText
								);
								break;
							}
						}

						if (foundText) {
							responseContent = foundText;
						} else {
							// If no text property found, log all properties and use JSON
							console.log(
								'❌ No text property found in object. Available properties:',
								Object.keys(responseContent)
							);
							console.log('📄 Full object structure:', responseContent);
							responseContent = JSON.stringify(responseContent, null, 2);
						}
					}
				} else if (responseContent === null || responseContent === undefined) {
					responseContent = 'No response received from Claude';
				} else if (typeof responseContent !== 'string') {
					responseContent = String(responseContent);
				}

				// Final safety check - make sure it's really a string
				if (typeof responseContent !== 'string') {
					console.log(
						'⚠️ Content is still not a string after processing:',
						typeof responseContent,
						responseContent
					);
					responseContent = String(responseContent);
				}

				console.log('📝 Final Processed Content:', {
					finalContent: responseContent,
					finalType: typeof responseContent,
					finalLength: responseContent.length,
				});

				const claudeMessage = {
					role: 'assistant',
					content: responseContent,
					timestamp: Date.now(),
					actions: response.data.actions || [],
				};
				messages.value.push(claudeMessage);

				console.log('💬 Message added to chat:', {
					role: claudeMessage.role,
					contentType: typeof claudeMessage.content,
					contentLength: claudeMessage.content.length,
					actionsCount: claudeMessage.actions.length,
					timestamp: new Date(claudeMessage.timestamp).toLocaleString(),
				});
			} else {
				throw new Error(response.data.error || 'Claude request failed');
			}
		} catch (error) {
			console.error('Claude chat error:', error);

			let errorMessage = error.message || 'Failed to send message to Claude';

			// Handle specific error types
			if (error.message?.includes('SESSION_LIMIT')) {
				errorMessage = 'Session request limit reached. Please try again later.';
			} else if (error.message?.includes('MULTIPLE_SESSIONS')) {
				errorMessage = 'Multiple sessions detected. Please close other tabs.';
			}

			const errorMsg = {
				role: 'error',
				content: errorMessage,
				timestamp: Date.now(),
			};
			messages.value.push(errorMsg);
		} finally {
			isTyping.value = false;

			// Focus back to input
			nextTick(() => {
				if (messageInput.value) {
					messageInput.value.focus();
				}
			});
		}
	};

	const useQuickAction = (action) => {
		currentMessage.value = action;
		messageInput.value?.focus();
	};

	const formatTimestamp = (timestamp) => {
		return new Date(timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const clearChat = () => {
		$q.dialog({
			title: 'Clear Chat',
			message: 'Are you sure you want to clear the chat history?',
			cancel: true,
			persistent: true,
		}).onOk(() => {
			messages.value = [];
			$q.notify({
				type: 'info',
				message: 'Chat history cleared',
				timeout: 2000,
			});
		});
	};

	// Keyboard shortcut for clearing chat
	const handleKeydown = (event) => {
		if (event.ctrlKey && event.key === 'l') {
			event.preventDefault();
			clearChat();
		}
	};

	// ===========================================
	// COMPONENT LIFECYCLE
	// ===========================================

	// Log initial settings when component mounts
	onMounted(() => {
		console.log('🎭 ClaudeChat Component MOUNTED');
		console.log('📊 Initial Settings:', {
			systemPromptEnabled: systemPromptEnabled.value,
			keywordFilterEnabled: keywordFilterEnabled.value,
			maxTokens: maxTokens.value,
			claudeApiKeyValid: isClaudeKeyValid.value,
			lifxApiKeyValid: isLifxKeyValid.value,
			backendStatus: backendStatus.value,
			canSendRequest: canSendRequest.value,
		});

		console.log('🎓 Educational Logging Active:');
		console.log('   • System Prompt toggle changes will be logged');
		console.log('   • Keyword Filter toggle changes will be logged');
		console.log('   • Max Tokens input changes will be logged');
		console.log('   • Message input analysis will be logged');
		console.log('   • Claude API requests/responses will be logged');
		console.log('   • All logs visible in browser console (F12)');

		console.log('🔍 Keyword Filter Setup:');
		console.log('   • Filter enabled:', keywordFilterEnabled.value);
		console.log('   • Keywords monitored:', lightKeywords.length);
		console.log('   • Keywords:', lightKeywords.join(', '));
	});

	// Add keyboard listener
	document.addEventListener('keydown', handleKeydown);
</script>

<style scoped>
	.chat-card {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.chat-container {
		flex: 1;
		min-height: 0;
	}

	.chat-scroll {
		border: 1px solid #e0e0e0;
		border-radius: 8px;
	}

	.message-container {
		margin-bottom: 8px;
	}

	.user-message {
		display: flex;
		justify-content: flex-end;
	}

	.claude-message {
		display: flex;
		justify-content: flex-start;
		flex-direction: column;
	}

	.error-message {
		margin: 8px 0;
	}

	.typing-indicator {
		display: flex;
		justify-content: flex-start;
	}

	.system-prompt-text {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 11px;
		line-height: 1.4;
		white-space: pre-wrap;
		word-wrap: break-word;
		color: #333;
		margin: 0;
		background-color: #f8f9fa;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #e1e5e9;
		max-height: 300px;
		overflow-y: auto;
	}

	.keyword-list {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 12px;
		line-height: 1.6;
		color: #444;
		background-color: #f8f9fa;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #e1e5e9;
		word-wrap: break-word;
	}

	@media (max-width: 600px) {
		.chat-height {
			height: 300px;
		}

		.system-prompt-text {
			font-size: 10px;
			padding: 8px;
			max-height: 200px;
		}
	}
</style>
