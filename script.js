(() => {
  'use strict';
  const table = document.querySelector('.leaderboard-table');
  const rows = Array.from(table.tBodies[0].rows);
  const values = row => ({ f2p:Number(row.cells[2].dataset.value),p2p:Number(row.cells[3].dataset.value),passRate:Number(row.cells[4].dataset.value) });
  let activeSort='f2p',direction='descending';
  const columns={f2p:2,p2p:3,passRate:4};
  Object.entries(columns).forEach(([key,index])=>{
    const best=Math.max(...rows.map(row=>values(row)[key]));
    rows.forEach(row=>row.cells[index].classList.toggle('metric-best',values(row)[key]===best));
  });
  function sort(key,toggle=true){
    direction=toggle&&activeSort===key&&direction==='descending'?'ascending':'descending';activeSort=key;
    const ordered=rows.slice().sort((a,b)=>(values(a)[key]-values(b)[key])*(direction==='ascending'?1:-1)||values(b).f2p-values(a).f2p);
    ordered.forEach((row,index)=>{row.cells[0].textContent=String(index+1).padStart(2,'0');table.tBodies[0].append(row);});
    document.querySelectorAll('th[data-col]').forEach(th=>{
      const selected=th.dataset.col===key;
      if(selected)th.setAttribute('aria-sort',direction);else th.removeAttribute('aria-sort');
      th.querySelector('.sort-arrow').textContent=selected?(direction==='descending'?'↓':'↑'):'↕';
    });
  }
  document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>sort(button.dataset.sort)));
  sort('f2p',false);
  const flowTitles=['Read the handoff','Trace the open work','Confirm the requirement','Change the code','Check and report'];
  const flowNotes = [
    ["START WITH THE HANDOFF", "The handoff identifies the project and where to look next. The agent uses the board, project records and colleagues to work out which requirements remain open."],
    ["FIND THE QUESTION TO RESOLVE", "MEM-227 concerns the audit summary. Before changing the code, the agent needs to ask Yuan Jing which data the summary should use and what to return when no audit is saved."],
    ["TURN THE REPLY INTO A REQUIREMENT", "The colleague confirms that the summary must come from saved audit data. If there is no saved audit, the function must return null without building a replacement from transaction data."],
    ["APPLY THE CONFIRMED REQUIREMENT", "The existing fallback builds a summary from transaction data when no audit is saved. The agent removes that fallback so the function returns the saved audit or null, as the colleague specified."],
    ["CHECK THE CONFIRMED BEHAVIOR", "The agent tests both cases: existing audit data should be returned, and missing audit data should produce null without generating a replacement summary. Both tests pass."]
  ];
  const flowTabs=Array.from(document.querySelectorAll('.flow-node'));
  let currentFlow=0,flowTimer=null;
  function stopFlow(){
    if(flowTimer!==null)clearInterval(flowTimer);flowTimer=null;
    const button=document.querySelector('[data-flow-play]');button.querySelector('span').textContent='Play walkthrough';button.setAttribute('aria-pressed','false');
  }
  function activateFlow(index,{focus=false,manual=true}={}){
    if(manual)stopFlow();currentFlow=index;
    document.querySelectorAll('[data-flow-step]').forEach(button=>{
      const i=Number(button.dataset.flowStep),selected=i===index;
      button.classList.toggle('is-before',i<index);
      if(button.classList.contains('flow-node')){button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;button.setAttribute('aria-label','Step '+(i+1)+': '+flowTitles[i]);}
      else button.setAttribute('aria-pressed',String(selected));
    });
    document.querySelectorAll('.flow-stage').forEach((panel,i)=>panel.hidden=i!==index);
    document.querySelector('[data-flow-counter]').textContent=String(index+1).padStart(2,'0')+' / 05 · '+flowTitles[index];
    document.querySelector('[data-flow-prev]').disabled=index===0;document.querySelector('[data-flow-next]').disabled=index===4;
    const note=document.querySelector('[data-hero-note]');note.querySelector('span').textContent=flowNotes[index][0];note.querySelector('p').textContent=flowNotes[index][1];
    if(focus)flowTabs[index].focus();
  }
  document.querySelectorAll('[data-flow-step]').forEach(button=>button.addEventListener('click',()=>activateFlow(Number(button.dataset.flowStep))));
  flowTabs.forEach((tab,index)=>tab.addEventListener('keydown',event=>{
    const next=event.key==='ArrowRight'?(index+1)%5:event.key==='ArrowLeft'?(index+4)%5:event.key==='Home'?0:event.key==='End'?4:null;
    if(next!==null){event.preventDefault();activateFlow(next,{focus:true});}
  }));
  document.querySelector('[data-flow-prev]').addEventListener('click',()=>activateFlow(Math.max(0,currentFlow-1)));
  document.querySelector('[data-flow-next]').addEventListener('click',()=>activateFlow(Math.min(4,currentFlow+1)));
  document.querySelector('[data-flow-play]').addEventListener('click',()=>{
    if(flowTimer!==null){stopFlow();return;}
    if(currentFlow===4)activateFlow(0);
    const button=document.querySelector('[data-flow-play]');button.querySelector('span').textContent='Pause walkthrough';button.setAttribute('aria-pressed','true');
    flowTimer=setInterval(()=>{if(document.hidden){stopFlow();return;}if(currentFlow===4){stopFlow();return;}activateFlow(currentFlow+1,{manual:false});},6500);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFlow();});
  activateFlow(0);
  const demoVideo=document.getElementById('demo-video');
  const demoPlay=document.querySelector('.demo-play');
  const demoStatus=document.querySelector('.demo-status');
  demoPlay.hidden=false;
  demoVideo.controls=false;
  function showDemoFallback(){
    demoPlay.hidden=true;
    demoVideo.controls=true;
    demoStatus.hidden=false;
  }
  async function playDemo(){
    stopFlow();
    demoPlay.hidden=true;
    demoVideo.controls=true;
    demoStatus.hidden=true;
    try{
      if(demoVideo.ended)demoVideo.currentTime=0;
      await demoVideo.play();
      demoVideo.focus({preventScroll:true});
    }catch{showDemoFallback();}
  }
  demoPlay.addEventListener('click',playDemo);
  document.querySelectorAll('[data-play-demo]').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    document.getElementById('demo').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    playDemo();
  }));
  demoVideo.addEventListener('play',()=>{demoPlay.hidden=true;demoVideo.controls=true;demoStatus.hidden=true;});
  demoVideo.addEventListener('ended',()=>{demoPlay.hidden=false;demoVideo.controls=false;});
  demoVideo.addEventListener('error',showDemoFallback);
  demoVideo.querySelector('source').addEventListener('error',showDemoFallback);
  const figureDialog=document.getElementById('image-dialog');
  function openDialog(dialog){dialog.showModal();document.body.classList.add('modal-open');}
  document.querySelectorAll('.zoom-image').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();
    const image=document.getElementById('enlarged-image');image.src=button.dataset.image;image.alt=button.dataset.caption;
    document.getElementById('enlarged-caption').textContent=button.dataset.caption;openDialog(figureDialog);
  }));
  [figureDialog].forEach(dialog=>{
    dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{
      const r=dialog.getBoundingClientRect();
      if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();
    });
    dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});
  });
  document.getElementById('copy-citation').addEventListener('click',async()=>{
    const status=document.getElementById('copy-status');
    try{await navigator.clipboard.writeText(document.getElementById('citation').textContent);status.textContent='Citation copied.';}
    catch{status.textContent='Select the citation above to copy it.';}
  });
  const navLinks=Array.from(document.querySelectorAll('.site-header nav a'));
  const navSections=navLinks.map(link=>({link,section:document.querySelector(link.hash)})).filter(item=>item.section);
  let navUpdatePending=false;
  function updateNavigation(){
    navUpdatePending=false;
    const threshold=document.querySelector('.site-header').offsetHeight+48;
    const current=navSections.filter(item=>item.section.getBoundingClientRect().top<=threshold).pop();
    navLinks.forEach(link=>{
      if(current&&link===current.link)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleNavigationUpdate(){
    if(!navUpdatePending){navUpdatePending=true;requestAnimationFrame(updateNavigation);}
  }
  window.addEventListener('scroll',scheduleNavigationUpdate,{passive:true});
  window.addEventListener('resize',scheduleNavigationUpdate);
  updateNavigation();
})();
