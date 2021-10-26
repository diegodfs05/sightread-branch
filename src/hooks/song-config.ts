import { usePersistedState } from '@/features/persist'
import { SongConfig } from '@/types'

export default function useSongSettings(file: string) {
  return usePersistedState<SongConfig>(`${file}/settings`, {
    left: true,
    right: true,
    waiting: false,
    noteLetter: false,
    visualization: 'falling-notes',
    tracks: {},
  })
}
