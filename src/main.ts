import { app, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import windowStateKeeper from "electron-window-state";

const windows = new Array<BrowserWindow>();

interface NewWindowEvent extends Electron.Event {
    newGuest?: BrowserWindow;
}

function onWindowOpen(
    ev: NewWindowEvent,
    url: string,
    frameName: string,
    disposition: "new-window" | "default" | "foreground-tab" | "background-tab" | "save-to-disk" | "other",
    options: BrowserWindowConstructorOptions
) {
    // The code below mirrors electrons default behavior except that new windows are only registered as guests when they
    // were opened from the About dialog. Application windows are thus never closed when another application window is
    // closed.
    ev.preventDefault();
    const isGuest = disposition !== "new-window";
    const window = addNewWindow(url, isGuest, options);

    if (isGuest) {
        ev.newGuest = window;
    }
}

function removeClosedWindow(window: BrowserWindow) {
    const index = windows.findIndex((w) => w === window);

    if (index < 0) {
        throw new Error("Window not found!");
    }

    windows.splice(index, 1);
}

function addNewWindow(url: string, isGuest: boolean, options: BrowserWindowConstructorOptions) {
    const windowState = windowStateKeeper({ defaultWidth: 1024, defaultHeight: 768 });
    const defaultOptions = { title: "Net Worth", backgroundColor: isGuest ? undefined : "#25272A" };
    const window = new BrowserWindow({ ...options, ...windowState, ...defaultOptions });
    windows.push(window);
    window.setMenu(null);
    // Fired whenever a new window is opened (either by calling window.open or by following a target="_blank" link)
    window.webContents.on("new-window", onWindowOpen);
    window.on("closed", () => removeClosedWindow(window));
    window.loadURL(url);
    windowState.manage(window);
    return window;
}

function createFirstWindow () {
    addNewWindow("https://andreashuber69.github.io/net-worth/", false, { webPreferences: { nodeIntegration: false } });
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
