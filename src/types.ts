import { InstrumentName } from '@/features/synth'
import { KEY_SIGNATURE } from './features/theory'

export type DifficultyLabel =
  | 'Easiest'
  | 'Easier'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Hardest'
  // "-" stands for Unknown
  | '-'

export type MusicFile = {
  id: string
  file: string
  title: string
  artist?: string
  arranger?: string
  difficulty: number
  source: 'builtin' | 'midishare'
}

export interface Size {
  width: number
  height: number
}

export type Pitch = {
  step: string
  octave: number
  alter: number
}

export type SongNote = {
  type: 'note'
  midiNote: number
  track: number
  time: number
  duration: number
  pitch: Pitch
  velocity?: number
}

export type Bpm = { time: number; bpm: number }

export type Tracks = {
  [id: number]: Track
}

export type Track = {
  instrument?: string
  name?: string
  program?: number
}

export type SongMeasure = {
  type: 'measure'
  time: number
  number: number
}

export type Song = {
  tracks: Tracks
  duration: number
  measures: Array<SongMeasure>
  notes: Array<SongNote>
  bpms: Array<Bpm>
  timeSignature?: { numerator: number; denominator: number }
  keySignature: KEY_SIGNATURE
  items: Array<SongNote | SongMeasure>
}

export type VisualizationMode = 'falling-notes' | 'sheet'
export type Hand = 'both' | 'left' | 'right' | 'none'
export type SongConfig = {
  left: boolean
  right: boolean
  waiting: boolean
  visualization: VisualizationMode
  noteLetter: boolean
  keySignature?: KEY_SIGNATURE
  tracks: {
    [trackId: number]: TrackSetting
  }
}

export type TrackSetting = {
  track: Track
  hand: 'left' | 'right' | 'none'
  sound: boolean
  instrument: InstrumentName
}

export type MidiStateEvent = {
  type: 'down' | 'up'
  note: number
  time: number
  velocity?: number
}

export type HandSettings = {
  [trackId: string]: {
    hand: Hand | 'none'
  }
}
