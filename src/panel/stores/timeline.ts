import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimelineMutation } from '@/shared/messages'

const MAX_ENTRIES = 500

export const useTimeline = defineStore('timeline', () => {
  const mutations = ref<TimelineMutation[]>([])
  const selectedId = ref<string | null>(null)
  const recording = ref(true)

  function append(mutation: TimelineMutation) {
    if (!recording.value) return
    mutations.value.push(mutation)
    if (mutations.value.length > MAX_ENTRIES) {
      mutations.value.splice(0, mutations.value.length - MAX_ENTRIES)
    }
  }

  function clear() {
    mutations.value = []
    selectedId.value = null
  }

  function select(id: string | null) {
    selectedId.value = id
  }

  function toggleRecording() {
    recording.value = !recording.value
  }

  return { mutations, selectedId, recording, append, clear, select, toggleRecording }
})
