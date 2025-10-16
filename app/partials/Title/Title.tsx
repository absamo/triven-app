import {
  type TitleOrder,
  ActionIcon,
  Anchor,
  Button,
  Center,
  Flex,
  Group,
  Title as MantineTitle,
  Paper,
  Stack,
  Text,
  rem,
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { type To, Link } from 'react-router'

import classes from '~/app/partials/Title/Title.module.css'

interface TitleProps {
  children: React.ReactNode
  description?: string
  order?: TitleOrder
  to?: To
  backTo?: string
  canCreate?: boolean
  createLabel?: string
  filter?: string
  additionalButtons?: React.ReactNode
  sticky?: boolean
}

export default function Title({
  children,
  description,
  order = 1,
  to,
  backTo,
  canCreate,
  createLabel,
  filter,
  additionalButtons,
  sticky = true,
}: TitleProps) {
  const { t } = useTranslation(['common'])

  // Use translated "Create" if no custom createLabel is provided
  const buttonLabel = createLabel || t('common:create')

  return (
    <Paper
      radius={0}
      className={sticky ? classes.titleContainer : classes.nonSticky}
      pt={sticky ? 20 : 0}
      pb={sticky ? 20 : 0}
      mb={15}
    >
      <Flex justify="space-between" align="flex-start" gap="md">
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group justify="flex-start" align="center">
            {backTo && (
              <Anchor component={Link} to={backTo}>
                <Center>
                  <ActionIcon variant="light" radius="xl" size="xl" className={classes.backButton}>
                    <IconArrowLeft style={{ width: rem(24), height: rem(24) }} stroke={1.5} />
                  </ActionIcon>
                </Center>
              </Anchor>
            )}
            <MantineTitle order={order} p={0} className={classes.titleText}>
              {children}
            </MantineTitle>
          </Group>
          {description && (
            <Text size="sm" c="dimmed" ml={backTo ? 56 : 0}>
              {description}
            </Text>
          )}
        </Stack>
        <Group>
          {additionalButtons}
          {to && canCreate && (
            <Button component={Link} to={to}>
              {buttonLabel}
            </Button>
          )}
        </Group>
      </Flex>
    </Paper>
  )
}
