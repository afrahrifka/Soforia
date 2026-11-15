import net from 'node:net';
async function available(port){const server=net.createServer();return new Promise(resolve=>{server.once('error',()=>resolve(false));server.listen(port,'0.0.0.0',()=>server.close(()=>resolve(true)));});}
for(let port=3210;port<3310;port+=2){if(await available(port)&&await available(port+1)){console.log(port);process.exit(0);}}
console.error('Tidak ada pasangan port kosong 3210–3309. Gunakan --port dan --operator-port.');process.exit(1);
