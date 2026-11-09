import test from 'node:test'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtemp,mkdir,writeFile,realpath} from 'node:fs/promises'
import {fileURLToPath,pathToFileURL} from 'node:url'
import {join,relative,isAbsolute} from 'node:path'
import {verifyFiles} from '../scripts/verify-package.mjs'
const root=fileURLToPath(new URL('../',import.meta.url))
test('an independent public consumer executes attribution and compiles complete declarations',{timeout:180000},async t=>{
 assert.ok(process.env.npm_execpath,'Use npm test');await mkdir(join(root,'.test-artifacts'),{recursive:true});const area=await mkdtemp(join(root,'.test-artifacts','consumer-'))
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/KEY|TOKEN|SECRET|PASSWORD/i.test(key)));env.NPM_CONFIG_CACHE=join(root,'..','tooling','npm-cache');env.TEMP=env.TMP=area
 async function run(argv,cwd=area){
  const timeout=AbortSignal.timeout(120000),child=spawn(process.execPath,argv,{cwd,env,signal:AbortSignal.any([t.signal,timeout]),windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',error
  child.stdout.on('data',data=>{output+=data});child.stderr.on('data',data=>{output+=data});child.once('error',value=>{error=value})
  const [code,signal]=await new Promise(resolve=>child.once('close',(...values)=>resolve(values)));if(error)throw error;assert.equal(timeout.aborted,false);assert.equal(signal,null);assert.equal(code,0,output.slice(-1800));return output
 }
 const packed=JSON.parse(await run([process.env.npm_execpath,'pack','--ignore-scripts','--json','--pack-destination',area],root))[0];verifyFiles(packed.files.map(value=>value.path))
 await writeFile(join(area,'package.json'),JSON.stringify({private:true,type:'module'})+'\n')
 await run([process.env.npm_execpath,'install','--ignore-scripts','--no-audit','--no-fund','--package-lock=false',join(area,packed.filename),'typescript@5.9.3','@types/node@24.0.0'])
 const source=`import {RequestAuthority} from 'dsh-im-requests'
import type {InvocationId} from 'dsh-im-requests'
import type {} from 'dsh-im-requests/cordis'
import {identifier} from 'dsh-im-kit'
import {brandString} from '@deepseek-ai/dsh-brand'
import type {Context} from '@deepseek-ai/cordis'
const authority=new RequestAuthority('sender'),read:Context['imRequests']=authority.service,owner={id:'one'}
const source={id:brandString<InvocationId>('request'),scope:{account:{tenantId:identifier('im.tenant','qa'),networkId:identifier('im.network','qa'),accountId:identifier('im.account','bot')},kind:'private' as const,peerId:identifier('im.peer','alice')},senderId:identifier('im.user','alice'),messageId:identifier('im.message','message')}
const lease=authority.open(owner,source,new AbortController().signal)
if(read.current(owner)!==null)throw Error('Unadmitted source')
lease.activate();if(read.current(owner)?.senderId!=='alice'||read.current({id:'one'})!==null)throw Error('Wrong owner')
lease.close();if(read.current(owner)!==null)throw Error('Revoked source')
authority.close()
if(false){
 // @ts-expect-error Read-only consumers cannot issue a lease.
 read.open(owner,source,new AbortController().signal)
 // @ts-expect-error Sender identity is not invocation identity.
 const invalid:InvocationId=identifier('im.user','alice');void invalid
}
console.log('independent-attribution-passed')
`
 await writeFile(join(area,'consumer.ts'),source)
 const {default:ts}=await import(pathToFileURL(join(area,'node_modules','typescript','lib','typescript.js')).href)
 const options={strict:true,skipLibCheck:false,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,outDir:join(area,'out'),types:['node'],typeRoots:[join(area,'node_modules','@types')]}
 const host=ts.createCompilerHost(options);host.getCurrentDirectory=()=>area
 const program=ts.createProgram([join(area,'consumer.ts')],options,host)
 assert.equal(ts.getPreEmitDiagnostics(program).length,0)
 for(const input of program.getSourceFiles()){const owned=relative(area,await realpath(input.fileName));assert.ok(!owned.startsWith('..')&&!isAbsolute(owned),'Consumer borrowed ancestor declarations')}
 const emitted=program.emit();assert.equal(emitted.emitSkipped,false);assert.equal(emitted.diagnostics.length,0)
 assert.match(await run([join(area,'out','consumer.js')]),/independent-attribution-passed/)
 await writeFile(join(area,'result.json'),JSON.stringify({passed:true,packedFiles:packed.files.length,declarationFiles:program.getSourceFiles().filter(file=>file.isDeclarationFile).length,ancestorDependenciesBorrowed:false,startedApplications:0,qqMessagesSent:0})+'\n')
})
