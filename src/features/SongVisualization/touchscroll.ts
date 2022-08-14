import Player from '@/features/player'
import { clamp } from '@/utils'
import { getPointerVelocity, isPointerDown } from '../pointer'

const player = Player.player()

let isDragging_ = false
export function isDragging(): boolean {
  return isDragging_
}

export function seekPlayer(seconds: number) {
  const songTime = clamp(seconds + player.getTime(), { min: 0, max: player.song.duration })
  player.seek(songTime)
}

// init acceleration
let acceleration = 0

// ! Careful balance is needed for these values.
// set decay falloff value, (How quickly it will come to a stop)
const dfalloff = 0.96
// set acceleration magnitude value (How much it scales with acceleration)
const aMag = 1

// TODO Calculate dfalloff and aMag proportionate to framerate

export const decay = () => {
  isDragging_ = false
  //Delay frames
  requestAnimationFrame(() => {
    const dY = acceleration / PPS
    // End acceleration when the acceleration catches up to the natural song velocity.
    const endSnap = (PPS * player.bpmModifier) / 1000 / 60
    if (Math.abs(dY) > endSnap) {
      seekPlayer(dY)
      acceleration *= dfalloff
      decay()
    } else {
      endInertialScroll()
    }
  })
}

let wasPlaying = false
export function handleDown(e: PointerEvent) {
  isDragging_ = true
  const target = e.target as HTMLDivElement
  target.setPointerCapture(e.pointerId)
  if (player.isPlaying()) {
    wasPlaying = true
    player.pause()
  }
  acceleration = 0
  // TODO: doubleclick pause / play
}

export function handleUp(e: PointerEvent) {
  const target = e.target as HTMLDivElement
  target.releasePointerCapture(e.pointerId)
  decay()
}

function endInertialScroll() {
  // if player was playing, then continue playing.
  if (wasPlaying) {
    wasPlaying = false
    player.play()
  }
  acceleration = 0
}

// ? Threshold to prevent accidental acceleration
const threshold = 5

const PPS = 225
export function handlePointer(e: PointerEvent) {
  if (!isPointerDown()) {
    return
  }
  const yVel = getPointerVelocity().y
  seekPlayer(yVel / PPS)
  if (Math.abs(yVel) > threshold) {
    acceleration = yVel * aMag
  } else {
    acceleration = 0
  }
  // ? Handleup if you want it to use acceleration even if you swipe off page.
}
