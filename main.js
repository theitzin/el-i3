const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let bar_window

function create_window () {
    bar_window = new BrowserWindow({
        width: 200, 
        height: 50,
        type: 'utility', // 'splash',
        //transparant: true,
        frame: false
    });

    bar_window.loadURL(url.format({
        pathname: path.join(__dirname, 'core.html'),
        protocol: 'file:',
        slashes: true
    }))

    bar_window.webContents.openDevTools()

    bar_window.on('closed', function () {
        bar_window = null
    })
}

app.on('ready', create_window)

app.on('window-all-closed', function () {
    app.quit()
})
