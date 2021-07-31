import React, { useEffect, useRef, useState } from 'react'
import { useSize } from '../hooks/size'
import midiState from '../midi'
import Player from '../player'
import { getNoteSizes, range } from '../utils'
import { SongNote } from '../types'
import { diffKeys, isBlack, isBrowser } from '../utils'
import { getKey } from 'src/synth/utils'

const getNoteId = (n: number | string) => `PIANO_NOTE_${n}`

export type SubscriptionCallback = (pressedKeys: { [note: number]: SongNote }) => void
type PianoRollProps = {
  getTrackColor?: (songNote: SongNote) => string | void
  activeColor: string
  onNoteDown?: (midiNote: number) => void
  onNoteUp?: (midiNote: number) => void
  startNote?: number
  endNote?: number
  subscribe?: (cb: SubscriptionCallback) => void
  unsubscribe?: (cb: SubscriptionCallback) => void
}

// TODO: instead of getTrackColor --> should subscribe to events which include color selection.
export function PianoRoll({
  getTrackColor,
  activeColor,
  onNoteUp,
  onNoteDown,
  startNote,
  endNote,
  subscribe,
  unsubscribe,
}: PianoRollProps) {
  const { width, measureRef } = useSize()
  const prevPressed = useRef({})
  startNote = startNote ?? 21
  endNote = endNote ?? 108

  useEffect(() => {
    if (!subscribe || !unsubscribe) {
      return
    }

    subscribe(setNoteColors)
    return () => {
      unsubscribe(setNoteColors)
    }
  }, [getTrackColor, subscribe, unsubscribe])

  function setNoteColors(currPressed: { [note: number]: SongNote }) {
    let diff = diffKeys(prevPressed.current, currPressed)
    for (let midiNote of diff) {
      const noteEl = document.getElementById(getNoteId(midiNote))
      if (!noteEl) {
        continue
      }

      let color = isBlack(midiNote) ? 'black' : 'white'
      if (midiNote in currPressed) {
        color = activeColor
      }
      const trackColor = getTrackColor?.(currPressed[midiNote] as SongNote)
      noteEl.style.backgroundColor = trackColor ?? color
    }
    prevPressed.current = currPressed
  }

  const whiteKeysCount = range(startNote, endNote)
    .map((n) => !isBlack(n))
    .filter(Boolean).length
  const sizes = getNoteSizes(width, whiteKeysCount)
  const notes = range(startNote, endNote).map((midiNote) => {
    return (
      <PianoNote
        width={isBlack(midiNote) ? sizes.blackWidth : sizes.whiteWidth}
        height={isBlack(midiNote) ? sizes.blackHeight : sizes.whiteHeight}
        note={midiNote}
        activeColor={activeColor}
        key={midiNote}
        onNoteDown={onNoteDown}
        onNoteUp={onNoteUp}
      />
    )
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
      }}
      ref={measureRef}
    >
      {notes}
    </div>
  )
}

let isMouseDown = false
;(function () {
  const setMouseDown = () => (isMouseDown = true)
  const setMouseUp = () => (isMouseDown = false)
  if (isBrowser()) {
    window.addEventListener('mousedown', setMouseDown, { passive: true })
    window.addEventListener('mouseup', setMouseUp, { passive: true })
  }
})()

type PianoNoteProps = {
  width: number
  height: number
  note: number
  activeColor: string
  onNoteDown?: (midiNote: number) => void
  onNoteUp?: (midiNote: number) => void
}
function PianoNote({ width, height, note, activeColor, onNoteDown, onNoteUp }: PianoNoteProps) {
  const [userPressed, setUserPressed] = useState(false)
  const midiKeys = midiState.getPressedNotes()
  let pressed = userPressed || midiKeys.has(note)
  const color = isBlack(note) ? 'black' : 'white'
  const isC = getKey(note).startsWith('C')

  return (
    <div
      id={getNoteId(note)}
      style={{
        border: '1px solid #292e49',
        margin: isBlack(note) ? `0 -${width / 2}px` : 0,
        width,
        height,
        backgroundColor: pressed ? activeColor : color,
        zIndex: isBlack(note) ? 1 : 0,
        userSelect: 'none',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onMouseDown={() => {
        setUserPressed(true)
        onNoteDown?.(note)
      }}
      onMouseUp={() => {
        setUserPressed(false)
        onNoteUp?.(note)
      }}
      onMouseLeave={() => {
        if (!userPressed) {
          return
        }
        setUserPressed(false)
        onNoteUp?.(note)
      }}
      onMouseEnter={() => {
        if (isMouseDown) {
          setUserPressed(true)
          onNoteDown?.(note)
        }
      }}
    >
      {isC && (
        <div
          style={{
            bottom: 0,
            opacity: 0.7,
            paddingBottom: 10,
          }}
        >
          {getKey(note)}
        </div>
      )}
    </div>
  )
}
