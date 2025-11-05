//import { getProduct } from "~/app/services/products.server"
import { renderToStream } from '@react-pdf/renderer'
import type { LoaderFunction, LoaderFunctionArgs } from 'react-router'

export const loader: LoaderFunction = async ({ params, request }: LoaderFunctionArgs) => {
  //let product = await getProduct(request, params.id)
  const stream = await renderToStream(<div />)

  const body: Buffer = await new Promise((resolve, reject) => {
    const buffers: Uint8Array[] = []
    stream.on('data', (data) => {
      buffers.push(data)
    })
    stream.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
    stream.on('error', reject)
  })

  const headers = new Headers({ 'Content-Type': 'application/pdf' })

  return new Response(body, {
    status: 200,
    headers,
  })
}
