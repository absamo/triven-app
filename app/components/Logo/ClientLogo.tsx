import { useEffect, useState } from "react"
import Logo, { type LogoProps } from "./Logo"

export default function ClientLogo(props: LogoProps) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        // Return null during SSR to prevent hydration mismatches
        return null
    }

    return <Logo {...props} />
}
