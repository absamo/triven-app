import { rem } from '@mantine/core'

interface HuIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string
}

export default function HuIcon({ size = 20, style, ...others }: HuIconProps) {
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
        <path fill="#eee" d="m0 167 253.8-19.3L512 167v178l-254.9 32.3L0 345z" />
        <path fill="#d80027" d="M0 0h512v167H0z" />
        <path fill="#6da544" d="M0 345h512v167H0z" />
      </g>
    </svg>
  )
}
