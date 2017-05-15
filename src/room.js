'use strict'

const diff = require('hyperdiff')
const Emitter = require('events')

const PEER_POLL_INTERVAL = 1000

module.exports = (ipfs, topic) => {
  const emitter = Object.assign(new Emitter(), {
    hasPeer: hasPeer
  })

  let peers = []
  const pollInterval = setInterval(pollPeers, PEER_POLL_INTERVAL)

  ipfs.once('stop', () => {
    clearInterval(pollInterval)
  })

  pollPeers()

  return emitter

  function pollPeers () {
    ipfs.pubsub.peers(topic, (err, _newPeers) => {
      if (err) {
        emitter.emit('error', err)
        return // early
      }

      const newPeers = _newPeers.sort()

      if (emitChanges(newPeers)) {
        peers = newPeers
      }
    })
  }

  function emitChanges (newPeers) {
    const differences = diff(peers, newPeers)

    differences.added.forEach((addedPeer) => emitter.emit('peerJoined', addedPeer))
    differences.removed.forEach((removedPeer) => emitter.emit('peerLeft', removedPeer))

    return differences.added.length > 0 || differences.removed.length > 0
  }

  function hasPeer (peer) {
    return peers.indexOf(peer) >= 0
  }
}
