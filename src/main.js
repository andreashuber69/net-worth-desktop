'use strict'
const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')

const appUrl = 'https://andreashuber69.github.io/net-worth/'
const defaultOptions = { title: 'Net Worth', backgroundColor: '#25272A' }
const windows = []

function onWindowOpen (ev, url, frameName, disposition, options) {
  // The code below mirrors electrons default behavior, with the following differences:
  // - New windows are not registered as guests so that closing the original window does not also automatically close
  //   the new window.
  // - Overwrite some properties of options with the ones of defaultOptions.
  ev.preventDefault()
  const window = addNewWindow(options, url)

  if (disposition !== 'new-window') {
    ev.newGuest = window
  }
}

function removeClosedWindow (window) {
  const index = windows.findIndex((w) => w === window)

  if (index < 0) {
    throw new Error('Window not found!')
  }

  windows.splice(index, 1)
}

function addNewWindow (options, url) {
  const windowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 768
  })

  const window = new BrowserWindow({ ...options, ...windowState, ...defaultOptions })

  if (windows.length === 0) {
    // Apparently, manage also calls window.show(), which is why we bind it to the event.
    window.once('ready-to-show', () => windowState.manage(window))
  }

  windows.push(window)
  window.setMenu(null)

  // This event is fired whenever the application calls window.open.
  window.webContents.on('new-window', onWindowOpen)
  window.on('closed', () => removeClosedWindow(window))
  window.loadURL(url)
  return window
}

function createFirstWindow () {
  addNewWindow({ webPreferences: { nodeIntegration: false } }, appUrl)
}

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (windows.length === 0) {
    createFirstWindow()
  }
})

app.on('ready', createFirstWindow)
