import { eventStream } from 'remix-utils/sse/server'
import { emitter } from './emitter.server'

export function createEventStream(request: Request, eventName: string) {
  return eventStream(request.signal, (send) => {
    // Send initial connection confirmation
    send({
      event: 'connected',
      data: JSON.stringify({
        type: 'connected',
        timestamp: Date.now(),
        eventName,
      }),
    })

    const handle = (data?: any) => {
      send({
        event: eventName,
        data: JSON.stringify({
          type: eventName,
          timestamp: Date.now(),
          data: data || {},
        }),
      })
    }

    emitter.addListener(eventName, handle)

    return () => {
      emitter.removeListener(eventName, handle)
    }
  })
}
