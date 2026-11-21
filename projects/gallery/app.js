const {$,node}=Studio;
const prints=[
{id:'tidal',name:'Tidal rings',category:'Curves',note:'Repeated arcs grow out of one corner, drawing the eye across the page.'},
{id:'crosswalk',name:'Crosswalk',category:'Linear',note:'Parallel diagonal bands give a still surface a sense of movement.'},
{id:'afterglow',name:'Afterglow',category:'Curves',note:'Warm nested curves frame an off-center point.'}];
let visible=prints,index=0;
  function show(){const item=visible[index];
  $('edition').src='../../assets/art/'+item.id+'.svg';
  $('edition').alt=item.name+' geometric poster';
  $('edition').classList.remove('zoom');
  $('zoom').textContent='Zoom in';
  $('printTitle').textContent=item.name;
  $('design').textContent=item.note;
}
  function render(){const list=$('prints');
  list.replaceChildren();
    visible.forEach((item,i)=>{const b=node('button'),img=new Image();
    img.src='../../assets/art/'+item.id+'.svg';
    img.alt=item.name+' geometric artwork';
    const label=node('strong',item.name+' ↗');label.append(node('small',item.category));
    b.append(img,label);
      b.onclick=()=>{index=i;
      show();
      $('light').showModal();
    };
    list.append(b);
  });
}
function step(by){index=(index+by+visible.length)%visible.length;show();}
$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);
$('zoom').onclick=()=>{$('zoom').textContent=$('edition').classList.toggle('zoom')?'Zoom out':'Zoom in';};
$('light').onkeydown=e=>{if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);};
  $('categories').onclick=e=>{if(!e.target.matches('button'))return;
  const cat=e.target.textContent;
  visible=prints.filter(x=>cat==='All prints'||cat===x.category);
  $('categories').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===e.target));
  render();
};
render();
