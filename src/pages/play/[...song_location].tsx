import '../../player'
import React, { useState, useEffect, useRef } from 'react'
import Player from '../../player'
import { Song, PlayableSong, Hand } from '../../types'
import { useRAFLoop, useSongPressedKeys, useSelectedSong } from '../../hooks'
import {
  CanvasSongBoard,
  WindowedStaffBoard,
  RuleLines,
  BpmDisplay,
  PianoRoll,
} from '../../PlaySongPage'
import midiKeyboard from '../../midi'
import { useRouter } from 'next/router'
import { formatTime, getSong, inferHands } from '../../utils'
import { getSynthStub } from '../../synth'
import { css } from '../../flakecss'
import { useSize } from '../../hooks/size'
import { GetServerSideProps } from 'next'
import { default as ErrorPage } from 'next/error'
// const steps: any = { A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10 }
// const pathToSongs =

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const props = {
    props: {},
  }
  if (query === undefined) {
    return props
  }
  const song_location = query.song_location
  if (!Array.isArray(song_location) || song_location.length < 3) {
    return props
  }
  const type = song_location.includes('lessons') ? 'lesson' : 'song'
  const viz = query.viz
  return {
    props: {
      type,
      songLocation: song_location.join('/'),
      viz: viz ?? 'falling-notes',
    },
  }
}

let synth = getSynthStub('acoustic_grand_piano')

type viz = 'falling-notes' | 'sheet'
type PlaySongProps = {
  type: 'lesson' | 'song' | undefined
  songLocation: string | undefined
  viz: viz
}
const palette = {
  right: {
    black: '#4912d4',
    white: '#7029fb',
  },
  left: {
    black: '#d74000',
    white: '#ff6825',
  },
  measure: '#C5C5C5', //'#C5C5C5',
}

const classes = css({
  topbar: {
    '& i': {
      color: 'white',
      cursor: 'pointer',
      transition: 'color 0.1s',
      fontSize: 24,
      width: 22,
    },
    '& i:hover': {
      color: 'rgba(58, 104, 231, 1)',
    },
    '& i.active': {
      color: 'rgba(58, 104, 231, 1)',
    },
  },
})
function App({ type, songLocation, viz }: PlaySongProps) {
  if (!type || !songLocation) {
    return <ErrorPage statusCode={404} title="Song Not Found :(" />
  }

  const [playing, setPlaying] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [rangeSelecting, setRangeSelecting] = useState(false)
  const [soundOff, setSoundOff] = useState(false)
  const [canPlay, setCanPlay] = useState<boolean>(false)
  const [songSettings, setSongSettings] = useSelectedSong(songLocation)
  // const [song, setSong] = useState<PlayableSong | null>(null)
  const [hand, setHand] = useState<Hand>('both')
  const pressedKeys = useSongPressedKeys()
  const router = useRouter()
  const player = Player.player()

  useEffect(() => {
    player.setHand(hand)
  }, [hand])

  // Register ummount fns
  useEffect(() => {
    return () => {
      player.stop()
    }
  }, [])

  useEffect(() => {
    if (!songLocation || !type) return

    if (songSettings?.song) {
      player.setSong(songSettings.song).then(() => {
        setCanPlay(true)
      })
      return
    }
    getSong(songLocation)
      .then((song) => inferHands(song, type === 'lesson'))
      .then((song: PlayableSong) => {
        setCanPlay(false)
        const settings = { tracks: songSettings?.tracks ?? {}, song }
        setSongSettings(songLocation, settings)
        player.setSong(song).then(() => {
          setCanPlay(true)
        })
      })
    midiKeyboard.virtualKeyboard = true

    return function cleanup() {
      midiKeyboard.virtualKeyboard = false
    }
  }, [songLocation, player])

  useEffect(() => {
    const keyboardHandler = (evt: KeyboardEvent) => {
      if (evt.code === 'Space') {
        if (playing) {
          player.pause()
          setPlaying(false)
        } else {
          if (canPlay) {
            player.play()
            setPlaying(true)
          }
        }
      }
    }
    window.addEventListener('keydown', keyboardHandler, { passive: true })
    return () => window.removeEventListener('keydown', keyboardHandler)
  }, [playing, player, canPlay])

  const handleHand = (selected: Hand) => {
    if (hand === selected) {
      setHand('both')
      return
    }
    setHand(selected)
  }

  const getKeyColor = (midiNote: number, type: 'white' | 'black'): string => {
    const song = songSettings?.song
    if (!song || !(midiNote in pressedKeys)) return type

    const track = pressedKeys[midiNote].track
    const shouldShow =
      hand === 'both' ||
      (hand === 'left' && track === song?.config.left) ||
      (hand === 'right' && track === song?.config.right)
    if (shouldShow) {
      const hand: 'left' | 'right' = track === song?.config.left ? 'left' : 'right'
      return palette[hand][type]
    }
    return type
  }

  return (
    <div className="App">
      <div
        id="topbar"
        className={`${classes.topbar}`}
        style={{
          position: 'fixed',
          height: 55,
          width: '100vw',
          zIndex: 2,
          backgroundColor: '#292929',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <i
          className="fas fa-arrow-left"
          style={{ fontSize: 30, position: 'relative', left: 15 }}
          onClick={() => {
            player.pause()
            router.back()
          }}
        />
        <div
          className="nav-buttons"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-around',
            width: 225,
          }}
        >
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <i
            className="fas fa-step-backward"
            onClick={() => {
              player.stop()
              setPlaying(false)
            }}
          />
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <i
            className={playing ? 'fas fa-pause' : 'fas fa-play'}
            onClick={() => {
              if (!playing) {
                if (canPlay) {
                  player.play()
                  setPlaying(true)
                }
              } else {
                player.pause()
                setPlaying(false)
              }
            }}
          ></i>
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <BpmDisplay />
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
        </div>
        <div
          style={{
            display: 'flex',
            marginLeft: 'auto',
            alignItems: 'center',
            minWidth: 250,
            marginRight: 20,
          }}
        >
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <div style={{ width: 44 }}>
            <i
              style={{ transform: 'rotateY(180deg)' }}
              className={`fas fa-hand-paper ${hand === 'left' && 'active'}`}
              onClick={() => handleHand('left')}
            />
            <i
              className={`fas fa-hand-paper ${hand === 'right' && 'active'}`}
              onClick={() => handleHand('right')}
            />
          </div>
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <i
            style={{ width: 24 }}
            className={`fas fa-clock ${waiting && 'active'}`}
            onClick={() => {
              setWaiting(!waiting)
              player.setWait(!waiting)
            }}
          />
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <i
            className={`fas fa-history ${rangeSelecting && 'active'}`}
            style={{ width: 24 }}
            onClick={() => {
              setRangeSelecting(!rangeSelecting)
              setPlaying(false)
              player.pause()
            }}
          />
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <i
            style={{ width: 24 }}
            className={`fas fa-music ${viz == 'sheet' && 'active'}`}
            onClick={() => {
              if (viz === 'falling-notes' || !viz) {
                router.replace({
                  href: router.route,
                  query: { viz: 'sheet', song_location: router.query.song_location },
                })
              } else {
                router.replace({
                  href: router.route,
                  query: { viz: 'falling-notes', song_location: router.query.song_location },
                })
              }
            }}
          />
          <hr style={{ width: 1, height: 40, backgroundColor: 'white', border: 'none' }} />
          <i
            style={{ width: 24 }}
            className={soundOff ? 'fas fa-volume-off' : 'fas fa-volume-up'}
            onClick={() => {
              if (!soundOff) {
                player.setVolume(0)
                setSoundOff(true)
              } else {
                player.setVolume(1)
                setSoundOff(false)
              }
            }}
          />
        </div>
        <div style={{ position: 'absolute', top: 55, height: 40, width: '100%' }}>
          <SongScrubBar
            song={songSettings?.song ?? null}
            rangeSelecting={rangeSelecting}
            setRangeSelecting={setRangeSelecting}
          />
        </div>
      </div>
      <div
        style={{
          backgroundColor: viz === 'falling-notes' ? '#2e2e2e' : 'white',
          width: '100vw',
          height: '100vh',
          contain: 'strict',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {viz === 'falling-notes' && (
          <>
            <RuleLines />
            <div style={{ position: 'relative', flex: 1 }}>
              {/*
              TODO: convert to canvas based for both falling notes + sheet music
            */}
              <CanvasSongBoard song={songSettings?.song ?? null} hand={hand} />
              {/* <WindowedSongBoard song={song} hand={hand} /> */}
            </div>
            <div
              style={{
                position: 'relative',
                paddingBottom: '7%',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <PianoRoll getKeyColor={getKeyColor} activeColor="grey" />
            </div>
          </>
        )}
        {viz === 'sheet' && (
          <>
            <WindowedStaffBoard song={songSettings?.song ?? null} selectedHand={hand} />
          </>
        )}
      </div>
    </div>
  )
}

// TODO: animate filling up the green of current measure
// TODO support seeking to start of current measure
export function SongScrubBar({
  song,
  rangeSelecting = false,
  setRangeSelecting = () => {},
}: {
  song: Song | null
  rangeSelecting?: boolean
  setRangeSelecting?: any
}) {
  const [mousePressed, setMousePressed] = useState(false) // TODO: mouse state shouldn't need to be ui state.
  const [mouseOver, setMouseOver] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { width, measureRef } = useSize()
  const currentTimeRef = useRef<HTMLSpanElement>(null)
  const timeSpanRef = useRef<HTMLSpanElement>(null)
  const measureSpanRef = useRef<HTMLSpanElement>(null)
  const toolTipRef = useRef<HTMLDivElement>(null)
  const rangeRef = useRef<HTMLDivElement>(null)
  const rangeSelection = useRef<null | { start: number; end: number }>(null)
  const startX = useRef<number>(0)
  const player = Player.player()

  function getProgress(x: number) {
    return Math.min(Math.max((x - startX.current) / width, 0), 1)
  }

  useRAFLoop(() => {
    if (!divRef.current) {
      return
    }
    const progress = Math.min(player.getTime() / player.getDuration(), 1)
    divRef.current.style.transform = `translateX(${progress * width}px)`
    if (currentTimeRef.current) {
      const time = player.getRealTimeDuration(0, player.getTime())
      currentTimeRef.current.innerText = String(formatTime(time))
    }
    if (rangeRef.current && rangeSelection.current) {
      const start = Math.min(rangeSelection.current.start, rangeSelection.current.end)
      const end = Math.max(rangeSelection.current.start, rangeSelection.current.end)
      rangeRef.current.style.left = (start / player.getDuration()) * width + 'px'
      rangeRef.current.style.width = ((end - start) / player.getDuration()) * width + 'px'
    }
  })
  useEffect(() => {
    if (wrapperRef.current) {
      startX.current = wrapperRef.current.getBoundingClientRect().x
    }
  }, [wrapperRef.current])

  useEffect(() => {
    if (rangeSelecting) {
      rangeSelection.current = null
      player.setRange(null)
    }
  }, [rangeSelecting])

  function seekPlayer(e: { clientX: number }) {
    const progress = getProgress(e.clientX)
    const songTime = progress * player.getDuration()
    player.seek(songTime)
  }

  useEffect(() => {
    if (mousePressed) {
      const handleUp = () => {
        setMousePressed(false)
        if (rangeSelecting) {
          const { start, end } = rangeSelection.current!
          player.setRange({ start, end: end ?? 0 })
          setRangeSelecting(false)
        }
      }
      const handler = (e: MouseEvent) => {
        const progress = getProgress(e.clientX)
        const songTime = progress * player.getDuration()
        if (rangeSelecting) {
          rangeSelection.current = { start: rangeSelection.current?.start ?? 0, end: songTime }
        } else {
          player.seek(songTime)
        }
      }

      window.addEventListener('mousemove', handler)
      window.addEventListener('mouseup', handleUp)
      return () => {
        window.removeEventListener('mousemove', handler)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [mousePressed, rangeSelecting])

  return (
    <div
      ref={wrapperRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'absolute',
        borderBottom: 'black solid 1px',
      }}
      onMouseDown={(e) => {
        setMousePressed(true)
        if (!rangeSelecting) {
          seekPlayer(e)
          return
        }

        const progress = getProgress(e.clientX)
        const songTime = progress * player.getDuration()
        rangeSelection.current = { start: songTime, end: songTime }
      }}
      onMouseOver={() => setMouseOver(true)}
      onMouseOut={() => setMouseOver(false)}
      onMouseMove={(e: React.MouseEvent) => {
        if (measureSpanRef.current && timeSpanRef.current && toolTipRef.current) {
          const progress = getProgress(e.clientX)
          const songTime = progress * player.getDuration()
          const measure = player.getMeasureForTime(songTime)
          toolTipRef.current.style.left = `${Math.min(
            width - 150,
            e.clientX - startX.current + 10,
          )}px`
          measureSpanRef.current.innerText = String(measure?.number)
          timeSpanRef.current.innerText = formatTime(player.getRealTimeDuration(0, songTime))
        }
      }}
    >
      <div ref={measureRef} style={{ width: '100%', height: '100%', position: 'absolute' }} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: width,
            backgroundColor: '#B0B0B0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: 'calc(100%)',
            width: width,
            pointerEvents: 'none',
            backgroundColor: 'white',
            left: -width,
          }}
          className="scrubBar"
          ref={divRef}
        />
      </div>
      <span
        ref={currentTimeRef}
        style={{ position: 'absolute', bottom: 1, left: 4, color: '#242632', fontSize: 20 }}
      ></span>
      <span style={{ position: 'absolute', bottom: 1, right: 4, color: '#242632', fontSize: 20 }}>
        {song && formatTime(player.getRealTimeDuration(0, song.duration))}
      </span>
      <div
        style={{
          display: mouseOver ? 'flex' : 'none',
          position: 'absolute',
          left: 100,
          top: -45,
          height: '42px',
          width: '150px',
          backgroundColor: 'black',
          zIndex: 6,
        }}
        ref={toolTipRef}
      >
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 7,
            color: 'white',
            verticalAlign: 'center',
            fontSize: 12,
          }}
        >
          Time: <span ref={timeSpanRef} style={{ color: 'green' }} />
        </span>
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 7,
            color: 'white',
            verticalAlign: 'center',
            fontSize: 12,
          }}
        >
          Measure: <span ref={measureSpanRef} style={{ color: 'green' }} />
        </span>
      </div>
      {rangeSelection.current && (
        <div
          ref={rangeRef}
          style={{
            position: 'absolute',
            border: '2px solid orange',
            top: '-2px',
            height: 30,
          }}
        ></div>
      )}
    </div>
  )
}

export default App
