let electron = require('electron');
let win = electron.remote.getCurrentWindow();

electron.ipcRenderer.send('put-in-tray');

let token_input = document.getElementById('token');
let hearthstoneDir_input = document.getElementById('hearthstoneDir');
let dataDir_input = document.getElementById('dataDir');
token_input.value = win.token;
hearthstoneDir_input.value = win.hearthstoneDir;
dataDir_input.value = win.dataDir;

hearthstoneDir_input.setAttribute(
  'placeholder',
  process.platform === 'win32'
  ? 'C:\\Program Files (x86)\\Hearthstone\\'
  : '/Applications/Hearthstone/'
);

dataDir_input.setAttribute(
  'placeholder',
  process.platform === 'win32'
    ? require('os').homedir() + '\\AppData\\Local\\Blizzard\\Hearthstone\\'
    : require('os').homedir() + '/Library/Preferences/Blizzard/Hearthstone/'
);

document.getElementById('submit').onclick = function(){
  electron.ipcRenderer.send('settings-changed', [...document.body.querySelectorAll('input')].map(e => ({key: e.id, value: e.value})));
};

document.getElementById('token_link').onclick = function(e){
  e.preventDefault();
  electron.shell.openExternal(this.href);
};

document.body.querySelectorAll('.accordion > :first-child').forEach(element => {
  element.onclick = function(e) {
    e.preventDefault();
    let accordion = e.target;
    while (accordion !== null && !accordion.classList.contains('accordion')) {
      accordion = accordion.parentNode;
    }
    if (accordion !== null) {
      accordion.classList.toggle('collapsed');
    }
  };
});

electron.ipcRenderer.on('status-change', function (event, message) {
  document.getElementById('status').innerText = message;
});
