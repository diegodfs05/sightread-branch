import { getSong } from '@/features/api'
import Player from '@/features/player'
import { getHandSettings, SongVisualizer } from '@/features/SongVisualization'
import { Song } from '@/types'
import { useState, useEffect, useRef } from 'react'
import { getDefaultSongSettings } from '../SongVisualization/utils'

interface SongPreviewProps {
  songBytes?: ArrayBuffer
  songId: string
  source: string
  onReady?: (songId: string) => void
}

function SongPreview({ songId, source, onReady, songBytes }: SongPreviewProps) {
  const [song, setSong] = useState<Song>()
  const player = Player.player()
  const onReadyRef = useRef<any>()
  onReadyRef.current = onReady

  useEffect(() => {
    getSong(source, songId).then((song) => {
      setSong(song)
      player.setSong(song, getDefaultSongSettings(song))
      onReadyRef.current?.(songId)
    })
  }, [songId, source, player])

  const songConfig = getDefaultSongSettings(song)
  return (
    <SongVisualizer
      song={song}
      config={songConfig}
      getTime={() => Player.player().getTime()}
      hand="both"
      handSettings={getHandSettings(songConfig)}
    />
  )
}

export type { SongPreviewProps }
export { SongPreview }
