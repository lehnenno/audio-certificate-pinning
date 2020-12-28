// Put all the javascript code here, that you want to execute in background.

// const Tone = require('tone')
// window.Tone = Tone
// const scribble = require('scribbletune')

// Tone.context.resume().then(() => Tone.Transport.start())

// scribble
//   .clip({
//     instrument: 'Synth',
//     pattern: 'xx[xx]-',
//     notes: 'C3 Cm-3'
//   })
//   .start()

var log = console.log.bind(console)

log(`\n\nTLS browser extension loaded`)

// https://developer.chrome.com/extensions/match_patterns
var ALL_SITES = { urls: ['<all_urls>'] }

// Mozilla doesn't use tlsInfo in extraInfoSpec 
var extraInfoSpec = ['blocking'];

// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onHeadersReceived
browser.webRequest.onHeadersReceived.addListener(async function (details) {
  log(`\n\nGot a request for ${details.url} with ID ${details.requestId}`)

  // Yeah this is a String, even though the content is a Number
  var requestId = details.requestId

  var securityInfo = await browser.webRequest.getSecurityInfo(requestId, {
    certificateChain: true,
    rawDER: false
  })

  log(`securityInfo: ${JSON.stringify(securityInfo, null, 2)}`)

}, ALL_SITES, extraInfoSpec)

log('Added listener')
