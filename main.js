const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const Menu = electron.Menu;
const Tray = electron.Tray;
const fs = require('original-fs');
const request = require('request');

const path = require('path');
const url = require('url');

const Store = require(path.join(__dirname, 'Store.js'));

const hs = require(path.join(__dirname, 'hearthstone.js'));

const Tester = require(path.join(__dirname, 'tester.js'));

let appIcon = null;

let mainWindow;

let status_message = 'Watching for packs...';

const store = new Store({
  configName: 'user',
  defaults: {
    token: null
  }
});

function checkForUpdate () {
  req = {
    // url: 'https://github.com/mlntn/pack-o-bot/releases/latest',
    // url: 'https://github.com/stevschmid/track-o-bot/releases/latest',
    url: 'https://pitytracker.com/packobot-version.txt',
    timeout: 10000
  }
  return request.get(req, function(error, response, body){
    if (body != app.getVersion()) {
      console.log('You need to update Pack-o-Bot!', app.getVersion())
      createUpdateWindow();
    }
  });
}

function createWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  mainWindow = new BrowserWindow({backgroundColor: '#f4f4f4', width: 400, height: 350});

  mainWindow.token = store.get('token');
  mainWindow.hearthstoneDir = store.get('hearthstoneDir');
  mainWindow.dataDir = store.get('dataDir');

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

function createUpdateWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  updateWindow = new BrowserWindow({backgroundColor: '#f4f4f4', width: 400, height: 350});

  updateWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'update.html'),
    protocol: 'file:',
    slashes: true
  }));

  updateWindow.show();

  updateWindow.on('closed', function () {
    updateWindow = null;
    if (require('os').platform() === 'darwin') {
      app.dock.hide();
    }
  });
}

ipc.on('put-in-tray', function (event) {
  if (appIcon !== null) return;

  let iconPath;
  iconPath = path.join(__dirname, 'tray-invert.png');
  if (require('os').platform() === 'darwin') {
    iconPath = electron.nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
    iconPath.setTemplateImage(true);
  }

  appIcon = new Tray(iconPath);

  setupContextMenu(appIcon);
});

let setupContextMenu = function(){
  let contextMenu = Menu.buildFromTemplate([
    {
      label: 'pack-o-bot v0.2.1',
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
    // {
    //   label: 'Simulate Pack Opening',
    //   click: function () {
    //     // createWindow();
    //     Tester.openPack();
    //   }
    // },
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

ipc.on('settings-changed', function(event, data) {
  store.setArray(data);

  // TODO We can do better than this. Next version.
  app.emit('status-change', 'Updated settings. You will need to restart Pack-o-Bot if you changed any directory paths.');

  setTimeout(function(){
    app.emit('status-change', 'Watching for packs...');
  }, 7000);
});

app.on('ready', function(){
  checkForUpdate();
  hs.setup();
  hs.getLines();
  hs.watchPacks();
  hs.watchLogfile();
  hs.clearPendingFlags();


  let template = [{
    label: "Application",
    submenu: [
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { type: 'separator' },
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();
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
