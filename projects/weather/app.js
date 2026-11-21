const {$,node,read,save}=Studio;
const examples=[['Cagwait',28,'Light rain','🌦',84,12],['Cebu',31,'Sunny','☀',69,9],['Baguio',19,'Cloudy','☁',88,7]];
let data,unit=read('unit','C'),request=0;
function degrees(v){return Math.round(unit==='F'?v*9/5+32:v)+'°'+unit;}
function draw(){
  $('units').textContent='Show °'+(unit==='C'?'F':'C');if(!data)return;
  const r=$('reading'),wx=node('div','','wx'),now=node('div','','wx-now');
  now.append(node('small',data.sample?'Illustrative sample':'Open-Meteo · current estimate'),node('div',data.icon,'wx-icon'),node('div',degrees(data.temperature),'wx-temp'),node('h3',[data.city,data.country].filter(Boolean).join(', ')),node('p',data.condition));
  const stats=node('div','','wx-stats');
  [['Humidity',data.humidity+'%'],['Wind',data.wind+' km/h'],...(data.time?[['Local time',data.time.replace('T',' ')]]:[])].forEach(([k,v])=>{const d=node('div');d.append(node('small',k),node('strong',v));stats.append(d);});
  wx.append(now,stats);
  if(data.forecast?.length){const fc=node('div','','wx-fc');fc.append(node('h3','Forecast'));
    const ul=node('ul','','forecast');
    data.forecast.forEach(day=>{const d=new Date(day.date+'T12:00:00'),li=node('li');
    li.append(node('span',isNaN(d)?day.date:d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}),'day'),node('span',day.icon,'ico2'),node('span',day.condition),node('strong',degrees(day.max)+' / '+degrees(day.min)));ul.append(li);});
    fc.append(ul);wx.append(fc);
  }
  const a=node('a','Weather data by Open-Meteo ↗');
  a.href='https://open-meteo.com/';
  if(!data.sample)(wx.querySelector('.wx-fc')||wx).append(a);
  r.replaceChildren(wx);
}
  function sample(row){const [city,temperature,condition,icon,humidity,wind]=row;
  data={city,temperature,condition,icon,humidity,wind,sample:true};
  draw();
}
  examples.forEach(row=>{const b=node('button',row[0]);
    b.onclick=()=>{request++;
    $('status').classList.remove('busy');
    $('status').textContent='Sample selected.';
    sample(row);
  };
  $('samples').append(b);
});
  async function lookup(){const city=$('city').value.trim();
  if(!city)return;
  const id=++request;
  data=null;
  $('reading').replaceChildren();
  $('status').classList.add('busy');
  $('status').textContent='Looking up '+city+'…';
    try{const result=await StudioServices.weather(city);
    if(id!==request)return;
    data=result;
    draw();
    $('status').textContent='Forecast loaded.';
    }catch(err){if(id!==request)return;
    const row=examples.find(r=>r[0].toLowerCase()===city.toLowerCase())||examples[0];
    sample(row);
    $('status').textContent=err.message+' Showing a labeled '+row[0]+' sample.';
    }finally{if(id===request)$('status').classList.remove('busy');
}}
  $('cityForm').onsubmit=e=>{e.preventDefault();
  lookup();
};
  $('units').onclick=()=>{unit=unit==='C'?'F':'C';
  save('unit',unit);
  draw();
};
draw();
lookup();
