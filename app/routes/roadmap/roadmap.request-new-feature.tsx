import { Grid, Textarea, TextInput } from '@mantine/core'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { redirect, useActionData } from 'react-router'
import Form from '~/app/components/Form'
import { createFeatureSchema } from '~/app/lib/roadmap/validators'
import { Title } from '~/app/partials/Title'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import { createFeature } from '~/app/services/roadmap/feature.service'

type ActionData = {
  errors?:
    | {
        title?: string[]
        description?: string[]
        status?: string[]
      }
    | {
        form: string
      }
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Ensure user is authenticated
  await requireBetterAuthUser(request)
  return null
}

export async function action({ request }: ActionFunctionArgs): Promise<ActionData | Response> {
  const user = await requireBetterAuthUser(request)

  const formData = await request.formData()
  const title = formData.get('title')
  const description = formData.get('description')

  // Validate input
  const result = createFeatureSchema.safeParse({
    title,
    description,
    status: 'TODO',
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Create the feature
  try {
    await createFeature(result.data, user.id)
    return redirect('/roadmap')
  } catch (error) {
    return {
      errors: {
        form: (error as Error).message,
      },
    }
  }
}

export default function RequestNewFeature() {
  const actionData = useActionData<typeof action>()

  const fieldErrors = actionData?.errors && 'title' in actionData.errors ? actionData.errors : null
  const formError =
    actionData?.errors && 'form' in actionData.errors ? actionData.errors.form : null

  return (
    <Grid>
      <Grid.Col>
        <Title backTo="/roadmap">Request New Feature</Title>

        <Form showSubmitButton>
          <Grid.Col span={12}>
            <TextInput
              label="Feature Title"
              name="title"
              placeholder="Enter a brief title for your feature request"
              required
              error={fieldErrors?.title?.[0]}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Description"
              name="description"
              placeholder="Describe the feature you'd like to see, including why it would be valuable"
              required
              minRows={10}
              autosize
              error={fieldErrors?.description?.[0] || formError}
            />
          </Grid.Col>
        </Form>
      </Grid.Col>
    </Grid>
  )
}
