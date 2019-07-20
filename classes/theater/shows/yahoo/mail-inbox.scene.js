const PromiseCondition = require('../../promise-condition');const YahooJustClickAwareScene = require('./just-click-aware-scene');
const Scene = require('../../scene');

class YahooMailInboxScene extends YahooJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        yBar: {
          selector: '#ybar',
        },
        mailAppContainer: {
          selector: '#mail-app-container',
        },
        mailSearchNav: {
          selector: 'input[role="combobox"]',
        },
        searchBtn: {
          selector: 'button[title="Search"]',
        },
        downloadBtn: {
          selector: 'button[aria-label="Download"]',
          visibility: 'optional',
        },
        mailDiv: {
          selector: 'div[data-test-id="mail-reader-container"]',
        },
        photosNav: {
          selector: 'a[aria-label="Photos - Click to see all photos"]',
          visibility: 'optional',
        },
        documentsNav: {
          selector: 'a[aria-label="Documents - Click to see all documents"]',
          visibility: 'optional',
        },
        documents: {
          selector: '.document-list-item',
          visibility: 'optional',
        },
        paginateBtn: {
          selector: 'button[data-test-id="previewr-forward"]',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.PreventCurtainFall({
          playCount: 10
        }),
      ],
      generic: false,
    }, args));
  }

  async appData() {
    // eslint-disable-next-line arrow-body-style
    return (await this.show.bot()).page.evaluate(() => {
      // eslint-disable-next-line no-undef
      return window.AppBootstrapData;
    });
  }

  async scrapeInfiniteScrollItems(page, extractItems, itemTargetCount, scrollDelay = 1000) {
    let items = [];
    try {
      let previousHeight;
      while (items.length < itemTargetCount) {
        items = await page.evaluate(extractItems);
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
        await page.waitFor(scrollDelay);
      }
    } catch (e) {}
    return items;
  }


  async extractDocuments() {
    const els = Array.from(document.querySelectorAll('.document-list-item'));
    els.map((el) => el.click());

    const items = [];
    for (let element of extractedElements) {
      items.push(element.innerText);
    }
    return items;
  }



  async match() {
    return PromiseCondition.and(
      super.match(),
    );
  }

  async play() {
    await super.play();
    const bot = await this.show.bot();
    this.log('Linked');

    this.show.emit('retailerBotResult', {
      status: 'Linked',
    });

    await this.elements.mailSearchNav.fill('Discover');
    await this.elements.searchBtn.click();
    await bot.page.waitFor(5000);
    await bot.page.reload({
      waitUntil: 'domcontentloaded'
    });

    await this.elements.mailSearchNav.fill('SquareUp');
    await this.elements.searchBtn.click();
    await bot.page.waitFor(5000);
    await bot.page.reload({
      waitUntil: 'domcontentloaded'
    });

    await this.elements.mailSearchNav.fill('Tax Return');
    await this.elements.searchBtn.click();
    await bot.page.waitFor(5000);
    await bot.page.reload({
      waitUntil: 'domcontentloaded'
    });


    await this.elements.mailSearchNav.fill('PayPal');
    await this.elements.searchBtn.click();
    await bot.page.waitFor(5000);
    await bot.page.reload({
      waitUntil: 'domcontentloaded'
    });

  }
}

module.exports = YahooMailInboxScene;
