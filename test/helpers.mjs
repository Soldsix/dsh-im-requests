import { identifier } from 'dsh-im-kit'

export function account(tenant = 'lab', id = '90000001') {
  return { tenantId: identifier('im.tenant', tenant), networkId: identifier('im.network', 'onebot11'), accountId: identifier('im.account', id) }
}
export function scope(id = '90000100', kind = 'group', bound = account()) {
  return { account: bound, kind, peerId: identifier('im.peer', id) }
}
export function inbound(destination = scope()) {
  return { scope: destination, messageId: identifier('im.message', 'message-1'), senderId: identifier('im.user', '90000002'), sentAt: 1, receivedAt: 2, parts: [{type:'text', text:'hello'}], directedToBot:true }
}
export function outbound(destination = scope()) {
  return { scope:destination, operationId:identifier('im.operation','operation-1'), parts:[{type:'text',text:'hello'}] }
}
export function deferred() {
  let resolve, reject
  const promise = new Promise((accept, fail) => {resolve=accept;reject=fail})
  return {promise,resolve,reject}
}
export function provider(bound = account(), overrides = {}) {
  const calls = {availability:[],send:[],dispose:0}
  return {
    calls,
    transport: {
      account:bound,
      async availability(destination,signal) {calls.availability.push({destination,signal});return 'available'},
      async send(message,signal) {calls.send.push({message,signal});return {status:'accepted',messageIds:[identifier('im.message','remote-1')]}},
      async dispose() {calls.dispose++},
      ...overrides,
    },
  }
}
