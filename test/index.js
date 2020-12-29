// ---- imports for librarys ----
// tone is for audio playback in the browser
// scribbletune creates midi data
window.Tone = require('tone')
const Tone = window.Tone
const scribble = require('scribbletune')
const _ = require('lodash')

const playingClips = []

function playHash (text) {
  console.log(text)
  play4(text)
}

function play4 (MYHASH) {
  const MYHASHbin = hex2bin(MYHASH).slice(0, 64)
  const meta = MYHASHbin.slice(0, 10)
  const scalesTypes = [major, dorian, phrygian, lydian, mixlydian, minor, locrian, pentatonic]
  const scaleType = scalesTypes[parseInt(meta.slice(0, 3), 2)]
  const scale = getScale(2, scaleType).concat(getScale(3, scaleType)).concat(getScale(4, scaleType))

  // TODO hier fehlen 8 schlagzeugpattern (3bit von meta)

  // TODO hier fehlen 2 specials

  if (meta[8] === '0') {
    // sets the bpm clips should be played at
    Tone.Transport.bpm.value = 100
  } else {
    Tone.Transport.bpm.value = 150
  }

  const pattern = ['[x_x]', '[xx]', '[xxx]', 'x']
  // const pickedSpecial = _.sample(specialPatterns)
  // console.log(pickedSpecial)

  const melodySine = []
  let rhythmSine = ''
  const melodySaw = []
  let rhythmSaw = ''

  let currentNote = 'C3'
  if (meta[9] === '0') {
    melodySine.push(currentNote)
    rhythmSaw += '-'
    rhythmSine += 'x'
  } else {
    melodySaw.push(currentNote)
    rhythmSaw += 'x'
    rhythmSine += '-'
  }

  // TODO redundanten code aufräumen
  for (let i = 10; i < MYHASHbin.length; i += 6) {
    let step = parseInt(MYHASHbin[i + 1] + MYHASHbin[i + 2] + MYHASHbin[i + 3], 2)
    step = step - 4
    if (step === -4) {
      rhythmSine += '-'
      rhythmSaw += '-'
      continue
    } else {
      // FIXME vielleicht ist in die mitte springen schöner weil kein zurückspringen passieren kann
      currentNote = scale[mod(scale.indexOf(currentNote) + step, scale.length)]
    }
    const rhythmIndex = parseInt(MYHASHbin[i + 4] + MYHASHbin[i + 5], 2)
    const xAmount = char_count(pattern[rhythmIndex], 'x')

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

  console.log(parseInt(meta.slice(0, 3), 2))
  console.log(rhythmSine)
  console.log(melodySine)
  console.log(rhythmSaw)
  console.log(melodySaw)

  const sine = new Tone.Synth()
  sine.oscillator.type = 'sine'

  const clipSine = scribble.clip({
    synth: sine,
    notes: melodySine,
    pattern: rhythmSine
  })

  const saw = new Tone.Synth()
  saw.oscillator.type = 'sawtooth'
  saw.volume.value = -10

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

  playingClips.push(clipSaw, clipSine)

  // this line is required for the playback to work in browser
  Tone.context.resume().then(() => Tone.Transport.start())
}

function play3 (MYHASH) {
  const scale = getScale(4, blues2)
  console.log(scale)

  // FIXME parseint klaut führende Nullen
  const scaledHash = parseInt(MYHASH, 16).toString(scale.length)
  console.log(scaledHash)

  const patternCollection = ['[x_x]', '[x_x]', '[xxx]', '[xxx]', 'x', '-', '[--x]']

  let pattern = '[xxx]'
  for (let i = 0; i < 12 * 2 - 1; i++) {
    pattern += _.sample(patternCollection)
    console.log(pattern)
  }

  const melody = []
  for (const x of scaledHash) {
    melody.push(scale[parseInt(x, scale.length)])
  }

  const mySynth = new Tone.Synth()
  mySynth.oscillator.type = 'sine'

  const clip = scribble.clip({
    synth: mySynth,
    notes: melody,
    pattern
  })

  playingClips.push(clip)

  const clips = tsd()
  console.log(clips)
  clips[0].loop = false
  // clips[0].start()
  clips[1].loop = false
  // clips[1].start()

  // the clip keeps looping if this property isnt set
  clip.loop = false
  // starts the clip
  console.log(clip)
  clip.start()
  console.log(clip)


  // this line is required for the playback to work in browser
  Tone.context.resume().then(() => Tone.Transport.start())
}

function play2 (MYHASH) {
  const MYHASHbin = hex2bin(MYHASH)
  const scale = getScale(4, fournote)
  console.log(scale)

  const specialPatterns = ['[x_x]', '[xx]', '[xxx]', '[xxxx]', '[x-x-]', '[-x]', 'x', '[xxxxx]']
  const pickedSpecial = _.sample(specialPatterns)
  console.log(pickedSpecial)

  const melodySine = []
  let rhythmSine = ''
  const melodySaw = []
  let rhythmSaw = ''

  for (let i = 0; i < MYHASHbin.length / 4; i += 4) {
    if (MYHASHbin[i] === '0') {
      const index = parseInt(MYHASHbin[i + 1] + MYHASHbin[i + 2], 2)
      if (MYHASHbin[i + 3] === '0') {
        melodySine.push(scale[index])
        rhythmSine += 'x'
        rhythmSaw += '-'
      } else {
        melodySine.push(scale[index])
        melodySine.push(scale[index])
        rhythmSine += pickedSpecial
        rhythmSaw += '-'
      }
    } else {
      const index = parseInt(MYHASHbin[i + 1] + MYHASHbin[i + 2], 2)
      if (MYHASHbin[i + 3] === '0') {
        melodySaw.push(scale[index])
        rhythmSine += '-'
        rhythmSaw += 'x'
      } else {
        melodySaw.push(scale[index])
        melodySaw.push(scale[index])
        rhythmSine += '-'
        rhythmSaw += pickedSpecial
      }
    }
  }

  const sine = new Tone.Synth()
  sine.oscillator.type = 'sine'

  const clipSine = scribble.clip({
    synth: sine,
    notes: melodySine,
    pattern: rhythmSine
  })

  const saw = new Tone.Synth()
  saw.oscillator.type = 'sawtooth'
  saw.volume.value = -10

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

  playingClips.push(clipSaw, clipSine)

  // sets the bpm clips should be played at
  Tone.Transport.bpm.value = 100
  // this line is required for the playback to work in browser
  Tone.context.resume().then(() => Tone.Transport.start())
}

function play () {
  // ---- test values ----
  const MYHASH = '45c9a6614fccd4f9592d8283a4f25bff84076fd43ee9f90eaa07746ebbed02ca'
  const MYHASH2 = 'a11a198cc31b4b7c2f37013847b9c3ab35c8d24d4db2159b29d41a9296fc1a82'
  let index = 0

  const setOfNotes =
    getScale(3, dorian)
      .concat(getScale(4, dorian)) // or simply scribble.scale('C3 major') OR manually set the notes
      .concat([getScale(2, dorian)[0]])
      .concat([getScale(2, dorian)[1]])
  console.log(setOfNotes)
  const chordSize = 3
  const chordCount = Math.floor(MYHASH.length / chordSize)
  const lastChordSize = MYHASH.length % chordSize
  const notes = []

  // build all standard chords
  console.log(MYHASH.length)
  console.log('Set of Notes length: ' + setOfNotes.length)
  console.log(chordCount)
  for (let i = 0; i < chordCount; i++) {
    const myChord = []
    for (let j = 0; j < chordSize; j++) {
      myChord.push(setOfNotes[parseInt(MYHASH[index], 16)])
      index++
    }
    console.log(myChord)
    notes.push(myChord)
  }

  // build the last chord
  console.log(lastChordSize)
  if (lastChordSize !== 0) {
    const myLastChord = []
    for (let j = 0; j < lastChordSize; j++) {
      myLastChord.push(setOfNotes[parseInt(MYHASH[index], 16)])
      index++
    }

    // fix to have the right amount of notes in the chord -> Fill up with the last note until full
    index--
    for (let j = 0; j < chordSize - lastChordSize; j++) {
      myLastChord.push(setOfNotes[parseInt(MYHASH[index], 16)])
    }

    console.log(myLastChord)
    notes.push(myLastChord)
  }

  // rhythm
  let pattern = ''
  let count = 1
  for (const x of MYHASH) {
    if (count === chordSize) {
      pattern = pattern + getRhythm(x)
      count = 1
    } else {
      count++
    }
  }

  const clip = scribble.clip({
    synth: 'PolySynth',
    notes,
    pattern
  })

  // the clip keeps looping if this property isnt set
  clip.loop = false
  // starts the clip
  clip.start()
  console.log(clip)

  // sets the bpm clips should be played at
  Tone.Transport.bpm.value = 120
  // this line is required for the playback to work in browser
  Tone.context.resume().then(() => Tone.Transport.start())
}

// function to get a rhythm for a given value
function getRhythm (x) {
  return 'x'
  // x = parseInt(x, 16)
  // x = Math.floor(x / 4)
  // switch (x) {
  //   case 0:
  //     return 'xxxx'
  //   case 1:
  //     return 'x_[xx]x'
  //   case 2:
  //     return 'x__[xxx]'
  //   case 3:
  //     return '[[xx]-[xx]-]'
  // }
}

// ---- scales used to pick notes ----
//                 0    1     2     3     4    5     6    7    8     9    10    11
const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const major = [0, 2, 4, 5, 7, 9, 11]
const dorian = [0, 2, 3, 5, 7, 9, 10]
const phrygian = [0, 1, 3, 5, 7, 8, 10]
const lydian = [0, 2, 4, 6, 7, 9, 11]
const mixlydian = [0, 2, 4, 5, 7, 9, 10]
const minor = [0, 2, 3, 5, 7, 8, 10]
const locrian = [0, 1, 3, 5, 6, 8, 10]
const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const pentatonic = [0, 2, 4, 7, 9]
const blues1 = [0, 3, 5, 7, 10]
const blues2 = [0, 3, 5, 6, 7, 10]
const tonic = [0, 5, 7]
const subdominant = [5, 0, 2]
const dominant = [7, 2, 4]
const fournote = [0, 3, 5, 7]

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

function tsd () {
  const scaleTonic = getScale(3, tonic)
  const scaleSubdominant = getScale(3, subdominant)
  const scaleDominant = getScale(3, dominant)
  const pattern = 'xxx-'.repeat(12)
  let notes1 = []
  let notes2 = []

  let result = tsdHelp(scaleTonic, 2)
  notes1 = notes1.concat(result[0])
  notes2 = notes2.concat(result[1])
  result = tsdHelp(scaleSubdominant, 2)
  notes1 = notes1.concat(result[0])
  notes2 = notes2.concat(result[1])
  result = tsdHelp(scaleTonic, 2)
  notes1 = notes1.concat(result[0])
  notes2 = notes2.concat(result[1])
  result = tsdHelp(scaleDominant, 1)
  notes1 = notes1.concat(result[0])
  notes2 = notes2.concat(result[1])
  result = tsdHelp(scaleSubdominant, 1)
  notes1 = notes1.concat(result[0])
  notes2 = notes2.concat(result[1])
  result = tsdHelp(scaleTonic, 2)
  notes1 = notes1.concat(result[0])
  notes2 = notes2.concat(result[1])

  const clip1 = scribble.clip({
    synth: 'PolySynth',
    notes: notes1,
    pattern
  })

  const clip2 = scribble.clip({
    synth: 'PolySynth',
    notes: notes2,
    pattern
  })
  return [clip1, clip2]
}

function tsdHelp (scaleAny, amount) {
  const notes1 = []
  const notes2 = []
  for (let i = 0; i < amount; i++) {
    notes1.push(scaleAny[0])
    notes2.push(scaleAny[1])
    notes1.push(scaleAny[0])
    notes2.push(scaleAny[2])
    notes1.push(scaleAny[0])
    notes2.push(scaleAny[1])
  }
  return [notes1, notes2]
}

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

function stop () {
  for (const x of playingClips) {
    x.stop()
  }
  Tone.context.resume().then(() => Tone.Transport.stop())
}

function mod (v, m) {
  console.log(v + " mod " + m)
  const temp = v % m
  console.log(temp)
  if (temp < 0) {
    console.log("returning " + (m - temp))
    return (m + temp)
  } else {
    console.log("returning " + temp)
    return temp
  }
}

function char_count (str, letter) {
  var letter_Count = 0;
  for (var position = 0; position < str.length; position++) {
    if (str.charAt(position) == letter) {
      letter_Count += 1;
    }
  }
  return letter_Count;
}
