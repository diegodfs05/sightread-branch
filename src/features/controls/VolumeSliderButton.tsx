import { Dropdown, Slider } from '@/components'
import { Volume2, VolumeX } from '@/icons'
import Player from '../player'

export function VolumeSliderButton() {
  const player = Player.player()
  const isSoundOff = player.volume.value === 0
  const toggleVolume = () => (isSoundOff ? player.setVolume(1) : player.setVolume(0))

  return (
    <Dropdown
      target={
        <div className="text-white" onClick={toggleVolume}>
          {isSoundOff ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </div>
      }
      openOn="hover"
    >
      <div className="relative flex flex-col items-center h-44 w-8 p-2 bg-white z-20">
        <Slider
          orientation="vertical"
          min={0}
          max={1}
          step={0.01}
          value={[player.volume.value]}
          onValueChange={(val) => player.setVolume(val[0])}
          // Clicks to the volume slider shouldn't close other modal-like windows (e.g. SettingsPanel)
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-black text-sm text-center">
          {Math.round(Player.player().volume.value * 100)}
        </span>
      </div>
    </Dropdown>
  )
}
