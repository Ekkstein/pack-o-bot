const fs = require('original-fs');
const path = require('path');
const ini = require('ini');
const request = require('request');
const async = require('async');
const config = require(path.join(__dirname, 'config.json'));
const app = require('electron').app;

const Store = require(path.join(__dirname, 'Store.js'));

let store = new Store({ configName: 'user' });

module.exports = {
  configFile: process.platform === 'win32' ? require('os').homedir() + '\\AppData\\Local\\Blizzard\\Hearthstone\\log.config' : require('os').homedir() + '/Library/Preferences/Blizzard/Hearthstone/log.config',

  logPath: process.platform === 'win32' ? 'C:\\Program Files (x86)\\Hearthstone\\Logs\\' : '/Applications/Hearthstone/Logs/',

  region: 'xx',

  requiredLogs: [
    'Achievements',
    'BattleNet',
  ],

  setup: function() {
    let self = this;

    fs.readFile(this.configFile, 'utf8', function(error, contents) {
      if (error) {
        contents = '';
      }

      let existing = ini.parse(contents);

      self.requiredLogs.forEach(function(v) {
        if (typeof existing[v] === 'undefined') {
          existing[v] = {};
        }

        existing[v].LogLevel = 1;
        existing[v].FilePrinting = true;
      });

      fs.writeFile(self.configFile, ini.stringify(existing), function(){});
    });
  },

  getRegion: function(cb) {
    let self = this;

    return fs.readFile(path.join(this.logPath, 'BattleNet.log'), 'utf8', function(error, contents) {
      if (error) return;

      let line = contents.substr(0, 128);

      let region = line.match(/(us|eu|kr)\.actual.battle.net/);

      let new_region = (region === null) ? store.get('region') : region[1];

      if (self.region !== new_region) {
        self.region = new_region;

        store.set('region', self.region);

        app.emit('status-change', 'Updated region to ' + new_region.toUpperCase());

        setTimeout(function(){
          app.emit('status-change', 'Watching for packs...');
        }, 5000);

        cb();
      }
    });
  },

  watchPacks: function() {
    let self = this;
    let logFile = path.join(this.logPath, 'Achievements.log');
    fs.watchFile(logFile, function(current, old){
      fs.readFile(logFile, 'utf8', function(error, contents){
        if (contents) {
          let data = contents.substr(old.size, current.size - old.size);
          let matches = [];
          data.replace(/\[name=.+? cardId=(.+?) type=.+?\] (GOLDEN|NORMAL) (\d)/g, function(all, cardId, golden, owned){
            matches.push({
              cardId: cardId,
              golden: golden === 'GOLDEN',
              owned: +owned
            });
          });

          if (matches.length >= 5 && matches.length % 5 === 0) {
            self.getRegion(function(){
              app.emit('status-change', 'Pack found!');

              let n = 5;
              let chunks = Array(Math.ceil(matches.length/n)).fill().map((_,i) => matches.slice(i*n,i*n+n));;

              chunks.forEach(function(pack){
                let req = {
                  region: self.region,
                  cards: pack
                };

                async.retry({
                  times: 10,
                  interval: function(retryCount) {
                    return 500 * Math.pow(2, retryCount); // 1s, 2s, 4s, 8s, etc
                  }
                }, function (callback, results) {
                  store = new Store({ configName: 'user' });
                  app.emit('status-change', 'Uploading your pack to PityTracker...');
                  return request.post({
                    url: 'https://staging.pitytracker.com/api/v1/packs',
                    body: req,
                    json: true,
                    headers: {
                      pobtoken: store.get('token'),
                      Authorization: 'Token token="'+ config.apptoken +'"',
                      'Content-Type': 'application/json'
                    },
                    timeout: 10000
                  }, function(error, response, body){
                    if (response.statusCode < 300) {
                      app.emit('status-change', 'Pack uploaded to PityTracker.');
                      setTimeout(function(){
                        app.emit('status-change', 'Watching for packs...');
                      }, 5000);
                      callback(null, 'done');
                    }
                    else {
                      app.emit('status-change', 'Retrying pack upload... (' + response.statusCode + ')');
                      callback('failed', null);
                    }
                  });
                }, function(err, result) {
                  if (err) {
                    app.emit('status-change', 'Failed: Pack couldn\'t be uploaded to PityTracker. (' + response.statusCode + ')');
                    setTimeout(function(){
                      app.emit('status-change', 'Watching for packs...');
                    }, 5000);
                  }
                });
              });
            });
          }
        }
      })
    });
  }
};