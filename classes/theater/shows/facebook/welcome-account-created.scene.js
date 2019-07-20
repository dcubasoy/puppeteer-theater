const Scene = require('../../scene');
const FacebokJustClickAwareScene = require('./just-click-aware-scene');
const PromiseCondition = require('../../promise-condition');const path = require('path');

class FacebookWelcomeAccountCreatedScene extends FacebokJustClickAwareScene.WithSpinner {
  constructor(args) {
    super(Object.assign({
      elementQueries: {
        sideNav: {
          selector: '#sideNav',
        },
        uploadPhoto: {
          selector: '[name="file"]',
        },
        addFriendsBtn: {
          selector: 'button'
        }
      },
    }, args));
  }

  async match() {
    return PromiseCondition.and(super.match());
  }

  async play() {
    await super.play();
    const spec = this.context('spec');

    const photosToUpload = (spec.photos || [])
      .filter(a => !!a)
      .map(a => Object.assign(a, { path: path.parse(a.name) }))
      .map((a) => {
        Object.assign(a.path, {
          ext: a.path.ext.toLowerCase(),
          name: a.path.name.toLowerCase().replace(/[^a-z0-9]+/, ''),
        });
        return a;
      }).filter(a => !~uploadedFileNames.findIndex(f => a.path.ext === f.ext && a.path.name === f.name));



      for (let i = 0; i < photosToUpload.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const a = attachmentsToUpload[i];
        this.log('uploading', a.path.name);
        // eslint-disable-next-line no-await-in-loop
        await this.elements.inputReceipt.upload(a.buffer, {
          prefix: `${a.path.name}-`,
          postfix: a.path.ext,
        });
        this.log('uploading', a.path.name, 'complete');
        for (let startedAt = Date.now(); ;) {
          if (Date.now() - startedAt > 60 * 1000) throw new Error((500, 'upload-timeout');
          // eslint-disable-next-line no-await-in-loop
          if (!(await this.elements.uploadPleaseWait.visible())) break;
        }
        this.log('upload finished');
        return;
      }
  }
}

module.exports = FacebookWelcomeAccountCreatedScene;
