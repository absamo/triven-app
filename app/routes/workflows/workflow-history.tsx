import { Badge, Container, Paper, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"

export default function WorkflowHistoryPage() {
    const { t } = useTranslation('workflowHistory')

    return (
        <Container size="xl" py="md">
            <div>
                <Title order={2} mb="xs">{t('title')}</Title>
                <Text c="dimmed" mb="xl">{t('subtitle')}</Text>
            </div>

            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
                <Title order={3} c="dimmed" mb="sm">{t('historySection.title')}</Title>
                <Text c="dimmed" mb="md">
                    {t('historySection.description')}
                </Text>
                <Badge color="blue" variant="light">
                    {t('historySection.developmentBadge')}
                </Badge>
            </Paper>
        </Container>
    )
}