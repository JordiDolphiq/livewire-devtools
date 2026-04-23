import type { AlpineInfo, LivewireVersion } from '@/adapter/types'

export interface ComponentTreeNode {
  id: string
  name: string
  childIds: string[]
}

export interface ComponentDetails {
  id: string
  name: string
  state: Record<string, unknown>
}

export interface TimelineMutation {
  id: string
  componentId: string
  componentName: string
  state: Record<string, unknown>
  timestamp: number
}

export interface EventLogEntry {
  id: string
  name: string
  payload: unknown[]
  sourceComponentId: string | null
  timestamp: number
}

export interface ReadyPayload {
  livewireVersion: LivewireVersion
  alpine: AlpineInfo
  devToolsEnabled: boolean
}

export interface SetInstanceDataArgs {
  id: string
  path: string
  value: unknown
}

export type PanelToBackend =
  | { event: 'init' }
  | { event: 'refresh' }
  | { event: 'switch-tab'; payload: 'components' | 'timeline' | 'events' }
  | { event: 'select-instance'; payload: string }
  | { event: 'scroll-to-instance'; payload: string }
  | { event: 'enter-instance'; payload: string }
  | { event: 'leave-instance' }
  | { event: 'filter-instances'; payload: string }
  | { event: 'set-instance-data'; payload: SetInstanceDataArgs }
  | { event: 'timeline:travel-to-state'; payload: { componentId: string; state: Record<string, unknown> } }
  | { event: 'timeline:clear' }
  | { event: 'events:clear' }
  | { event: 'get-context-menu-target' }

export type BackendToPanel =
  | { event: 'ready'; payload: ReadyPayload }
  | { event: 'flush'; payload: { tree: ComponentTreeNode[]; inspected: ComponentDetails | null } }
  | { event: 'timeline:mutation'; payload: TimelineMutation }
  | { event: 'event:triggered'; payload: EventLogEntry }
  | { event: 'inspect-instance'; payload: string }
  | { event: 'instance-selected' }
  | { event: 'proxy-fail' }
  | { event: 'error'; payload: { message: string; stack?: string } }

export type BridgeMessage = PanelToBackend | BackendToPanel

export interface DetectorMessage {
  event: 'livewire:detected'
  payload: {
    devToolsEnabled: boolean
    alpine: AlpineInfo
  }
}

export type EnvelopeFromContent = BackendToPanel | DetectorMessage
