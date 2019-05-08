const Scene = require('../../scene');
const JokerJustClickSpinnerAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../../../utils/promise-condition');

class JokerStashOrdersScene extends JokerJustClickSpinnerAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        ordersHeader: {
          selector: 'h1',
          match: e => /Your Orders/.test(e.innerText),
        },
        exportOrderBtn: {
          selector: 'a.export-order',
        },
        ordersList: {
          selector: '.order-list',
        },
        ordersTables: {
          selector: '.\\_tabhor.dumps-table',
        },
        freshOrders: {
          selector: '.fresh-order',
          visibility: 'optional',
        },
      },
      extensions: [
        new Scene.Extensions.Delay(8000),
      ],
    }, args));
  }

  async play() {
    await super.play();

    if (await this.elements.freshOrders.visible()) {
      const freshOrdersContent = await this.elements.freshOrders.innerText();
      this.log('Found fresh orders: ', freshOrdersContent);
    }

    const orders = await this.elements.ordersTables.tableContent();
    this.log('Found JokerStash orders: ', orders);
    this.setContext('orders', orders);
    this.show.emit('botMonitoringResult', { orders });
  }
}

module.exports = JokerStashOrdersScene;
