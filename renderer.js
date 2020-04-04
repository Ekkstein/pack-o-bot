// const path = require('path');
// import { packStore } from path.join(__dirname, 'hearthstone.js')
let electron = require('electron');
let win = electron.remote.getCurrentWindow();
let packQueue = win.unsentPacks;
// let packQueue = packStore.get('unsentPacks');

// app.dock.hide();
// win.setAlwaysOnTop(true, "floating", 1);
// win.setVisibleOnAllWorkspaces(true);


// Prettify packQueue
let packQueueSimple = {};
for (let [key, value] of Object.entries(packQueue)) {
  let cards = []
  value['cards'].forEach(card => cards.push(card['cardId']));
  packQueueSimple[key] = {
    'region' : value['region'],
    'cards' : cards
  }
}

electron.ipcRenderer.send('put-in-tray');

electron.ipcRenderer.on('status-change', function (event, message) {
  document.getElementById('status').innerText = message;
  // document.getElementById('unsent-packs').innerText = JSON.stringify(win.unsentPacks, null, 2);
  document.getElementById('unsent-packs').innerText = JSON.stringify(packQueueSimple, null, 2);
  document.getElementById('unsent-packs-count').innerText = Object.keys(win.unsentPacks).length;
});


