# y-ipfs-connector

> IPFS Connector for [Yjs](https://github.com/y-js/yjs)

([Demo video](https://t.co/jywinq2WlK))

## Use it!

Retrieve this with npm:

```bash
$ npm install y-ipfs-connector --save
```


## Example

```js
// you need to create and inject a IPFS object
const IPFS = require('ipfs')

const Y = require('yjs')
require('y-ipfs-connector')(Y)

// other Yjs deps:
require('y-memory')(Y)
require('y-array')(Y)
require('y-text')(Y)


// create IPFS node
const ipfs = new IPFS({
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
    ipfs: ipfs, // inject the IPFS object
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

Activate `y-ipfs-connector` on [`debug`](https://github.com/visionmedia/debug#readme) to see log messages.

# License

MIT

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/pgte/y-ipfs/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
