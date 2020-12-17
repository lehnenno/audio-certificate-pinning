// Put all the javascript code here, that you want to execute in background.

window.Tone = require('tone')
const scribble = require('scribbletune')

Tone.context.resume().then(() => Tone.Transport.start())

scribble.clip({
  instrument: 'PolySynth', // new property: synth
  pattern: '[xx]',
  notes: 'C4 D4 C4 D#4 C4 D4 C4 Bb3'
}).start()
