export type LivewireVersion = 3 | 4

export interface NormalizedComponent {
  id: string
  name: string
  el: Element | null
  data: Record<string, unknown>
  childIds: string[]
  raw: any
}

export interface CommitEvent {
  componentId: string
  componentName: string
  data: Record<string, unknown>
  effects: Record<string, unknown> | null
  timestamp: number
}

export interface DispatchedEvent {
  name: string
  payload: unknown[]
  sourceComponentId: string | null
  timestamp: number
}

export interface AlpineInfo {
  present: boolean
  version: string | null
}

export interface LivewireAdapter {
  readonly version: LivewireVersion
  readonly devToolsEnabled: boolean

  getAllComponents(): NormalizedComponent[]
  getComponentById(id: string): NormalizedComponent | null
  getComponentChildren(c: NormalizedComponent): NormalizedComponent[]
  findComponentForElement(el: Element): NormalizedComponent | null

  getComponentState(c: NormalizedComponent): Record<string, unknown>
  setComponentState(id: string, path: string, value: unknown): void

  onComponentUpdate(cb: (e: CommitEvent) => void): () => void
  onEventDispatched(cb: (e: DispatchedEvent) => void): () => void
  onComponentInit(cb: (c: NormalizedComponent) => void): () => void
  onComponentRemoved(cb: (id: string) => void): () => void
}
