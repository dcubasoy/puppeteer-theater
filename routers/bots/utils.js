const Chance = require('chance');
const chance = new Chance();

function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

function generateEmail() {
    return chance.email({domain: 'gmail.com'});
}


module.exports = {
    generatePassword,
    generateEmail,
};
