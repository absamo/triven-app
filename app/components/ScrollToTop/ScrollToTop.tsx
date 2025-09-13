import { ActionIcon, rem } from "@mantine/core"
import { useWindowScroll } from "@mantine/hooks"
import { IconArrowUp } from "@tabler/icons-react"
import classes from "./ScrollToTop.module.css"

export default function ScrollToTop() {
    const [scroll, scrollTo] = useWindowScroll()

    // Show scroll to top button when scrolled down more than 70px
    const showScrollButton = scroll.y > 50

    const handleScrollToTop = () => {
        scrollTo({ y: 0 })
    }

    if (!showScrollButton) return null

    return (
        <ActionIcon
            onClick={handleScrollToTop}
            size={40}
            radius="xl"
            variant="filled"
            aria-label="Scroll to top"
            className={classes.scrollToTopButton}
        >
            <IconArrowUp style={{ width: rem(20), height: rem(20) }} />
        </ActionIcon>
    )
}
