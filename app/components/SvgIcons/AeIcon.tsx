import { rem } from '@mantine/core'

interface AeIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string
}

export default function AeIcon({ size = 20, style, ...others }: AeIconProps) {
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
        <path fill="#a2001d" d="M0 0h167l52.3 252L167 512H0z" />
        <path fill="#eee" d="m167 167 170.8-44.6L512 167v178l-173.2 36.9L167 345z" />
        <path fill="#6da544" d="M167 0h345v167H167z" />
        <path fill="#333" d="M167 345h345v167H167z" />
      </g>
    </svg>
  )
}
