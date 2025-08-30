const WebSocket = require('ws');

const targets = [
  'wss://gloobix-io.onrender.com/socket',
  'wss://gloobix-io.onrender.com/',
  'wss://gloobix-io.onrender.com:443/socket'
];

function test(url){
  return new Promise((resolve)=>{
    console.log('\n-> Testing', url);
    const ws = new WebSocket(url, {headers:{Origin: 'https://gloobix-io.onrender.com'}});
    let done = false;
    const t = setTimeout(()=>{
      if(done) return;
      done = true;
      console.log('-> timeout after 6s');
      try{ ws.terminate(); }catch(e){}
      resolve({url, status:'timeout'});
    }, 6000);
    ws.on('open', ()=>{
      if(done) return; done = true; clearTimeout(t);
      console.log('-> open');
      ws.close();
      resolve({url, status:'open'});
    });
    ws.on('error', (err)=>{
      if(done) return; done = true; clearTimeout(t);
      console.log('-> error', err && err.message ? err.message : err);
      resolve({url, status:'error', err: err && err.stack ? err.stack : err});
    });
    ws.on('close', (code, reason)=>{
      if(done) return; done = true; clearTimeout(t);
      console.log('-> close', code, reason && reason.toString());
      resolve({url, status:'close', code, reason: reason && reason.toString()});
    });
  });
}

(async function(){
  for(const t of targets){
    try{
      const r = await test(t);
      // small pause
      await new Promise(r=>setTimeout(r,300));
    }catch(e){
      console.error('fatal', e);
    }
  }
})();
