import { getSynth, getSynthStub, Synth } from '../synth'
import { TrackSettings, PlayableSong, Track } from '../types'
import Player from '../player'
import { gmInstruments, InstrumentName } from '../synth/instruments'
import { Ref, useEffect, useRef, useState } from 'react'

export function getNoteLanes(width: number) {
  const whiteWidth = width / 52
  const blackWidth = whiteWidth / 2
  const blackNotes = [1, 4, 6, 9, 11]
  const lanes: Array<{ left: number; width: number }> = []
  let totalNotes = 0

  for (var whiteNotes = 0; whiteNotes < 52; whiteNotes++, totalNotes++) {
    const lane = { width: whiteWidth, left: whiteWidth * whiteNotes }
    if (blackNotes.includes(totalNotes % 12)) {
      lanes.push({ width: blackWidth, left: lane.left - blackWidth / 2 })
      totalNotes++
    }
    lanes.push(lane)
  }
  return lanes
}

export function useSynth(
  instrument: InstrumentName,
): { loading: boolean; error: boolean; synth: Synth } {
  const [loadError, setLoadError] = useState({ loading: true, error: false })

  useEffect(() => {
    setLoadError({ loading: true, error: false })
    getSynth(instrument)
      .then(() => {
        setLoadError({ loading: false, error: false })
      })
      .catch((err) => {
        console.error(`Could not load synth. Error: ${err}`)
        setLoadError({ loading: false, error: true })
      })
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
  return notes.reduce((acc, note) => {
    if (note.track === trackId) {
      return acc + 1
    }
    return acc
  }, 0)
}

function getInstrument(track: Track): InstrumentName {
  return ((track.instrument || track.name) as InstrumentName) || gmInstruments[track.program ?? 0]
}

export function getTrackSettings(song: PlayableSong): TrackSettings {
  const tracks = song.tracks
  return Object.fromEntries(
    Object.entries(tracks).map(([trackId, track]) => {
      const t = parseInt(trackId)
      const hand = getHand(song, t)
      const count = getNotesCount(song, t)
      const instrument = getInstrument(track)
      return [
        t,
        {
          track,
          hand,
          count,
          instrument,
          sound: true,
        },
      ]
    }),
  )
}

export function whiteNoteHeight(pianoRollContainerWidth: number): number {
  const whiteWidth = pianoRollContainerWidth / 52
  return (220 / 30) * whiteWidth
}
