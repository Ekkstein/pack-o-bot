const path = require('path');
const Store = require(path.join(__dirname, 'Store.js'));

class PackStore extends Store {
  constructor(opts) {
    super(opts);
  }

  saveUnsentPack(pack) {
    this.data['unsentPacks'][pack.created_at_hs] = pack
    this.set('unsentPacks', this.data['unsentPacks'])
  }

  removeUnsentPack(pack) {
    delete this.data['unsentPacks'][pack.created_at_hs]
    this.set('unsentPacks',this.data['unsentPacks'])
  }

}

module.exports = PackStore;