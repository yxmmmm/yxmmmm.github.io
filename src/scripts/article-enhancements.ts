export {};
const diagrams: {source: string; element: HTMLElement}[] = [];

document.querySelectorAll<HTMLPreElement>('.prose pre').forEach(pre => {
  const code = pre.querySelector('code');
  if (!code) return;
  const source = code.textContent || '';
  const language = pre.dataset.language || code.className.match(/language-([^\s]+)/)?.[1] || 'text';
  if (language === 'mermaid') {
    const figure = document.createElement('figure');
    figure.className = 'diagram-block';
    const caption = document.createElement('figcaption');
    caption.textContent = '流程图';
    const diagram = document.createElement('div');
    diagram.className = 'mermaid-diagram';
    diagram.setAttribute('aria-label','文章流程图');
    diagram.setAttribute('aria-busy','true');
    diagram.textContent = '图表正在加载…';
    figure.append(caption,diagram);
    pre.replaceWith(figure);
    diagrams.push({source,element:diagram});
    return;
  }
  const block = document.createElement('div');
  block.className = 'code-block';
  const toolbar = document.createElement('div');
  toolbar.className = 'code-toolbar';
  const label = document.createElement('span');
  label.className = 'code-language';
  label.textContent = ({cpp:'C++',c:'C',js:'JavaScript',ts:'TypeScript',python:'Python',py:'Python',text:'TEXT'} as Record<string,string>)[language] || language.toUpperCase();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-copy';
  button.textContent = '复制代码';
  button.setAttribute('aria-label',`复制 ${label.textContent} 代码`);
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role','status');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(source);
      button.textContent = '已复制 ✓'; status.textContent = '代码已复制';
    } catch {
      button.textContent = '请选择代码复制'; status.textContent = '无法自动复制，请选择代码后复制';
    }
    setTimeout(()=>button.textContent='复制代码',2000);
  });
  toolbar.append(label,button,status);
  pre.before(block);
  block.append(toolbar,pre);
  pre.tabIndex = 0;
  pre.setAttribute('aria-label',`${label.textContent} 代码块`);
});

if (diagrams.length) {
  // This chunk is only fetched on articles containing diagrams; no CDN dependency.
  const { default: mermaid } = await import('mermaid');
  let rendering = false;
  let pending = false;
  let sequence = 0;
  async function renderDiagrams() {
    if (rendering) { pending = true; return; }
    rendering = true;
    const dark = document.documentElement.dataset.theme === 'dark';
    mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:dark?'dark':'neutral',fontFamily:'system-ui, Microsoft YaHei, sans-serif',flowchart:{useMaxWidth:true,htmlLabels:true}});
    for (const diagram of diagrams) {
      try {
        const {svg,bindFunctions} = await mermaid.render(`article-diagram-${sequence++}`,diagram.source);
        diagram.element.innerHTML = svg;
        bindFunctions?.(diagram.element);
      } catch {
        diagram.element.textContent = diagram.source;
        diagram.element.classList.add('diagram-error');
        diagram.element.setAttribute('aria-label','图表渲染失败，显示原始内容');
      } finally { diagram.element.setAttribute('aria-busy','false'); }
    }
    rendering = false;
    if (pending) { pending = false; void renderDiagrams(); }
  }
  await renderDiagrams();
  new MutationObserver(()=>void renderDiagrams()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}
