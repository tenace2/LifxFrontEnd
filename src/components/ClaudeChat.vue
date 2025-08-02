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
										for <i>random misinterpretations</i> of your chats, such as
										off topic chat "Please make me bacon and eggs" can result in
										the "on" in "bacon" being parsed out as separate tokens and
										turning your lights on. But you can also ask for "I need a
										recipe for potato salad, oh, and also turn my lights blue",
										and you can get both! Claude will then respond with a recipe
										for potato salad and turn your lights blue.
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

					<!-- Max Tokens Input - Always visible, responsive width -->
					<div class="q-mb-md">
						<q-input
							v-model.number="maxTokens"
							label="Output Token Limit"
							type="number"
							:min="100"
							:max="4000"
							:step="100"
							outlined
							dense
							class="token-input"
							@update:model-value="onMaxTokensChange"
						/>
					</div>

					<!-- Statistics Section - Collapsible on mobile -->
					<q-expansion-item
						v-model="showTokenStats"
						icon="analytics"
						label="Token Statistics"
						:default-opened="$q.screen.gt.sm"
						:header-class="$q.screen.lt.md ? 'text-weight-medium' : ''"
					>
						<!-- Desktop/Tablet Layout -->
						<div v-if="$q.screen.gt.sm" class="row q-gutter-md q-pt-md">
							<div class="col">
								<q-card flat bordered class="text-center q-pa-md">
									<div class="text-h6 text-primary">
										{{ estimatedTokens }}
									</div>
									<div class="text-caption text-grey-6">
										{{
											actualTokenUsage.total_requests > 0
												? 'Actual Tokens'
												: 'Est. Tokens'
										}}
									</div>
									<!-- Show breakdown if we have actual data -->
									<div
										v-if="actualTokenUsage.total_requests > 0"
										class="text-caption text-grey-5 q-mt-xs"
									>
										In: {{ actualTokenUsage.input_tokens }} | Out:
										{{ actualTokenUsage.output_tokens }}
									</div>
								</q-card>
							</div>
							<div class="col">
								<q-card flat bordered class="text-center q-pa-md">
									<div class="text-h6 text-positive">
										${{ estimatedCost.toFixed(4) }}
									</div>
									<div class="text-caption text-grey-6">
										{{
											actualTokenUsage.total_requests > 0
												? 'Actual Cost'
												: 'Est. Cost'
										}}
									</div>
								</q-card>
							</div>
							<div class="col">
								<q-card flat bordered class="text-center q-pa-md">
									<div class="text-h6 text-info">{{ messageCount }}</div>
									<div class="text-caption text-grey-6">Messages</div>
								</q-card>
							</div>
						</div>

						<!-- Mobile Layout - Stacked -->
						<div v-else class="q-pt-md">
							<div class="q-mb-sm">
								<q-card flat bordered class="text-center q-pa-sm">
									<div class="text-h6 text-primary">
										{{ estimatedTokens }}
									</div>
									<div class="text-caption text-grey-6">
										{{
											actualTokenUsage.total_requests > 0
												? 'Actual Tokens'
												: 'Est. Tokens'
										}}
									</div>
									<!-- Show breakdown if we have actual data -->
									<div
										v-if="actualTokenUsage.total_requests > 0"
										class="text-caption text-grey-5 q-mt-xs"
									>
										In: {{ actualTokenUsage.input_tokens }} | Out:
										{{ actualTokenUsage.output_tokens }}
									</div>
								</q-card>
							</div>
							<div class="q-mb-sm">
								<q-card flat bordered class="text-center q-pa-sm">
									<div class="text-h6 text-positive">
										${{ estimatedCost.toFixed(4) }}
									</div>
									<div class="text-caption text-grey-6">
										{{
											actualTokenUsage.total_requests > 0
												? 'Actual Cost'
												: 'Est. Cost'
										}}
									</div>
								</q-card>
							</div>
							<div class="q-mb-sm">
								<q-card flat bordered class="text-center q-pa-sm">
									<div class="text-h6 text-info">{{ messageCount }}</div>
									<div class="text-caption text-grey-6">Messages</div>
								</q-card>
							</div>
						</div>
					</q-expansion-item>
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
						<!-- Thinking Indicator for interim responses -->
						<div v-if="message.isThinking" class="thinking-message q-mb-sm">
							<q-chat-message
								:text="['Claude is working on your request...']"
								bg-color="blue-1"
								text-color="blue-8"
								:stamp="formatTimestamp(message.timestamp)"
							>
								<template v-slot:avatar>
									<q-avatar color="blue-4" text-color="white">
										<q-spinner color="white" size="20px" />
									</q-avatar>
								</template>
							</q-chat-message>
						</div>

						<!-- Regular Claude Message -->
						<q-chat-message
							v-else
							:text="[
								typeof message.content === 'string'
									? message.content
									: JSON.stringify(message.content),
							]"
							:bg-color="message.isInitial ? 'blue-2' : 'grey-3'"
							:text-color="message.isInitial ? 'blue-9' : 'dark'"
							:stamp="formatTimestamp(message.timestamp)"
						>
							<template v-slot:avatar>
								<q-avatar
									:color="message.isInitial ? 'blue-5' : 'secondary'"
									text-color="white"
									:icon="message.isInitial ? 'psychology' : 'smart_toy'"
								/>
							</template>

							<!-- Initial Response Badge -->
							<template v-if="message.isInitial" v-slot:name>
								<span class="text-caption text-blue-7">Initial Response</span>
							</template>

							<!-- Final Response Badge -->
							<template v-if="message.isFinal" v-slot:name>
								<span class="text-caption text-secondary">Final Response</span>
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

	// Token Statistics visibility state
	const showTokenStats = ref(false);

	// Track actual token usage from Claude API responses
	const actualTokenUsage = ref({
		input_tokens: 0,
		output_tokens: 0,
		total_requests: 0,
	});

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
		// If we have actual usage data from Claude API, use that
		if (actualTokenUsage.value.total_requests > 0) {
			return (
				actualTokenUsage.value.input_tokens +
				actualTokenUsage.value.output_tokens
			);
		}

		// Otherwise, fall back to rough estimates for preview
		const messageTokens = Math.ceil(currentMessage.value.length / 4);
		const contextTokens = messages.value.reduce((sum, msg) => {
			return sum + Math.ceil(msg.content.length / 4);
		}, 0);

		// Only add system prompt tokens if:
		// 1. System prompt is enabled AND
		// 2. User is actively typing a message OR there are existing messages
		const hasActiveContent =
			currentMessage.value.trim().length > 0 || messages.value.length > 0;
		const systemPromptTokens =
			systemPromptEnabled.value && hasActiveContent ? 100 : 0;

		return messageTokens + contextTokens + systemPromptTokens;
	});

	const estimatedCost = computed(() => {
		// If we have actual usage data, calculate precise cost
		if (actualTokenUsage.value.total_requests > 0) {
			// Claude pricing: $0.003 per 1K input tokens, $0.015 per 1K output tokens
			const inputCost = (actualTokenUsage.value.input_tokens / 1000) * 0.003;
			const outputCost = (actualTokenUsage.value.output_tokens / 1000) * 0.015;
			return inputCost + outputCost;
		}

		// Otherwise, use rough estimate with blended rate
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
	// TOKEN USAGE TRACKING
	// ===========================================

	const updateActualTokenUsage = (claudeUsageData) => {
		if (claudeUsageData && typeof claudeUsageData === 'object') {
			console.log('🎯 ACTUAL TOKEN USAGE from Claude API:', claudeUsageData);

			// Accumulate token usage across multiple requests
			actualTokenUsage.value.input_tokens += claudeUsageData.input_tokens || 0;
			actualTokenUsage.value.output_tokens +=
				claudeUsageData.output_tokens || 0;
			actualTokenUsage.value.total_requests += 1;

			console.log('📊 UPDATED TOTAL TOKEN USAGE:', {
				input_tokens: actualTokenUsage.value.input_tokens,
				output_tokens: actualTokenUsage.value.output_tokens,
				total_tokens:
					actualTokenUsage.value.input_tokens +
					actualTokenUsage.value.output_tokens,
				total_requests: actualTokenUsage.value.total_requests,
				this_request: claudeUsageData,
			});
		} else {
			console.log(
				'⚠️ No valid usage data in Claude response:',
				claudeUsageData
			);
		}
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

			// Update actual token usage if available
			if (response.data.usage) {
				updateActualTokenUsage(response.data.usage);
			}

			updateUsageFromResponse(response);

			if (response.data.success) {
				// Extract initial and final responses
				const initialResponse = response.data.initialResponse;
				let finalResponseContent = response.data.response;

				console.log('🔧 Response Analysis:', {
					hasInitialResponse: !!initialResponse,
					initialResponse: initialResponse,
					finalResponse: finalResponseContent,
					actions: response.data.actions || [],
				});

				// Helper function to extract text content from Claude response
				const extractTextContent = (responseContent) => {
					if (typeof responseContent === 'string') {
						return responseContent;
					}

					if (Array.isArray(responseContent)) {
						return responseContent
							.map((item) => {
								if (typeof item === 'string') return item;
								if (typeof item === 'object' && item !== null) {
									return item.text || item.content || JSON.stringify(item);
								}
								return String(item);
							})
							.join(' ');
					}

					if (typeof responseContent === 'object' && responseContent !== null) {
						// Handle Claude API response format specifically
						if (
							responseContent.content &&
							Array.isArray(responseContent.content)
						) {
							const textBlocks = responseContent.content
								.filter((block) => block.type === 'text')
								.map((block) => block.text);

							if (textBlocks.length > 0) {
								return textBlocks.join('\n');
							}
						}

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

						for (const key of possibleTextKeys) {
							if (
								responseContent[key] &&
								typeof responseContent[key] === 'string'
							) {
								return responseContent[key];
							}
						}

						return JSON.stringify(responseContent, null, 2);
					}

					return String(responseContent || 'No response received from Claude');
				};

				// Process final response content
				finalResponseContent = extractTextContent(finalResponseContent);

				// Handle initial response if present
				if (initialResponse && initialResponse.trim()) {
					console.log('� Displaying initial Claude response:', initialResponse);

					// Add initial message immediately
					const initialMessage = {
						role: 'assistant',
						content: initialResponse,
						timestamp: Date.now(),
						isInitial: true,
					};
					messages.value.push(initialMessage);

					// Add thinking indicator
					const thinkingMessage = {
						role: 'assistant',
						content: '',
						timestamp: Date.now() + 1,
						isThinking: true,
					};
					messages.value.push(thinkingMessage);

					// Wait, then remove thinking indicator and show final response
					setTimeout(() => {
						// Remove thinking indicator
						const thinkingIndex = messages.value.findIndex((m) => m.isThinking);
						if (thinkingIndex !== -1) {
							messages.value.splice(thinkingIndex, 1);
						}

						// Add final response
						const finalMessage = {
							role: 'assistant',
							content: finalResponseContent,
							timestamp: Date.now(),
							actions: response.data.actions || [],
							isFinal: true,
						};
						messages.value.push(finalMessage);

						console.log('💬 Final message added to chat:', {
							contentLength: finalMessage.content.length,
							actionsCount: finalMessage.actions.length,
						});
					}, 2000); // 2 second delay for thinking
				} else {
					// No initial response, just show final response with current behavior
					console.log('📝 No initial response, showing final response only');

					const claudeMessage = {
						role: 'assistant',
						content: finalResponseContent,
						timestamp: Date.now(),
						actions: response.data.actions || [],
					};
					messages.value.push(claudeMessage);
				}

				console.log('💬 Response processing complete');
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
			// Reset actual token usage tracking
			actualTokenUsage.value = {
				input_tokens: 0,
				output_tokens: 0,
				total_requests: 0,
			};
			$q.notify({
				type: 'info',
				message: 'Chat history and token usage cleared',
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

	.thinking-message {
		opacity: 0.8;
	}

	.thinking-message .q-message {
		background: linear-gradient(45deg, #e3f2fd, #f3e5f5);
		border-left: 3px solid #2196f3;
	}

	/* Initial response styling */
	.q-message[data-bg-color='blue-2'] {
		border-left: 3px solid #1976d2;
		box-shadow: 0 1px 3px rgba(25, 118, 210, 0.2);
	}

	/* Final response styling */
	.q-message[data-bg-color='grey-3'] {
		border-left: 3px solid #4caf50;
		box-shadow: 0 1px 3px rgba(76, 175, 80, 0.1);
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

	/* Token Settings Responsive Styles */
	.token-input {
		max-width: 200px;
	}

	@media (max-width: 599px) {
		.token-input {
			max-width: 100%;
		}
	}

	@media (min-width: 600px) {
		.token-input {
			max-width: 150px;
		}
	}
</style>
