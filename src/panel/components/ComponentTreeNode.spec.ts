import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentTreeNode from './ComponentTreeNode.vue'

const nodes = {
  root: { id: 'root-id-abcdef', name: 'Parent', childIds: ['child-id-123456'] },
  child: { id: 'child-id-123456', name: 'Child', childIds: [] }
}

function mk(id: keyof typeof nodes, depth = 0, selected: string | null = null) {
  const byId = new Map(Object.values(nodes).map((n) => [n.id, n]))
  return mount(ComponentTreeNode, {
    props: {
      node: nodes[id],
      byId,
      selected,
      depth
    }
  })
}

describe('ComponentTreeNode', () => {
  it('renders name and truncated id', () => {
    const w = mk('root')
    expect(w.text()).toContain('Parent')
    expect(w.text()).toContain('root-id-') // first 8 chars
  })

  it('emits select with the node id on click', async () => {
    const w = mk('root')
    await w.find('.row').trigger('click')
    expect(w.emitted('select')?.[0]?.[0]).toBe('root-id-abcdef')
  })

  it('emits hover-in on mouseenter and hover-out on mouseleave', async () => {
    const w = mk('root')
    await w.find('.row').trigger('mouseenter')
    expect(w.emitted('hover-in')?.[0]?.[0]).toBe('root-id-abcdef')
    await w.find('.row').trigger('mouseleave')
    expect(w.emitted('hover-out')).toBeTruthy()
  })

  it('renders child nodes recursively', () => {
    const w = mk('root')
    expect(w.text()).toContain('Child')
  })

  it('adds selected class when selected', () => {
    const w = mk('root', 0, 'root-id-abcdef')
    expect(w.find('.row').classes()).toContain('selected')
  })

  it('increases indentation with depth', () => {
    const shallow = mk('root', 0)
    const deep = mk('root', 3)
    const shallowPad = shallow.find('.row').attributes('style') ?? ''
    const deepPad = deep.find('.row').attributes('style') ?? ''
    expect(shallowPad).toContain('10px')
    expect(deepPad).toContain('52px') // 3*14 + 10
  })
})
