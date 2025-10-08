import { Box, Button, Container, Flex } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useFormContext } from '~/app/contexts/FormContext'
import classes from './Footer.module.css'

export default function Footer() {
  const { t } = useTranslation('common')
  const { isFormActive, isSubmitting } = useFormContext()

  return (
    <Box className={classes.footer}>
      <Container fluid h="100%">
        <Flex justify="flex-end" align="center" h="100%">
          {/* Right-aligned save button */}
          {isFormActive && (
            <Button
              className={classes.saveBtn}
              size="sm"
              type="submit"
              form="main-form"
              loading={isSubmitting}
            >
              {t('common:save', 'Save')}
            </Button>
          )}
        </Flex>
      </Container>
    </Box>
  )
}
