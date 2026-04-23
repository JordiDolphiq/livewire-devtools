import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Tab = 'components' | 'events' | 'timeline'

export const useUi = defineStore('ui', () => {
  const tab = ref<Tab>('components')
  const theme = ref<'light' | 'dark'>('light')

  function setTab(next: Tab) {
    tab.value = next
  }

  function setTheme(next: 'light' | 'dark') {
    theme.value = next
    document.documentElement.dataset.theme = next
  }

  return { tab, theme, setTab, setTheme }
})
