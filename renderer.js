let electron = require('electron');
let win = electron.remote.getCurrentWindow();

electron.ipcRenderer.send('put-in-tray');

let token_input = document.getElementById('token');
token_input.value = win.token;

document.getElementById('submit').onclick = function(){
  electron.ipcRenderer.send('settings-changed', token_input.value);
};

document.getElementById('token_link').onclick = function(e){
  e.preventDefault();
  electron.shell.openExternal(this.href);
};

electron.ipcRenderer.on('status-change', function (event, message) {
  document.getElementById('status').innerText = message;
});