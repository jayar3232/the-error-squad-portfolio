const {$,node,read,save,notify}=Studio;
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const clientId=uid(),cfg=window.FIELDWORK_CHAT||{},historyKey=['room',cfg.url||'local',cfg.room].join('.');
let messages=read(historyKey,[]),typingTimer;
$('alias').value=read('chatName','Guest');$('alias').onchange=()=>save('chatName',$('alias').value.trim());
  function draw(){const box=$('messages');
  box.replaceChildren();
  if(!messages.length)box.append(node('p','Your conversation starts here.'));
    for(const m of messages){const bubble=node('div','','bubble'+(m.clientId===clientId?' mine':''));
    bubble.append(node('small',(m.name[0]||'?').toUpperCase()+' · '+m.name+' · '+new Date(m.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),'avatar'),node('span',m.text));
    box.append(bubble);
  }box.scrollTop=box.scrollHeight;
}
  function add(m){messages=[...new Map([...read(historyKey,[]),...messages,m].map(x=>[x.id,x])).values()].sort((a,b)=>a.time.localeCompare(b.time)).slice(-100);
  save(historyKey,messages);
  draw();
}
  const room=StudioServices.connectChat({...cfg,clientId},m=>{add(m);
  $('typing').textContent='';
  },m=>{$('typing').textContent=m.name+' is typing…';
  clearTimeout(typingTimer);
  typingTimer=setTimeout(()=>$('typing').textContent='',1800);
  },(state,detail)=>{$('connection').textContent=detail;
  $('chatHelp').textContent=state==='local'?'Local mode. Open this page in two tabs on localhost or the private site to exchange messages. A single tab works as a local conversation log.':'Shared room mode. Messages reach connected participants.';
});
$('message').oninput=()=>room.typing($('alias').value.trim()||'Guest');
  $('emoji').onclick=()=>{const el=$('message');
  el.setRangeText('🙂',el.selectionStart,el.selectionEnd,'end');
  el.focus();
};
  $('composer').onsubmit=async e=>{e.preventDefault();
  let input=$('message'),text=input.value.trim();
  if(!text)return;
  const m={id:uid(),name:$('alias').value.trim()||'Guest',text,time:new Date().toISOString(),clientId};
  const b=e.currentTarget.querySelector('button:last-child');
  b.disabled=true;
    try{await room.send(m);
    add(m);
    if(input.value.trim()===text)input.value='';
    }catch(err){notify(err.message);
    }finally{b.disabled=false;
}};
addEventListener('pagehide',()=>room.close());
  addEventListener('pageshow',e=>{if(e.persisted)location.reload();
});
draw();

for(const prompt of ['Can I review the gallery?','What should we test?','Are we ready to present?']){
  const button=node('button',prompt);
    button.onclick=()=>{$('message').value=prompt;
    $('message').focus();
  };
  $('prompts').append(button);
}
