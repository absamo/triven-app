import { rem } from '@mantine/core'

interface CgIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string
}

export default function CgIcon({ size = 20, style, ...others }: CgIconProps) {
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
        <path fill="#ffda44" d="M384 0h128v128L352 352 128 512H0V384l160-224Z" />
        <path fill="#6da544" d="M0 384 384 0H0Z" />
        <path fill="#d80027" d="M512 128 128 512h384z" />
      </g>
    </svg>
  )
}
