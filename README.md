# y-ipfs

> IPFS Connector for [Yjs](https://github.com/y-js/yjs)

## Use it!

Retrieve this with npm:

```bash
$ npm install y-ipfs --save
```


## Example

```js
const IPFS = require('ipfs')
const Y = require('yjs')

// create IPFS node
const ipfs = new IPFS({
  config: {
    Addresses: {
      Swarm: [
        '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss'
      ]
    }
  },
  EXPERIMENTAL: {
    pubsub: true // need this to work
  }
})

Y({
  db: {
    name: 'memory'
  },
  connector: {
    name: 'ipfs', // use the IPFS connector
    ipfs: ipfs,
    room: 'Textarea-example-dev'
  },
  sourceDir: '/bower_components', // location of the y-* modules
  share: {
    textarea: 'Text' // y.share.textarea is of type Y.Text
  }
}).then(function (y) {
  // bind the textarea to a shared text element
  y.share.textarea.bind(document.getElementById('textfield'))
}
```
## Debug

Activate `y-ipfs` on [`debug`](https://github.com/visionmedia/debug#readme) to see log messages.

# License

MIT

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/pgte/y-ipfs/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
