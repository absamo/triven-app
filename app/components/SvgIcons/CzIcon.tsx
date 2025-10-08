import { rem } from '@mantine/core'

interface CzIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string
}

export default function CzIcon({ size = 20, style, ...others }: CzIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="512"
      height="512"
      style={{ width: rem(size), height: rem(size), ...style }}
      {...others}
      viewBox="0 0 512 512"
    >
      <mask id="a">
        <circle cx="256" cy="256" r="256" fill="#fff" />
      </mask>
      <g mask="url(#a)">
        <path fill="#eee" d="M0 0h512v256l-265 45.2z" />
        <path fill="#d80027" d="M210 256h302v256H0z" />
        <path fill="#0052b4" d="M0 0v512l256-256L0 0z" />
      </g>
    </svg>
  )
}
