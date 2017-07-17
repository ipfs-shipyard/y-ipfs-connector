/* global Y */
'use strict'

const log = require('debug')('y-ipfs-connector')
const EventEmitter = require('events')
const Room = require('ipfs-pubsub-room')
const Queue = require('async/queue')
const Buffer = require('safe-buffer').Buffer
const encode = require('./encode')
const decode = require('./decode')

function extend (Y) {
  class YIpfsConnector extends Y.AbstractConnector {
    constructor (y, options) {
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }
      if (!options.ipfs) {
        throw new Error('You must define a started IPFS object inside options')
      }


      if (!options.role) { options.role = 'master' }
      super(y, options)

      this._yConnectorOptions = options

      this.ipfs = options.ipfs

      const topic = this.ipfsPubSubTopic = 'y-ipfs:rooms:' + options.room

      this.roomEmitter = options.roomEmitter || new EventEmitter()
      this.roomEmitter.peers = () => this._room.getPeers()
      this.roomEmitter.id = () => topic

      this._receiveQueue = Queue(this._processQueue.bind(this), 1)

      this._room = Room(this.ipfs, topic)

      this._room.on('error', (err) => {
        (console.error || console.log)(err)
      })

      this._room.on('message', (msg) => {
        const proceed = () => {
          this._queueReceiveMessage(msg.from, decode(message.payload))
        }

        const message = decode(msg.data)
        if (message.type !== null) {
          if (options.verifySignature) {
            const sig = message.signature && Buffer.from(message.signature, 'base64')
            const incomingMessage = Buffer.from(message.payload)
            if (!sig) {
              console.error('No signature in message from ' + msg.from + '. Discarding it.')
              return
            }
            options.verifySignature.call(null, incomingMessage, sig, (err, valid) => {
              if (err) {
                console.error('Error verifying signature from peer ' + msg.from + '. Discarding message.', err)
                return
              }

              if (!valid) {
                console.error('Invalid signature from peer ' + msg.from + '. Discarding message.')
                return
              }
              proceed()
            })
          } else {
            proceed()
          }
        }
      })

      this._room.on('peer joined', (peer) => {
        this.roomEmitter.emit('peer joined', peer)
        this.userJoined(peer, 'master')
      })

      this._room.on('peer left', (peer) => {
        this.roomEmitter.emit('peer left', peer)
        this.userLeft(peer)
      })

      if (this.ipfs.isOnline()) {
        this._start()
      } else {
        this.ipfs.once('ready', this._start.bind(this))
      }
    }

    _queueReceiveMessage (from, message) {
      this._receiveQueue.push({
        from: from,
        message: message
      })
    }

    _processQueue (item, callback) {
      const from = item.from
      const message = item.message

      if (from === this._ipfsUserId) {
        // ignore message from self
        callback()
      } else if (this._room.hasPeer(from)) {
        this.receiveMessage(from, message)
        callback()
      } else {
        this._receiveQueue.unshift(item)
        setTimeout(callback, 500)
      }
    }

    _start () {
      const id = this.ipfs._peerInfo.id.toB58String()
      this._ipfsUserId = id
      this.setUserId(id)
    }

    disconnect () {
      log('disconnect')
      this._room.leave()
      super.disconnect()
    }
    send (peer, message) {
      this._encodeMessage(message, (err, encodedMessage) => {
        if (err) {
          throw err
        }
        this._room.sendTo(peer, encodedMessage)
      })
    }
    broadcast (message) {
      this._encodeMessage(message, (err, encodedMessage) => {
        if (err) {
          throw err
        }
        this._room.broadcast(encodedMessage)
      })
    }
    isDisconnected () {
      return false
    }

    _encodeMessage (_message, callback) {
      const message = localEncode(_message)
      if (this._yConnectorOptions.sign) {
        this._yConnectorOptions.sign(Buffer.from(message), (err, signature) => {
          if (err) { return callback(err) }
          const sig = signature.toString('base64')
          callback(null, encode({
            signature: sig,
            payload: message
          }))
        })
      } else {
        callback(null, encode({
          payload: message
        }))
      }
    }
  }
  Y.extend('ipfs', YIpfsConnector)
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}

function localEncode (m) {
  return JSON.stringify(m)
}