const electron = require('electron');
const path = require('path');
const fs = require('fs');
const dateFormat = require('dateformat');
const logPath = '/Applications/Hearthstone/Logs/';

Tester = {
  // logPath: process.platform === 'win32' ? 'C:\\Program Files (x86)\\Hearthstone\\Logs\\' : '/Applications/Hearthstone/Logs/',
  example: 'Test D 16:17:04.6677860 NotifyOfCardGained: [name=Shadow Visions cardId=UNG_029 type=SPELL] NORMAL 3',
  example2: [
    '\n',
    'D 16:17:04.6677860 NotifyOfCardGained: [name=Shadow Visions cardId=UNG_029 type=SPELL] NORMAL 3\n',
    'D 16:17:04.6678840 NotifyOfCardGained: [name=Stonehill Defender cardId=UNG_072 type=MINION] NORMAL 3\n',
    'D 16:17:04.6679510 NotifyOfCardGained: [name=Ornery Direhorn cardId=UNG_925 type=MINION] NORMAL 3\n',
    'D 16:17:04.6680120 NotifyOfCardGained: [name=Tar Creeper cardId=UNG_928 type=MINION] NORMAL 3\n',
    'D 16:17:04.6680720 NotifyOfCardGained: [name=Rockpool Hunter cardId=UNG_073 type=MINION] NORMAL 3\n'
  ],

  formatTime: function(dateObject) {
    let self = this;
    let timestamp = dateFormat(dateObject, "HH:MM:ss.l") + '6789';
    return timestamp;
  },

  buildLine: function(cardInfo) {
    let self = this;
    let now = new Date();
    let line = 'D ' + self.formatTime(now) + ' NotifyOfCardGained: ' + cardInfo + ' NORMAL 3\n';
    return line;
  },
  buildLines: function(callback) {
    let self = this;
    // swap a card in cards with this line to provoke a multiple set_type error
      // "[name=Incanter's Flow cardId=BT_002 type=SPELL]",
    let cards = [
      '[name=Shadow Visions cardId=UNG_029 type=SPELL]',
      '[name=Stonehill Defender cardId=UNG_072 type=MINION]',
      '[name=Ornery Direhorn cardId=UNG_925 type=MINION]',
      '[name=Tar Creeper cardId=UNG_928 type=MINION]',
      '[name=Rockpool Hunter cardId=UNG_073 type=MINION]'
    ];

    let lines = [];
    lines.push('\n');
    cards.forEach(function(element) {
      lines.push(self.buildLine(element));
    });

    callback(lines);
  },

  writeLines: function(lines) {
    let self = this;
    let logFile = path.join(logPath, 'Achievements.log');

    lines.forEach(function(element) {
      fs.appendFile(logFile, element, function (err) {
        if (err) throw err;
        // console.log('Saved!');
      });
    });
  },

  openPack: function() {
    let self = this;
    self.buildLines(self.writeLines);
  }

}

module.exports = Tester;
