const debug = require('debug')('promise-condition');
const _ = require('lodash');

module.exports = {
  and: async (...promises) => {
    try {
      return (await Promise.all(_.flattenDeep(promises).map(p => (typeof p === 'function' ? p() : p)))).filter(r => !r).length === 0;
    } catch (error) {
      debug('error', error.stack);
      return false;
    }
  },
  or: async (...promises) => new Promise((resolve) => {
    let count = 0;
    let resolved = false;
    const ps = _.flattenDeep(promises);
    ps.forEach(async (promise) => {
      try {
        const res = await (typeof promise === 'function' ? promise() : promise);
        if (res) {
          if (!resolved) {
            resolved = true;
            return resolve(true);
          }
        }
        count += 1;
        if (count === ps.length) {
          if (!resolved) {
            resolved = true;
            return resolve(false);
          }
        }
      } catch (error) {
        debug('error', error.stack);
        if (count === ps.length) {
          if (!resolved) {
            resolved = true;
            return resolve(false);
          }
        }
      }

      return null;
    });
  }),
  not: async promise => !await promise,
  strictEqual: async (a, b) => await a === await b,
};
