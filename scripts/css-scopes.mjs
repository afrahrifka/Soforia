import postcss from 'postcss';import selectorParser from 'postcss-selector-parser';
/** Prefix pada build membatasi setiap stylesheet ke akar UI pemiliknya. */
export function compileScopedCss(source,scope){
 const root=postcss.parse(source),isDashboard=scope==='dashboard',id=scope.replace(/^game:/,'');if(!isDashboard&&!/^[a-z][a-z0-9-]{1,31}$/.test(id))throw Error('Scope CSS tidak valid.');
 const prefix=isDashboard?':where(body.catalog-screen)':`:where([data-game-scope="${id}"])`,names=new Map();
 root.walkAtRules(rule=>{if(!['media','supports','container','layer','keyframes','-webkit-keyframes'].includes(rule.name))throw Error(`@${rule.name} tidak diizinkan pada ${scope}.`);if(/keyframes$/i.test(rule.name)){const original=rule.params;if(!/^[a-zA-Z][\w-]*$/.test(original))throw Error('Nama animasi tidak valid.');names.set(original,`${id}-${original}`);rule.params=names.get(original);}});
 root.walkDecls(decl=>{if(/url\s*\(/i.test(decl.value))throw Error(`CSS ${scope}: gunakan aset melalui modul, bukan URL CSS global.`);if(decl.prop==='animation'||decl.prop==='animation-name')for(const [a,b] of names)decl.value=decl.value.replace(new RegExp(`\\b${a}\\b`,'g'),b);});
 root.walkRules(rule=>{if(rule.parent?.type==='atrule'&&/keyframes$/i.test(rule.parent.name))return;const result=[];
  selectorParser(ast=>ast.each(selector=>{const text=selector.toString();if(isDashboard){if(/^body\b/.test(text)){result.push(text.replace(/^body(?:\.catalog-screen)?/,'body.catalog-screen'));return;}if(/^\.display-only\b/.test(text)){result.push(text.replace(/^\.display-only/,'body.catalog-screen.display-only'));return;}}
   selector.walk(node=>{if(node.type==='tag'&&['html','body'].includes(node.value)||node.type==='pseudo'&&[':root',':global',':scope',':host',':host-context'].includes(node.value)||node.type==='nesting'||node.type==='attribute'&&node.attribute==='data-game-scope'||node.type==='combinator'&&['+','~'].includes(node.value.trim()))throw Error(`Selector keluar scope pada ${scope}: ${text}`);});
   result.push(`${prefix} ${text}`);if(!isDashboard){const clone=selector.clone(),node=selectorParser().astSync(prefix).first.first.clone(),first=clone.first;if(first?.type==='tag'||first?.type==='universal')clone.insertAfter(first,node);else clone.prepend(node);result.push(clone.toString());}
  })).processSync(rule.selector);rule.selector=result.join(',\n');
 });return root.toString();
}
