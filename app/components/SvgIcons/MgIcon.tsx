import { rem } from "@mantine/core"

interface MgIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string
}

export default function MgIcon({ size = 20, style, ...others }: MgIconProps) {
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
        <path fill="#eee" d="M0 0h167l45.6 257.6L167.1 512H0z" />
        <path fill="#d80027" d="M167 0h345v256l-176.7 53.5L166.9 256z" />
        <path fill="#6da544" d="M167 256h345v256H167z" />
      </g>
    </svg>
  )
}
