import { IconInput } from './types'

function SoundOff({ width, height, style, className, onClick }: IconInput) {
  return (
    <svg
      width={width}
      height={height}
      style={style}
      className={className}
      onClick={onClick}
      viewBox="0 0 26 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.0781 1.375L11.4297 1.73055L11.4317 1.72855L11.0781 1.375ZM6.90625 5.5V6H7.1117L7.2578 5.85555L6.90625 5.5ZM6.90625 14.5L7.2598 14.1464L7.11336 14H6.90625V14.5ZM22.6094 10L22.2597 9.64258L21.8984 9.99609L22.2558 10.3536L22.6094 10ZM24.7656 7.89062L25.1153 8.24806L25.1192 8.24418L24.7656 7.89062ZM22.6094 5.73438L22.2558 5.3808L22.252 5.38473L22.6094 5.73438ZM20.5 7.89062L20.1464 8.24418L20.5039 8.60164L20.8574 8.24027L20.5 7.89062ZM16.1875 7.89062L15.8339 8.2442L15.8379 8.24804L16.1875 7.89062ZM18.3438 10L18.6973 10.3536L19.0548 9.99609L18.6934 9.64258L18.3438 10ZM20.5 12.1562L20.8574 11.8066L20.5039 11.4452L20.1464 11.8027L20.5 12.1562ZM22.6094 14.3125L22.2519 14.6622L22.2558 14.6661L22.6094 14.3125ZM10.7266 1.01945L6.5547 5.14445L7.2578 5.85555L11.4297 1.73055L10.7266 1.01945ZM6.90625 5H2.125V6H6.90625V5ZM2.125 5C1.17904 5 0.5 5.75324 0.5 6.625H1.5C1.5 6.27801 1.75846 6 2.125 6V5ZM0.5 6.625V13.375H1.5V6.625H0.5ZM0.5 13.375C0.5 14.3074 1.19261 15 2.125 15V14C1.74489 14 1.5 13.7551 1.5 13.375H0.5ZM2.125 15H6.90625V14H2.125V15ZM6.5527 14.8536L10.7246 19.0254L11.4317 18.3183L7.2598 14.1464L6.5527 14.8536ZM10.7246 19.0254C11.7308 20.0317 13.5 19.3684 13.5 17.875H12.5C12.5 18.4441 11.8317 18.7183 11.4317 18.3183L10.7246 19.0254ZM13.5 17.875V2.17188H12.5V17.875H13.5ZM13.5 2.17188C13.5 0.678444 11.7308 0.0152154 10.7246 1.02145L11.4317 1.72855C11.8317 1.32853 12.5 1.60281 12.5 2.17188H13.5ZM22.959 10.3574L25.1153 8.24804L24.416 7.53321L22.2597 9.64258L22.959 10.3574ZM25.1192 8.24418C25.5957 7.76767 25.5957 6.93546 25.1192 6.45895L24.4121 7.16605C24.4981 7.25204 24.4981 7.45108 24.4121 7.53707L25.1192 8.24418ZM25.1192 6.45895L24.0411 5.38082L23.3339 6.08793L24.4121 7.16605L25.1192 6.45895ZM24.0411 5.38082C23.5645 4.90431 22.7323 4.90431 22.2558 5.38082L22.9629 6.08793C23.0489 6.00194 23.248 6.00194 23.3339 6.08793L24.0411 5.38082ZM22.252 5.38473L20.1426 7.54098L20.8574 8.24027L22.9668 6.08402L22.252 5.38473ZM20.8536 7.53707L18.6973 5.38082L17.9902 6.08793L20.1464 8.24418L20.8536 7.53707ZM18.6973 5.38082C18.2208 4.90431 17.3886 4.90431 16.9121 5.38082L17.6192 6.08793C17.7052 6.00194 17.9042 6.00194 17.9902 6.08793L18.6973 5.38082ZM16.9121 5.38082L15.8339 6.45895L16.5411 7.16605L17.6192 6.08793L16.9121 5.38082ZM15.8339 6.45895C15.3574 6.93546 15.3574 7.76767 15.8339 8.24418L16.5411 7.53707C16.4551 7.45108 16.4551 7.25204 16.5411 7.16605L15.8339 6.45895ZM15.8379 8.24804L17.9941 10.3574L18.6934 9.64258L16.5371 7.53321L15.8379 8.24804ZM17.9902 9.64645L15.8339 11.8027L16.5411 12.5098L18.6973 10.3536L17.9902 9.64645ZM15.8339 11.8027C15.3574 12.2792 15.3574 13.1114 15.8339 13.5879L16.5411 12.8808C16.4551 12.7948 16.4551 12.5958 16.5411 12.5098L15.8339 11.8027ZM15.8339 13.5879L16.9121 14.6661L17.6192 13.9589L16.5411 12.8808L15.8339 13.5879ZM16.9121 14.6661C17.3886 15.1426 18.2208 15.1426 18.6973 14.6661L17.9902 13.9589C17.9042 14.0449 17.7052 14.0449 17.6192 13.9589L16.9121 14.6661ZM18.6973 14.6661L20.8536 12.5098L20.1464 11.8027L17.9902 13.9589L18.6973 14.6661ZM20.1426 12.5059L22.252 14.6621L22.9668 13.9629L20.8574 11.8066L20.1426 12.5059ZM22.2558 14.6661C22.7323 15.1426 23.5645 15.1426 24.0411 14.6661L23.3339 13.9589C23.248 14.0449 23.0489 14.0449 22.9629 13.9589L22.2558 14.6661ZM24.0411 14.6661L25.1192 13.5879L24.4121 12.8808L23.3339 13.9589L24.0411 14.6661ZM25.1192 13.5879C25.5957 13.1114 25.5957 12.2792 25.1192 11.8027L24.4121 12.5098C24.4981 12.5958 24.4981 12.7948 24.4121 12.8808L25.1192 13.5879ZM25.1192 11.8027L22.9629 9.64645L22.2558 10.3536L24.4121 12.5098L25.1192 11.8027Z"
        fill="#B29BDF"
      />
    </svg>
  )
}

export default SoundOff
