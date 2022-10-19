import { DifficultyLabel } from '@/types'

export type LibrarySong = {
  id: string
  file: string
  title: string
  artist: string
  difficulty: number
  duration: number
  source: 'midishare' | 'upload' | 'builtin'
}

export type Filters = {
  show: boolean
  duration?: [number, number] // duration filter in a range. have to find song with longest duration?
  difficulty?: DifficultyLabel
  type?: 'song' | 'upload'
}
