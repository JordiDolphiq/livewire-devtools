import { defineManifest } from '@crxjs/vite-plugin'
import pkg from '../package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'Livewire DevTools',
  version: pkg.version.replace(/-dev\.(\d+)$/, '.$1'),
  version_name: pkg.version,
  description: 'Chrome DevTools extension for debugging Livewire applications (v3 & v4).',
  icons: {
    16: 'icons/16.png',
    48: 'icons/48.png',
    128: 'icons/128.png'
  },
  action: {
    default_icon: {
      16: 'icons/16-gray.png',
      48: 'icons/48-gray.png',
      128: 'icons/128-gray.png'
    },
    default_title: 'Livewire DevTools',
    default_popup: 'src/popup/not-found.html'
  },
  devtools_page: 'src/panel/devtools.html',
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module'
  },
  permissions: ['scripting', 'contextMenus'],
  host_permissions: ['<all_urls>'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/hook-loader.ts'],
      run_at: 'document_start'
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/proxy.ts'],
      run_at: 'document_idle'
    }
  ],
  web_accessible_resources: [
    {
      resources: [
        'src/injected/hook.ts',
        'src/injected/detector.ts',
        'src/injected/backend.ts'
      ],
      matches: ['<all_urls>']
    }
  ]
})
