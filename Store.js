const electron = require('electron');
const path = require('path');
const fs = require('fs');
const userDataPath = (electron.app || electron.remote.app).getPath('userData');

class Store {
  constructor(opts) {
    this.options = opts;
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
  }

  get(key) {
    // this is bad practice. returning a string, when it could be anything.
    // It requires other coders to know about this behaviour and as it deviates from
    // what is expected, it instead should return undefined!
    // return this.data[key] || '';
    return this.data[key]
  }

  set(key, val) {
    // console.log('Store setting key: ', key, 'val: ',val)
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  log(entry) {
    this.data['log'].push(entry)
    this.set('log', this.data['log'])
  }
  /**
   * Write multiple key/value pairs to a file.
   * @param {Object[]} pairs - The key/value pairs to be written.
   * @param {string} pairs[].key
   * @param {*} pairs[].value
   */
  setArray(ar) {
    ar.forEach(e => {
      this.data[e.key] = e.value;
    });
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath, defaults) {
  try {
    const presentData = JSON.parse(fs.readFileSync(filePath))
    // In case additional defaults are added, they need to join the store.
    return {...defaults, ...presentData}
  } catch(error) {
    if (!fs.existsSync(userDataPath)){ fs.mkdirSync(userDataPath); }
    fs.writeFileSync(filePath, JSON.stringify(defaults));
    return defaults;
  }
}

module.exports = Store;
