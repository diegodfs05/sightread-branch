// TODO: handle when users don't have an AudioContext supporting browser
import { SongNote, Song, SongConfig, SongMeasure } from '@/types'
import { InstrumentName } from '@/features/synth'
import { getHands } from '@/utils'
import { getSynth, Synth } from '../synth'
import midi from '../midi'

let player: Player

export type PlayerState = 'CannotPlay' | 'Playing' | 'Paused'
class Player {
  state: PlayerState = 'CannotPlay'
  song!: Song
  playInterval: any = null
  currentSongTime = 0
  // right now assuming bpm means quarter notes per minute
  currentBpm = 0
  currentIndex = 0
  lastIntervalFiredTime = 0
  playing: Array<SongNote> = []
  synths: Array<Synth> = []
  volume = 1
  handlers: any = {}
  bpmModifier = 1
  range: null | [number, number] = null
  hand = 'both'
  listeners: Array<Function> = []
  wait = false
  lastPressedKeys = new Map<number, number>()
  songHands: { left?: number; right?: number } = {}

  static player(): Player {
    if (!player) {
      player = new Player()
    }
    return player
  }

  setWait(wait: boolean) {
    this.wait = wait
  }

  isPlaying() {
    return this.state === 'Playing'
  }

  init(): void {
    this.currentBpm = 0
    this.bpmModifier = 1
    this.currentSongTime = 0
    this.currentIndex = 0
    this.currentSongTime = 0
    this.playing = []
  }

  async setSong(song: Song, songConfig: SongConfig) {
    this.song = song
    this.songHands = getHands(songConfig)
    this.reset_()
    this.state = 'CannotPlay'
    this.notify()

    const synths: Promise<Synth>[] = []
    Object.entries(song.tracks).forEach(async ([trackId, config]) => {
      const instrument =
        songConfig.tracks[+trackId]?.instrument ?? config.program ?? config.instrument ?? 0
      synths[+trackId] = getSynth(instrument)
      const vol = songConfig.tracks[+trackId]?.sound ? 1 : 0
      this.setTrackVolume(+trackId, vol)
    })
    await Promise.all(synths).then((s) => {
      this.synths = s
      this.state = 'Paused'
      this.notify()
    })
  }

  setVolume(vol: number) {
    this.synths?.forEach((synth) => {
      synth?.setMasterVolume(vol)
    })
  }

  setTrackVolume(track: number | string, vol: number) {
    this.synths?.[+track]?.setMasterVolume(vol)
  }
  async setTrackInstrument(track: number | string, instrument: InstrumentName) {
    const synth = await getSynth(instrument)
    this.synths[+track] = synth
  }

  isActiveHand(note: SongNote) {
    const { left, right } = this.songHands

    // Not even a L/R hand track.
    if (left !== note.track && right !== note.track) {
      return false
    }

    return (
      this.hand === 'both' ||
      (this.hand === 'left' && note.track === left) ||
      (this.hand === 'right' && note.track === right)
    )
  }

  isActiveTrack(note: SongNote) {
    return this.songHands.left === note.track || this.songHands.right === note.track
  }

  getTime() {
    if (!this.isPlaying()) {
      return this.currentSongTime
    }
    const nextNote = this.song?.notes[this.currentIndex]
    if (this.wait && nextNote && this.isActiveHand(nextNote)) {
      const isntPressed =
        !midi.getPressedNotes().has(nextNote.midiNote) ||
        midi.getPressedNotes().get(nextNote.midiNote) ===
          this.lastPressedKeys.get(nextNote.midiNote)
      if (isntPressed) {
        return this.currentSongTime
      }
    }

    const now = performance.now()
    const dt = now - this.lastIntervalFiredTime
    return this.currentSongTime + dt / 1000
  }
  // ms * |___1s___|
  //      | 1000ms |

  getBpm() {
    const currBpm = this.song?.bpms[this.currentBpm]?.bpm ?? 120
    return currBpm * this.bpmModifier
  }

  increaseBpm() {
    const delta = 0.05
    this.bpmModifier = parseFloat((this.bpmModifier + delta).toFixed(2))
  }

  decreaseBpm() {
    const delta = 0.05
    this.bpmModifier = parseFloat((this.bpmModifier - delta).toFixed(2))
  }

  getBpmModifier() {
    return this.bpmModifier
  }

  setHand(hand: any) {
    this.hand = hand
  }

  getBpmIndexForTime(time: number) {
    const index = this.song.bpms.findIndex((m) => m.time > time) - 1
    if (index < 0) {
      return this.song.bpms.length - 1
    }
    return index
  }

  getMeasureForTime(time: number): SongMeasure {
    let index = this.song.measures.findIndex((m) => m.time > time) - 1
    if (index < 0) {
      index = this.song.measures.length - 1
    }
    return this.song.measures[index]
  }

  play() {
    if (this.isPlaying()) {
      return
    }
    this.state = 'Playing'
    this.notify()

    this.lastIntervalFiredTime = performance.now()
    this.playInterval = setInterval(() => this.playLoop_(), 1)
    // continue playing everything we were in the middle of, but at a lower vol
    this.playing.forEach((note) => this.playNote(note))
  }

  playNote(note: SongNote) {
    this.synths[note.track].playNote(note.midiNote, note.velocity)
  }

  stopNotes(notes: Array<SongNote>) {
    if (notes.length === 0 || this.synths.length === 0) {
      return
    }
    for (let note of notes) {
      this.synths[note.track].stopNote(note.midiNote)
    }
  }

  updateTime_() {
    let dt = 0
    if (this.isPlaying()) {
      const now = performance.now()
      dt = (now - this.lastIntervalFiredTime) * this.bpmModifier
      this.lastIntervalFiredTime = now
      this.currentSongTime += dt / 1000
    }

    return this.currentSongTime
  }

  playLoop_() {
    const prevTime = this.currentSongTime
    const time = this.updateTime_()

    // If at the end of the song, stop playing.
    if (this.currentSongTime >= this.getDuration()) {
      this.pause()
    }

    // If a range is selected and you just got past it then zoom back
    if (this.range) {
      let [start, stop] = this.range
      if (prevTime <= stop && stop <= time) {
        this.seek(start - 0.5)
        return
      }
    }

    if (this.song.bpms[this.currentBpm + 1]?.time < time) {
      this.currentBpm++
    }
    const stillPlaying = (n: SongNote) => n.time + n.duration > time
    this.stopNotes(this.playing.filter((n) => !stillPlaying(n)))
    this.playing = this.playing.filter(stillPlaying)

    while (this.song.notes[this.currentIndex]?.time < time) {
      const note = this.song.notes[this.currentIndex]

      if (this.wait && this.isActiveHand(note)) {
        const lastPressedTime = this.lastPressedKeys.get(note.midiNote)
        const currPressedTime = midi.getPressedNotes().get(note.midiNote)?.time
        if (currPressedTime && currPressedTime !== lastPressedTime) {
          this.lastPressedKeys.set(note.midiNote, currPressedTime)
        }

        const withinMsLimit =
          currPressedTime && Date.now() - currPressedTime < 100 * (1 / this.bpmModifier)

        if (!currPressedTime || !withinMsLimit || currPressedTime === lastPressedTime) {
          this.currentSongTime = note.time
          return
        }
      }
      this.playing.push(note)
      this.playNote(note)
      this.currentIndex++
    }
  }

  toggle() {
    if (this.state === 'Playing') {
      this.pause()
      return
    }
    this.play()
  }

  stopAllSounds() {
    this.stopNotes(this.playing)
  }

  pause() {
    if (this.state !== 'Playing') {
      return
    }
    clearInterval(this.playInterval)
    this.playInterval = null
    this.stopAllSounds()
    this.state = 'Paused'
    this.notify()
  }

  stop() {
    this.pause()
    this.reset_()
  }

  reset_() {
    this.currentSongTime = 0
    this.currentIndex = 0
    this.playing = []
    this.range = null
  }

  seek(time: number) {
    this.stopAllSounds()
    this.currentSongTime = time
    this.playing = this.song.notes.filter((note) => {
      return note.time < this.currentSongTime && this.currentSongTime < note.time + note.duration
    })
    this.currentIndex = this.song.notes.findIndex((note) => note.time >= this.currentSongTime)
    this.currentBpm = this.getBpmIndexForTime(time)
  }

  /* Convert between songtime and real human time. Includes bpm calculations*/
  getRealTimeDuration(starttime: number, endtime: number) {
    return endtime - starttime
  }

  getPressedKeys() {
    const activeNotes = this.playing.filter((n) => this.isActiveHand(n))
    return Object.fromEntries(activeNotes.map((n) => [n.midiNote, n]))
  }

  getDuration() {
    return this.song?.duration ?? 0
  }

  setRange(range?: { start: number; end: number }) {
    if (!range) {
      this.range = null
      return
    }

    const { start, end } = range
    this.range = [Math.min(start, end), Math.max(start, end)]
  }

  subscribe(fn: (state: PlayerState) => void) {
    this.listeners.push(fn)
  }

  unsubscribe(fn: (state: PlayerState) => void) {
    let i = this.listeners.indexOf(fn)
    this.listeners.splice(i, 1)
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.state))
  }
}

export default Player
