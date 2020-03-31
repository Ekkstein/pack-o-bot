let electron = require('electron');
let win = electron.remote.getCurrentWindow();

electron.ipcRenderer.send('put-in-tray');

electron.ipcRenderer.on('status-change', function (event, message) {
  document.getElementById('status').innerText = message;
  document.getElementById('unsent-packs').innerText = JSON.stringify(win.unsentPacks, null, 2);
  console.log('test renderer')
});


