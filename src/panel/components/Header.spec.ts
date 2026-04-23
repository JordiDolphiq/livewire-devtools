import { describe, expect, it } from 'vitest'
import { mount } from '../../../tests/helpers'
import Header from './Header.vue'
import { useConnection } from '../stores/connection'
import { useUi } from '../stores/ui'

describe('Header', () => {
  it('shows Livewire badge after ready', async () => {
    const { wrapper, pinia } = mount(Header)
    const conn = useConnection(pinia)
    conn.setReady({
      livewireVersion: 4,
      alpine: { present: true, version: '3.15.0' },
      devToolsEnabled: true
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('v4')
    expect(wrapper.text()).toContain('Alpine 3.15.0')
  })

  it('omits Alpine badge when Alpine absent', async () => {
    const { wrapper, pinia } = mount(Header)
    const conn = useConnection(pinia)
    conn.setReady({
      livewireVersion: 3,
      alpine: { present: false, version: null },
      devToolsEnabled: true
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Alpine')
  })

  it('clicking a tab updates the UI store', async () => {
    const { wrapper, pinia } = mount(Header)
    const ui = useUi(pinia)
    expect(ui.tab).toBe('components')
    const eventsBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Events')!
    await eventsBtn.trigger('click')
    expect(ui.tab).toBe('events')
  })

  it('clicking Refresh sends via the bridge', async () => {
    const { wrapper, bridge } = mount(Header)
    const refresh = wrapper.findAll('button').find((b) => b.text() === 'Refresh')!
    await refresh.trigger('click')
    expect(bridge.send).toHaveBeenCalledWith('refresh')
  })

  it('disables Refresh briefly while refreshing', async () => {
    const { wrapper } = mount(Header)
    const refresh = wrapper.findAll('button').find((b) => b.text() === 'Refresh')!
    await refresh.trigger('click')
    expect(refresh.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Refreshing')
  })
})
