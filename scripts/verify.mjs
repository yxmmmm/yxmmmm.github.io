import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const root = process.cwd();
const dist = path.join(root,'dist');
const report = JSON.parse(fs.readFileSync('migration-report.json','utf8'));
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
assert.equal(report.length,16,'All 16 published posts must migrate');
assert.equal(new Set(report.map(p=>p.permalink)).size,16,'Permalinks must be unique');
for(const post of report) {
  const file=path.join(dist,post.permalink,'index.html');
  assert.ok(fs.existsSync(file),`Missing original URL: ${post.permalink}`);
  const $=load(fs.readFileSync(file,'utf8'));
  assert.equal($('h1').first().text(),post.title);
  assert.ok($('.prose').text().trim().length>10,`Empty article: ${post.title}`);
  assert.equal($('.katex-error').length,0,`Broken formula: ${post.title}`);
}
const legacyFiles=JSON.parse(fs.readFileSync('legacy-page-paths.json','utf8'));
for(const file of legacyFiles.filter(file=>!file.startsWith('categories/'))) assert.ok(fs.existsSync(path.join(dist,file)),`Missing legacy page: ${file}`);
const errors=[];
for(const file of walk(dist).filter(f=>f.endsWith('.html'))) {
  const $=load(fs.readFileSync(file,'utf8'));
  $('[href],[src]').each((_,el)=>{
    const url=$(el).attr('href')||$(el).attr('src');
    if(!url || /^(https?:|mailto:|data:|tel:|#|javascript:)/i.test(url)) return;
    let decoded;
    try{decoded=decodeURIComponent(url.split(/[?#]/)[0]);}catch{return;}
    if(!decoded) return;
    const target=decoded.startsWith('/')?path.join(dist,decoded):path.resolve(path.dirname(file),decoded);
    if(!fs.existsSync(target)&&!fs.existsSync(path.join(target,'index.html'))) errors.push(`${path.relative(dist,file)}: ${url}`);
  });
}
assert.deepEqual(errors,[],'Internal links and local assets must resolve');
const math=fs.readFileSync(path.join(dist,'2025/12/26/关于和式极限的求解方法/index.html'),'utf8');
assert.ok(math.includes('katex'),'Math rendering must be present');
assert.ok(load(math)('.katex-display').length >= 3,'Obsidian single-line double-dollar formulas must render as display math');
assert.ok(fs.existsSync(path.join(dist,'pdf/最终稿.pdf')),'Published PDF must survive');
assert.equal(fs.readFileSync(path.join(dist,'CNAME'),'utf8').trim(),'xiaomaoyang.top');
console.log('PASS: 16 articles, unique original URLs, substantive bodies, legacy pages, internal links/assets, formula rendering, PDF and custom domain.');
