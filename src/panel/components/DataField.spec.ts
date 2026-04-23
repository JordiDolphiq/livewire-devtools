import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DataField from './DataField.vue'

describe('DataField', () => {
  it('renders the key and displayed value', () => {
    const w = mount(DataField, {
      props: { fieldKey: 'count', value: 5, editable: true }
    })
    expect(w.text()).toContain('count')
    expect(w.text()).toContain('5')
  })

  it('quotes strings in display', () => {
    const w = mount(DataField, {
      props: { fieldKey: 'name', value: 'hello', editable: true }
    })
    expect(w.text()).toContain('"hello"')
  })

  it('shows Array(n) and {n keys} for non-editable types', () => {
    const a = mount(DataField, {
      props: { fieldKey: 'arr', value: [1, 2, 3], editable: true }
    })
    expect(a.text()).toContain('Array(3)')

    const o = mount(DataField, {
      props: { fieldKey: 'obj', value: { a: 1, b: 2 }, editable: true }
    })
    expect(o.text()).toContain('2 keys')
  })

  it('emits edit when user commits a numeric change', async () => {
    const w = mount(DataField, {
      props: { fieldKey: 'count', value: 5, editable: true }
    })
    await w.find('.value').trigger('click')
    const input = w.find('input')
    expect(input.exists()).toBe(true)
    await input.setValue('9')
    await input.trigger('keyup.enter')
    const emitted = w.emitted('edit')
    expect(emitted?.[0]?.[0]).toEqual({ path: 'count', value: 9 })
  })

  it('does not open an editor when not editable', async () => {
    const w = mount(DataField, {
      props: { fieldKey: 'count', value: 5, editable: false }
    })
    await w.find('.value').trigger('click')
    expect(w.find('input').exists()).toBe(false)
  })
})
