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

## Signature

### `options.sign`

You can sign messages. For that, you have to provide a `sign` option, which needs to be a function that accepts a message (string) and calls back with a buffer containing the signature for it (string):

```js
Y({
  connector: {
    name: 'ipfs',
    sign: (m, callback) => { ... }
    // ...
  }
  // ...
})
```

Using this, messages will be sent alongside with a signature, which can be validated.

## `options.verifySignature`

You can also verify a signature for a given message by providing a function like this:

```js
Y({
  connector: {
    name: 'ipfs',
    verifySignature: (peer, message, signature, callback) => { ... }
    // ...
  }
  // ...
})
```

## `options.encode`

Optional function that receives the message and encodes it. Useful if you want to encrypt the content before sending.

```js
options.encode = (message) => {
  return encrypt(message)
}
```

## `options.decode`

Optional function that receives the message and decodes it. Useful if you want to decrypt the content after receiving.

```js
options.decode = (message) => {
  return decrypt(message)
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
