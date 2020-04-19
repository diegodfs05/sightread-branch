export async function parseMusicXML() {
  /*
   * TODO:
   * - Handle alternative time signatures
   * - Handle non Trebl/Bass clefs
   */

  const txt = await (await fetch(process.env.PUBLIC_URL + '/music/GoT.xml')).text()
  const xml = new DOMParser().parseFromString(txt, 'application/xml')
  const walker = xml.createTreeWalker(xml, NodeFilter.SHOW_ALL, nodeFilter)
  ;(window as any).xml = xml

  let currTime = 0
  let totalDuration = 0
  let curr: HTMLElement | null = walker.currentNode as HTMLElement
  let currKey = { fifth: 0, mode: 'major' }
  let staffs: any = {}
  let measures: Array<any> = []
  while (curr) {
    if (curr.tagName === 'clef') {
      let number = Number(curr.getAttribute('number'))
      staffs[number] = staffs[number] || {}
      staffs[number].clef = { sign: curr.querySelector('sign')?.textContent }
    } else if (curr.tagName === 'note' && curr.querySelector('rest')) {
      const duration = Number(curr.querySelector('duration')?.textContent?.trim())
      currTime += duration
    } else if (curr.tagName === 'note') {
      const step = curr.querySelector('step')?.textContent?.trim() ?? ''
      const octave = Number(curr.querySelector('octave')?.textContent?.trim())
      const duration = Number(curr.querySelector('duration')?.textContent?.trim())
      const staff = curr.querySelector('staff')?.textContent?.trim() ?? ''
      const accidental = curr.querySelector('accidental')?.textContent?.trim()
      const isChord = !!curr.querySelector('chord')
      let time = isChord ? staffs[staff].notes[staffs[staff].notes.length - 1].time : currTime

      let note: any = {
        pitch: { step, octave },
        duration,
        time,
        noteValue: getNoteValue(step, octave, currKey.fifth),
      }
      if (accidental) {
        note.accidental = accidental
      }

      staffs[staff].notes = staffs[staff].notes ?? []
      ;(staffs[staff].notes as any).push(note)
      // TODO: - is there proper handling of `<chord/>`s ?
      if (!isChord) {
        currTime += duration
      }
    } else if (curr.tagName === 'backup') {
      const duration = Number(curr.querySelector('duration')?.textContent?.trim())
      currTime -= duration
    } else if (curr.tagName === 'forward') {
      const duration = Number(curr.querySelector('duration')?.textContent?.trim())
      currTime += duration
    } else if (curr.tagName === 'measure') {
      measures.push({ time: currTime, number: Number(curr.getAttribute('number')) })
    } else if (curr.tagName === 'key') {
      const fifth = Number(curr.querySelector('fifths')?.textContent?.trim())
      const mode = curr.querySelector('mode')?.textContent?.trim() ?? ''
      currKey = { fifth, mode }
    }
    totalDuration = Math.max(totalDuration, currTime)
    curr = walker.nextNode() as HTMLElement
  }

  return { staffs, duration: totalDuration, measures }
}

const nodeFilter = {
  acceptNode(node: HTMLElement) {
    const acceptable = ['note', 'clef', 'measure', 'key', 'time', 'backup', 'forward', 'meter']
    return acceptable.some((name) => name === node.tagName)
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_SKIP
  },
}

function getNoteValue(step: string, octave: number, fifth: number) {
  const stepValues: any = { A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10 }
  const offset = getSharps(fifth)[step] ?? 0

  // Counting octaves starts at the first C. So it turns out C2 comes before A2
  if (step < 'C') {
    octave++
  }

  return octave * 12 + stepValues[step] + offset
}

function getSharps(fifth: number) {
  const cScale = [0, 2, 3, 5, 7, 8, 10]
  const thisScale = cScale.map((n) => (n + fifth * 7 + 12) % 12)
  thisScale.sort((a, b) => a - b)

  const revIndex = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  let sharps: any = {}
  let accidentalOffset = fifth > 0 ? 1 : -1
  cScale.forEach((val, i) => {
    if (val !== thisScale[i]) {
      sharps[revIndex[i]] = accidentalOffset
    }
  })
  return sharps
}

;(window as any).getSharps = getSharps
;(window as any).getNoteValue = getNoteValue
