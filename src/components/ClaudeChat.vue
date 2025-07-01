<template>
	<q-card class="chat-card">
		<q-card-section class="q-pb-none">
			<div class="text-h6 q-mb-md">
				<q-icon name="smart_toy" class="q-mr-sm" />
				Claude AI Chat
			</div>

			<!-- System Prompt Controls -->
			<div class="row q-gutter-md q-mb-md">
				<q-toggle
					v-model="systemPromptEnabled"
					label="Safety Guardrails"
					color="primary"
					left-label
					@update:model-value="onSystemPromptToggle"
				/>
				<q-slider
					v-model="maxTokens"
					:min="100"
					:max="4000"
					:step="100"
					label
					:label-value="`Max Tokens: ${maxTokens}`"
					color="primary"
					class="col"
					@update:model-value="onMaxTokensChange"
				/>
			</div>

			<!-- Token Usage Estimate -->
			<div class="row q-gutter-md q-mb-md">
				<div class="col-auto">
					<q-chip color="info" text-color="white" size="sm">
						Est. Cost: ${{ estimatedCost.toFixed(4) }}
					</q-chip>
				</div>
				<div class="col-auto">
					<q-chip color="primary" text-color="white" size="sm">
						Tokens: ~{{ estimatedTokens }}
					</q-chip>
				</div>
			</div>
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
							:text="[message.content]"
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
							:text="[message.content]"
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

	const hasLightKeywords = computed(() => {
		const message = currentMessage.value.toLowerCase();
		return lightKeywords.some((keyword) => message.includes(keyword));
	});

	const validationWarning = computed(() => {
		if (!currentMessage.value.trim()) return null;
		if (!hasLightKeywords.value) {
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
			component: 'ClaudeChat.vue - Safety Guardrails Toggle',
		});
	};

	const onMaxTokensChange = (newValue) => {
		console.log('🎛️ Max Tokens Slider MOVED:', {
			newValue: newValue,
			userAction: 'Manual slider adjustment',
			timestamp: new Date().toLocaleString(),
			component: 'ClaudeChat.vue - Max Tokens Slider',
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

		// Check for light keywords
		if (!hasLightKeywords.value) {
			const errorMessage = {
				role: 'error',
				content:
					'Please ask questions related to LIFX light control. For example: "Turn on the living room lights" or "Set all lights to blue".',
				timestamp: Date.now(),
			};
			messages.value.push(errorMessage);
			return;
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
				hasActions: !!(
					response.data.actions && response.data.actions.length > 0
				),
				usage: response.data.usage || 'No usage data',
			});

			updateUsageFromResponse(response);

			if (response.data.success) {
				console.log('📝 Extracted Claude content:', response.data.response);

				const claudeMessage = {
					role: 'assistant',
					content: response.data.response,
					timestamp: Date.now(),
					actions: response.data.actions || [],
				};
				messages.value.push(claudeMessage);

				console.log('💬 Message added to chat:', {
					role: claudeMessage.role,
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
			maxTokens: maxTokens.value,
			claudeApiKeyValid: isClaudeKeyValid.value,
			lifxApiKeyValid: isLifxKeyValid.value,
			backendStatus: backendStatus.value,
			canSendRequest: canSendRequest.value,
		});

		console.log('🎓 Educational Logging Active:');
		console.log('   • System Prompt toggle changes will be logged');
		console.log('   • Max Tokens slider changes will be logged');
		console.log('   • Message input analysis will be logged');
		console.log('   • Claude API requests/responses will be logged');
		console.log('   • All logs visible in browser console (F12)');
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

	@media (max-width: 600px) {
		.chat-height {
			height: 300px;
		}
	}
</style>
