import '@mantine/carousel/styles.css'
import '@mantine/charts/styles.css'
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/dropzone/styles.css'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import './styles/auth-dark-mode-fixes.css'

import { useTranslation } from 'react-i18next'
import {
  // isRouteErrorResponse,
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  type ErrorResponse,
} from 'react-router'
import { useChangeLanguage } from 'remix-i18next/react'
import { getLocale, i18nextMiddleware, localeCookie } from './middleware/i18next'

import { theme } from '~/app/lib/theme'
import ErrorPage from '~/app/pages/Error/Error'
import type { Route } from './+types/root'

export const unstable_middleware = [i18nextMiddleware]

export async function loader({ context, request }: Route.LoaderArgs) {
  let locale = getLocale(context)
  const cookieHeader = request.headers.get('cookie') || ''

  // Parse cookies for navbar state and color scheme
  const cookies = cookieHeader
    ? Object.fromEntries(
        cookieHeader.split('; ').map((cookie) => {
          const [key, ...valueParts] = cookie.split('=')
          return [key, valueParts.join('=')]
        })
      )
    : {}

  // Only handle navbar state - let react-i18next handle languages
  const showMiniNavbar = cookies.showMiniNavbar === 'true'

  // Get color scheme from cookie, default to auto if not set
  const colorScheme = cookies['mantine-color-scheme'] || 'auto'

  // ImageKit configuration for client-side
  const imagekitConfig = {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
  }

  return data(
    { locale, showMiniNavbar, colorScheme, imagekitConfig },
    { headers: { 'Set-Cookie': await localeCookie.serialize(locale) } }
  )
}

export async function action({ context, request }: Route.ActionArgs) {
  const formData = await request.formData()
  const lng = formData.get('lng') as string

  if (lng && ['en', 'fr'].includes(lng)) {
    const headers = new Headers()
    headers.append('Set-Cookie', await localeCookie.serialize(lng))

    // Redirect to the same URL to refresh with new language
    const url = new URL(request.url)
    url.searchParams.set('lng', lng)

    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(headers),
        Location: url.pathname + '?' + url.searchParams.toString(),
      },
    })
  }

  return data({ error: 'Invalid language' }, { status: 400 })
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  // Favicon links
  { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
  { rel: 'icon', href: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
  { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
]

export default function App({ loaderData }: Route.ComponentProps) {
  let { i18n } = useTranslation()

  useChangeLanguage(loaderData.locale)

  return (
    <html lang={i18n.language} dir={i18n.dir(i18n.language)} {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__IMAGEKIT_CONFIG__ = ${JSON.stringify(loaderData.imagekitConfig)};`,
          }}
        />
      </head>
      <body>
        <Scripts />
        <MantineProvider theme={theme}>
          <Outlet />
          <Notifications autoClose={false} />
        </MantineProvider>
        <ScrollRestoration />
      </body>
    </html>
  )
}

// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
//   let message = "Oops!"
//   let details = "An unexpected error occurred."
//   let stack: string | undefined

//   if (isRouteErrorResponse(error)) {
//     message = error.status === 404 ? "404" : "Error"
//     details =
//       error.status === 404
//         ? "The requested page could not be found."
//         : error.statusText || details
//   } else if (import.meta.env.DEV && error && error instanceof Error) {
//     details = error.message
//     stack = error.stack
//   }

//   return (
//     <main className="pt-16 p-4 container mx-auto">
//       <h1>{message}</h1>
//       <p>{details}</p>
//       {stack && (
//         <pre className="w-full p-4 overflow-x-auto">
//           <code>{stack}</code>
//         </pre>
//       )}
//     </main>
//   )
// }

export function ErrorBoundary() {
  let error: ErrorResponse = useRouteError() as ErrorResponse

  return (
    <html {...mantineHtmlProps}>
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <Scripts />
        <MantineProvider theme={theme}>
          <ErrorPage error={error} />
        </MantineProvider>
      </body>
    </html>
  )
}
