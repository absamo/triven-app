import { remember } from '@epic-web/remember'
import { EventEmitter } from 'events'

export const emitter = remember('emitter', () => new EventEmitter())
