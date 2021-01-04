const player = require('./player.js')

// map to hold current certificate info for each url
var map = new Map()

console.log('\n\nTLS browser extension loaded') // just an output to check things are working

// https://developer.chrome.com/extensions/match_patterns
// we want to save the certificates for all urls
var ALL_SITES = { urls: ['<all_urls>'] }

// If you use "blocking", you must have the "webRequestBlocking" API permission in your manifest.json
// required for webRequest.getSecurityInfo()
var extraInfoSpec = ['blocking']

// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
browser.webRequest.onHeadersReceived.addListener(async function (details) {
  var requestId = details.requestId

  var securityInfo = await browser.webRequest.getSecurityInfo(requestId, {
    certificateChain: true,
    rawDER: false
  })

  securityInfo.timestamp = Date.now()

  map.set(details.url, securityInfo)
  //log(`securityInfo: ${JSON.stringify(securityInfo, null, 2)}`)
}, ALL_SITES, extraInfoSpec)

browser.runtime.onMessage.addListener(
  // cant be async https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
  (data, sender) => {
    if (data.command === 'play') {
      player.stop()
      const rv = play(data)
      return Promise.resolve(rv)
    } else if (data.command === 'stop') {
      player.stop()
      return Promise.resolve({ message: 'Any playback was stopped.' })
    } else {
      return Promise.resolve({ message: 'Unknown command.' })
    }
  }
)

function play(data) {
  return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    // get the url of the currently visible tab
    const url = tabs[0].url
    if (url === undefined || map.get(url) === undefined) {
      return { message: 'Please reload the site or try another one to listen to the Fingerprint.' }
    }

    if (map.get(url).certificates === undefined) {
      return { message: 'Seems like this site doesn\'t use SSL/TLS. There is nothing to play here.' }
    }

    // if any playback is running it needs to be stopped first
    player.stop()
    // start the new player
    const hash = map.get(url).certificates[0].fingerprint.sha256.replaceAll(':', '')
    player.playHash(hash, parseInt(data.playVersion), parseInt(data.volume), parseInt(data.part))
    return { message: 'Playing Certificate:\n' + JSON.stringify(map.get(url).certificates[0]) }
  })
}

// delete old entrys from the map
// check every minute
setInterval(checkOldMapEntrys,60*1000)

function checkOldMapEntrys() {
  map.forEach( (value, key, map) => {
    // if the entry is older than 5mins delete it
    if(Date.now()-value.timestamp > 300*1000) {
      map.delete(key)
    }
  })
}