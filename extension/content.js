(() => {
  'use strict';
  if(document.getElementById('biff-better-view')) return;
  const original=document.getElementById('myPageTab');
  if(!original || !document.getElementById('sForm')) return;
  const C=window.BiffTicketCore, KEY='biff-ticket-view:v1';
  const now=new Date(), currentMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let state={month:currentMonth,tab:'RS',date:'',venue:'',query:'',sort:'asc',anchor:null,original:false};
  try { const saved=JSON.parse(sessionStorage.getItem(KEY)); if(saved && /^\d{4}-\d{2}$/.test(saved.month)) state={...state,...saved}; } catch {}
  if(!['RS','CANCEL'].includes(state.tab)) state.tab='RS';
  let rows=[],visible=[],ready=false,busy=false,controller,restoring=true,scrollTimer,navigating=false;
  const host=document.createElement('div'); host.id='biff-better-view'; original.before(host);
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
  :host{display:block;color:#242020;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;margin:22px 0 40px}*{box-sizing:border-box}button,input,select{font:inherit}button,a,input,select{border-radius:10px}button,select,input{border:1px solid #dfd5d5;background:white;color:#242020;padding:10px 13px}button,a{cursor:pointer}button:hover,a:hover{background:#fff0ef}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b91c1c;outline-offset:3px}button:disabled{opacity:.5;cursor:wait}.shell{background:#fffafa;border:1px solid #ebdddd;border-radius:20px;padding:26px}.head,.tools,.filters,.actions,.grouphead{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.head{justify-content:space-between}h2{font-size:27px;letter-spacing:-1px;margin:0}p{margin:5px 0;color:#706363}.eyebrow{font-size:12px;font-weight:750;letter-spacing:2px;color:#b91c1c}.tools{margin:24px 0 14px}.filters{padding:16px;background:#fff;border:1px solid #ebdddd;border-radius:12px;align-items:end}label{display:flex;flex-direction:column;gap:5px;font-size:13px;color:#706363}label.search{flex:1;min-width:160px}input[type=search]{width:100%}.dates{display:flex;gap:8px;overflow-x:auto;padding:17px 0}.dates button{white-space:nowrap}.selected{background:#e52525!important;color:white!important;border-color:#e52525!important}.status{font-size:14px;margin:12px 0;min-height:22px}.error{color:#b52727}.grouphead{margin:25px 0 10px;justify-content:space-between}.grouphead h3{margin:0;font-size:19px}.count{font-size:13px;color:#786969}.card{display:grid;grid-template-columns:78px 1fr auto;gap:18px;background:white;border:1px solid #eadede;border-radius:13px;padding:20px;margin:9px 0;align-items:center}.time{font-size:23px;font-weight:750;font-variant-numeric:tabular-nums}.title{font-size:18px;font-weight:700;margin:0 0 6px}.meta{font-size:14px;color:#706363}.badge{font-size:12px;color:#706363;margin-top:6px}.actions a{padding:9px 12px;border:1px solid #dfd5d5;text-decoration:none;color:#242020;font-size:14px}.actions a.ticket{background:#e52525;color:white;border-color:#e52525}.empty{padding:45px 15px;text-align:center;color:#706363}.note{font-size:12px;margin-top:20px} [hidden]{display:none!important}@media(max-width:700px){.shell{padding:16px}.card{grid-template-columns:65px 1fr;gap:12px;padding:15px}.actions{grid-column:2}.head h2{font-size:23px}.time{font-size:20px}.filters label{flex:1;min-width:130px}} 
  </style><section class="shell" aria-label="날짜별 예매 목록"><div class="head"><div><div class="eyebrow">MY BIFF</div><h2>나의 상영 일정</h2><p>보고 싶은 하루를, 관람 순서대로.</p></div><button id="original">원래 화면 보기</button></div><div id="enhanced"><div class="tools"><button id="reserved">예매내역</button><button id="cancelled">취소내역</button><label>조회할 관람 월<input id="month" type="month"></label><button id="refresh">새로고침</button></div><div class="filters"><label class="search">영화 찾기<input id="query" type="search" placeholder="영화 제목 검색"></label><label>상영관<select id="venue"><option value="">모든 상영관</option></select></label><label>정렬<select id="sort"><option value="asc">관람일 빠른순</option><option value="desc">관람일 늦은순</option></select></label><button id="reset">필터 초기화</button></div><div class="dates" id="dates" aria-label="관람 날짜"></div><div id="status" class="status" role="status" aria-live="polite"></div><div id="list"></div><p class="note">개인이 만든 비공식 도구이며 BIFF 및 예매 운영사와 제휴 관계가 없습니다. 선택한 관람 월의 모든 페이지를 조회합니다. 상세·취소는 공식 사이트에서 진행하며, 돌아오면 목록을 새로 확인합니다.</p></div></section>`;
  const $=id=>root.getElementById(id);
  function save(){try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{}}
  function capture(){
    if(navigating||restoring||!ready||state.original)return;
    const cards=[...root.querySelectorAll('[data-booking]')];
    const card=cards.find(e=>e.getBoundingClientRect().bottom>0);
    if(card) state.anchor={id:card.dataset.booking,top:card.getBoundingClientRect().top,order:visible.map(r=>r.id),y:scrollY};
    else state.anchor={id:'',order:visible.map(r=>r.id),y:scrollY};
    save();
  }
  function restore(){
    const a=state.anchor;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(a&&!state.original){
        const id=C.anchorId(a,visible.map(r=>r.id));
        const card=[...root.querySelectorAll('[data-booking]')].find(e=>e.dataset.booking===id);
        if(card) scrollBy(0,card.getBoundingClientRect().top-Number(a.top||0));
        else scrollTo(0,Number(a.y||0));
      }
      restoring=false;
    }));
  }
  function el(tag,text,className){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(className)e.className=className;return e;}
  function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  function mode(){original.hidden=ready&&!state.original;$('enhanced').hidden=state.original;$('original').textContent=state.original?'날짜별 화면 보기':'원래 화면 보기';}
  function render(){
    visible=C.filter(rows,state);$('list').replaceChildren();$('dates').replaceChildren();
    $('reserved').classList.toggle('selected',state.tab==='RS');$('cancelled').classList.toggle('selected',state.tab==='CANCEL');
    $('reserved').setAttribute('aria-pressed',String(state.tab==='RS'));$('cancelled').setAttribute('aria-pressed',String(state.tab==='CANCEL'));
    const dates=[...new Set([...rows.map(r=>r.date).filter(Boolean),...(state.date?[state.date]:[])])].sort();
    for(const date of ['',...dates]){const n=date?rows.filter(r=>r.date===date).length:rows.length;const b=el('button',`${date?date.slice(5).replace('-','/'): '전체'} · ${n}`,state.date===date?'selected':'');b.setAttribute('aria-pressed',String(state.date===date));b.onclick=()=>{state.date=date;state.anchor=null;save();render();};$('dates').append(b);}
    let previous=null;
    for(const r of visible){
      if(previous!==r.date){const h=el('div',null,'grouphead');h.append(el('h3',r.date?new Date(r.date+'T12:00:00').toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'}):'관람일 미표기'));h.append(el('span',`${visible.filter(x=>x.date===r.date).length}건`,'count'));$('list').append(h);previous=r.date;}
      const card=el('article',null,'card');card.dataset.booking=r.id;
      card.append(el('div',r.time||'—','time'));const info=el('div');info.append(el('h4',r.title,'title'),el('div',r.venue,'meta'),el('div',`${r.status} · ${r.qty||'?'}매`,'badge'));card.append(info);
      const actions=el('div',null,'actions');
      if(r.mobile){const a=el('a','모바일티켓','ticket');a.href=r.mobile;a.target='_blank';a.rel='noopener noreferrer';actions.append(a);}
      const detail=el('a',state.tab==='CANCEL'?'취소 상세':'상세·취소');detail.href=r.detail;detail.addEventListener('click',()=>{capture();navigating=true;state.anchor={id:r.id,top:card.getBoundingClientRect().top,order:visible.map(x=>x.id),y:scrollY};save();});actions.append(detail);card.append(actions);$('list').append(card);
    }
    if(!visible.length)$('list').append(el('div','조건에 맞는 예매가 없습니다.','empty'));
    if(ready) message(`${state.month} 관람 · 전체 ${rows.length}건 중 ${visible.length}건 표시 · ${new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 확인`);
  }
  async function load(){
    navigating=false;controller?.abort();controller=new AbortController();const active=controller;
    busy=true;ready=false;restoring=true;rows=[];$('list').replaceChildren();$('dates').replaceChildren();mode();$('refresh').disabled=true;message('모든 페이지를 불러오는 중…');
    const month=state.month,tabType=state.tab;
    try{
      const result=await C.collect(async(offset,limit)=>{
        const params=new URLSearchParams({schPeriod:'',schGubun:'SD',schYear:month.slice(0,4),schMonth:String(Number(month.slice(5))),tabType,page:String(offset/limit+1),rsSeq:'',langCd:document.querySelector('#langCd')?.value||''});
        const url=new URL('https://filmapi.maketicket.co.kr/api/v1/mypage/tickets/list');url.search=new URLSearchParams({limit:String(limit),offset:String(offset),langCd:params.get('langCd')});
        const response=await fetch(url,{method:'POST',credentials:'include',body:params,signal:AbortSignal.any([active.signal,AbortSignal.timeout(20000)])});
        if(!response.ok)throw Error(`목록 조회 실패 (${response.status})`);
        return response.json();
      },(n,total)=>message(`전체 목록 조회 중 · ${n}/${total}건`));
      if(active!==controller)return;
      rows=result;ready=true;
      $('venue').replaceChildren(new Option('모든 상영관',''));
      const venues=[...new Set(rows.map(r=>r.venue))].sort();if(state.venue&&!venues.includes(state.venue)) venues.push(state.venue);
      venues.forEach(v=>$('venue').add(new Option(v,v)));$('venue').value=state.venue;
      render();mode();restore();
    }catch(error){if(active!==controller)return;restoring=false;ready=false;mode();message(`전체 목록을 불러오지 못했습니다. ${error.message} 원래 화면을 이용하거나 새로고침해 주세요.`,true);}
    finally{if(active===controller){busy=false;$('refresh').disabled=false;}}
  }
  $('month').value=state.month;$('query').value=state.query;$('sort').value=state.sort;
  $('month').onchange=()=>{if(!/^\d{4}-\d{2}$/.test($('month').value))return;state.month=$('month').value;state.date='';state.anchor=null;save();load();};
  for(const key of ['query','venue','sort']) $(key).addEventListener(key==='query'?'input':'change',()=>{state[key]=$(key).value;state.anchor=null;save();if(ready)render();});
  for(const [id,type] of [['reserved','RS'],['cancelled','CANCEL']]) $(id).onclick=()=>{if(state.tab===type)return;state.tab=type;state.anchor=null;save();load();};
  $('reset').onclick=()=>{state.date='';state.venue='';state.query='';state.sort='asc';state.anchor=null;$('venue').value='';$('query').value='';$('sort').value='asc';save();if(ready)render();};
  $('refresh').onclick=()=>{capture();load();};
  $('original').onclick=()=>{capture();state.original=!state.original;save();mode();if(!state.original&&!ready&&!busy)load();};
  addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(capture,150);},{passive:true});
  addEventListener('pagehide',capture);
  addEventListener('pageshow',event=>{if(event.persisted)load();});
  document.addEventListener('click',event=>{if(event.target.closest?.('a[href*="film-logout"]')){try{sessionStorage.removeItem(KEY);}catch{}}},true);
  mode();load();
})();
