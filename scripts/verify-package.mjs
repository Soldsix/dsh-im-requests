/** Portable library metadata and a deliberate public-file allowlist. */
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
/** @param manifest - publication metadata. */
export function verifyManifest(manifest){
 assert.equal(manifest.name,'dsh-im-requests');assert.equal(manifest.type,'module');assert.equal(manifest.license,'MIT');assert.ok(!manifest.bin&&!manifest.dsh)
 assert.equal(manifest.dependencies['dsh-im-kit'],'https://github.com/Soldsix/dsh-im-kit/releases/download/v0.2.1/dsh-im-kit-0.2.1.tgz')
 for(const section of ['dependencies','peerDependencies','devDependencies'])for(const value of Object.values(manifest[section]??{}))assert.ok(!/^(?:file:|link:|workspace:|[a-z]:[\\/]|[\\/])/i.test(value))
}
/** @param paths - actual packed file list. */
export function verifyFiles(paths){
 const allowed=['package.json','LICENSE','README.md','README.zh.md','README.i18n.yaml','dist/index.js','dist/index.d.ts','dist/cordis.js','dist/cordis.d.ts']
 assert.deepEqual([...paths].sort(),allowed.sort())
}
/** @param en - English reference. @param zh - paired Chinese reference. */
export function verifyDocs(en,zh){
 en=en.replaceAll('\r\n','\n');zh=zh.replaceAll('\r\n','\n')
 for(const doc of [en,zh]){assert.match(doc,/kind: "package-library"/);assert.ok(doc.endsWith('\n')&&!doc.endsWith('\n\n'));assert.ok(!/dsh plugin .* add/.test(doc))}
 assert.equal(en.split(/\r?\n/).length,zh.split(/\r?\n/).length)
 for(const heading of ['Summary','Table of Contents','Model Experience','Known Limitations and Deferred Work','Dev Note'])assert.ok(en.includes('## '+heading+'\n'))
 assert.ok(en.split('## Summary\n')[1].split('\n## ')[0].trim().split(/\s+/).length<=100)
}
async function main(){
 const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('package.json',root),'utf8'));verifyManifest(manifest)
 verifyDocs(await readFile(new URL('README.md',root),'utf8'),await readFile(new URL('README.zh.md',root),'utf8'))
 for(const name of ['index.ts','cordis.ts']){const value=await readFile(new URL('src/'+name,root),'utf8');assert.ok(value.startsWith('/**'));assert.ok(!/\bas unknown\b/.test(value));assert.ok(value.endsWith('\n')&&!value.endsWith('\n\n'))}
 console.log(JSON.stringify({passed:true,package:manifest.name}))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main()
