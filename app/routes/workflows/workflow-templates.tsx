import { Badge, Button, Container, Group, Paper, Text, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

export default function WorkflowTemplatesPage() {
  const { t } = useTranslation('workflowTemplates')

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>{t('title')}</Title>
          <Text c="dimmed">{t('subtitle')}</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />}>{t('newTemplate')}</Button>
      </Group>

      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Title order={3} c="dimmed" mb="sm">
          {t('templatesSection.title')}
        </Title>
        <Text c="dimmed" mb="md">
          {t('templatesSection.description')}
        </Text>
        <Badge color="blue" variant="light">
          {t('templatesSection.developmentBadge')}
        </Badge>
      </Paper>
    </Container>
  )
}
