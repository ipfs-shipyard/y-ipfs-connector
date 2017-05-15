/* global Y */
'use strict'

const IPFS = require('IPFS')
const pull = require('pull-stream')
const Queue = require('async/queue')
const setImmediate = require('async/setImmediate')
const Room = require('./room')
const Peers = require('./peers')
const protocol = require('./protocol')
const encode = require('./encode')
const decode = require('./decode')

function extend (Y) {
  class YIPFS extends Y.AbstractConnector {
    constructor (y, options) {
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }
      options.role = 'master'
      super(y, options)

      this.connected = false

      this.ipfsOptions = options.ipfs || {
        ipfs: options.ipfs || {
          repo: repoPath(),
          config: {
            Addresses: {
              Swarm: [
                '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss'
              ]
            }
          },
          EXPERIMENTAL: {
            pubsub: true
          }
        },
        room: options.room
      }

      const topic = this.ipfsPubSubTopic = 'y-ipfs:rooms:' + options.room

      const ipfs = this.ipfs = new IPFS(this.ipfsOptions.ipfs)

      const onMessage = this.ipfsPubsubSubscription = (msg) => {
        const message = decode(msg.data)
        console.log('received broadcast message', message, msg.from)
        if (message.type) {
          this.queueReceiveMessage(msg.from, message)
        }
      }

      const handleDirectConnection = this.ipfsDirectConnectionHandler = (protocol, conn) => {
        conn.getPeerInfo((err, peerInfo) => {
          if (err) {
            throw err
          }

          const peerId = peerInfo.id.toB58String()

          console.log('handling direct connection', peerInfo)
          pull(
            conn,
            pull.map(decode),
            pull.map((message) => {
              this.queueReceiveMessage(peerId, message)
              return message
            }),

            pull.onEnd((err) => {
              console.log('direct connection ended', err)
            })
          )

        })
      }

      const processReceivedMessage = (m, _callback) => {
        console.log('processReceivedMessage', m)
        if (this._ipfsUserId && m.from === this._ipfsUserId) {
          console.log('got message from self, ignoring...')
          callback()
        } else if (!this.room) {
          console.log('no room, waiting...')
          this.receiveQueue.unshift(m)
          setTimeout(callback, 500) // wait for room
        } else if (this.room.hasPeer(m.from)) {
          console.log('room has peer, delivering')
          this.receiveMessage(m.from, m.message)
          callback()
        } else {
          console.log('waiting for peer %s to deliver message', m.from, m.message)
          this.receiveQueue.push(m)
          setTimeout(callback, 500)
        }

        function callback (err) {
          console.log('processReceivedMessage DONE', err)
          _callback(err)
        }
      }

      this.receiveQueue = Queue(processReceivedMessage, 1)

      ipfs.once('ready', () => {
        console.log('ipfs ready')
        this.connected = true
        ipfs.id((err, peerInfo) => {
          if (err) {
            this.emit('error', err)
            return // early
          }

          console.log('ipfs id: %s', peerInfo.id)

          this._ipfsUserId = peerInfo.id
          this.setUserId(peerInfo.id)

          // subscribe to broadcast messages
          ipfs.pubsub.subscribe(topic, onMessage)
          console.log('subscribed to topic %s', topic)

          // handle direct messages
          ipfs._libp2pNode.handle(protocol.id, handleDirectConnection)

          const room = this.room = Room(ipfs, topic)
          this.peers = Peers(ipfs, topic)

          room.on('peerJoined', (peer) => {
            console.log('peer %s joined', peer)
            this.userJoined(peer, 'master ')
          })

          room.on('peerLeft', (peer) => {
            console.log('peer %s left', peer)
            this.userLeft(peer)
          })
        })
      })

    }
    disconnect () {
      console.log('disconnect')
      this.ipfs.pubsub.unsubscribe(this.ipfsPubSubTopic, this.ipfsPubsubSubscription)
      this.ipfs._libp2p.unhandle(protocol.id)
      this.ipfs.stop()
      super.disconnect()
    }
    reconnect () {
      console.log('reconnect')
      this.ipfs.pubsub.subscribe(this.ipfsPubSubTopic, this.ipfsPubsubSubscription)
      this.ipfs._libp2p.handle(protocol.id, this.ipfsDirectConnectionHandler)
      super.reconnect()
    }
    send (peer, message) {
      console.log('send to', message, peer)
      this.peers.send(peer, message)
    }
    broadcast (message) {
      console.log('broadcasting', message)
      this.ipfs.pubsub.publish(this.ipfsPubSubTopic, encode(message), (err) => {
        if (err) {
          throw err
        }
      })
    }
    isDisconnected () {
      return !this.connected
    }

    queueReceiveMessage (from, message) {
      this.receiveQueue.push({
        from: from,
        message: message
      })
    }
  }
  Y.extend('ipfs', YIPFS)

  function repoPath () {
    // TODO: shouldnt need a new repo on every instance
    return 'temp/ipfs-y/' + Math.random()
  }
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}

