import { IconInput } from './types'

function MusicalNoteIcon({ width, height, style, className, onClick }: IconInput) {
  return (
    <svg
      width={width}
      height={height}
      style={style}
      className={className}
      onClick={onClick}
      viewBox="0 0 42 43"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M38.5547 0.414062L12.3047 8.125C11.2383 8.53516 10.5 9.51953 10.5 10.668V32.0781C9.59766 31.9141 8.77734 31.832 7.875 31.75C3.52734 31.75 0 34.1289 0 37C0 39.9531 3.52734 42.25 7.875 42.25C12.2227 42.25 15.75 39.9531 15.75 37V17.8867L36.75 11.7344V26.8281C35.8477 26.6641 35.0273 26.582 34.125 26.5C29.7773 26.5 26.25 28.8789 26.25 31.75C26.25 34.7031 29.7773 37 34.125 37C38.4727 37 42 34.7031 42 31.75V2.875C41.918 1.48047 40.7695 0.332031 39.375 0.332031C39.0469 0.332031 38.8008 0.332031 38.5547 0.414062Z"
        fill="#7029FA"
      />
    </svg>
  )
}

export default MusicalNoteIcon
