import type { LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  // Return public configuration that can be safely exposed to the client
  return Response.json({
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
  })
}
