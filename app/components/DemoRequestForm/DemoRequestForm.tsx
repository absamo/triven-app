import {
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCalendarCheck, IconCheck, IconMail } from '@tabler/icons-react'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from 'react-router'

import {
  demoRequestFormSchema,
  type IDemoRequest,
} from '~/app/common/validations/demoRequestSchema'
import classes from './DemoRequestForm.module.css'

interface DemoRequestFormProps {
  onSuccess?: () => void
  errors?: Record<string, string>
}

export default function DemoRequestForm({ onSuccess, errors }: DemoRequestFormProps) {
  const { t } = useTranslation(['demo', 'common'])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const navigation = useNavigation()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Get user's timezone
  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'UTC'
    }
  }

  // Generate time slots (9:00 to 18:00 in 30-minute intervals, 24-hour format)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break // Stop at 18:00
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({ value: time, label: time })
      }
    }
    return slots
  }

  const form = useForm({
    validate: zodResolver(demoRequestFormSchema),
    initialValues: {
      name: '',
      workEmail: '',
      companyName: '',
      phoneNumber: '',
      companySize: '' as IDemoRequest['companySize'],
      preferredDate: null as Date | null,
      preferredTime: '',
      timezone: getUserTimezone(),
      message: '',
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true)
    try {
      // Convert date to ISO string for API
      const submitData = {
        ...values,
        preferredDate: values.preferredDate
          ? (values.preferredDate instanceof Date
              ? values.preferredDate
              : new Date(values.preferredDate)
            ).toISOString()
          : null,
      }

      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const responseData = await response.json()
        setIsSubmitted(true)
        form.reset()
        onSuccess?.()
      } else {
        const errorData = await response.json()
        notifications.show({
          title: t('common:error'),
          message: errorData.message || t('demo:submitError'),
          color: 'red',
          autoClose: false,
        })
      }
    } catch (error) {
      notifications.show({
        title: t('common:error'),
        message: t('demo:networkError'),
        color: 'red',
        autoClose: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card shadow="sm" padding="md" radius="md" className={classes.successMessage}>
        <Stack align="center" gap="md">
          <ThemeIcon
            size={64}
            radius="xl"
            color="teal"
            variant="light"
            style={{
              '--ti-color': 'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
            }}
          >
            <IconCalendarCheck size={32} />
          </ThemeIcon>
          <div style={{ textAlign: 'center' }}>
            <Title
              order={2}
              mb="sm"
              style={{
                color: 'light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))',
              }}
            >
              Demo Scheduled Successfully!
            </Title>
            <Text size="lg" c="dimmed" mb="xl">
              We've received your demo request for <strong>{form.values.companyName}</strong>. A
              confirmation email will be sent to <strong>{form.values.workEmail}</strong> within the
              next 2 hours.
            </Text>
          </div>
          <Card withBorder padding="md" radius="sm" w="100%">
            <Stack gap="sm">
              {/* Header row */}
              <Group gap="xs" align="center">
                <IconMail
                  size={18}
                  style={{
                    color: 'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
                  }}
                />
                <Text
                  fw={600}
                  style={{
                    color: 'light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))',
                  }}
                >
                  What happens next?
                </Text>
              </Group>

              {/* List items */}
              <Stack gap="xs">
                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <div
                    style={{
                      width: '18px',
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <ThemeIcon
                      size={16}
                      radius="xl"
                      color="teal"
                      variant="light"
                      style={{
                        '--ti-color':
                          'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
                      }}
                    >
                      <IconCheck size={10} />
                    </ThemeIcon>
                  </div>
                  <Text size="sm" style={{ flex: 1 }}>
                    Our team will review your preferred time slot and send you a calendar invitation
                  </Text>
                </Group>

                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <div
                    style={{
                      width: '18px',
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <ThemeIcon
                      size={16}
                      radius="xl"
                      color="teal"
                      variant="light"
                      style={{
                        '--ti-color':
                          'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
                      }}
                    >
                      <IconCheck size={10} />
                    </ThemeIcon>
                  </div>
                  <Text size="sm" style={{ flex: 1 }}>
                    You'll receive an email confirmation with meeting details and agenda
                  </Text>
                </Group>

                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <div
                    style={{
                      width: '18px',
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <ThemeIcon
                      size={16}
                      radius="xl"
                      color="teal"
                      variant="light"
                      style={{
                        '--ti-color':
                          'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
                      }}
                    >
                      <IconCheck size={10} />
                    </ThemeIcon>
                  </div>
                  <Text size="sm" style={{ flex: 1 }}>
                    If your preferred time isn't available, we'll suggest alternative slots
                  </Text>
                </Group>

                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <div
                    style={{
                      width: '18px',
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <ThemeIcon
                      size={16}
                      radius="xl"
                      color="teal"
                      variant="light"
                      style={{
                        '--ti-color':
                          'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
                      }}
                    >
                      <IconCheck size={10} />
                    </ThemeIcon>
                  </div>
                  <Text size="sm" style={{ flex: 1 }}>
                    A product specialist will prepare a personalized demo for your business needs
                  </Text>
                </Group>
              </Stack>
            </Stack>
          </Card>{' '}
          <Group gap="sm" mt="md">
            <Button
              component="a"
              href="/pricing"
              style={{
                '--button-bg':
                  'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-6))',
                '--button-hover':
                  'light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-7))',
              }}
              variant="filled"
              size="sm"
            >
              View Pricing Plans
            </Button>
            <Button
              component="a"
              href="/"
              style={{
                '--button-color':
                  'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
                '--button-border':
                  'light-dark(var(--mantine-color-teal-5), var(--mantine-color-teal-4))',
              }}
              variant="outline"
              size="sm"
            >
              Learn More
            </Button>
          </Group>
          <Text size="xs" c="dimmed" ta="center" mt="lg">
            Questions? Contact us at{' '}
            <Text
              component="span"
              style={{
                color: 'light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))',
              }}
              fw={500}
            >
              sales@triven.com
            </Text>{' '}
            or call{' '}
            <Text
              component="span"
              style={{
                color: 'light-dark(var(--mantine-color-teal-6), var(--mantine-color-teal-4))',
              }}
              fw={500}
            >
              +1 (555) 123-4567
            </Text>
          </Text>
        </Stack>
      </Card>
    )
  }

  // Show static content during SSR and initial hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <div className={classes.formContainer}>
        <h2 className={classes.title}>Schedule Your Demo</h2>
        <form className={classes.form}>
          <Stack gap="md">
            <TextInput withAsterisk label="Name" placeholder="Enter your name" />
            <TextInput withAsterisk label="Work Email" placeholder="example@company.com" />
            <TextInput withAsterisk label="Company Name" placeholder="Your company name" />
            <TextInput label="Phone Number" placeholder="Your phone number" />
            <Select
              withAsterisk
              label="Company Size"
              placeholder="Select Company Size"
              data={[
                { value: '1-10', label: '1-10 employees' },
                { value: '11-50', label: '11-50 employees' },
                { value: '51-200', label: '51-200 employees' },
                { value: '201-500', label: '201-500 employees' },
                { value: '501+', label: '501+ employees' },
              ]}
            />
            <DatePickerInput
              withAsterisk
              label="Preferred Date"
              placeholder="Select demo date"
              minDate={new Date()}
            />
            <Textarea
              label="Additional Message"
              placeholder="Tell us about your specific needs..."
              minRows={3}
            />
            <Button type="submit" fullWidth mt="md">
              Schedule My Demo
            </Button>
          </Stack>
        </form>
      </div>
    )
  }

  return (
    <div className={classes.formContainer}>
      <h2 className={classes.title}>Schedule Your Demo</h2>

      <form onSubmit={form.onSubmit(handleSubmit)} className={classes.form}>
        <Stack gap="md">
          <TextInput
            withAsterisk
            label={t('demo:name')}
            placeholder={t('demo:namePlaceholder')}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <TextInput
            withAsterisk
            label={t('demo:workEmail')}
            placeholder={t('demo:workEmailPlaceholder')}
            key={form.key('workEmail')}
            {...form.getInputProps('workEmail')}
          />

          <TextInput
            withAsterisk
            label={t('demo:companyName')}
            placeholder={t('demo:companyNamePlaceholder')}
            key={form.key('companyName')}
            {...form.getInputProps('companyName')}
          />

          <TextInput
            label={t('demo:phoneNumber')}
            placeholder={t('demo:phoneNumberPlaceholder')}
            key={form.key('phoneNumber')}
            {...form.getInputProps('phoneNumber')}
          />

          <Select
            withAsterisk
            label={t('demo:companySize')}
            placeholder={t('demo:companySizePlaceholder')}
            data={[
              { value: '1-10', label: t('demo:companySize1to10') },
              { value: '11-50', label: t('demo:companySize11to50') },
              { value: '51-200', label: t('demo:companySize51to200') },
              { value: '201-500', label: t('demo:companySize201to500') },
              { value: '501+', label: t('demo:companySize501plus') },
            ]}
            key={form.key('companySize')}
            {...form.getInputProps('companySize')}
          />

          <DatePickerInput
            withAsterisk
            label={t('demo:preferredDate')}
            placeholder={t('demo:preferredDatePlaceholder')}
            minDate={new Date()}
            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
            excludeDate={(date) => {
              const dateObj = typeof date === 'string' ? new Date(date) : date
              return dateObj.getDay() === 0 || dateObj.getDay() === 6 // Exclude weekends
            }}
            key={form.key('preferredDate')}
            {...form.getInputProps('preferredDate')}
          />

          {form.values.preferredDate && (
            <div>
              <Text size="sm" fw={500} mb="xs">
                {t('demo:preferredTime')} ({t('demo:timeFormat')})
              </Text>
              <SimpleGrid cols={3} spacing="xs">
                {generateTimeSlots().map((slot) => (
                  <Button
                    key={slot.value}
                    variant={form.values.preferredTime === slot.value ? 'filled' : 'light'}
                    size="xs"
                    rightSection={
                      form.values.preferredTime === slot.value ? <IconCheck size={14} /> : null
                    }
                    onClick={() => form.setFieldValue('preferredTime', slot.value)}
                  >
                    {slot.label}
                  </Button>
                ))}
              </SimpleGrid>
            </div>
          )}

          <Textarea
            label={t('demo:message')}
            placeholder={t('demo:messagePlaceholder')}
            minRows={3}
            key={form.key('message')}
            {...form.getInputProps('message')}
          />

          <Button type="submit" fullWidth loading={isLoading} mt="md">
            {isLoading ? t('demo:submitButtonLoading') : t('demo:submitButton')}
          </Button>
        </Stack>
      </form>
    </div>
  )
}
