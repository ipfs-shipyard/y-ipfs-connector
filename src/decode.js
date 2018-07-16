'use strict'

module.exports = (data) => {
  const str = data.toString()

  let json

  try {
    json = JSON.parse(str)
  } catch (err) {
    console.error('Failed parsing', str)
    throw err
  }

  return json
}
