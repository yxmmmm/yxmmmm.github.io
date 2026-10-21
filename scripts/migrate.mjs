import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const vault = path.resolve(root, '../article-source');
const mapping = {
  'KMP算法': 'algorithm/KMP.md', '哈希表': 'algorithm/哈希表.md',
  'quicksort': 'algorithm/排序/quicksort.md', '最短路': 'algorithm/最短路.md',
  '传统结构体链表和数组模拟链表辨析': 'algorithm/传统结构体链表和数组模拟链表辨析.md',
  '关于和式极限的求解方法': 'math/关于和式极限的求解方法.md',
  '洛谷P1217普及-': 'algorithm/题解/洛谷P1217普及-.md',
  '牛客寒假营第二场H': 'algorithm/题解/牛客寒假营第二场H.md',
  '2025-12': 'blog/monthly report/2025-12.md',
  '2026-2': 'blog/monthly report/2026年二月总结.md',
  '2026年3月总结': 'blog/monthly report/2026年3月总结.md',
  '2026-3': 'blog/monthly report/2026年3月总结.md',
  '2026年4月总结': 'blog/monthly report/2026年4月总结.md',
  '树与图的dfs和bfs': 'blog/树与图的dfs和bfs.md',
  '当代年轻人的破局之道摘录': '当代年轻人破局之道.md',
};
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, content);
}
const report = [];
for (const year of ['2025', '2026']) for (const file of walk(path.join(root,year)).filter(f=>f.endsWith('.html'))) {
  const $ = load(fs.readFileSync(file,'utf8'));
  const title = $('.post-title').text().trim();
  if (!title) throw new Error(`Missing title: ${file}`);
  const permalink = '/' + path.relative(root,path.dirname(file)).split(path.sep).join('/') + '/';
  const source = mapping[title];
  const found = source && fs.existsSync(path.join(vault,source));
  let body;
  if (found) {
    body = fs.readFileSync(path.join(vault,source),'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');
    body = body.replace(/^(?:#[^\s#]+[ \t]*)+\r?\n\s*/,'');
  } else {
    const article = $('#article-container');
    article.find('script,style').remove();
    article.find('#post-outdate-notice').remove();
    article.find('figure.highlight').each((_,el)=>{
      const code = $(el).find('td.code pre');
      code.find('br').replaceWith('\n');
      const replacement = $('<pre><code></code></pre>');
      replacement.find('code').text(code.text());
      $(el).replaceWith(replacement);
    });
    article.find('img[data-lazy-src]').each((_,el)=>$(el).attr('src',$(el).attr('data-lazy-src')));
    // Keep original math markup, tables and code when an exact Markdown source is unavailable.
    body = article.html() || '';
  }
  const embeds = [...body.matchAll(/!\[\[([^\]]+)\]\]/g)].map(m=>m[1]);
  const unresolved = [];
  body = body.replace(/!\[\[([^\]]+)\]\]/g, (_,target)=> {
    const name = target.split('|')[0];
    const match = walk(vault).find(f=>path.basename(f)===name);
    if (!match) { unresolved.push(name); return `*原笔记附件：${name}（待补充）*`; }
    const dest = 'notes/' + path.relative(vault,match).split(path.sep).join('/');
    fs.mkdirSync(path.dirname(path.join(root,'public',dest)),{recursive:true});
    fs.copyFileSync(match,path.join(root,'public',dest));
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(name) ? `![${name}](/${dest})` : `[${name}](/${dest})`;
  });
  body = body.replace(/(?<!!)\[\[([^\]]+)\]\]/g, (_,target)=>target.split('|').at(-1));
  const date = $('time.post-meta-date-created').first().attr('datetime') || $('meta[property="article:published_time"]').attr('content');
  if (!date) throw new Error(`Missing date: ${title}`);
  const meta = {title,date,updated:$('time.post-meta-date-updated').first().attr('datetime') || date,
    permalink, category:$('a.post-meta-categories').first().text().trim() || 'life',
    description:$('meta[name="description"]').attr('content')?.slice(0,150) || title,
    source:found ? `obsidian-vault/${source}` : 'published-html'};
  const front = Object.entries(meta).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n');
  write(path.join(root,'src/content/posts',permalink.slice(1,-1)+'.md'), `---\n${front}\n---\n\n${body}\n`);
  report.push({...meta,unresolved,embeds});
}
for (const dir of ['img','pdf']) fs.cpSync(path.join(root,dir),path.join(root,'public',dir),{recursive:true});
fs.copyFileSync(path.join(root,'CNAME'),path.join(root,'public/CNAME'));
// About uses only the already-published content, avoiding new personal details from the vault.
const $about = load(fs.readFileSync(path.join(root,'about/index.html'),'utf8'));
$about('img[data-lazy-src]').each((_,el)=>{
  $about(el).attr('src',$about(el).attr('data-lazy-src')).attr('loading','lazy').attr('decoding','async').removeAttr('data-lazy-src');
});
$about('#article-container div[style*="display: flex"]').each((_,el)=>{
  $about(el).css('flex-wrap','wrap');
});
write(path.join(root,'src/data/about.html'),$about('#article-container').html() || $about('#page').html() || '');
write(path.join(root,'migration-report.json'),JSON.stringify(report,null,2));
const oldPages = ['index.html','about','archives','categories','page','2025','2026'].flatMap(name=>{
  const file=path.join(root,name);
  return fs.statSync(file).isDirectory()?walk(file).filter(f=>f.endsWith('index.html')):[file];
}).map(file=>path.relative(root,file).split(path.sep).join('/'));
write(path.join(root,'legacy-page-paths.json'),JSON.stringify(oldPages,null,2));
console.log(`Migrated ${report.length} posts (${report.filter(p=>p.source!=='published-html').length} Markdown originals).`);
