import {brandString} from '@deepseek-ai/dsh-brand'
import {identifier} from 'dsh-im-kit'
import {RequestAuthority,type InvocationId,type RequestService} from '../src/index.ts'
const request:InvocationId=brandString<InvocationId>('example')
const authority=new RequestAuthority('sender')
const read:RequestService=authority.service
void request;void read
// @ts-expect-error The read-only service cannot issue a lease.
read.open({}, {}, new AbortController().signal)
// @ts-expect-error Sender IDs cannot substitute for request IDs.
const wrong:InvocationId=identifier('im.user','alice')
void wrong
