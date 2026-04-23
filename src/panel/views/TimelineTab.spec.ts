import { describe, expect, it } from 'vitest'
import { mount } from '../../../tests/helpers'
import TimelineTab from './TimelineTab.vue'
import { useTimeline } from '../stores/timeline'

describe('TimelineTab', () => {
  it('shows empty hint when no mutations', () => {
    const { wrapper } = mount(TimelineTab)
    expect(wrapper.text()).toContain('No state changes yet')
  })

  it('renders mutations and supports time-travel', async () => {
    const { wrapper, pinia, bridge } = mount(TimelineTab)
    const timeline = useTimeline(pinia)
    timeline.append({
      id: 'm1',
      componentId: 'comp-abc',
      componentName: 'Counter',
      state: { count: 3 },
      timestamp: Date.now()
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Counter')

    await wrapper.find('.rows li').trigger('click')
    expect(timeline.selectedId).toBe('m1')

    const travel = wrapper.findAll('button').find((b) => b.text() === 'Travel to state')!
    expect(travel.attributes('disabled')).toBeUndefined()
    await travel.trigger('click')
    expect(bridge.send).toHaveBeenCalledWith('timeline:travel-to-state', {
      componentId: 'comp-abc',
      state: { count: 3 }
    })
  })

  it('Clear empties and Pause toggles recording', async () => {
    const { wrapper, pinia } = mount(TimelineTab)
    const timeline = useTimeline(pinia)
    timeline.append({
      id: 'm1',
      componentId: 'c',
      componentName: 'C',
      state: {},
      timestamp: Date.now()
    })
    await wrapper.vm.$nextTick()
    const pause = wrapper.findAll('button').find((b) => b.text() === 'Pause')!
    await pause.trigger('click')
    expect(timeline.recording).toBe(false)

    const clear = wrapper.findAll('button').find((b) => b.text() === 'Clear')!
    await clear.trigger('click')
    expect(timeline.mutations).toHaveLength(0)
  })
})
