import { isBrowser } from '@/utils'
import { getOctave } from '../theory'

// convert a MIDI.js javascript soundfont file to json
async function parseMidiJsSoundfont(text: string): Promise<{ [key: string]: AudioBuffer }> {
  var begin = text.indexOf('MIDI.Soundfont.')
  if (begin < 0) throw Error('Invalid MIDI.js Soundfont format:')
  begin = text.indexOf('=', begin) + 2
  var end = text.lastIndexOf(',')
  let json: { [key: string]: string } = JSON.parse(text.slice(begin, end) + '}')

  const audioBufferPromises = Object.entries(json).map(async ([key, dataUri]) => {
    const base64 = dataUri.slice(dataUri.indexOf(',') + 1)
    const arrayBuf = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer
    const audioBuf = decodeAudio(arrayBuf)
    return [key, await audioBuf]
  })
  const audioBuffers = await Promise.all(audioBufferPromises)
  return Object.fromEntries(audioBuffers)
}

// Makes a promise version that is compatible with Safari.
// For now, Safari only understands callback version.
function decodeAudio(arrayBuf: ArrayBuffer) {
  return new Promise((res, rej) => {
    getAudioContext().decodeAudioData(arrayBuf, res, rej)
  })
}

let AudioContext: AudioContext
function getAudioContext() {
  if (AudioContext === undefined) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    AudioContext = new AC()
  }
  return AudioContext
}

// The sound fonts need the key in C Major with only flat accidentals.
// No sharps.
function getKeyForSoundfont(note: number) {
  const soundFontIndex = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  return soundFontIndex[note % 12] + getOctave(note)
}

if (isBrowser()) {
  // iOS 6-8 for touchstart, iOS 9+ for touchend
  document.addEventListener('touchstart', iOSAudioContextFix)
  document.addEventListener('touchend', iOSAudioContextFix)
}

// iOS AC won't allow audio to play on a page unless it was created from a touch event.
function iOSAudioContextFix() {
  const audioContext = getAudioContext()
  if (!audioContext) {
    return
  }

  // Creates an empty buffer and plays it.
  var buffer = audioContext.createBuffer(1, 1, 22050)
  var source = audioContext.createBufferSource()
  source.buffer = buffer
  source.connect(audioContext.destination)

  if (source.start) {
    source.start(0)
  } else if ((source as any).play) {
    ;(source as any).play(0)
  } else if ((source as any).noteOn) {
    ;(source as any).noteOn(0)
  }

  // Remove events
  document.removeEventListener('touchstart', iOSAudioContextFix)
  document.removeEventListener('touchend', iOSAudioContextFix)
}

export { getAudioContext, parseMidiJsSoundfont, getKeyForSoundfont }
