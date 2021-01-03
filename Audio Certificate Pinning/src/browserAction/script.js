const output = document.getElementById('output')
const playButtons = document.getElementsByName('playButton')
const stopButton = document.getElementById('stopButton')
const volumeSlider = document.getElementById('volumeSlider')
const playVersionRadio = document.getElementsByName('playVersion')
const storage = browser.storage.local

initVolume()

stopButton.addEventListener("click", stop)
for(const playButton of playButtons) {
  playButton.addEventListener("click", play)
}
volumeSlider.addEventListener("change", volume)

// function to stop any playback called by button
async function stop () {
  // sends a message to the background script
  const response = await browser.runtime.sendMessage({
    command: 'stop'
  })

  output.innerText = response.message
}

async function play (event) {
  // sends a message to the background script
  const response = await browser.runtime.sendMessage({
    command: 'play',
    playVersion: getPlayVersion(),
    volume: await storage.get('volume').then(result => result.volume),
    part: event.target.value
  })

  output.innerText = response.message
}

async function volume (event) {
  // set the volume value to local storage for the play function to use and to make the information persitent
  storage.set({ volume: event.target.value })
}

async function initVolume () {
  let volume = await storage.get('volume').then(result => result.volume)
  if (volume) {
    volumeSlider.value = volume
  } else {
    // set volume value on first load
    storage.set({ volume: 0 })
  }
}

function getPlayVersion () {
  for (i = 0; i < playVersionRadio.length; i++) {
    if (playVersionRadio[i].checked) {
      return playVersionRadio[i].value
    }
  }
}