import { type LoaderFunctionArgs, type LoaderFunction } from "react-router";

//import { getProduct } from "~/app/services/products.server"
import { renderToStream } from "@react-pdf/renderer"

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  //let product = await getProduct(request, params.id)
  let stream = await renderToStream(<div />)

  let body: Buffer = await new Promise((resolve, reject) => {
    let buffers: Uint8Array[] = []
    stream.on("data", (data) => {
      buffers.push(data)
    })
    stream.on("end", () => {
      resolve(Buffer.concat(buffers))
    })
    stream.on("error", reject)
  })

  let headers = new Headers({ "Content-Type": "application/pdf" })

  return new Response(body, {
    status: 200,
    headers,
  })
}
