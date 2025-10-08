import AdIcon from './AdIcon'
import AeIcon from './AeIcon'

interface CountryIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  isoCode: string
  size?: number
}

export default function CountryIcon({ isoCode, size = 20 }: CountryIconProps) {
  switch (isoCode) {
    case 'AD':
      return <AdIcon size={size} />
    case 'AE':
      return <AeIcon size={size} />
    default:
  }
}
