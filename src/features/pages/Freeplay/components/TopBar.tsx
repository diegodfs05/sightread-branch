import React, { MouseEvent } from 'react'
import { Select } from '@/components'
import { formatInstrumentName } from '@/utils'
import { gmInstruments, InstrumentName } from '@/features/synth'
import { ArrowLeft, Midi } from '@/icons'
import { ButtonWithTooltip } from '../../PlaySong/components/TopBar'
import Link from 'next/link'

type TopBarProps = {
  isError: boolean
  isLoading: boolean
  value: InstrumentName
  onChange: (instrument: InstrumentName) => void
  onClickMidi: (e: MouseEvent<any>) => void
}

export default function TopBar({ isError, isLoading, value, onChange, onClickMidi }: TopBarProps) {
  return (
    <div className="px-4 text-white transition text-2xl h-[50px] min-h-[50px] w-full bg-[#292929] flex items-center gap-4">
      <ButtonWithTooltip tooltip="Back">
        <Link href="/">
          <ArrowLeft size={24} />
        </Link>
      </ButtonWithTooltip>
      <ButtonWithTooltip tooltip="Choose a MIDI device" className="ml-auto" onClick={onClickMidi}>
        <Midi size={24} />
      </ButtonWithTooltip>
      <Select
        className="max-w-fit h-3/4 text-base text-black"
        loading={isLoading}
        error={isError}
        value={value}
        onChange={onChange}
        options={gmInstruments as any}
        format={formatInstrumentName as any}
        display={formatInstrumentName as any}
      />
    </div>
  )
}
