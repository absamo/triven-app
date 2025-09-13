import { Flex, Text, Button } from "@mantine/core"
import classes from "./SettingsTitle.module.css"
interface SettingsTitleProps {
  title?: string
  description?: string
  onClick: () => void
}

export default function SettingsTitle({
  title,
  description,
  onClick,
}: SettingsTitleProps) {
  return (
    <Flex align="center" justify="space-between">
      <div>
        <Text size="sm">{title}</Text>
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      </div>

      <Button
        onClick={onClick}
        className={classes.editButton}
        size="compact-sm"
      >
        Add currency
      </Button>
    </Flex>
  )
}
