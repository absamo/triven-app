import { rem } from "@mantine/core"

interface PeIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string
}

export default function PeIcon({ size = 20, style, ...others }: PeIconProps) {
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
        <path
          fill="#d80027"
          d="M0 0h167l86 41.2L345 0h167v512H345l-87.9-41.4L167 512H0z"
        />
        <path fill="#eee" d="M167 0h178v512H167z" />
      </g>
    </svg>
  )
}
