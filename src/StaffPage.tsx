import React from 'react'
import { Song, STAFF, SongNote } from './parsers'
import { usePlayer, useWindowSize } from './hooks'

import FClefSVG from './FClef.svg'
import GClefSVG from './GClef.svg'
import { Virtualized } from './Virtualized'
import { Sizer } from './utils'

const PIXELS_PER_SECOND = 300
function getXPos(time: number) {
  return time * PIXELS_PER_SECOND
}

export function WindowedStaffBoard({
  song,
  selectedHand,
}: {
  song: Song
  selectedHand: 'left' | 'right' | 'both'
}) {
  const windowSize = useWindowSize()

  return (
    <div style={{}}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '100vw',
          backgroundColor: 'white',
        }}
      >
        <Stave
          width={windowSize.width - 100}
          height={100}
          staff={STAFF.trebl}
          song={song}
          disabled={selectedHand === 'left'}
        />
        <Sizer height={100} />
        <Stave
          width={windowSize.width - 100}
          height={100}
          staff={STAFF.bass}
          song={song}
          disabled={selectedHand === 'right'}
        />
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: 200,
            width: 7,
            height: 375,
            backgroundColor: '#B91919',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: 188,
            width: 30,
            height: 375,
            backgroundColor: 'rgba(185,25,25,0.21)',
          }}
        />
      </div>
    </div>
  )
}

const noteSvg = (
  <svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.4811 6.42107C24.4811 10.4211 21.0371 15.6763 15.4811 17.9211C9.48114 19.9211 5.48114 18.921 2.98114 15.421C1.48114 11.421 4.48114 6.92102 10.0411 3.9855C15.9811 2.42107 20.4811 2.42107 22.4811 6.42107Z"
      fill="black"
    />
  </svg>
)

const STEP_NUM: any = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
}

// Make a staffz
function Stave({
  width,
  height,
  staff,
  song,
  disabled,
}: {
  width: number
  height: number
  staff: typeof STAFF.trebl | typeof STAFF.bass
  song: Song
  disabled: boolean
}) {
  const { player } = usePlayer()
  const notes = song.notes.filter((n) => n.staff === staff)
  const clefImgSrc = staff === STAFF.trebl ? GClefSVG : FClefSVG
  const clefStyle =
    staff === STAFF.trebl ? { height: 160, top: -20, left: -5 } : { height: 80, top: 2, left: 10 }

  function Line({ top, width }: any) {
    return (
      <div
        style={{
          position: 'absolute',
          top,
          width: width ?? '100%',
          height: 2.5,
          backgroundColor: 'black',
        }}
      />
    )
  }

  // There are 52 white keys.
  function getRow(octave: number, step: string): number {
    return octave * 7 + STEP_NUM[step]
  }
  const staveTopRow = staff === STAFF.bass ? getRow(4, 'A') : getRow(5, 'F')
  const heightPerRow = height / 8
  function getRelYPos(row: number) {
    const relDiff = staveTopRow - row
    return relDiff * heightPerRow
  }

  function Note({ note }: { note: SongNote }) {
    const row = getRow(note.pitch.octave, note.pitch.step)
    const top = 100 + getRelYPos(row)
    const extraLines: any = []
    if (row > staveTopRow) {
      for (let i = staveTopRow + 2; i <= row; i++) {
        if (i % 2 === 0) {
          extraLines.push(
            <Line
              top={100 + getRelYPos(i)}
              width={note.duration * PIXELS_PER_SECOND}
              key={`line-${i}-${note.time}`}
            />,
          )
        }
      }
    }
    if (row < staveTopRow - 8) {
      for (let i = row; i <= staveTopRow - 8; i++) {
        if (i % 2 === 0) {
          extraLines.push(
            <Line
              top={100 + getRelYPos(i)}
              width={note.duration * PIXELS_PER_SECOND}
              key={`line-${i}-${note.time}`}
            />,
          )
        }
      }
    }

    const accidentalMap: any = {
      '-1': '♭',
      1: '#',
    }
    return (
      <>
        {note.accidental !== 0 && (
          <span
            style={{ position: 'absolute', top: top - 8, left: -12, fontSize: 20, fontWeight: 600 }}
          >
            {accidentalMap[note.accidental]}
          </span>
        )}
        <div
          style={{
            position: 'absolute',
            top: top + 2,
            transform: 'translateY(-50%)',
          }}
        >
          {noteSvg}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 10,
            width: note.duration * PIXELS_PER_SECOND - 10,
            top: top + 1,
            height: 15,
            backgroundColor: 'rgba(0,0,0,0.51)',
            transform: 'translateY(-50%)',
          }}
        />
        {extraLines}
      </>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        margin: '0 auto',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ position: 'relative', left: 150, top: -100, overflow: 'hidden' }}>
        <Virtualized
          items={notes}
          renderItem={(note: any) => <Note note={note} />}
          getCurrentOffset={() => getXPos(player.getTime())}
          getItemOffsets={(note: SongNote) => ({
            start: getXPos(note.time),
            end: getXPos(note.time + note.duration),
          })}
          direction="horizontal"
          width={width - 150}
          height={height + 200}
        />
      </div>
      <div style={{ position: 'absolute', left: 0, width: 2, height, backgroundColor: 'black' }} />
      <img style={{ position: 'absolute', ...clefStyle }} src={clefImgSrc} alt="clef" />
      {[0, 2, 4, 6, 8].map((i) => {
        return <Line top={getRelYPos(staveTopRow - i)} key={`line-${i}`} />
      })}
    </div>
  )
}
