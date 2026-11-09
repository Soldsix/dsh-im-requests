/** Optional type-only Cordis request-attribution service. */
import type {} from '@deepseek-ai/cordis'
import type {RequestService} from './index.ts'
declare module '@deepseek-ai/cordis'{interface Context{readonly imRequests:RequestService}}
