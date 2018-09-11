"use strict";
const { app, BrowserWindow } = require("electron");
const path = require("path");

const appUrl = "https://andreashuber69.github.io/net-worth/";
const defaultOptions = { width: 1024, height: 768, show: false };
const windows = [];

function addDefaults(options) {
    for (const property in defaultOptions) {
        options[property] = defaultOptions[property];
    }
}

function onWindowOpen(ev, url, frameName, disposition, options) {
    // The code below mirrors electrons default behavior, with the following differences:
    // - New windows are not registered as guests so that closing the original window does not also automatically close
    //   the new window.
    // - Overwrite some properties of options with the ones of defaultOptions.
    ev.preventDefault();
    addDefaults(options);
    const window = addNewWindow(new BrowserWindow(options), url);

    if (disposition !== "new-window") {
        ev.newGuest = window;
    }
}

function removeClosedWindow(window) {
    const index = windows.findIndex((w) => w === window);

    if (index < 0) {
        throw new Error("Window not found!");
    }

    windows.splice(index, 1);
}

function onNavigated(window, url) {
    if (url.indexOf(appUrl) === 0) {
        // We can only get here as a result of clicking Open... or New. Both commands open a new window with a url
        // containing parameters. After reading said parameters, the url without the parameters is then passed to
        // window.location.replace. The code below ensures that the window is only shown when the page for the real
        // application url has finished rendering.
        if (url.length === appUrl.length) {
            window.once("ready-to-show", () => window.show());
        } else {
            window.webContents.once("did-navigate", (ev, url) => onNavigated(window, url));
        }
    } else {
        window.once("ready-to-show", () => window.show());
    }
}

function addNewWindow(window, url) {
    windows.push(window);
    window.setMenu(null);
    onNavigated(window, url);

    // This event is fired whenever the application calls window.open.
    window.webContents.on("new-window", onWindowOpen);
    window.on("closed", () => removeClosedWindow(window));
    window.loadURL(url);
    return window;
}

function createFirstWindow() {
    const firstWindowOptions = {
        backgroundColor: "#25272A",
        icon: path.join(__dirname, "../../../public/icon-192x192.png"),
        webPreferences: { nodeIntegration: false }
    };

    addDefaults(firstWindowOptions);
    addNewWindow(new BrowserWindow(firstWindowOptions), appUrl);
}

app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.length === 0) {
        createFirstWindow();
    }
});

app.on("ready", createFirstWindow);
