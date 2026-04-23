import { describe, expect, it } from 'vitest'
import { mount } from '../../../tests/helpers'
import ComponentsTab from './ComponentsTab.vue'
import { useComponents } from '../stores/components'

describe('ComponentsTab', () => {
  it('types into the filter input and forwards to the bridge', async () => {
    const { wrapper, bridge, pinia } = mount(ComponentsTab)
    const components = useComponents(pinia)
    await wrapper.find('input.filter').setValue('counter')
    expect(components.filter).toBe('counter')
    expect(bridge.send).toHaveBeenCalledWith('filter-instances', 'counter')
  })

  it('renders component rows from the store', async () => {
    const { wrapper, pinia } = mount(ComponentsTab)
    const components = useComponents(pinia)
    components.setFlush({
      tree: [{ id: 'root-id-abc', name: 'RootComp', childIds: [] }],
      inspected: null
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('RootComp')
  })

  it('forwards an inspector edit to the bridge as set-instance-data', async () => {
    const { wrapper, pinia, bridge } = mount(ComponentsTab)
    const components = useComponents(pinia)
    components.setFlush({
      tree: [{ id: 'a', name: 'Counter', childIds: [] }],
      inspected: { id: 'a', name: 'Counter', state: { count: 1 } }
    })
    await wrapper.vm.$nextTick()

    await wrapper.find('.value').trigger('click')
    const input = wrapper.find('.field input')
    await input.setValue('7')
    await input.trigger('keyup.enter')

    expect(bridge.send).toHaveBeenCalledWith('set-instance-data', {
      id: 'a',
      path: 'count',
      value: 7
    })
  })

  it('shows the component count in the toolbar', async () => {
    const { wrapper, pinia } = mount(ComponentsTab)
    const components = useComponents(pinia)
    components.setFlush({
      tree: [
        { id: 'a', name: 'A', childIds: [] },
        { id: 'b', name: 'B', childIds: [] }
      ],
      inspected: null
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('2')
  })
})
