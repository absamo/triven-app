import { Box } from "@mantine/core"

interface WaveLogoProps {
    size?: number
    color?: string
}

export default function WaveLogo({ size = 64, color = "#4C8CFF" }: WaveLogoProps) {
    return (
        <Box style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M8 32C8 32 16 20 24 20C32 20 32 32 40 32C48 32 56 20 56 20"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M8 44C8 44 16 32 24 32C32 32 32 44 40 44C48 44 56 32 56 32"
                    stroke={color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </Box>
    )
}
