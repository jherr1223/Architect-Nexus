import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopApi } from '@shared/api'

const api: DesktopApi = {
  workspace: {
    get: () => ipcRenderer.invoke('workspace:get'),
    select: () => ipcRenderer.invoke('workspace:select')
  },
  documents: {
    list: () => ipcRenderer.invoke('documents:list'),
    get: (id) => ipcRenderer.invoke('documents:get', id),
    create: (input) => ipcRenderer.invoke('documents:create', input),
    save: (document) => ipcRenderer.invoke('documents:save', document),
    delete: (id) => ipcRenderer.invoke('documents:delete', id),
    exportMarkdown: (id) => ipcRenderer.invoke('documents:exportMarkdown', id),
    importVisio: (title) => ipcRenderer.invoke('documents:importVisio', title),
    replaceVisio: (id) => ipcRenderer.invoke('documents:replaceVisio', id),
    openVisio: (id) => ipcRenderer.invoke('documents:openVisio', id),
    visioPreview: (id) => ipcRenderer.invoke('documents:visioPreview', id)
  }
}

// @mitigates SolutionArch:Preload against renderer Node access with contextBridge and named IPC methods
contextBridge.exposeInMainWorld('api', api)
