const player = require('./player.js')

// map to hold current certificate info for each url
var map = new Map()

console.log('\n\nTLS browser extension loaded')

// https://developer.chrome.com/extensions/match_patterns
// TODO check if this is required
var ALL_SITES = { urls: ['<all_urls>'] }

// Mozilla doesn't use tlsInfo in extraInfoSpec
// TODO check if this is required
var extraInfoSpec = ['blocking']

// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
browser.webRequest.onHeadersReceived.addListener(async function (details) {
  // log(`\n\nGot a request for ${details.url} with ID ${details.requestId}`)

  // Yeah this is a String, even though the content is a Number
  var requestId = details.requestId

  var securityInfo = await browser.webRequest.getSecurityInfo(requestId, {
    certificateChain: true,
    rawDER: false
  })

  // log('Details: ' + details)

  map.set(details.url, securityInfo)
  //log(`securityInfo: ${JSON.stringify(securityInfo, null, 2)}`)
}, ALL_SITES, extraInfoSpec)

browser.runtime.onMessage.addListener(
  // cant be async https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage
  (data, sender) => {
    console.log('got a message')
    if (data.command === 'play') {
      player.stop()
      const rv = play(data)
      console.log('rv: ' + rv)
      return Promise.resolve(rv)
    } else if (data.command === 'stop') {
      player.stop()
      return Promise.resolve({ message: 'Any playback was stopped.' })
    } else {
      return Promise.resolve({ message: 'Unknown command.' })
    }
  }
)

function play (data) {
  // TODO test ob das promiseRevolve hier gebraucht wird
  return Promise.resolve(browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    // get the url of the currently visible tab
    const url = tabs[0].url
    if (url === undefined || map.get(url) === undefined) {
      return { message: 'Please reload the site or try another one to listen to the Fingerprint.' }
    }

    // if any playback is running it needs to be stopped first
    player.stop()
    // start the new player
    const hash = map.get(url).certificates[0].fingerprint.sha256.replaceAll(':', '')
    player.playHash(hash, parseInt(data.playVersion), parseInt(data.volume), parseInt(data.part))
    return { message: 'Playing Certificate:\n' + JSON.stringify(map.get(url).certificates[0]) }
  }))
}

// TODO setInterval for deleting old entrys in the map to save resources
