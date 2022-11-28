import { parseMidiFile, MidiEvent } from '@sightread/jasmid.ts'
// Since this is called from Deno as well, we need to use relative paths.
import type { Song, SongMeasure, SongNote, Tracks, Bpm } from '../../../src/types'
import type { NoteKey } from './types'
import { getKeySignatureFromMidi, KEY_SIGNATURE } from '../theory'
import { gmInstruments } from '../synth'

export default function parseMidi(midiData: ArrayBuffer): Song {
  const parsed = parseMidiFile(midiData)

  const bpms: Array<Bpm> = []
  var ticksPerBeat = parsed.header.ticksPerBeat

  let currTime = 0
  let currTick = 0
  let tracks: Tracks = {}
  let openNotes: Map<NoteKey, SongNote> = new Map() // notes still "on"
  let notes: SongNote[] = []
  let measures: SongMeasure[] = []
  let lastMeasureTickedAt = -Infinity
  let timeSignature = { numerator: 4, denominator: 4 }
  let keySignature: KEY_SIGNATURE = 'C'
  const ticksPerMeasure = () =>
    ticksPerBeat * (timeSignature.numerator / timeSignature.denominator) * 4

  function calcWallDuration(ticks: number): number {
    const bpm = bpms[bpms.length - 1]?.bpm ?? 120
    return (ticks * 60) / (ticksPerBeat * bpm)
  }

  let orderedEvents = getOrderedMidiEvents(parsed)
  for (let orderedEvent of orderedEvents) {
    const midiEvent: MidiEvent = orderedEvent.event
    const track: number = orderedEvent.track
    const noteKey = (num: number): NoteKey => `${track}-${num}` as unknown as NoteKey

    currTick += orderedEvent.ticksToEvent
    currTime += calcWallDuration(orderedEvent.ticksToEvent)

    // Important to ensure ticks occur before the next event. Esp so we don't record a measure before processing meta events.
    const hasSongHadNotes =
      orderedEvent.ticksToEvent > 0 || midiEvent.subType == 'noteOn' || notes.length > 0
    if (hasSongHadNotes && currTick - lastMeasureTickedAt >= ticksPerMeasure()) {
      lastMeasureTickedAt = currTick
      measures.push({
        type: 'measure',
        time: currTime,
        number: measures.length,
        duration: calcWallDuration(ticksPerMeasure()),
      })
    }

    if (!tracks[track]) {
      tracks[track] = {}
    }

    if (midiEvent.subType === 'instrumentName') {
      const instrument = midiEvent.text
      tracks[track].instrument = instrument
      if (!tracks[track].program && inferProgram(instrument) !== -1) {
        tracks[track].program = inferProgram(instrument)
      }
    } else if (midiEvent.subType === 'trackName') {
      const trackName = midiEvent.text
      tracks[track].name = trackName
      if (!tracks[track].program && inferProgram(trackName) !== -1) {
        tracks[track].program = inferProgram(trackName)
      }
    } else if (midiEvent.subType === 'programChange') {
      tracks[track].program = midiEvent.program
    } else if (midiEvent.subType === 'noteOn') {
      const midiNote = midiEvent.note
      if (openNotes.has(noteKey(midiNote))) {
        const note = openNotes.get(noteKey(midiNote))!
        note.duration = calcWallDuration(note.duration)
        openNotes.delete(noteKey(midiNote))
      }

      const note: SongNote = {
        type: 'note',
        time: currTime,
        duration: 0,
        midiNote,
        track,
        velocity: midiEvent.velocity,
        measure: measures.length,
      }
      openNotes.set(noteKey(midiNote), note)
      notes.push(note)
    } else if (midiEvent.subType === 'noteOff') {
      const midiNote = midiEvent.note
      if (openNotes.has(noteKey(midiNote))) {
        const note = openNotes.get(noteKey(midiNote))!
        note.duration = currTime - note.time
        openNotes.delete(noteKey(midiNote))
      }
    } else if (midiEvent.subType === 'setTempo') {
      const bpm = Math.round(60000000 / midiEvent.microsecondsPerBeat)
      bpms.push({ time: currTime, bpm })
    } else if (midiEvent.subType === 'timeSignature') {
      timeSignature = midiEvent
    } else if (midiEvent.subType === 'keySignature') {
      // TODO: also do something with the scale?
      keySignature = getKeySignatureFromMidi(midiEvent.key, midiEvent.scale)
    }
  }

  // TODO: evaluate if this is necessary.
  for (let t of Object.keys(tracks).map(Number)) {
    // Remove empty tracks.
    if (notes.filter((n) => n.track === t).length === 0) {
      delete tracks[t]
    }
  }

  notes = sort(notes)
  measures = sort(measures)
  const duration = measures.reduce((sum, m) => sum + m.duration, 0)

  return {
    duration,
    measures,
    notes,
    tracks,
    bpms,
    timeSignature,
    keySignature,
    items: sort([...measures, ...notes]),
  }
}

function sort<T extends { time: number }>(arr: T[]): T[] {
  return arr.sort((i1, i2) => i1.time - i2.time)
}

function inferProgram(instrumentName: string): number {
  // TODO: match against simplified versions of all the GM Instruments.
  // E.g. Piano / Drums vs. "Acoustic Grand" etc.
  if (instrumentName.toLowerCase().includes('piano')) {
    return 1
  }
  if (instrumentName.toLowerCase().includes('drum')) {
    return gmInstruments.findIndex((i) => i === 'melodic_tom')
  }
  return -1
}

function getOrderedMidiEvents(parsed: any) {
  var trackStates: any = []
  for (var i = 0; i < parsed.tracks.length; i++) {
    trackStates[i] = {
      nextEventIndex: 0,
      ticksToNextEvent: parsed.tracks[i].length ? parsed.tracks[i][0].deltaTime : null,
    }
  }

  function getNextEvent() {
    var ticksToNextEvent: any = null
    var nextEventTrack: any = null
    var nextEventIndex: any = null
    let nextEventInfo: any

    for (let i = 0; i < trackStates.length; i++) {
      if (
        trackStates[i].ticksToNextEvent != null &&
        (ticksToNextEvent === null || trackStates[i].ticksToNextEvent < ticksToNextEvent)
      ) {
        ticksToNextEvent = trackStates[i].ticksToNextEvent
        nextEventTrack = i
        nextEventIndex = trackStates[i].nextEventIndex
      }
    }
    if (nextEventTrack != null) {
      /* consume event from that track */
      var nextEvent = parsed.tracks[nextEventTrack][nextEventIndex]
      if (parsed.tracks[nextEventTrack][nextEventIndex + 1]) {
        trackStates[nextEventTrack].ticksToNextEvent +=
          parsed.tracks[nextEventTrack][nextEventIndex + 1].deltaTime
      } else {
        trackStates[nextEventTrack].ticksToNextEvent = null
      }
      trackStates[nextEventTrack].nextEventIndex += 1
      /* advance timings on all tracks by ticksToNextEvent */
      for (let i = 0; i < trackStates.length; i++) {
        if (trackStates[i].ticksToNextEvent != null) {
          trackStates[i].ticksToNextEvent -= ticksToNextEvent
        }
      }
      nextEventInfo = {
        ticksToEvent: ticksToNextEvent,
        event: nextEvent,
        track: nextEventTrack,
      }
    } else {
      nextEventInfo = null
    }
    return nextEventInfo
  }

  let orderedEvents = []
  let nextEvent = getNextEvent()
  while (nextEvent) {
    orderedEvents.push(nextEvent)
    nextEvent = getNextEvent()
  }
  return orderedEvents
}
