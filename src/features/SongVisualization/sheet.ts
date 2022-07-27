import { GivenState } from './canvasRenderer'
import { CanvasItem, getItemsInView, Viewport } from './utils'
import {
  drawCurlyBrace,
  drawFClef,
  drawGClef,
  drawKeySignature,
  drawPlayNotesLine,
  drawStaffConnectingLine,
  drawStaffLines,
  drawTimeSignature,
  STAFF_SPACE,
} from '@/features/drawing'
import { SongNote } from '@/types'
import { pickHex } from '@/utils'
import {
  drawLedgerLines,
  drawMusicNote,
  drawSymbol,
  getNoteY,
  PLAY_NOTES_WIDTH,
} from '../drawing/sheet'
import { getKey, getKeyDetails, getNote, glyphs } from '../theory'
import midiState from '../midi'

const TEXT_FONT = 'Arial'
const STAFF_START_X = 100
const STAFF_FIVE_LINES_HEIGHT = 80
const PLAY_NOTES_LINE_OFFSET = STAFF_SPACE * 4 // offset above and below the staff lines
const NOTE_ALPHA = 'A2'

function getViewport(state: Readonly<GivenState>): Viewport {
  return {
    start: state.time * state.pps,
    end: state.time * state.pps + (state.windowWidth - STAFF_START_X),
  }
}

type State = GivenState & {
  viewport: Viewport
}

function deriveState(state: GivenState) {
  return { ...state, viewport: getViewport(state) }
}

// Optimization ideas:
// - can use offdom canvas (not OffscreenCanvas API) for background since its repainting over and over.
// - can also treat it all as one giant image that gets partially drawn each frame.
export function renderSheetVis(givenState: GivenState): void {
  const state = deriveState(givenState)
  state.ctx.clearRect(0, 0, state.windowWidth, state.height)
  drawStatics(state)
  const items = getSheetItemsInView(state)
  for (const item of items) {
    if (item.type === 'measure') {
      continue
    }
    renderSheetNote(state, item)
  }
  renderMidiPressedKeys(state)
}

function getSheetItemsInView(state: State): CanvasItem[] {
  const startPred = (item: CanvasItem) => getItemStartEnd(state, item).end >= 0
  const endPred = (item: CanvasItem) => getItemStartEnd(state, item).start > state.windowWidth
  return getItemsInView(state, startPred, endPred)
}

function drawStatics(state: State) {
  const { ctx, keySignature } = state
  ctx.fillStyle = 'black'
  ctx.strokeStyle = 'black'

  const curlyBraceSize = STAFF_FIVE_LINES_HEIGHT * 2 + 100
  const curlyBraceY = state.height / 2 + curlyBraceSize / 2
  drawCurlyBrace(state.ctx, STAFF_START_X - 25, curlyBraceY, curlyBraceSize)

  const staffHeight = STAFF_FIVE_LINES_HEIGHT
  const trebleTopY = getTrebleStaffTopY(state)
  const bassTopY = getBassStaffTopY(state)
  drawStaffLines(state.ctx, STAFF_START_X, trebleTopY, state.windowWidth)
  drawStaffLines(state.ctx, STAFF_START_X, bassTopY, state.windowWidth)
  drawStaffConnectingLine(state.ctx, STAFF_START_X, trebleTopY - 1, bassTopY + staffHeight + 1)

  const playLineTop = trebleTopY - PLAY_NOTES_LINE_OFFSET
  const playLineBottom = bassTopY + staffHeight + PLAY_NOTES_LINE_OFFSET
  drawPlayNotesLine(ctx, getPlayNotesLineX(state), playLineTop, playLineBottom)

  drawGClef(ctx, getClefX(), trebleTopY)
  drawFClef(ctx, getClefX(), bassTopY)
  drawKeySignature(ctx, getKeySignatureX(), trebleTopY, keySignature, 'treble')
  drawKeySignature(ctx, getKeySignatureX(), bassTopY, keySignature, 'bass')

  if (state.timeSignature) {
    const x = getTimeSignatureX(state)
    drawTimeSignature(ctx, x, trebleTopY, state.timeSignature)
    drawTimeSignature(ctx, x, bassTopY, state.timeSignature)
  }
}

function getTrebleStaffTopY(state: State) {
  const staffHeight = STAFF_FIVE_LINES_HEIGHT
  return state.height / 2 - 50 - staffHeight
}

function getBassStaffTopY(state: State) {
  return state.height / 2 + 50
}

function getClefX() {
  return STAFF_START_X + STAFF_SPACE
}

function getKeySignatureX() {
  return getClefX() + 3 * STAFF_SPACE
}

function getTimeSignatureX(state: State) {
  const fifths = getKeyDetails(state.keySignature).notes.length
  return getKeySignatureX() + fifths * STAFF_SPACE + STAFF_SPACE
}

function getPlayNotesLineX(state: State) {
  return getTimeSignatureX(state) + STAFF_SPACE * 4
}

function renderSheetNote(state: State, note: SongNote): void {
  const { ctx, pps, keySignature } = state
  ctx.save()
  const length = Math.round(pps * note.duration)
  const posX = getItemStartEnd(state, note).start
  const color = sheetNoteColor(posX, length)
  const staff = state.hands?.[note.track].hand === 'right' ? 'treble' : 'bass'
  const staffTopY = staff === 'treble' ? getTrebleStaffTopY(state) : getBassStaffTopY(state)
  const playNotesLineX = getPlayNotesLineX(state)
  let canvasX = posX + playNotesLineX + PLAY_NOTES_WIDTH / 2
  let canvasY = getNoteY(note.midiNote, staff, staffTopY, keySignature)
  ctx.fillStyle = color + NOTE_ALPHA
  const trailLength = length - 15 - (canvasX > playNotesLineX ? 0 : playNotesLineX - canvasX)
  const trailHeight = 10
  ctx.fillRect(
    Math.max(canvasX, playNotesLineX + 1.5),
    canvasY - trailHeight / 2,
    trailLength,
    trailHeight,
  )
  // Return after drawing the tail for the notes that have already crossed.
  if (canvasX < playNotesLineX - 10) {
    ctx.restore()
    return
  }

  drawLedgerLines(ctx, canvasX - 13, 33, staffTopY, note.midiNote, staff, state.keySignature)
  drawMusicNote(ctx, canvasX, canvasY, color)

  const key = getKey(note.midiNote, state.keySignature)
  const accidental = key.length == 2 && key[1]
  if (accidental) {
    ctx.font = `bold 16px ${TEXT_FONT}`
    ctx.fillStyle = 'black'
    ctx.fillText(accidental, canvasX - 20, canvasY + 6)
  }
  if (state.drawNotes) {
    ctx.font = `9px ${TEXT_FONT}`
    ctx.fillStyle = 'white'
    const step = key[0]
    ctx.fillText(step, canvasX, canvasY + 3)
  }
  ctx.restore()
}

function getItemStartEnd(state: State, item: CanvasItem): { start: number; end: number } {
  const start = item.time * state.pps - state.viewport.start
  const duration = item.type === 'note' ? item.duration : 100
  const end = start + duration * state.pps
  return { start, end }
}

function sheetNoteColor(x: number, length: number): string {
  const black = '#000000'
  if (x + length < 0 || x >= 0) {
    return black
  }
  const ratio = Math.max((x + length) / length, 0.15) // idk why but lower causes orange
  return pickHex('#8147EB', black, ratio)
}

// TODO pick side based not just on side of C4 but also
// the current song, i.e. if there are notes that should be played by left or right hand
// then show it on that hand.
function renderMidiPressedKeys(state: State): void {
  const { ctx } = state
  const pressed = midiState.getPressedNotes()
  for (let note of pressed.keys()) {
    const staff = note < getNote('C4') ? 'bass' : 'treble'
    const staffTopY = staff === 'bass' ? getBassStaffTopY(state) : getTrebleStaffTopY(state)
    const canvasY = getNoteY(note, staff, staffTopY)
    let canvasX = getPlayNotesLineX(state) - 2
    drawMusicNote(ctx, canvasX, canvasY, 'red')

    const key = getKey(note)
    // is sharp
    if (key.length === 2) {
      ctx.fillStyle = 'black'
      drawSymbol(ctx, glyphs.accidentalSharp, canvasX - 17, canvasY, STAFF_SPACE)
    }
    if (state.drawNotes) {
      ctx.font = `9px ${TEXT_FONT}`
      ctx.fillStyle = 'white'
      ctx.fillText(key[0], canvasX, canvasY + 3)
    }
  }
}
