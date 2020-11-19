/**
 * Generate all of the parsed music files + manifest as used by the app.
 * @fileoverview
 */

const jsdom = require('jsdom')
const window = new jsdom.JSDOM().window
globalThis.DOMParser = window.DOMParser
globalThis.NodeFilter = window.NodeFilter
import { parseMidi, parseMusicXML, Song } from '../src/parsers'
import { musicFiles, MusicFile } from './songdata'
const fs: any = require('fs')
const pathJoin: any = require('path').join

const baseDir = pathJoin(__dirname, '..', 'public')

type ParsedMusicFile = MusicFile & { parsedSong: Song }
const parsedMusic: ParsedMusicFile[] = musicFiles
  .map((musicFile) => {
    const path = musicFile.file
    if (path.endsWith('mid')) {
      try {
        var buf = new Uint8Array(fs.readFileSync(pathJoin(baseDir, path))).buffer
        const isTeachMidi = musicFile.type === 'lesson'
        return { ...musicFile, parsedSong: parseMidi(buf, isTeachMidi) }
      } catch (err) {
        console.error(`Error parsing file: ${path}` + err)
      }
    }
    if (path.endsWith('xml')) {
      try {
        const txt = fs.readFileSync(pathJoin(baseDir, path), { encoding: 'utf-8' })
        return { ...musicFile, parsedSong: parseMusicXML(txt) }
      } catch (err) {
        console.error(`Error parsing file: ${path}` + err)
      }
    }
  })
  .filter((x) => !!x) as ParsedMusicFile[]

const manifestJson = parsedMusic.map((parsed: MusicFile) => {
  let v: any = { ...parsed }
  v.duration = v.parsedSong.duration
  delete v.parsedSong
  return v
})
const manifestPath = pathJoin(__dirname, '..', 'public', 'generated', 'manifest.json')
const manifestSrcPath = pathJoin(__dirname, '..', 'src', 'manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson))
fs.writeFileSync(manifestSrcPath, JSON.stringify(manifestJson))

parsedMusic.forEach((parsed) => {
  const filename = parsed.file.replace('.xml', '').replace('.mid', '') + '.json'
  let genSongPath = pathJoin(
    __dirname,
    '..',
    'public',
    'generated',
    'music',
    parsed.type + 's',
    filename,
  )
  fs.writeFileSync(genSongPath, JSON.stringify(parsed.parsedSong))
})
