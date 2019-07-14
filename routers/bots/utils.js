const Chance = require('chance');

const chance = new Chance();
const redis = require('../../utils/redis');
const logger = require('./logger');
const request = require('request');
const got = require('got');


const rp = opt => new Promise((resolve, reject) => request(opt, (err, resp, body) => {
  if (err) return reject(err);
  return resolve([resp, body]);
}));


function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

function generateEmail() {
    return chance.email({domain: 'gmail.com', length: 18});
}


async function checkSSN(ssn) {
  try {
    const cachedResult = await redis.get(`ssn:${ssn}`);
    if (cachedResult) {
      logger.info('checkSSN()-bin-cache-hit');
      return JSON.parse(cachedResult);
    }

    logger.info('checkSSN()-bin-cache-miss');
    const { body } = await got(`https://www.ssn-check.org/verify/${ssn}`);

    if (/is Invalid/i.test(body) || !body) {
      console.log(body);
      throw new Error('Parsing Error');
    }

    const $ = cheerio.load(body);
    let ssnresults = $('.text-muted').text();
    ssnresults = ssnresults.replace('\n', ' ');
    ssnresults = ssnresults.replace(ssn, '');

    const issuedState = ssnresults.match(/(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\sHampshire|New\sJersey|New\sMexico|New\sYork|North\sCarolina|North\sDakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\sIsland|South\sCarolina|South\sDakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\sVirginia|Wisconsin|Wyoming)/)[0];
    let issuedYearArr = ssnresults.match(/in \d{4}/)[0];
    issuedYearArr = issuedYearArr.replace('in ', '').trim();

    const issuedYear = parseInt(issuedYearArr, 10);

    const age = moment().diff(moment(issuedYear, 'YYYY'), 'years');

    // set cached value
    await redis.setex(`ssn:${ssn}`, 60 * 60 * 24 * 7, JSON.stringify({ ...{ssn, issuedState, issuedYear, age} })); // expires 24 hours
    return { ssn, issuedState, issuedYear, age };
  } catch (error) {
    throw new Error('checkSSN() Parsing Error', error.stack);
  }
}





async function main() {
  let resp = await checkSSN('608-08-7890');
  console.log(resp);
}

main().catch(console.error);


module.exports = {
    generatePassword,
    generateEmail,
    checkSSN,
};
