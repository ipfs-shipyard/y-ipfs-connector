'use strict'

const log = require('debug')('y-ipfs')
const Emitter = require('events')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const multiaddr = require('multiaddr')
const protocol = require('./protocol')
const encode = require('./encode')

const RETRY_INTERVAL = 1000

module.exports = (ipfs, topic) => {
  const connections = {}
  const emitter = Object.assign(new Emitter, {
    send: send
  })

  return emitter

  function send (peer, message) {
    getConnection(peer, (err, conn) => {
      if (err) {
        emitter.emit('error', err)
        return // early
      }

      if (!conn) {
        later(peer, message)
      } else {
        log('connected. sending message', message, peer)
        conn.push(encode(message))
      }
    })
  }

  function getConnection (peer, callback) {

    const conn = connections[peer]
    if (conn) {
      // TODO: How can we assure the message was delivered?
      callback(null, conn)
      return // early
    }


    ipfs.pubsub.peers(topic, (err, peers) => {
      if (err) {
        callback(err)
        return // early
      }

      if (!peers.find(peerHasAddress(peer))) {
        callback()
      } else {
        getPeerAddress(peer, (err, peerAddress) => {
          if (err) {
            callback(err)
            return // early
          }

          ipfs._libp2pNode.dial(peerAddress, protocol.id, (err, conn) => {
            if (err) {
              callback(err)
              return // early
            }
            log('connected to %s', peer)
            const pushable = Pushable()
            connections[peer] = pushable
            pull(
              pushable,
              conn,
              pull.onEnd((err) => {
                log('connection to %s ended', peer, err)
                delete connections[peer]
              })
            )
            callback(null, pushable)
          })
        })
      }
    })
  }

  function later(peer, message) {
    setTimeout(send.bind(null, peer, message), RETRY_INTERVAL)
  }

  function getPeerAddress (peerId, callback) {
    ipfs.swarm.peers((err, peersAddresses) => {
      if (err) {
        callback(err)
        return // early
      }

      const peer = peersAddresses.find((peerAddress) => {
        return peerAddress.peer.id.toB58String() === peerId
      })
      if (!peer) {
        callback(new Error('Could not find address for peer ' + peerId))
        return // early
      }

      callback(null, peer.addr)
    })
  }
}

function peerHasAddress (address) {
  return (peer) => {
    return peer === address
  }
}