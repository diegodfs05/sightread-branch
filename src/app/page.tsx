import { AppBar, Sizer } from '@/components'
import Link from 'next/link'
import React from 'react'
import { FeaturedSongsPreview } from './home/FeaturedSongsPreview'

export default function Home() {
  return (
    <>
      <div className="relative flex min-h-[800px,100vh] w-full flex-col text-white">
        <AppBar />
        <div className="flex flex-col items-center bg-purple-primary p-8 text-center">
          <h1 className="text-reponsive2Xl font-bold">Your Piano Journey Begins Here</h1>
          <Sizer height={8} />
          <h3 className="text-reponsiveXl">
            Plug in your keyboard and learn, right in your browser
          </h3>
          <Sizer height={75 + 18} />
        </div>
        <Sizer height={60} />
        <FeaturedSongsPreview />
        <div
          style={{
            backgroundColor: 'rgba(220, 126, 82, 0.1)',
            marginTop: 'auto',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 24,
            paddingTop: 42,
            gap: 24,
          }}
        >
          <h3 className="text-black" style={{ fontSize: 'clamp(1rem, 1rem + 1vw, 2rem)' }}>
            Start learning
          </h3>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(min-content, 150px))',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Link href={'/songs'}>
              <Button className="bg-purple-primary text-white hover:bg-purple-hover">
                Learn a song
              </Button>
            </Link>
            <Link href={'/freeplay'}>
              <Button className="border border-purple-primary bg-white text-purple-primary hover:bg-purple-light">
                Free play
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

function Button({
  children,
  style,
  className,
}: {
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <button
      className={className}
      style={{
        transition: 'background-color 150ms',
        cursor: 'pointer',
        fontSize: 'clamp(0.875rem, 0.875rem + 0.5vw, 1.2rem)',
        padding: '10px 16px',
        borderRadius: 15,
        fontWeight: 700,
        minWidth: 'max-content',
        width: '100%',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
