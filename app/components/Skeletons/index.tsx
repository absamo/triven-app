import { Card, Container, Grid, Group, Paper, Skeleton, Stack } from "@mantine/core";

/**
 * Skeleton for loading cards/stats
 */
export function CardSkeleton() {
    return (
        <Card withBorder padding="lg" radius="md" style={{ height: '140px' }}>
            <Stack gap="xs">
                <Skeleton height={12} width="92%" />
                <Skeleton height={24} width="78%" />
                <Skeleton height={10} width="98%" />
            </Stack>
        </Card>
    );
}

/**
 * Skeleton for loading a grid of cards
 */
export function CardsGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <Grid gutter="lg" mb="xl">
            {[...Array(count)].map((_, index) => (
                <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                    <CardSkeleton />
                </Grid.Col>
            ))}
        </Grid>
    );
}

/**
 * Skeleton for form filters
 */
export function FiltersSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <Paper withBorder p="xl" mb="xl" radius="md">
            <Stack gap="md">
                {/* Filter header skeleton */}
                <Group justify="space-between">
                    <Group>
                        <Skeleton height={32} width={32} radius="md" />
                        <Skeleton height={20} width={190} />
                    </Group>
                    <Skeleton height={24} width={140} />
                </Group>

                {/* Filter inputs skeleton */}
                <Grid gutter="md">
                    {[...Array(columns)].map((_, index) => (
                        <Grid.Col key={index} span={{ base: 12, sm: 6, md: 12 / columns }}>
                            <Skeleton height={36} />
                        </Grid.Col>
                    ))}
                </Grid>
            </Stack>
        </Paper>
    );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton() {
    return (
        <Card
            shadow="sm"
            padding="xl"
            radius="lg"
            withBorder
            mb="md"
        >
            {/* Header */}
            <Group justify="space-between" mb="md">
                <Group>
                    <Skeleton height={48} width={48} radius="md" />
                    <Stack gap={4}>
                        <Skeleton height={20} width={340} />
                        <Skeleton height={12} width={210} />
                    </Stack>
                </Group>
                <Group gap="xs">
                    <Skeleton height={28} width={145} radius="xl" />
                    <Skeleton height={32} width={165} radius="xl" />
                </Group>
            </Group>

            {/* Description */}
            <Skeleton height={14} width="92%" mb="md" />

            {/* Metadata Grid */}
            <Grid gutter="md" mb="md">
                {[...Array(4)].map((_, index) => (
                    <Grid.Col key={index} span={3}>
                        <Group gap="xs">
                            <Skeleton height={24} width={24} radius="sm" />
                            <Stack gap={2}>
                                <Skeleton height={10} width={135} />
                                <Skeleton height={14} width={165} />
                            </Stack>
                        </Group>
                    </Grid.Col>
                ))}
            </Grid>

            {/* Details Panel */}
            <Paper p="md" withBorder radius="md" mb="md">
                <Skeleton height={16} width={230} mb="xs" />
                <Group gap="lg">
                    {[...Array(3)].map((_, index) => (
                        <Stack key={index} gap={2}>
                            <Skeleton height={10} width={105} />
                            <Skeleton height={14} width={145} />
                        </Stack>
                    ))}
                </Group>
            </Paper>

            {/* Comments and Actions */}
            <Group justify="space-between">
                <Group gap="xs">
                    <Skeleton height={24} width={24} radius="sm" />
                    <Skeleton height={14} width={145} />
                </Group>
                <Group gap="sm">
                    <Skeleton height={32} width={115} radius="md" />
                    <Skeleton height={32} width={115} radius="md" />
                </Group>
            </Group>
        </Card>
    );
}

/**
 * Skeleton for a complete table
 */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <Stack gap="md">
            {[...Array(rows)].map((_, index) => (
                <TableRowSkeleton key={index} />
            ))}
        </Stack>
    );
}

/**
 * Skeleton for chat messages
 */
export function ChatMessageSkeleton() {
    return (
        <Stack gap="xs">
            <Skeleton height={8} radius="xl" />
            <Skeleton height={8} width="85%" radius="xl" />
            <Skeleton height={8} width="60%" radius="xl" />
        </Stack>
    );
}

/**
 * Skeleton for form fields
 */
export function FormFieldSkeleton() {
    return (
        <Stack gap="xs">
            <Skeleton height={14} width="45%" />
            <Skeleton height={36} />
        </Stack>
    );
}

/**
 * Skeleton for a complete form
 */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
    return (
        <Grid>
            {[...Array(fields)].map((_, index) => (
                <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                    <FormFieldSkeleton />
                </Grid.Col>
            ))}
        </Grid>
    );
}

/**
 * Skeleton for text content
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <Stack gap="xs">
            {[...Array(lines)].map((_, index) => (
                <Skeleton
                    key={index}
                    height={14}
                    width={index === lines - 1 ? "60%" : "100%"}
                />
            ))}
        </Stack>
    );
}

/**
 * Complete page skeleton with common layout
 */
export function PageSkeleton() {
    return (
        <Container size="xl" py="md">
            {/* Summary Cards */}
            <CardsGridSkeleton count={4} />

            {/* Filters */}
            <FiltersSkeleton columns={4} />

            {/* Table */}
            <TableSkeleton rows={6} />
        </Container>
    );
}