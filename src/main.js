'use strict'
const { app, BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')

const appUrl = 'https://andreashuber69.github.io/net-worth/'
const defaultOptions = { show: false, title: 'Net Worth' }
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

function onNavigated (window, url) {
  if (url.indexOf(appUrl) === 0) {
    // We can only get here as a result of clicking Open... or New. Both commands open a new window with a url
    // containing parameters. After reading said parameters, the url without the parameters is then passed to
    // window.location.replace. The code below ensures that the window is only shown when the page for the real
    // application url has finished rendering.
    if (url.length === appUrl.length) {
      window.once('ready-to-show', () => window.show())
    } else {
      window.webContents.once('did-navigate', (ev, url) => onNavigated(window, url))
    }
  } else {
    window.once('ready-to-show', () => window.show())
  }
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
  onNavigated(window, url)

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
