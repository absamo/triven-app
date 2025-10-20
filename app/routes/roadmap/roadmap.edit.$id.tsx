import { Grid, Textarea, TextInput } from '@mantine/core'
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { data, redirect, useActionData, useLoaderData, useSubmit } from 'react-router'
import { z } from 'zod'
import Form from '~/app/components/Form'
import { updateFeatureSchema } from '~/app/lib/roadmap/validators'
import { Title } from '~/app/partials/Title'
import { requireBetterAuthUser } from '~/app/services/better-auth.server'
import {
  createFeatureComment,
  deleteFeature,
  getFeatureById,
  getFeatureComments,
  updateFeature,
} from '~/app/services/roadmap/feature.service'

const commentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(1000),
})

type ActionData = {
  errors?:
    | {
        title?: string[]
        description?: string[]
        comment?: string[]
      }
    | {
        form: string
      }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireBetterAuthUser(request)
  const featureId = params.id

  if (!featureId) {
    throw new Response('Feature ID is required', { status: 400 })
  }

  const feature = await getFeatureById(featureId, user.id)

  if (!feature) {
    throw new Response('Feature not found', { status: 404 })
  }

  // Check if user can edit: must be owner or admin
  const isOwner = feature.createdById === user.id
  const isAdmin = user.role?.name === 'Admin' || user.role?.name === 'Super Admin'

  if (!isOwner && !isAdmin) {
    throw new Response('You do not have permission to edit this feature', { status: 403 })
  }

  const comments = await getFeatureComments(featureId)

  return data({
    feature,
    comments,
    isAdmin,
    currentUser: {
      id: user.id,
      name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : user.email,
    },
  })
}

export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<ActionData | Response> {
  const user = await requireBetterAuthUser(request)
  const featureId = params.id

  if (!featureId) {
    throw new Response('Feature ID is required', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  // Handle delete
  if (intent === 'delete') {
    try {
      await deleteFeature(featureId, user.id)
      return redirect('/roadmap')
    } catch (error) {
      return {
        errors: {
          form: (error as Error).message,
        },
      }
    }
  }

  const title = formData.get('title')
  const description = formData.get('description')
  const comment = formData.get('comment')

  const result = updateFeatureSchema.safeParse({
    title,
    description,
  })

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    await updateFeature(featureId, result.data, user.id)

    // Add comment if provided
    if (comment && typeof comment === 'string' && comment.trim().length > 0) {
      const commentResult = commentSchema.safeParse({ comment })
      if (commentResult.success) {
        await createFeatureComment(featureId, user.id, commentResult.data.comment)
      }
    }

    return redirect('/roadmap')
  } catch (error) {
    return {
      errors: {
        form: (error as Error).message,
      },
    }
  }
}

export default function EditFeature() {
  const { feature } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const submit = useSubmit()

  const fieldErrors = actionData?.errors && 'title' in actionData.errors ? actionData.errors : null
  const formError =
    actionData?.errors && 'form' in actionData.errors ? actionData.errors.form : null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    submit(formData, { method: 'post' })
  }

  return (
    <Grid>
      <Grid.Col>
        <Title backTo="/roadmap">Edit Feature Request</Title>

        <Form onSubmit={handleSubmit}>
          <Grid.Col span={12}>
            <TextInput
              label="Feature Title"
              name="title"
              defaultValue={feature.title}
              placeholder="Enter a brief title for your feature request"
              required
              error={fieldErrors?.title?.[0]}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              label="Description"
              name="description"
              defaultValue={feature.description}
              placeholder="Describe the feature you'd like to see, including why it would be valuable"
              required
              minRows={12}
              autosize
              error={fieldErrors?.description?.[0] || formError}
            />
          </Grid.Col>

          <Grid.Col span={12}>
            <Textarea
              name="comment"
              label="Add Comment (Optional)"
              placeholder="Add your comment..."
              minRows={4}
              error={
                actionData?.errors && 'comment' in actionData.errors
                  ? actionData.errors.comment?.[0]
                  : undefined
              }
            />
          </Grid.Col>
        </Form>
      </Grid.Col>
    </Grid>
  )
}
