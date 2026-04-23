import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EventLogEntry } from '@/shared/messages'

const MAX_ENTRIES = 500

export const useEvents = defineStore('events', () => {
  const entries = ref<EventLogEntry[]>([])
  const selectedId = ref<string | null>(null)
  const recording = ref(true)

  function append(entry: EventLogEntry) {
    if (!recording.value) return
    entries.value.push(entry)
    if (entries.value.length > MAX_ENTRIES) {
      entries.value.splice(0, entries.value.length - MAX_ENTRIES)
    }
  }

  function clear() {
    entries.value = []
    selectedId.value = null
  }

  function select(id: string | null) {
    selectedId.value = id
  }

  function toggleRecording() {
    recording.value = !recording.value
  }

  return { entries, selectedId, recording, append, clear, select, toggleRecording }
})
