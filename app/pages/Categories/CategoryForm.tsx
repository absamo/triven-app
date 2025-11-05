import { Grid, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { useTranslation } from 'react-i18next'
import { useSubmit } from 'react-router'

import { categorySchema, type ICategory } from '~/app/common/validations/categorySchema'
import { Form } from '~/app/components'
import { Title } from '~/app/partials/Title'

interface CategoryFormProps {
  category: ICategory
  errors: Record<string, string>
}

export default function CategoryForm({ category, errors }: CategoryFormProps) {
  const { t } = useTranslation('inventory')

  const form = useForm({
    validate: zodResolver(categorySchema),
    initialValues: {
      ...category,
    },
  })

  const submit = useSubmit()

  const handleSubmit = ({ name, description }: ICategory) => {
    const form = new FormData()

    form.append('name', name)
    form.append('description', description || '')

    submit(form, { method: 'post' })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo={'/categories'}>{category.id ? t('editCategory') : t('addCategory')}</Title>

        <Form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid.Col>
            <TextInput
              withAsterisk
              label={t('name')}
              name="name"
              {...form.getInputProps('name')}
              error={form.getInputProps('name').error || errors?.name}
            />
          </Grid.Col>

          <Grid.Col>
            <Textarea
              label={t('categoryDescription')}
              name="description"
              autosize
              minRows={4}
              {...form.getInputProps('description')}
            />
          </Grid.Col>
        </Form>
      </Grid.Col>
    </Grid>
  )
}
