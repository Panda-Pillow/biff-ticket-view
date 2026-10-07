const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), ext=path.join(root,'extension');
const m=JSON.parse(fs.readFileSync(path.join(ext,'manifest.json')));
assert.equal(m.manifest_version,3);assert.equal(m.permissions,undefined);assert.equal(m.host_permissions,undefined);
assert.deepEqual(m.content_scripts[0].matches,['https://biff.maketicket.co.kr/mypage/tickets/list*']);
for(const f of [...m.content_scripts[0].js,...m.content_scripts[0].css,...Object.values(m.icons)])assert(fs.existsSync(path.join(ext,f)),f);
for(const f of m.content_scripts[0].js){const s=fs.readFileSync(path.join(ext,f),'utf8');assert(!/eval\s*\(|new Function\s*\(/.test(s),'Remote execution');assert(!/\/Users\/|ghp_[A-Za-z0-9]+|tket\.me\/[A-Za-z0-9]{6,}|26[A-Z0-9]{14,}/.test(s),'Private data candidate');}
console.log('Manifest, runtime files, narrow scope and release scan passed');
