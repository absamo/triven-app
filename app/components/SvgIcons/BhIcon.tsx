import { rem } from "@mantine/core"

interface BhIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number | string
}

export default function BhIcon({ size = 20, style, ...others }: BhIconProps) {
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
        <path fill="#eee" d="M0 0h182.5l88.1 268.5-88 243.5H0z" />
        <path
          fill="#d80027"
          d="m182.5 0-82.3 42.7 82.3 42.7-82.3 42.6 82.3 42.7-82.3 42.7 82.3 42.6-82.3 42.7 82.3 42.7-82.3 42.6 82.3 42.7-82.3 42.7 82.3 42.6H512V0H182.5z"
        />
      </g>
    </svg>
  )
}
