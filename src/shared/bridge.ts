export interface BridgeMessageEnvelope {
  event: string
  payload?: unknown
}

export interface BridgeWall {
  listen(fn: (msg: BridgeMessageEnvelope) => void): void
  send(msg: BridgeMessageEnvelope): void
}

type Listener = (payload: any) => void

export class Bridge<
  In extends BridgeMessageEnvelope,
  Out extends BridgeMessageEnvelope
> {
  private listeners = new Map<string, Set<Listener>>()

  constructor(private wall: BridgeWall) {
    wall.listen((msg) => {
      if (!msg || typeof msg !== 'object' || typeof msg.event !== 'string') return
      const set = this.listeners.get(msg.event)
      if (!set) return
      for (const fn of set) {
        try {
          fn((msg as { payload?: unknown }).payload)
        } catch (err) {
          console.error('[livewire-devtools] bridge listener error', err)
        }
      }
    })
  }

  on<E extends In['event']>(
    event: E,
    fn: (payload: Extract<In, { event: E }> extends { payload: infer P } ? P : undefined) => void
  ): () => void {
    const listeners = this.listeners.get(event) ?? new Set()
    listeners.add(fn as Listener)
    this.listeners.set(event, listeners)
    return () => {
      listeners.delete(fn as Listener)
    }
  }

  off(event: string, fn?: Listener): void {
    if (!this.listeners.has(event)) return
    if (!fn) {
      this.listeners.delete(event)
    } else {
      this.listeners.get(event)!.delete(fn)
    }
  }

  send<E extends Out['event']>(
    event: E,
    ...[payload]: Extract<Out, { event: E }> extends { payload: infer P } ? [P] : []
  ): void {
    this.wall.send({ event, payload } as BridgeMessageEnvelope)
  }
}
