module.exports = (src) => {
  // eslint-disable-next-line global-require
  // const ey = require('@nicomee/bt_backend-core');

  async function main() {
    // await ey.config.load(); // load all environment variables - you can implement this in any way you want

    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(src);
  }
  main();
};
