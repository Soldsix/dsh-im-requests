/** Build-only local archive generation; this script publishes nothing. */
import {mkdir} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('../',import.meta.url))
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true})
if(!process.env.npm_execpath)throw new Error('Run through npm run pack:local')
const child=spawn(process.execPath,[process.env.npm_execpath,'pack','--pack-destination','artifacts'],{cwd:root,windowsHide:true,stdio:'inherit'})
const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)})
if(code!==0)process.exit(typeof code==='number'?code:1)
