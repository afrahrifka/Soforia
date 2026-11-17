/** Origin publik dipisahkan dari listener: proxy Tailscale tidak mendapat port operator. */
export function networkConfig(options:{host:string;port:number;operatorPort:number;mode:string;publicOrigin?:string}){
 const {host,port,operatorPort,mode}=options;
 if(!['lan','tailscale'].includes(mode))throw Error('Mode jaringan harus lan atau tailscale.');
 const bind=`http://${host}:${port}`,local=`http://127.0.0.1:${operatorPort}`;
 let base=bind;
 if(mode==='tailscale'){
  if(host!=='127.0.0.1')throw Error('Mode Tailscale harus memakai backend loopback 127.0.0.1.');
  let url:URL;try{url=new URL(options.publicOrigin||'');}catch{throw Error('Mode Tailscale memerlukan --public-origin HTTPS MagicDNS.');}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.ts.net')||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Public origin harus HTTPS hostname .ts.net tanpa path, credential, query atau fragment.');
  base=url.origin;
 }else if(options.publicOrigin)throw Error('--public-origin hanya untuk mode Tailscale.');
 function accepts(req:any,requireOrigin=false){
  const operator=req.socket.localPort===operatorPort,expected=operator?local:base;
  const hosts=operator?[new URL(local).host]:[new URL(bind).host,new URL(base).host];
  return hosts.includes(req.headers.host)&&(!req.headers.origin?!requireOrigin:req.headers.origin===expected);
 }
 return {base,bind,local,mode,accepts};
}
