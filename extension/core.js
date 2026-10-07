(() => {
  const text = v => String(v ?? '');
  function normalize(r) {
    const raw = text(r.sdStartDt), hour = text(r.sdStartHour);
    const date = /^\d{8}$/.test(raw) ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}` : '';
    const time = /^\d{4}/.test(hour) ? `${hour.slice(0,2)}:${hour.slice(2,4)}` : '';
    const cancelled = r.rsStepCd === 'CANCEL';
    let mobile = '';
    if (!cancelled && ((r.rsStepCd === 'RSRV' && r.rsStatusCd === 'COMP' && r.delivTycd === 'MOBILE') || (Number(r.rsQuant) - Number(r.cancelQuant) > Number(r.tktQuant) && r.delivTycd === 'SITE'))) {
      try { const u = new URL(r.rsShortUrl); if (u.protocol === 'https:' && u.hostname === 'tket.me') mobile = u.href; } catch {}
    }
    return {id:text(r.rsPinNo),title:text(r.perfMainNm)||'제목 미표기',date,time,venue:[r.venueNm,r.hallNm].filter(Boolean).join(' ')||'장소 미표기',qty:text(r.rsQuant),status:cancelled?'취소완료':r.rsStatusCd==='WAIT'?'입금대기':['RSRV','TICKET'].includes(r.rsStepCd)?'예매완료':'상태 확인 필요',mobile,detail:`/mypage/tickets/${cancelled?'canceldetail':'ticketdetail'}/${encodeURIComponent(text(r.rsPinNo))}`};
  }
  function filter(rows, s) {
    return rows.filter(r=>(!s.date||r.date===s.date)&&(!s.venue||r.venue===s.venue)&&(!s.query||r.title.toLocaleLowerCase().includes(s.query.toLocaleLowerCase()))).sort((a,b)=>{
      const c = (a.date||'9999').localeCompare(b.date||'9999') || a.time.localeCompare(b.time) || a.id.localeCompare(b.id);
      return s.sort==='desc' ? -c:c;
    });
  }
  function anchorId(saved, ids) {
    if (!saved) return null;
    if (ids.includes(saved.id)) return saved.id;
    const order = saved.order || [], i = order.indexOf(saved.id);
    return order.slice(i+1).find(id=>ids.includes(id)) || order.slice(0,Math.max(0,i)).reverse().find(id=>ids.includes(id)) || null;
  }
  async function collect(request, progress=()=>{}) {
    const map = new Map(); let offset=0, expected=null;
    for(let page=0;page<200;page++) {
      const data=await request(offset,10);
      if(data.resultCode != null && data.resultCode !== '0000') throw Error('로그인 상태 또는 조회 응답을 확인해 주세요.');
      if(!Array.isArray(data.resultList)) throw Error('목록 응답 형식이 달라졌습니다.');
      const total=Number(data.total), limit=Number(data.limit), returnedOffset=Number(data.offset);
      if(!Number.isInteger(total)||total<0||!Number.isInteger(limit)||limit<=0||returnedOffset!==offset) throw Error('페이지 정보를 확인할 수 없습니다.');
      if(expected!==null&&expected!==total) throw Error('조회 중 예매 내역이 변경되었습니다. 다시 새로고침해 주세요.');
      expected=total;
      for(const raw of data.resultList) { const row=normalize(raw); if(!row.id) throw Error('예매번호가 없는 응답입니다.'); map.set(row.id,row); }
      progress(map.size,total);
      if(offset+limit>=total) { if(map.size!==total) throw Error('일부 예매가 누락되거나 중복되었습니다. 다시 조회해 주세요.'); return [...map.values()]; }
      if(!data.resultList.length) throw Error('다음 페이지를 읽지 못했습니다.');
      offset+=limit;
    }
    throw Error('조회 범위를 초과했습니다.');
  }
  const api={normalize,filter,anchorId,collect};
  if(typeof module!=='undefined') module.exports=api; else window.BiffTicketCore=api;
})();
