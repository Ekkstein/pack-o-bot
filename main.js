const electron = require('electron');
const {app, BrowserWindow, ipcMain: ipc, Menu, Tray, net} = electron;
const electronLocalshortcut = require('electron-localshortcut');
const fs = require('original-fs');

const path = require('path');
const url = require('url');

const hs = require(path.join(__dirname, 'hearthstone.js'));

const Tester = require(path.join(__dirname, 'tester.js'));

let appIcon = null;

let settingsWindow;
let debugWindow;

let status_message = 'Watching for packs...';

const userStore = hs.userStore

let packStore = hs.packStore

function checkForUpdate () {
  const url = 'https://pitytracker.com/packobot-version.txt'
  const request = net.request(url, res => {
    res.on('data', d => {
      const currentVersion = d.toString()
      if (currentVersion > app.getVersion()) {
        console.log('You need to update pack-o-bot!', app.getVersion());
        createUpdateWindow();
      }
    })
  });
  request.on('error', error => { console.error(error) })
  request.end()
}

function createSettingsWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  settingsWindow = new BrowserWindow({
    backgroundColor: '#f4f4f4',
    width: 400,
    height: 350,
    x: 1400, y: 50,
    webPreferences: {
      nodeIntegration: true
    },
    // alwaysOnTop: true,
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

  electronLocalshortcut.register(settingsWindow, 'F12', () => {
    settingsWindow.webContents.openDevTools()
  });

  return settingsWindow
}


function createDebugWindow () {
  if (require('os').platform() === 'darwin') {
    app.dock.show();
  }

  debugWindow = new BrowserWindow({
    backgroundColor: '#f4f4f4',
    width: 600,
    height: 1000,
    x: 1850, y: 50
    // title: 'CD App',
    // frame: false,
    // titleBarStyle: 'hidden',
    // type: 'desktop',
    // alwaysOnTop: true
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

  console.log('updateWindow created')

  updateWindow = new BrowserWindow({backgroundColor: '#f4f4f4', width: 400, height: 180});
  electronLocalshortcut.register(updateWindow, 'F12', () => {
    updateWindow.webContents.openDevTools()
  });
  updateWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'windows/update.html'),
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
  let iconPath = path.join(__dirname, 'tray-invert.png');
  if (require('os').platform() === 'darwin') {
    iconPath = electron.nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
    iconPath.isMacTemplateImage = true;
  }
  appIcon = new Tray(iconPath);
  setupContextMenu(appIcon);
});


let setupContextMenu = function(){
  const menuItems = [
    {
      label: 'pack-o-bot v'+app.getVersion(),
      enabled: false
    },
    {
      label: 'Settings',
      click: function () {
        createSettingsWindow();
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
  ]
  if (process.env.ELECTRON_ENV === 'development') {
    const devItems = [
      { type: "separator" },
      {
        label: 'Debug Window',
        click: function () {
          createDebugWindow();
        }
      },
      {
        label: 'Simulate good Pack Opening',
        click: function () {
          Tester.openPack(true);
        }
      },
      {
        label: 'Simulate bad Pack Opening',
        click: function () {
          Tester.openPack(false);
        }
      }
    ]
    menuItems.splice(2, 0, ...devItems)
  }
  let contextMenu = Menu.buildFromTemplate(menuItems);
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

app.allowRendererProcessReuse = true

app.on('ready', function(){
  checkForUpdate();
  hs.setup();
  // hs.getLines();
  hs.watchPacks();
  hs.watchLogfile();
  hs.clearPendingFlags();

  const settingsWindow = createSettingsWindow();
  // settingsWindow.webContents.openDevTools()
  if (process.env.ELECTRON_ENV === 'development') {
    createDebugWindow();
  }

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

});

app.on('status-change', function (message) {
  console.log('status-change event received: ' + message);
  status_message = message;
  setupContextMenu();

  if (debugWindow) {
    debugWindow.webContents.send('status-change', message);
    settingsWindow.webContents.send('status-change', message);
  }
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
