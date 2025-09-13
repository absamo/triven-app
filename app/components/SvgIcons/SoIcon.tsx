import { rem } from "@mantine/core"

interface SoIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string
}

export default function SoIcon({ size = 20, style, ...others }: SoIconProps) {
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
        <path
          fill="#eee"
          d="m256 133.6 27.6 85H373L300.7 271l27.6 85-72.3-52.5-72.3 52.6 27.6-85-72.3-52.6h89.4z"
        />
      </g>
    </svg>
  )
}
