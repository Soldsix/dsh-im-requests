import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {verifyManifest,verifyFiles,verifyDocs} from '../scripts/verify-package.mjs'
test('publication refuses private dependencies, missing declarations and invented app activation',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));verifyManifest(manifest)
 assert.throws(()=>verifyManifest({...manifest,bin:'dist/index.js'}));assert.throws(()=>verifyManifest({...manifest,dsh:{bundle:{patch:'example'}}}));assert.throws(()=>verifyManifest({...manifest,dependencies:{...manifest.dependencies,private:'file:../private'}}));assert.throws(()=>verifyFiles(['package.json']))
 const en=await readFile(new URL('../README.md',import.meta.url),'utf8'),zh=await readFile(new URL('../README.zh.md',import.meta.url),'utf8');verifyDocs(en,zh);assert.throws(()=>verifyDocs(en.replace('## Summary','## Missing'),zh))
})
