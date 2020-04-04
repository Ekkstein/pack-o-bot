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

  buildLines: function(goodPack, callback) {
    let cards = [
      '[name=Stonehill Defender cardId=UNG_072 type=MINION]',
      '[name=Ornery Direhorn cardId=UNG_925 type=MINION]',
      '[name=Tar Creeper cardId=UNG_928 type=MINION]',
      '[name=Rockpool Hunter cardId=UNG_073 type=MINION]'
    ]
    if (goodPack) {
      cards.push('[name=Shadow Visions cardId=UNG_029 type=SPELL]')
    } else {
      cards.push("[name=Incanter's Flow cardId=BT_002 type=SPELL]")
    }
    cards = cards.map( this.buildLine.bind(this) )
    cards.unshift('\n')
    callback(cards);
    return
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

  openPack: function(goodPack=true) {
    this.buildLines(goodPack, this.writeLines);
  },

}

module.exports = Tester;
