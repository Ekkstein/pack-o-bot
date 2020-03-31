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

let settingsWindow;
let debugWindow;

let status_message = 'Watching for packs...';

const userStore = new Store({
  configName: 'user',
  defaults: {
    token: null
  }
});

let packStore = new Store({
  configName: 'packs',
  defaults: {
    region: 'xx',
    unsentPacks: {}
  }
});

function checkForUpdate () {
  req = {
    // url: 'https://github.com/mlntn/pack-o-bot/releases/latest',
    // url: 'https://github.com/stevschmid/track-o-bot/releases/latest',
    url: 'https://pitytracker.com/packobot-version.txt',
    timeout: 10000
  };
  return request.get(req, function(error, response, body){
    if (body > app.getVersion()) {
      console.log('You need to update pack-o-bot!', app.getVersion());
      createUpdateWindow();
    }
  });
}

function createSettingsWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  settingsWindow = new BrowserWindow({
    backgroundColor: '#f4f4f4', 
    width: 400, 
    height: 350, 
    x: 1300, y: 50
  });

  if (process.env.ELECTRON_ENV === 'development') {
    settingsWindow.token = 'hhCTFq5Uhh5tDET9ogoLFA'
    settingsWindow.hearthstoneDir = userStore.get('hearthstoneDir');
  } else {
    settingsWindow.token = userStore.get('token');
    settingsWindow.hearthstoneDir = userStore.get('hearthstoneDir');
  }

  settingsWindow.dataDir = userStore.get('dataDir');

  settingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'windows/settings.html'),
    protocol: 'file:',
    slashes: true
  }));

  // settingsWindow.show();

  settingsWindow.on('closed', function () {
    settingsWindow = null;
    if (require('os').platform() === 'darwin') {
      app.dock.hide();
    }
  });
}

function createDebugWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  debugWindow = new BrowserWindow({
    backgroundColor: '#f4f4f4', 
    width: 800, 
    height: 1000, 
    x: 1850, y: 50,
    // title: 'CD App', 
    // frame: false, 
    // titleBarStyle: 'hidden', 
    // type: 'desktop',
    alwaysOnTop: true
  });

  debugWindow.unsentPacks = packStore.get('unsentPacks');

  debugWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'windows/debug.html'),
    protocol: 'file:',
    slashes: true
  }));

  // debugWindow.show();

  debugWindow.on('closed', function () {
    debugWindow = null;
    if (require('os').platform() === 'darwin') {
      app.dock.hide();
    }
  });
}


function createUpdateWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  updateWindow = new BrowserWindow({backgroundColor: '#f4f4f4', width: 400, height: 180});

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
      label: 'pack-o-bot v0.3.1',
      enabled: false
    },
    {
      label: 'Settings',
      click: function () {
        createSettingsWindow();
      }
    },
    {
      label: 'Debug',
      click: function () {
        createDebugWindow();
      }
    },
    { type: "separator" },
    {
      label: 'Simulate Pack Opening',
      click: function () {
        // createSettingsWindow();
        Tester.openPack();
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

ipc.on('settings-changed', function(event, data) {
  userStore.setArray(data);

  // TODO We can do better than this. Next version.
  app.emit('status-change', 'Updated settings. You will need to restart pack-o-bot if you changed any directory paths.');

  setTimeout(function(){
    app.emit('status-change', 'Watching for packs...');
  }, 5000);
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

  createSettingsWindow();
  createDebugWindow();
});

app.on('status-change', function (message) {
  status_message = message;
  setupContextMenu();

  // settingsWindow.webContents.send('status-change', message);
  debugWindow.webContents.send('status-change', message);
  console.log('test main')
  console.log(process.env.ELECTRON_ENV)

  // if (settingsWindow) {
  //   settingsWindow.webContents.send('status-change', message);
  // }
});

app.on('window-all-closed', function () {
  // noop
});

app.on('activate', function () {
  if (settingsWindow === null) {
    createSettingsWindow();
  }
  if (debugWindow === null) {
    createDebugWindow();
  }
});
