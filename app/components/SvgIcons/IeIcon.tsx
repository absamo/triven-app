import { rem } from '@mantine/core'

interface IeIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string
}

export default function IeIcon({ size = 20, style, ...others }: IeIconProps) {
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
        <path fill="#eee" d="M167 0h178l25.9 252.3L345 512H167l-29.8-253.4z" />
        <path fill="#6da544" d="M0 0h167v512H0z" />
        <path fill="#ff9811" d="M345 0h167v512H345z" />
      </g>
    </svg>
  )
}
