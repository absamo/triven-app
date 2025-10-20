import { Grid } from '@mantine/core'
import { useEffect } from 'react'
import { Form as RemixForm } from 'react-router'
import { useFormContext } from '~/app/contexts/FormContext'

import classes from './Form.module.css'

interface FormProps {
  children: React.ReactNode
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  submitText?: string
  showSubmitButton?: boolean
}

export default function Form({
  children,
  onSubmit,
  submitText = 'Save',
  showSubmitButton = true,
}: FormProps) {
  const { setIsFormActive } = useFormContext()

  useEffect(() => {
    // Activate form when component mounts and submit button should be shown
    if (showSubmitButton) {
      setIsFormActive(true)
    }

    // Deactivate form when component unmounts
    return () => {
      setIsFormActive(false)
    }
  }, [showSubmitButton, setIsFormActive])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // Don't prevent default if we want React Router to handle submission
    if (onSubmit) {
      event.stopPropagation()
      onSubmit(event)
    }
    // Let React Router handle the form submission for navigation state tracking
  }

  return (
    <RemixForm id="main-form" onSubmit={handleSubmit} encType="multipart/form-data" method="post">
      <Grid className={classes.form}>{children}</Grid>
    </RemixForm>
  )
}
