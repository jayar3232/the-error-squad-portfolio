// Addition chains are reduced after each multiplication/division group.
function evaluateExpression(expression){
  const tokens=expression.match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[+*/-]/gi);
  if(!tokens||tokens.join('')!==expression)throw Error('Incomplete expression');
  let cursor=0;
  function number(){
    const sign=tokens[cursor]==='-'?(cursor++,-1):1;
    const token=tokens[cursor++];if(!token||!/^\d|^\./.test(token))throw Error('Incomplete expression');
    return sign*Number(token);
  }
    function term(){let value=number();
      while(['*','/'].includes(tokens[cursor])){const op=tokens[cursor++],n=number();
      if(op==='/'&&n===0)throw Error('Cannot divide by zero');
      value=op==='*'?value*n:value/n;
    }return value;
  }
  let total=term();
    while(cursor<tokens.length){const op=tokens[cursor++];
    if(!['+','-'].includes(op))throw Error('Invalid expression');
    const next=term();
    total+=op==='+'?next:-next;
  }
  if(!Number.isFinite(total))throw Error('Result exceeds range');return String(Number(total.toPrecision(14)));
}
