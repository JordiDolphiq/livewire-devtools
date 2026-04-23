import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StateInspector from './StateInspector.vue'

describe('StateInspector', () => {
  it('shows empty hint when no component selected', () => {
    const w = mount(StateInspector, { props: { details: null } })
    expect(w.text()).toContain('Select a component')
  })

  it('shows "No public properties" when details.state is empty', () => {
    const w = mount(StateInspector, {
      props: { details: { id: 'a', name: 'Counter', state: {} } }
    })
    expect(w.text()).toContain('No public properties')
  })

  it('renders one DataField per state entry', () => {
    const w = mount(StateInspector, {
      props: {
        details: { id: 'a', name: 'Counter', state: { count: 5, label: 'hi' } },
        editable: true
      }
    })
    expect(w.text()).toContain('count')
    expect(w.text()).toContain('label')
  })

  it('bubbles the edit event from a DataField', async () => {
    const w = mount(StateInspector, {
      props: {
        details: { id: 'a', name: 'C', state: { count: 1 } },
        editable: true
      }
    })
    await w.find('.value').trigger('click')
    await w.find('input').setValue('7')
    await w.find('input').trigger('keyup.enter')
    expect(w.emitted('edit')?.[0]?.[0]).toEqual({ path: 'count', value: 7 })
  })
})
