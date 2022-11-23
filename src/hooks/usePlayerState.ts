import Player from '@/features/player'
import { useMemo } from 'react'

type PlayerDispatcher = {
  play: () => void
  pause: () => void
  toggle: () => void
  stop: () => void
}

type PlayerStateHookReturn = [
  { canPlay: boolean; playing: boolean; paused: boolean },
  PlayerDispatcher,
]

export default function usePlayerState(): PlayerStateHookReturn {
  const player = Player.player()
  const state = player.state.value

  const dispatcher: PlayerDispatcher = useMemo(
    () => ({
      play: () => player.play(),
      pause: () => player.pause(),
      toggle: () => player.toggle(),
      stop: () => player.stop(),
    }),
    [player],
  )

  return useMemo(() => {
    return [
      {
        canPlay: state !== 'CannotPlay',
        playing: state === 'Playing',
        paused: state === 'Paused',
      },
      dispatcher,
    ]
  }, [state, dispatcher])
}
