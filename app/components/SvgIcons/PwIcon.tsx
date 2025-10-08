import { rem } from '@mantine/core'

interface PwIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string
}

export default function PwIcon({ size = 20, style, ...others }: PwIconProps) {
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
        <path fill="#338af3" d="M0 0h512v512H0z" />
        <circle cx="200.3" cy="256" r="111.3" fill="#ffda44" />
      </g>
    </svg>
  )
}
