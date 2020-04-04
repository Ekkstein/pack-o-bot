const electron = require('electron');
const path = require('path');
const fs = require('fs');
const userDataPath = (electron.app || electron.remote.app).getPath('userData');

class Store {
  constructor(opts) {
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
    this.options = opts;
    this.loadedFromFile = false;
  }

  get(key) {
    if (!this.loadedFromFile) {
      this.data = parseDataFile(this.path);
      this.loadedFromFile = true;
    }
    return this.data[key] || '';
  }

  set(key, val) {
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
    return {...defaults, ...presentData}
  } catch(error) {
    if (!fs.existsSync(userDataPath)){ fs.mkdirSync(userDataPath); }
    fs.writeFileSync(filePath, JSON.stringify(defaults));
    return defaults;
  }
}

module.exports = Store;
