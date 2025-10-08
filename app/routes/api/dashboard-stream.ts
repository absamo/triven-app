import { type LoaderFunctionArgs } from 'react-router'
import { createEventStream } from '~/app/utils/create-event-stream.server'

export async function loader({ request }: LoaderFunctionArgs) {
  // Create an event stream for dashboard updates
  return createEventStream(request, 'dashboard-updates')
}
