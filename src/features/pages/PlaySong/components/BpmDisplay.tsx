import Player from '@/features/player'
import { ChevronUp, ChevronDown } from '@/icons'
import { round } from '@/utils'

export default function BpmDisplay() {
  const player = Player.player()
  const bpmText = round(player.getBpm().value) + ' BPM'
  const percentText = round(player.bpmModifier.value * 100) + '%'

  const iconSize = 24
  return (
    <div className="flex mx-auto gap-2">
      <div className="flex flex-col">
        <span className="text-xl text-center self-center">{percentText}</span>
        <span className="text-sm text-center">{bpmText}</span>
      </div>
      <div className="flex flex-col justify-between">
        <ChevronUp
          size={iconSize}
          className="text-black hover:cursor-pointer hover:text-purple-hover"
          onClick={player.increaseBpm.bind(player)}
        />
        <ChevronDown
          size={iconSize}
          className="text-black hover:cursor-pointer hover:text-purple-hover"
          onClick={player.decreaseBpm.bind(player)}
        />
      </div>
    </div>
  )
}
