import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AlpineInfo, LivewireVersion } from '@/adapter/types'

export const useConnection = defineStore('connection', () => {
  const ready = ref(false)
  const livewireVersion = ref<LivewireVersion | null>(null)
  const alpine = ref<AlpineInfo>({ present: false, version: null })
  const devToolsEnabled = ref(true)
  const lastError = ref<string | null>(null)

  function setReady(payload: {
    livewireVersion: LivewireVersion
    alpine: AlpineInfo
    devToolsEnabled: boolean
  }) {
    livewireVersion.value = payload.livewireVersion
    alpine.value = payload.alpine
    devToolsEnabled.value = payload.devToolsEnabled
    lastError.value = null
    ready.value = true
  }

  function setError(message: string) {
    lastError.value = message
  }

  return { ready, livewireVersion, alpine, devToolsEnabled, lastError, setReady, setError }
})
