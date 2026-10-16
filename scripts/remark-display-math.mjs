// Obsidian permits $$formula$$ on one line. Preserve its intended block layout.
export default function remarkDisplayMath() {
  return (tree, file) => {
    const source = String(file.value);
    function visit(parent) {
      if (!parent.children) return;
      parent.children = parent.children.flatMap(node => {
        visit(node);
        if (node.type !== 'paragraph') return [node];
        const result = [];
        let inline = [];
        const flush = () => {
          if (inline.some(child=>child.type!=='text' || child.value.trim())) result.push({type:'paragraph',children:inline});
          inline = [];
        };
        for (const child of node.children) {
          const start = child.position?.start.offset;
          if (child.type==='inlineMath' && start!==undefined && source.slice(start,start+2)==='$$') {
            flush();
            result.push({type:'math',value:child.value,data:{hName:'div',hProperties:{className:['math','math-display']},hChildren:[{type:'text',value:child.value}]}});
          } else inline.push(child);
        }
        flush();
        return result;
      });
    }
    visit(tree);
  };
}
