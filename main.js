const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let taskbar_window
let statusbar_window

function create_taskbar_window () {
    taskbar_window = new BrowserWindow({
        width: 200, 
        height: 50,
        type: 'utility', // 'splash',
        //transparant: true,
        frame: false
    });

    taskbar_window.loadURL(url.format({
        pathname: path.join(__dirname, 'taskbar.html'),
        protocol: 'file:',
        slashes: true
    }))

    taskbar_window.webContents.openDevTools()

    taskbar_window.on('closed', function () {
        taskbar_window = null
    })
}

function create_statusbar_window () {
    statusbar_window = new BrowserWindow({
        width: 200, 
        height: 50,
        type: 'utility',
        //transparant: true,
        frame: false
    });

    statusbar_window.loadURL(url.format({
        pathname: path.join(__dirname, 'statusbar.html'),
        protocol: 'file:',
        slashes: true
    }))

    //statusbar_window.webContents.openDevTools()

    statusbar_window.on('closed', function () {
        statusbar_window = null
    })
}

app.on('ready', create_taskbar_window)
// app.on('ready', create_statusbar_window)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
