const tabId = chrome.devtools.inspectedWindow.tabId

chrome.devtools.panels.create(
  'Livewire',
  'icons/128.png',
  `src/panel/panel.html?tabId=${tabId}`
)
