const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI',{
    requestUpdate: (data) => ipcRenderer.invoke('requestUpdate', data)
})
