/** Live request attribution bound to the provider's execution object, not caller-selected IDs. */
import type {Branded} from '@deepseek-ai/dsh-brand'
import type {ConversationScope,MessageId,UserId} from 'dsh-im-kit'

/** One provider-owned live request; an identifier alone never grants access. */
export type InvocationId=Branded<'im.invocation'>
/** Whether another sender can inherit the execution owner's model history. */
export type SessionIsolation='sender'|'shared'
/** Transport-authenticated source retained without member text or attachment references. */
export interface RequestSource{readonly id:InvocationId;readonly scope:ConversationScope;readonly senderId:UserId;readonly messageId:MessageId}
/** An admitted request whose signal ends when its provider revokes the binding. */
export interface ActiveRequest extends RequestSource{readonly isolation:SessionIsolation;readonly signal:AbortSignal}
/** Read-only service for trusted tool adapters; a model cannot choose the execution object. */
export interface RequestService{
 /** @param owner - actual immutable execution owner supplied by the host dispatcher. @returns the live, admitted source, or null for idle, unrelated or revoked owners. */
 current(owner:object):ActiveRequest|null
 /** @returns aggregate attribution state without source identities or message text. */
 status():{readonly active:number;readonly closed:boolean;readonly groupSessionMode:SessionIsolation}
}
/** Provider-only lifecycle handle, never exposed through RequestService. */
export interface RequestLease{
 /** Publish the binding only after its exact source has entered the execution log. @throws when the lease has ended. */
 activate():void
 /** Revoke the binding and abort dependent work; repeated calls are harmless. */
 close():void
}
interface Binding{readonly value:ActiveRequest;readonly controller:AbortController;readonly detach:()=>void;admitted:boolean}

/** The provider owns leases; consumers receive only the frozen read-only service. */
export class RequestAuthority{
 private readonly bindings=new Map<object,Binding>()
 private closed=false
 /** Read-only attribution view; it exposes no lease-issuing operation. */
 readonly service:RequestService
 /** @param groupSessionMode - provider guarantee for every group execution it binds; private executions are sender-isolated. */
 constructor(groupSessionMode:SessionIsolation){
  this.service=Object.freeze({current:(owner:object):ActiveRequest|null=>{const item=this.bindings.get(owner);return item?.admitted?item.value:null},status:()=>({active:this.bindings.size,closed:this.closed,groupSessionMode})})
 }
 /**
  * Reserve an execution object before admitting its logged source; IDs never substitute for object identity.
  * @param owner - provider-owned execution object, such as the native Agent instance.
  * @param source - authenticated source metadata copied without retaining the original payload.
  * @param signal - enclosing request lifetime.
  * @returns an unpublished lease whose close synchronously revokes dependent access.
  * @throws when closed, cancelled, or the object already belongs to another live request.
  */
 open(owner:object,source:RequestSource,signal:AbortSignal):RequestLease{
  if(this.closed)throw new Error('Request authority is closed')
  signal.throwIfAborted()
  if(this.bindings.has(owner))throw new Error('Request owner already reserved')
  const controller=new AbortController(),scope=Object.freeze({...source.scope,account:Object.freeze({...source.scope.account})})
  const abort=()=>finish(signal.reason)
  const value:ActiveRequest=Object.freeze({id:source.id,scope,senderId:source.senderId,messageId:source.messageId,isolation:scope.kind==='group'?this.service.status().groupSessionMode:'sender',signal:controller.signal})
  const binding:Binding={value,controller,admitted:false,detach:()=>signal.removeEventListener('abort',abort)}
  const finish=(reason:unknown=new DOMException('Request ended','AbortError')):void=>{
   if(this.bindings.get(owner)===binding)this.bindings.delete(owner)
   binding.detach();controller.abort(reason)
  }
  this.bindings.set(owner,binding);signal.addEventListener('abort',abort,{once:true})
  return Object.freeze({activate:()=>{controller.signal.throwIfAborted();binding.admitted=true},close:()=>finish()})
 }
 /** Revoke every live lease; the library owns no asynchronous work or external resources. */
 close():void{
  if(this.closed)return
  this.closed=true
  const active=[...this.bindings.values()];this.bindings.clear()
  for(const item of active){item.detach();item.controller.abort(new DOMException('Request authority closed','AbortError'))}
 }
}
