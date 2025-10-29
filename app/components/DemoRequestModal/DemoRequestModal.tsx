// Demo Request Modal Component
// User Story 2: Frictionless Trial Signup
// Modal form for demo requests with full validation

import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconSend } from '@tabler/icons-react'
import { useState } from 'react'
import type { DemoRequestFormData } from '~/app/lib/landing/types'
import { demoRequestSchema } from '~/app/lib/landing/validators'
import classes from './DemoRequestModal.module.css'

interface DemoRequestModalProps {
  opened: boolean
  onClose: () => void
}

interface FormErrors {
  name?: string[]
  email?: string[]
  company?: string[]
  teamSize?: string[]
  preferredDemoTime?: string[]
  message?: string[]
}

export function DemoRequestModal({ opened, onClose }: DemoRequestModalProps) {
  const [formData, setFormData] = useState<DemoRequestFormData>({
    name: '',
    email: '',
    company: '',
    teamSize: '',
    preferredDemoTime: '',
    message: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const teamSizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501+', label: '501+ employees' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitError(null)
    setIsSubmitting(true)

    // Validate with Zod schema
    const validationResult = demoRequestSchema.safeParse(formData)

    if (!validationResult.success) {
      setErrors(validationResult.error.flatten().fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationResult.data),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setSubmitError('Too many requests. Please try again later.')
        } else if (data.errors) {
          setErrors(data.errors)
        } else {
          setSubmitError(data.message || 'Failed to submit demo request')
        }
        return
      }

      // Success
      setSubmitSuccess(true)

      // Close modal after 3 seconds
      setTimeout(() => {
        handleClose()
      }, 3000)
    } catch (error) {
      console.error('Demo request submission error:', error)
      setSubmitError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      teamSize: '',
      preferredDemoTime: '',
      message: '',
    })
    setErrors({})
    setSubmitError(null)
    setSubmitSuccess(false)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Request a Demo"
      size="md"
      centered
      classNames={{ title: classes.modalTitle }}
      trapFocus
      returnFocus
    >
      {submitSuccess ? (
        <Alert icon={<IconCheck size={20} />} color="green" title="Success!">
          Your demo request has been submitted. We'll contact you within 24 hours.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {submitError && (
              <Alert icon={<IconAlertCircle size={20} />} color="red" title="Error">
                {submitError}
              </Alert>
            )}

            {/* Name */}
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name?.join(', ')}
              disabled={isSubmitting}
              classNames={{ input: classes.input }}
            />

            {/* Email */}
            <TextInput
              label="Work Email"
              placeholder="john@company.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email?.join(', ')}
              disabled={isSubmitting}
              classNames={{ input: classes.input }}
            />

            {/* Company */}
            <TextInput
              label="Company Name"
              placeholder="Acme Inc."
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              error={errors.company?.join(', ')}
              disabled={isSubmitting}
              classNames={{ input: classes.input }}
            />

            {/* Team Size */}
            <Select
              label="Team Size"
              placeholder="Select your team size"
              data={teamSizeOptions}
              value={formData.teamSize}
              onChange={(value) => setFormData({ ...formData, teamSize: value || '' })}
              error={errors.teamSize?.join(', ')}
              disabled={isSubmitting}
              classNames={{ input: classes.input }}
            />

            {/* Preferred Demo Time */}
            <TextInput
              label="Preferred Demo Time"
              placeholder="e.g., Next Tuesday 2PM EST"
              value={formData.preferredDemoTime}
              onChange={(e) => setFormData({ ...formData, preferredDemoTime: e.target.value })}
              error={errors.preferredDemoTime?.join(', ')}
              disabled={isSubmitting}
              classNames={{ input: classes.input }}
            />

            {/* Message */}
            <Textarea
              label="Additional Information"
              placeholder="Tell us about your inventory management needs..."
              minRows={3}
              maxRows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              error={errors.message?.join(', ')}
              disabled={isSubmitting}
              classNames={{ input: classes.input }}
            />

            {/* Privacy Notice */}
            <Text size="xs" c="dimmed">
              By submitting this form, you agree to our privacy policy. We'll only use your
              information to schedule a demo and won't share it with third parties.
            </Text>

            {/* Action Buttons */}
            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                leftSection={<IconSend size={18} />}
                className={classes.submitButton}
              >
                {isSubmitting ? 'Submitting...' : 'Request Demo'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
