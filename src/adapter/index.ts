import type { LivewireAdapter } from './types'
import { detectLivewireVersion } from './detect'
import { createV3Adapter } from './v3'
import { createV4Adapter } from './v4'

export function createAdapter(Livewire: any): LivewireAdapter {
  const version = detectLivewireVersion(Livewire)
  switch (version) {
    case 4:
      return createV4Adapter(Livewire)
    case 3:
      return createV3Adapter(Livewire)
  }
}

export type { LivewireAdapter } from './types'
export { detectAlpine } from './detect'
