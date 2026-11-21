function opponentMove(remaining,difficulty,random=Math.random){
  if(!Number.isInteger(remaining)||remaining<1)throw Error('Round is over');
  const limit=Math.min(2,remaining);
  if(difficulty==='Strategic'&&remaining%3)return remaining%3;
  return 1+Math.floor(random()*limit);
}
