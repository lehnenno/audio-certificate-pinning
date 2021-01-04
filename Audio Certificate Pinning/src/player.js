// ---- imports for librarys ----
// tone is for audio playback in the browser
// scribbletune creates midi data
console.log('player.js loading') // just to check the import works
window.Tone = require('tone')
const scribble = require('scribbletune')

module.exports = {
  playHash: playHash,
  stop: stop
}

// some constants
const sineVolume = -5
const beatVolume1 = -20
const beatVolume2 = -10
const sawtoothVolume = -15

// beat file buffers
const kick = new Tone.Player(browser.extension.getURL('resources/kick.wav')).toDestination();
const bass = new Tone.Player(browser.extension.getURL('resources/bass.wav')).toDestination();
const ch = new Tone.Player(browser.extension.getURL('resources/ch.wav')).toDestination();
const oh = new Tone.Player(browser.extension.getURL('resources/oh.wav')).toDestination();
const snare = new Tone.Player(browser.extension.getURL('resources/snare.wav')).toDestination();

// stores the currently playing clips so they can be stopped if requested
const playingClips = []

// hash should be a 256bit hash as hex. part decides which 64bits are gonna be processed
function playHash (hash, playVersion, volume, part) {
  // console.log('play called with ' + hash + ' ' + playVersion + ' ' + volume)
  const partialHash = getPartialHash(hash, part)
  switch (playVersion) {
    case 1:
      play5(partialHash, volume)
      break
    case 2:
      play4(partialHash, volume)
      break
  }
}

function getPartialHash (hash, part) {
  switch (part) {
    case 1:
      return hash.slice(0, 16)
    case 2:
      return hash.slice(16, 32)
    case 3:
      return hash.slice(32, 48)
    case 4:
      return hash.slice(48, 64)
  }
}

function stop () {
  //console.log('stop called!')
  for (const x of playingClips) {
    x.stop()
  }
  Tone.context.resume().then(() => Tone.Transport.stop())
}

// MYHASH is 64bit as hex 
function play5 (MYHASH, volume) {
  const scale = getScale(4, pentatonic).concat(getScale(5, pentatonic)).slice(0, 8)
  // console.log(scale)
  const basenote = 'F4'

  const melody = [basenote]
  let rhythm = 'x'
  let beat = '[x-]'

  for (const hexValue of MYHASH) {
    melody.push(pickNote(hexValue, scale))
    rhythm += 'x'
    beat += pickBeat(hexValue)
  }
  // console.log(beat)
  // console.log(melody)


  const sine = getSynth('sine', sineVolume + volume)

  const melodyclip = scribble.clip({
    synth: sine,
    notes: melody,
    pattern: rhythm
  })

  const sawtooth = getSynth('sawtooth', beatVolume1 + volume)

  const beatclip = scribble.clip({
    pattern: beat,
    notes: ['F2'],
    synth: sawtooth
  })

  melodyclip.loop = false
  beatclip.loop = false
  melodyclip.start()
  beatclip.start()
  playingClips.push(melodyclip, beatclip)

  Tone.Transport.bpm.value = 120
  // this line is required for the playback to work in browser
  Tone.context.resume().then(() => Tone.Transport.start())
}

function pickNote (hexValue, scale) {
  if (scale.length !== 8) {
    throw Error('scale must have a length of 8')
  }
  return scale[Math.floor(parseInt(hexValue, 16) / 2)]
}

function pickBeat (hexValue) {
  if (parseInt(hexValue, 16) % 2 === 0) {
    return '[x-]'
  } else {
    return '[-x]'
  }
}

function play4 (MYHASH, volume) {
  const MYHASHbin = hex2bin(MYHASH)
  const meta = MYHASHbin.slice(0, 10)

  const scalesTypes = [major, ganzton, phrygian, ungarisch, blues2, minor, septakkord, pentatonic]
  const scaleType = scalesTypes[parseInt(meta.slice(0, 3), 2)]
  const scale = getScale(3, scaleType).concat(getScale(4, scaleType))//.concat(getScale(5, scaleType))
  const basetone = 'C4'

  // schlagzeug (5bit von meta)
  // Adaptiert von https://scribbletune.com/examples/beat
  if (meta[3] === '1') {
    const clip = getBeatClip(kick, '-' + 'x'.repeat(9), volume)
    clip.start()
    playingClips.push(clip)
  }
  if (meta[4] === '1') {
    const clip = getBeatClip(bass, '-' + '[-x]'.repeat(9), volume)
    clip.start()
    playingClips.push(clip)
  }
  if (meta[5] === '1') {
    const clip = getBeatClip(ch, '-' + '[xx][xx][xx]'.repeat(3), volume)
    clip.start()
    playingClips.push(clip)
  }
  if (meta[6] === '1') {
    const clip = getBeatClip(oh, '-' + '-[--xx][xxxx]'.repeat(3), volume)
    clip.start()
    playingClips.push(clip)
  }
  if (meta[7] === '1') {
    const clip = getBeatClip(snare, '-' + '-x'.repeat(4), volume + 10) // snare needs some extra volume
    clip.start()
    playingClips.push(clip)
  }

  // sets the bpm the clips should be played at
  if (meta[8] === '0') {
    Tone.Transport.bpm.value = 80
  } else {
    Tone.Transport.bpm.value = 110
  }

  // The used rhytm Patterns
  const pattern = ['[xx_x]', '[x[xx]]', 'x', '[[xx]x]']

  const melodySine = []
  let rhythmSine = ''
  const melodySaw = []
  let rhythmSaw = ''

  let currentNote = basetone
  // decide which synth should play the first note
  if (meta[9] === '0') {
    melodySine.push(currentNote)
    rhythmSaw += '-'
    rhythmSine += 'x'
  } else {
    melodySaw.push(currentNote)
    rhythmSaw += 'x'
    rhythmSine += '-'
  }

  // iterate over 6bits at a time
  for (let i = 10; i < MYHASHbin.length; i += 6) {
    // get the steps that we should go on the scale -3 to 3
    let step = parseInt(MYHASHbin[i + 1] + MYHASHbin[i + 2] + MYHASHbin[i + 3], 2)
    step = step - 4
    if (step === -4) {
      // if step is -4 play a break
      rhythmSine += '-'
      rhythmSaw += '-'
      continue
    } else {
      // if scale runs out of notes on the bottom or top - jump back to the basenote (and go the remaining steps)
      // else go the steps on the scale
      if (scale.indexOf(currentNote) + step < 0 || scale.indexOf(currentNote) + step >= scale.length) {
        const newstep = (scale.indexOf(currentNote) + step) % scale.length
        currentNote = scale[scale.indexOf(basetone) + newstep]
      } else {
        currentNote = scale[scale.indexOf(currentNote) + step]
      }
    }

    // get the index that is used to determin the rhythm pattern for the current note
    const rhythmIndex = parseInt(MYHASHbin[i + 4] + MYHASHbin[i + 5], 2)
    const xAmount = charCount(pattern[rhythmIndex], 'x')

    // if-else decides what synth/instrument should play the current note
    // for loop adds the amount of notes required for the corresponding rhythm pattern
    if (MYHASHbin[i] === '0') {
      for (let i = 0; i < xAmount; i++) {
        melodySine.push(currentNote)
      }
      rhythmSine += pattern[rhythmIndex]
      rhythmSaw += '-'
    } else {
      for (let i = 0; i < xAmount; i++) {
        melodySaw.push(currentNote)
      }
      rhythmSine += '-'
      rhythmSaw += pattern[rhythmIndex]
    }
  }

  // console.log(parseInt(meta.slice(0, 3), 2))
  // console.log(rhythmSine)
  // console.log(melodySine)
  // console.log(rhythmSaw)
  // console.log(melodySaw)

  const sine = getSynth('sine', sineVolume + volume)

  const clipSine = scribble.clip({
    synth: sine,
    notes: melodySine,
    pattern: rhythmSine
  })

  const saw = getSynth('sawtooth', sawtoothVolume + volume)

  const clipSaw = scribble.clip({
    synth: saw,
    notes: melodySaw,
    pattern: rhythmSaw
  })

  // the clip keeps looping if this property isnt set
  clipSine.loop = false
  clipSaw.loop = false
  // starts the clip
  clipSine.start()
  clipSaw.start()

  // add the clips to the list so they can be stopped
  playingClips.push(clipSaw, clipSine)

  // this line is required for the playback to work in browser
  Tone.context.resume().then(() => Tone.Transport.start())
}

// ---- scales used to pick notes ----
//                 0    1     2     3     4    5     6    7    8     9    10    11
const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const major = [0, 2, 4, 5, 7, 9, 11]
// const dorian = [0, 2, 3, 5, 7, 9, 10]
const phrygian = [0, 1, 3, 5, 7, 8, 10]
// const lydian = [0, 2, 4, 6, 7, 9, 11]
// const mixlydian = [0, 2, 4, 5, 7, 9, 10]
const minor = [0, 2, 3, 5, 7, 8, 10]
// const locrian = [0, 1, 3, 5, 6, 8, 10]
const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const pentatonic = [0, 2, 4, 7, 9]
// const blues1 = [0, 3, 5, 7, 10]
const blues2 = [0, 3, 5, 6, 7, 10]
// const tonic = [0, 5, 7]
// const subdominant = [5, 0, 2]
// const dominant = [7, 2, 4]
// const fournote = [0, 3, 5, 7]
const ungarisch = [0, 2, 3, 6, 7, 8, 11]
// const moll1 = [0, 2, 3, 5, 7]
// const moll2 = [0, 2, 3, 5, 7, 8]
const ganzton = [0, 2, 4, 6, 8, 10]
// const harmonischmoll = [0, 2, 3, 5, 7, 8, 11]
// const melodischMoll = [0, 2, 3, 5, 7, 9, 10]
// const arabisch = [0, 1, 4, 5, 7, 8, 11]
const septakkord = [0, 4, 7, 10]

// function to get the scales in the specified pitch
function getScale (pitch, indices) {
  const scale = []
  let index = 0
  for (const note of chromatic) {
    if (indices.includes(index)) {
      scale.push(note + pitch)
    }
    index++
  }
  return scale
}

//
function hex2bin (hex) {
  hex = hex.replace('0x', '').toLowerCase()
  var out = ''
  for (var c of hex) {
    switch (c) {
      case '0': out += '0000'; break
      case '1': out += '0001'; break
      case '2': out += '0010'; break
      case '3': out += '0011'; break
      case '4': out += '0100'; break
      case '5': out += '0101'; break
      case '6': out += '0110'; break
      case '7': out += '0111'; break
      case '8': out += '1000'; break
      case '9': out += '1001'; break
      case 'a': out += '1010'; break
      case 'b': out += '1011'; break
      case 'c': out += '1100'; break
      case 'd': out += '1101'; break
      case 'e': out += '1110'; break
      case 'f': out += '1111'; break
      default: return ''
    }
  }

  return out
}

// counts the number of occurences of letter in str
function charCount (str, letter) {
  var letterCount = 0
  for (var position = 0; position < str.length; position++) {
    if (str.charAt(position) === letter) {
      letterCount += 1
    }
  }
  return letterCount
}

// prepares a Tone.js Synth
function getSynth (type, volume) {
  const synth = new Tone.Synth()
  synth.oscillator.type = type
  synth.volume.value = volume
  return synth
}

// returns a clip using the given parameters
function getBeatClip (player, pattern, volume) {
  player.volume.value = volume + beatVolume2

  clip = scribble.clip({
    pattern: pattern,
    player: player
  })

  clip.loop = false
  return clip
}