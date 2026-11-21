const {$,node,read,save}=Studio;
let expression='',finished=false,history=read('calculations',[]);
const labels={'*':'×','/':'÷','-':'−',Backspace:'⌫',Escape:'AC'};
const pretty=x=>x.replaceAll('*','×').replaceAll('/','÷');
  function drawHistory(){const list=$('history');
  list.replaceChildren(...history.map(t=>node('li',t)));
  if(!history.length)list.append(node('li','No calculations yet.'));
}
function press(key){
  if(key==='Escape'){expression='';finished=false;}
  else if(key==='Backspace'){expression=expression.slice(0,-1);finished=false;}
    else if(key==='='){if(!expression)return;
      try{const result=evaluateExpression(expression);
      history=[pretty(expression)+' = '+result,...history].slice(0,30);
      save('calculations',history);
      drawHistory();
      expression=result;
      finished=true;
      }catch(err){$('display').textContent=err.message;
      return;
  }}
    else if(/^[0-9.]$/.test(key)){if(finished)expression='';
    finished=false;
    const last=expression.split(/[+*/-]/).pop();
    if(key==='.'&&last.includes('.'))return;
    if(expression.length>=90)return;
    expression+=(key==='.'&&!last?'0':'')+key;
  }
    else if(/^[+*/-]$/.test(key)){finished=false;
    if(!expression&&key!=='-')return;
    if(/[+*/-]$/.test(expression)&&key!=='-')expression=expression.replace(/[+*/-]+$/,'');
    if(expression||key==='-')expression+=key;
  }
  $('display').textContent=pretty(expression)||'0';
}
  ['Escape','Backspace','/','*','7','8','9','-','4','5','6','+','1','2','3','.','0','='].forEach(key=>{const b=node('button',labels[key]||key,/^[+*\/-]$/.test(key)?'op':'');
  b.setAttribute('aria-label',key==='Backspace'?'Delete digit':key==='Escape'?'Clear calculator':labels[key]||key);
  b.onclick=()=>press(key);
  $('keys').append(b);
});
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.key==='Enter'&&e.target.matches('button,a'))return;
  let k=e.key==='Enter'?'=':e.key;
    if(/^[0-9.+*/=-]$/.test(k)||['Escape','Backspace'].includes(k)){e.preventDefault();
    press(k);
}});
$('clearHistory').onclick=()=>{history=[];save('calculations',history);drawHistory();};drawHistory();
