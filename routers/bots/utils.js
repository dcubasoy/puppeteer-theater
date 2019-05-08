function generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

function generateProfile() {
    const spec = {
      profileId: uuid.v4(),
      userId: uuid.v4(),
      firstName: chance.first({ gender: 'male' }),
      middleName: 'M',
      lastName: chance.last({ gender: 'male' }),
      gender: chance.gender(),
      email: chance.email({ length: 12, domain: 'gmail.com' }),
      password: faker.internet.password(),
      phone: chance.phone({ formatted: false, country: 'us' }),
      jobTitle: faker.name.jobDescriptor(),
      employerName: chance.company(),
      totalGrossIncome: '90000',
      address: '925 GAYLEY AVE',
      address2: 'APT 6',
      city: 'LOS ANGELES',
      state: 'CA',
      zip: '90024',
      ssn: chance.ssn(),
      dob: '02/21/1993',
      cardNumber: '5466160386124166',
      expDate: '03/21',
      cvv: '798',
    };
    Object.keys(spec).forEach(n => Object.assign(spec, { [n]: `${spec[n]}` }));
    return spec;
}


async function mergeImages(images) {
    // parse all images to merge it
    const cvImages = images.map((image) => {
      const img = new Canvas.Image();
      img.src = image;
      return img;
    });

    const width = cvImages.reduce((p, c) => p + c.width + 2, 0);
    const height = cvImages.reduce((p, c) => Math.max(p, c.height), 0);

    const cv = new Canvas(width, height);
    const ctx = cv.getContext('2d');

    let offset = 0;
    cvImages.forEach((cvImg) => {
      ctx.drawImage(cvImg, offset, 0, cvImg.width, cvImg.height);
      offset += cvImg.width + 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(offset - 2, 0, 2, height);
    });

     return cv.toBuffer();
}


module.exports = {
    generatePassword,
    generateProfile,
    mergeImages,
  };
