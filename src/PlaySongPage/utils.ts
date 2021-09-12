import { getSynth, getSynthStub, Synth } from '../synth'
import { TrackSettings, PlayableSong, Track, SongNote } from '../types'
import Player from '../player'
import { gmInstruments, InstrumentName } from '../synth/instruments'
import { useEffect, useState } from 'react'
import { CanvasItem } from 'src/canvas/types'
import { clamp, getNoteSizes, isBlack, mapValues, range } from 'src/utils'

export function getSongRange(song: { notes: SongNote[] } | undefined) {
  const notes = song?.notes ?? []
  let startNote = notes[0]?.midiNote ?? 21
  let endNote = notes[0]?.midiNote ?? 108

  for (let { midiNote } of notes) {
    startNote = Math.min(startNote, midiNote)
    endNote = Math.max(endNote, midiNote)
  }

  startNote = clamp(startNote - 2, { min: 21, max: 107 })
  endNote = clamp(endNote + 2, { min: startNote + 1, max: 108 })

  return { startNote, endNote }
}

interface Lanes {
  [note: number]: { left: number; width: number }
}
export function getNoteLanes(width: number, items: CanvasItem[] | undefined): Lanes {
  const notes: SongNote[] = items
    ? (items.filter((i) => i.type === 'note') as SongNote[])
    : ([{ midiNote: 21 }, { midiNote: 108 }] as SongNote[])
  const { startNote, endNote } = getSongRange({ notes })
  const whiteKeysCount = range(startNote, endNote)
    .map((n) => !isBlack(n))
    .filter(Boolean).length

  const { whiteWidth, blackWidth } = getNoteSizes(width, whiteKeysCount)
  const lanes: Lanes = {}
  let whiteNotes = 0
  for (let note = startNote; note <= endNote; note++) {
    if (isBlack(note)) {
      lanes[note] = { width: blackWidth, left: whiteWidth * whiteNotes - blackWidth / 2 }
    } else {
      lanes[note] = { width: whiteWidth, left: whiteWidth * whiteNotes }
      whiteNotes++
    }
  }

  return lanes
}

export function useSynth(
  instrument: InstrumentName,
): { loading: boolean; error: boolean; synth: Synth } {
  const [loadError, setLoadError] = useState({ loading: true, error: false })

  useEffect(() => {
    let cancelled = false
    setLoadError({ loading: true, error: false })
    getSynth(instrument)
      .then(() => {
        if (!cancelled) {
          setLoadError({ loading: false, error: false })
        }
      })
      .catch((err) => {
        if (cancelled) {
          return
        }
        console.error(`Could not load synth. Error: ${err}`)
        setLoadError({ loading: false, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [instrument])

  return { ...loadError, synth: getSynthStub(instrument) }
}

export function applySettings(player: Player, settings: TrackSettings | undefined): void {
  if (!settings) {
    return
  }
  Object.entries(settings).forEach(([track, config]) => {
    if (!config.sound) {
      player.setTrackVolume(track, 0)
    } else {
      player.setTrackVolume(track, 1)
    }
  })
}

export function getHandSettings(trackSettings: TrackSettings | null | undefined) {
  if (!trackSettings) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(trackSettings).map(([trackId, settings]) => {
      return [trackId, { hand: settings.hand }]
    }),
  )
}

export function getHand({ config }: PlayableSong, trackId: number): 'left' | 'right' | 'none' {
  if (config.left === trackId) {
    return 'left'
  }
  if (config.right === trackId) {
    return 'right'
  }
  return 'none'
}

export function getNotesCount({ notes }: PlayableSong, trackId: number): number {
  return notes.filter((n) => n.track == trackId).length
}

function getInstrument(track: Track): InstrumentName {
  return ((track.instrument || track.name) as InstrumentName) || gmInstruments[track.program ?? 0]
}

export function getTrackSettings(song: PlayableSong): TrackSettings {
  const tracks = song.tracks
  return mapValues(tracks, (track, trackId) => {
    const id = parseInt(trackId)
    return {
      track,
      hand: getHand(song, id),
      count: getNotesCount(song, id),
      instrument: getInstrument(track),
      sound: true,
    }
  })
}

export function whiteNoteHeight(pianoRollContainerWidth: number): number {
  const whiteWidth = pianoRollContainerWidth / 52
  return (220 / 30) * whiteWidth
}
