import { describe, expect, it } from 'vitest'
import { mount } from '../../../tests/helpers'
import EventsTab from './EventsTab.vue'
import { useEvents } from '../stores/events'

describe('EventsTab', () => {
  it('shows empty hint when there are no events', () => {
    const { wrapper } = mount(EventsTab)
    expect(wrapper.text()).toContain('No events yet')
  })

  it('renders event rows and selects on click', async () => {
    const { wrapper, pinia } = mount(EventsTab)
    const events = useEvents(pinia)
    events.append({
      id: 'e1',
      name: 'post-created',
      payload: [{ id: 1 }],
      sourceComponentId: null,
      timestamp: Date.now()
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('post-created')
    await wrapper.find('.rows li').trigger('click')
    expect(events.selectedId).toBe('e1')
    // Detail pane shows payload JSON
    expect(wrapper.text()).toContain('"id": 1')
  })

  it('Pause toggles recording', async () => {
    const { wrapper, pinia } = mount(EventsTab)
    const events = useEvents(pinia)
    const pause = wrapper.findAll('button').find((b) => b.text() === 'Pause')!
    await pause.trigger('click')
    expect(events.recording).toBe(false)
  })

  it('Clear removes entries', async () => {
    const { wrapper, pinia } = mount(EventsTab)
    const events = useEvents(pinia)
    events.append({
      id: 'e1',
      name: 'x',
      payload: [],
      sourceComponentId: null,
      timestamp: Date.now()
    })
    await wrapper.vm.$nextTick()
    const clear = wrapper.findAll('button').find((b) => b.text() === 'Clear')!
    await clear.trigger('click')
    expect(events.entries).toHaveLength(0)
  })
})
