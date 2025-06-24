<template>
  <q-card flat bordered>
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-gutter-md">
        <!-- Usage Progress -->
        <div class="col">
          <div class="text-caption text-grey-7 q-mb-xs">
            Session Usage: {{ requestsUsed }} / {{ dailyLimit }} requests
          </div>
          <q-linear-progress 
            :value="usagePercentage() / 100" 
            :color="progressColor"
            :class="progressClass"
            size="lg"
            stripe
          />
        </div>

        <!-- Remaining Requests -->
        <div class="col-auto text-center">
          <div class="text-h6" :class="remainingClass">{{ requestsRemaining }}</div>
          <div class="text-caption text-grey-7">remaining</div>
        </div>

        <!-- Session Info -->
        <div class="col-auto">
          <q-btn 
            flat 
            round 
            icon="info" 
            size="sm"
            @click="showSessionInfo = true"
          >
            <q-tooltip>Session Information</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Warning Message -->
      <div v-if="requestsRemaining <= 10" class="q-mt-sm">
        <q-banner 
          :type="requestsRemaining === 0 ? 'negative' : 'warning'" 
          dense
        >
          <template v-slot:avatar>
            <q-icon :name="requestsRemaining === 0 ? 'block' : 'warning'" />
          </template>
          <span v-if="requestsRemaining === 0">
            Request limit reached. Please try again later or start a new session.
          </span>
          <span v-else>
            Only {{ requestsRemaining }} requests remaining in this session.
          </span>
        </q-banner>
      </div>
    </q-card-section>

    <!-- Session Info Dialog -->
    <q-dialog v-model="showSessionInfo">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Session Information</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label>Session ID</q-item-label>
                <q-item-label caption class="text-mono">{{ sessionId }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label>Requests Used</q-item-label>
                <q-item-label caption>{{ requestsUsed }} / {{ dailyLimit }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label>Requests Remaining</q-item-label>
                <q-item-label caption>{{ requestsRemaining }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label>Usage Percentage</q-item-label>
                <q-item-label caption>{{ usagePercentage() }}%</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="q-mt-md text-caption text-grey-7">
            <strong>Note:</strong> This is a demo application with usage limits to prevent abuse. 
            Sessions are tracked by IP address and browser session.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn 
            flat 
            label="Reset Session" 
            color="warning" 
            @click="confirmResetSession"
          />
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useSessionTracking } from '../composables/useSessionTracking'

const $q = useQuasar()
const { 
  requestsUsed, 
  requestsRemaining, 
  dailyLimit, 
  getSessionId,
  resetSession,
  usagePercentage
} = useSessionTracking()

const showSessionInfo = ref(false)
const sessionId = getSessionId()

// Computed properties for styling
const progressColor = computed(() => {
  const percentage = usagePercentage()
  if (percentage >= 90) return 'negative'
  if (percentage >= 75) return 'warning'
  if (percentage >= 50) return 'orange'
  return 'positive'
})

const progressClass = computed(() => {
  const percentage = usagePercentage()
  if (percentage >= 90) return 'animate-pulse'
  return ''
})

const remainingClass = computed(() => {
  if (requestsRemaining.value === 0) return 'text-negative'
  if (requestsRemaining.value <= 10) return 'text-warning'
  return 'text-positive'
})

const confirmResetSession = () => {
  $q.dialog({
    title: 'Reset Session',
    message: 'Are you sure you want to reset your session? This will clear your usage tracking.',
    cancel: true,
    persistent: true
  }).onOk(() => {
    resetSession()
    showSessionInfo.value = false
    $q.notify({
      type: 'info',
      message: 'Session reset successfully',
      timeout: 2000
    })
  })
}
</script>

<style scoped>
.text-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.8em;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
