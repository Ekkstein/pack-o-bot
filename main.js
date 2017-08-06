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

const store = new Store({
  configName: 'user',
  defaults: {
    'token': null
  }
});

function createWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.hide();
  }

  mainWindow = new BrowserWindow({backgroundColor: '#f4f4f4', width: 350, height: 250});

  mainWindow.token = token;

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

ipc.on('put-in-tray', function (event) {
  if (appIcon !== null) return;

  const iconPath = path.join(__dirname, 'tray' + (process.platform === 'win32' ? '-invert' : '') + '.png');

  appIcon = new Tray(iconPath);

  if (require('os').platform() === 'darwin') {
    appIcon.setPressedImage(path.join(__dirname, 'tray-invert.png'));
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'pack-o-bot v0.9-beta',
      enabled: false
    },
    {
      label: 'Settings...',
      click: function () {
        if (mainWindow === null) {
          createWindow();
        }
      }
    },
    {
      label: 'Quit',
      click: function () {
        app.quit();
      }
    }
  ]);
  appIcon.setToolTip('pack-o-bot');
  appIcon.setContextMenu(contextMenu);
});

ipc.on('settings-changed', function(event, e) {
  store.set('token', e);
  token = e;

  mainWindow.hide();
});

app.on('ready', function(){
  token = store.get('token');

  hs.setup();

  hs.watchPacks(token);

  createWindow();

  if (token) {
    mainWindow.hide();
    mainWindow = null;
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
