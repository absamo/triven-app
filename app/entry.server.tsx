import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToPipeableStream } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import type { EntryContext, unstable_RouterContextProvider } from 'react-router'
import { ServerRouter } from 'react-router'
import { getInstance } from './middleware/i18next'
import { jobScheduler, shouldRunJobs } from './lib/jobs/scheduler'
import { processApprovalReminders } from './lib/jobs/approval-reminders'
import { processEmailDigests } from './lib/jobs/email-digest'

export const streamTimeout = 5_000

// T018: Initialize background jobs
if (shouldRunJobs()) {
  console.log('[Jobs] Initializing background job scheduler')

  // Register approval reminders job (runs every hour)
  jobScheduler.register({
    name: 'approval-reminders',
    fn: processApprovalReminders,
    intervalMs: 60 * 60 * 1000, // 1 hour
    enabled: true,
  })

  // Register email digest job (runs every hour, but only sends at digest time)
  jobScheduler.register({
    name: 'email-digest',
    fn: processEmailDigests,
    intervalMs: 60 * 60 * 1000, // 1 hour
    enabled: true,
  })

  // Start all jobs
  jobScheduler.start()

  console.log('[Jobs] Background job scheduler initialized')
} else {
  console.log('[Jobs] Background jobs disabled (set NODE_ENV=production or ENABLE_JOBS=true to enable)')
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  routerContext: unstable_RouterContextProvider
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const userAgent = request.headers.get('user-agent')

    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || entryContext.isSpaMode ? 'onAllReady' : 'onShellReady'

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={getInstance(routerContext)}>
        <ServerRouter context={entryContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          )

          pipe(body)
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) console.error(error)
        },
      }
    )

    setTimeout(abort, streamTimeout + 1000)
  })
}
