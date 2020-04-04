// @ts-check
class CookieStore {
  constructor() {
    this.store = null;
  }

  get() {
    return this.store;
  }

  set(store) {
    this.store = store;
  }
}

module.exports = { CookieStore };
