const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const Menu = electron.Menu;
const Tray = electron.Tray;
const fs = require('original-fs');

const path = require('path');
const url = require('url');

const Store = require(path.join(__dirname, 'Store.js'));

const hs = require(path.join(__dirname, 'hearthstone.js'));

let appIcon = null;

let mainWindow;

let token;

let status_message = 'Watching for packs...';

const store = new Store({
  configName: 'user',
  defaults: {
    'token': null,
    'region': 'xx',
  }
});

function createWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  mainWindow = new BrowserWindow({backgroundColor: '#f4f4f4', width: 400, height: 350});

  mainWindow.token = token;

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.show();

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (require('os').platform() === 'darwin') {
      app.dock.hide();
    }
  });
}

ipc.on('put-in-tray', function (event) {
  if (appIcon !== null) return;

  const iconPath = path.join(__dirname, 'tray' + (process.platform === 'win32' ? '-invert' : '') + '.png');

  appIcon = new Tray(iconPath);

  if (require('os').platform() === 'darwin') {
    appIcon.setPressedImage(path.join(__dirname, 'tray-invert.png'));
  }

  setupContextMenu();
});

let setupContextMenu = function(){
  let contextMenu = Menu.buildFromTemplate([
    {
      label: 'pack-o-bot v0.9',
      enabled: false
    },
    {
      label: 'Settings...',
      click: function () {
        createWindow();
      }
    },
    { type: "separator" },
    {
      label: status_message,
      enabled: false
    },
    { type: "separator" },
    {
      label: 'Quit',
      click: function () {
        app.quit();
      }
    }
  ]);
  appIcon.setToolTip('pack-o-bot');
  appIcon.setContextMenu(contextMenu);
};

ipc.on('settings-changed', function(event, e) {
  store.set('token', e);
  token = e;

  mainWindow.hide();
});

app.on('ready', function(){
  token = store.get('token');

  hs.setup();

  hs.watchPacks(token);

  let template = [{
    label: "Application",
    submenu: [
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();

  if (token) {
    mainWindow.hide();
    mainWindow = null;
    if (require('os').platform() === 'darwin') {
      app.dock.hide();
    }
  }
});

app.on('status-change', function (message) {
  status_message = message;
  setupContextMenu();

  if (mainWindow) {
    mainWindow.webContents.send('status-change', message);
  }
});

app.on('window-all-closed', function () {
  // noop
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
