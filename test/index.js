// ---- imports for librarys ----
// tone is for audio playback in the browser
// scribbletune creates midi data
window.Tone = require('tone')
const scribble = require('scribbletune')

onload = function () {
  // ---- test values ----
  const MYHASH = '45c9a6614fccd4f9592d8283a4f25bff84076fd43ee9f90eaa07746ebbed02ca'
  const MYHASH2 = 'a11a198cc31b4b7c2f37013847b9c3ab35c8d24d4db2159b29d41a9296fc1a82'
  let index = 0

  const setOfNotes =
    getScale(3, mixlydian)
      .concat(getScale(4, mixlydian)) // or simply scribble.scale('C3 major') OR manually set the notes
      .concat([getScale(2, mixlydian)[0]])
      .concat([getScale(2, mixlydian)[1]])
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
  for (let x of MYHASH) {
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
const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const major = [0, 2, 4, 5, 7, 9, 11]
const dorian = [0, 2, 3, 5, 7, 9, 10]
const phrygian = [0, 1, 3, 5, 7, 8, 10]
const lydian = [0, 2, 4, 6, 7, 9, 11]
const mixlydian = [0, 2, 4, 5, 7, 9, 10]
const minor = [0, 2, 3, 5, 7, 8, 10]
const locrian = [0, 1, 3, 5, 6, 8, 10]
const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

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