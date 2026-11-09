import test from 'node:test'
import assert from 'node:assert/strict'
import {identifier} from 'dsh-im-kit'
import {RequestAuthority} from '../dist/index.js'
import {brandString} from '@deepseek-ai/dsh-brand'
import {scope} from './helpers.mjs'
const source=(id='one',kind='group')=>({id:brandString(id),scope:scope('room',kind),senderId:identifier('im.user','alice'),messageId:identifier('im.message','message-'+id)})
test('the optional Cordis entry starts no service',async()=>{assert.deepEqual(Object.keys(await import('../dist/cordis.js')),[])})

test('a live source is published only after admission and requires the exact execution object',()=>{
 const authority=new RequestAuthority('sender'),owner={id:'same'},controller=new AbortController(),input=source(),lease=authority.open(owner,input,controller.signal)
 assert.equal(authority.service.current(owner),null);assert.equal(authority.service.current({id:'same'}),null)
 lease.activate();const active=authority.service.current(owner);assert.equal(active.id,input.id);assert.equal(active.isolation,'sender')
 assert.equal(authority.service.current({id:'same'}),null);assert.equal('open' in authority.service,false);assert.equal(Object.isFrozen(authority.service),true)
 for(const obj of [active,active.scope,active.scope.account])assert.equal(Object.isFrozen(obj),true)
 input.scope.account.accountId=identifier('im.account','changed');assert.notEqual(active.scope.account.accountId,input.scope.account.accountId)
 assert.throws(()=>{active.senderId=identifier('im.user','forged')},TypeError)
 assert.throws(()=>authority.open(owner,source('duplicate'),controller.signal),/already reserved/)
 lease.close();assert.equal(authority.service.current(owner),null);assert.equal(active.signal.aborted,true)
 assert.throws(()=>lease.activate(),error=>error.name==='AbortError');lease.close();authority.close();authority.close()
 assert.deepEqual(authority.service.status(),{active:0,closed:true,groupSessionMode:'sender'})
 assert.throws(()=>authority.open(owner,source('after-close'),controller.signal),/authority is closed/)
})
test('cancellation revokes before listeners run; closing an old lease cannot affect a new source',()=>{
 const authority=new RequestAuthority('shared'),owner={},controller=new AbortController(),lease=authority.open(owner,source(),controller.signal)
 lease.activate();const old=authority.service.current(owner);let observed
 old.signal.addEventListener('abort',()=>{observed=authority.service.current(owner)},{once:true})
 controller.abort();assert.equal(observed,null);assert.equal(authority.service.status().active,0)
 const fresh=authority.open(owner,source('fresh'),new AbortController().signal);fresh.activate();lease.close()
 assert.equal(authority.service.current(owner).id,'fresh');assert.equal(authority.service.current(owner).isolation,'shared');fresh.close()
 const privateLease=authority.open(owner,source('private','private'),new AbortController().signal);privateLease.activate();assert.equal(authority.service.current(owner).isolation,'sender');authority.close()
})
test('pre-cancelled reservations publish nothing and authority close revokes all owners atomically',()=>{
 const authority=new RequestAuthority('sender'),aborted=new AbortController();aborted.abort()
 assert.throws(()=>authority.open({},source(),aborted.signal),error=>error.name==='AbortError');assert.equal(authority.service.status().active,0)
 const owners=[{},{}],requests=owners.map((owner,i)=>{const lease=authority.open(owner,source('parallel-'+i),new AbortController().signal);lease.activate();return authority.service.current(owner)})
 for(const request of requests)request.signal.addEventListener('abort',()=>{assert.equal(authority.service.status().active,0);for(const owner of owners)assert.equal(authority.service.current(owner),null)},{once:true})
 authority.close();assert.ok(requests.every(value=>value.signal.aborted));assert.equal(authority.service.current({}),null)
})
