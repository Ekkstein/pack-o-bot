const fs = require('original-fs');
const path = require('path');
const ini = require('ini');
const async = require('async');
const config = require(path.join(__dirname, 'config.json'));
const { net, app } = require('electron');
const Store = require(path.join(__dirname, 'Store.js'));
const PackStore = require(path.join(__dirname, 'PackStore.js'));

let packStore = new PackStore({
  configName: 'packs',
  defaults: {
    region: 'xx',
    unsentPacks: {},
  }
});

let userStore = new Store({
  configName: 'user',
  defaults: {
    token: null,
    log: [],
    hearthstoneDir: "",
    dataDir: "",
  }
});

let busyFlag = false;

let configFile
if (userStore.get('dataDir') !== '') {
  configFile = path.join(userStore.get('dataDir'), 'log.config')
} else {
  if (process.platform === 'win32') {
    configFile = path.join(require('os').homedir(), 'AppData/Local/Blizzard/Hearthstone/log.config')
  } else {
    configFile = path.join(require('os').homedir(), '/Library/Preferences/Blizzard/Hearthstone/log.config')
  }
}

let logPath = (userStore.get('hearthstoneDir') !== '')
  ? (path.join(userStore.get('hearthstoneDir'), 'Logs/'))
  : ( (process.platform === 'win32')
    ? ('C:/Program Files (x86)/Hearthstone/Logs/')
    : ('/Applications/Hearthstone/Logs/')
);

module.exports = {
  configFile,
  logPath,
  region: 'xx',
  requiredLogs: [
    'Achievements',
    'BattleNet',
  ],
  packStore,
  userStore,

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

      fs.writeFile(self.configFile, ini.stringify(existing), function(err) {
        if (!err) return;
        setTimeout(() => {
          app.emit('status-change', `Couldn't write to ${self.configFile}! Are your paths set correctly?`);
        }, 1000);
      });
    });
  },

  getRegion: function(callback) {
    let self = this;
    const battleNetLogPath = path.join(this.logPath, 'BattleNet.log')

    return fs.readFile(battleNetLogPath, 'utf8',
      function(error, contents) {
        if (error) return;
        let line = contents.substr(0, 128);
        let region = line.match(/(us|eu|kr)\.actual.battle.net/);
        let newRegion = (region === null) ? packStore.get('region') : region[1];
        if (!newRegion) {
          app.emit('status-change', 'Error! Could not determine your region.');
        } else if (newRegion && self.region !== newRegion) {
          self.region = newRegion;
          packStore.set('region', self.region);
          app.emit('status-change', 'Updated region to ' + newRegion.toUpperCase());
          setTimeout(function(){
            app.emit('status-change', 'Watching for packs...');
          }, 5000);
        }
        callback();
      }
    );
  },

  buildRequestOptions: function(pack) {
    const isDev = process.env.ELECTRON_ENV === 'development'
    return {
      method: 'POST',
      protocol: isDev ? 'http:' : 'https:',
      hostname: isDev ? 'localhost' : 'pitytracker.com',
      port: isDev ? 3001 : 443,
      path: '/api/v1/packs',
      headers: {
        pobtoken: isDev ? 'hhCTFq5Uhh5tDET9ogoLFA' : userStore.get('token'),
        Authorization: 'Token token="'+ (isDev ? config.devToken : config.apptoken) +'"',
        'Content-Type': 'application/json'
      },
    }
  },

  sendPack: function(pack, self){
    if (busyFlag) {return false}
    busyFlag = true;
    let asyncOptions = {
      times: 6,
      interval: function(retryCount) {
        return 500 * Math.pow(2, retryCount); // 1s, 2s, 4s, 8s, etc
      }
    }

    asyncTask = function (callback, results) {
      app.emit('status-change', 'Uploading your pack to PityTracker...');
      options = self.buildRequestOptions();
      const request = net.request(options)
      request.on('response', (response) => {
        if (response.statusCode === 201) {
          let message = 'Pack uploaded to PityTracker.'
          app.emit('status-change', message);
          busyFlag = false;
          packStore.removeUnsentPack(pack)
          self.clearPendingFlags()
          setTimeout(function(){
            app.emit('status-change', 'Watching for packs...');
          }, 5000);
          callback(null, 'done');
        } else if (response.statusCode >= 300){
            let message = `Retrying pack upload...(statusCode: ${response.statusCode})`
            app.emit('status-change', message);
            callback(null, response);
        } else if (response.statusCode != 201){
          let message = `Unknown error while sending Pack: (${response.statusCode})`
          app.emit('status-change', message);
          callback(null, 'unknown Error');
        }
        response.on('data', (body) => {
          const responsePack = JSON.parse(body).pack
          if (response.statusCode === 400 && responsePack.set_type === 'multiple'){
            let message = "This pack can't be uploaded. It's set_type is not identifyable. You can find it in packobots app directory in user.json for review.";
            userStore.log(pack)
            packStore.removeUnsentPack(pack)
            app.emit('status-change', message);
            busyFlag = false;
            callback(null, 'done');
          }
        })
        response.on('error', (error) => {
          let message = 'Retrying pack upload...(error: '+ error + ')';
          app.emit('status-change', message);
          callback(error, 'error');
        })
        // response.on('end', () => {
        //   console.log('No more data in response.')
        // })
      })
      request.write(JSON.stringify(pack))
      request.end()
      return request
    }

    asyncCallback = function(response, result) {
      if (response) {
        let message = 'Failed: Pack couldn\'t be uploaded to PityTracker. Error: '+ response.statusCode;
        console.log(message);
        app.emit('status-change', message);
        busyFlag = false;
        pack.pending = false;
        packStore.saveUnsentPack(pack)
        setTimeout(function(){
          app.emit('status-change', 'Watching for packs...');
        }, 5000);
      }
    }

    async.retry(asyncOptions, asyncTask, asyncCallback);
  },

  // getLines: function() {
  //   let logFile = path.join(this.logPath, 'Achievements.log');
  //   fs.watchFile(logFile, { interval: 1007 }, function(current, old){
  //     fs.readFile(logFile, 'utf8', function(error, contents){
  //       if (contents) {
  //         let newLines = contents.substr(old.size, current.size - old.size);
  //         let matches = [];
  //         newLines.replace(/(D .+?NotifyOfCardGained.+? \d+)/g, function(all, rawCardLine){
  //           matches.push(all);
  //         });
  //         packStorage.set('lines', matches, function(error) {
  //           if (error) throw error;
  //         });
  //       }
  //     });
  //   });
  // },

  clearPendingFlags: function() {
    unsentPacks = packStore.get('unsentPacks')
    if (Object.keys(unsentPacks).length > 0) {
      console.log('clearPendingFlags found packs: ',Object.keys(unsentPacks).length);
      Object.values(unsentPacks).forEach(function(pack) {
        pack.pending = false;
      });
      packStore.set('unsentPacks',unsentPacks)
    }
  },

  watchPacks: function() {
    let self = this;
    fs.watchFile(packStore.path, { interval: 1007 }, function(current, old){
      console.log('watchPacks triggered');
      if (current.size != old.size) {
        unsentPacks = packStore.get('unsentPacks')
        let packsToSend = Object.values(unsentPacks).filter( ( pack ) => {
          return pack.pending == false
        });

        Object.values(unsentPacks).forEach(function(pack) {
          pack.pending = true
        });
        packStore.set('unsentPacks',unsentPacks)

        if (Object.keys(packsToSend).length > 0) {
          Object.values(packsToSend).forEach(function(element) {
            self.sendPack(element, self);
          });
        }
      }
    });
  },

  watchLogfile: function() {
    // console.log('starting to watch Achievements.log')
    let self = this;
    let logFile = path.join(this.logPath, 'Achievements.log');
    fs.watchFile(logFile, function(current, old){
      // console.log('watchLogFile triggered')
      fs.readFile(logFile, 'utf8', function(error, contents){
        if (contents) {
          let data = contents.substr(old.size, current.size - old.size);
          let matches = [];
          let now = new Date()
          data.replace(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\d+ NotifyOfCardGained: \[name=.+? cardId=(.+?) type=.+?\] (GOLDEN|NORMAL) (\d+)/g, function(all,h,m,s,ms, cardId, golden, owned){
            matches.push({
              cardId: cardId,
              golden: golden === 'GOLDEN',
              owned: +owned,
              time: new Date(now.getFullYear(),now.getMonth(),now.getDate(),+h,+m,+s,+ms)
            });
          });

          if (matches.length >= 5 && matches.length % 5 === 0) {
            self.getRegion(function(){
              app.emit('status-change', 'Pack found!');

              let n = 5;
              let chunks = Array(Math.ceil(matches.length/n)).fill().map((_,i) => matches.slice(i*n,i*n+n));;
              chunks.forEach(function(element) {
                let pack = {
                  created_at_hs: element[0].time.toString(),
                  region: self.region,
                  cards: element,
                  pending: false
                }
                packStore.saveUnsentPack(pack)
              });
            });
          } else {
            console.log('Raise NotImplementedError: Half-Pack Problem')
          }
        }
      })
    });
  }
};
