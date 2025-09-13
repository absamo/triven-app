import { Menu, UnstyledButton } from "@mantine/core"
import { IconDots } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface TableActionsMenuProps {
    /** The ID of the item being hovered */
    itemId: string | undefined | null
    /** The ID of the currently hovered row */
    hoveredRowId: string | undefined | null
    /** The menu items to display */
    children: ReactNode
    /** Custom width for the menu dropdown */
    menuWidth?: number
    /** Custom position for the menu */
    position?: "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end"
    /** Whether to render the menu within a portal */
    withinPortal?: boolean
    /** Custom button size */
    buttonSize?: number
    /** Custom icon size */
    iconSize?: number
    /** Custom icon color */
    iconColor?: string
    /** Custom opacity when not hovered */
    inactiveOpacity?: number
    /** Custom opacity when hovered */
    activeOpacity?: number
}

export function TableActionsMenu({
    itemId,
    hoveredRowId,
    children,
    menuWidth,
    position = "bottom-end",
    withinPortal = true,
    buttonSize = 32,
    iconSize = 20,
    iconColor = "#868e96",
    inactiveOpacity = 0.2,
    activeOpacity = 1,
}: TableActionsMenuProps) {
    const isHovered = hoveredRowId === itemId

    return (
        <Menu
            withinPortal={withinPortal}
            position={position}
            shadow="md"
            width={menuWidth}
        >
            <Menu.Target>
                <UnstyledButton
                    style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: buttonSize,
                        height: buttonSize,
                        opacity: isHovered ? activeOpacity : inactiveOpacity,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <IconDots size={iconSize} color={iconColor} />
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                {children}
            </Menu.Dropdown>
        </Menu>
    )
}
