'use client';
import { useEffect, useState, useRef } from 'react';
import { AppState, loadState } from '@/lib/store';
import { apiImportBookmark, apiCreateEvent } from '@/lib/api';
import { parseNoticeText, ParsedNotice } from '@/lib/noticeParser';
import { getSession } from '@/lib/session';

export default function NoticeUpload(){
  const [s,setS]=useState<AppState|null>(null);
  const [err,setErr]=useState('');
  const [msg,setMsg]=useState('');
  const [rawText,setRawText]=useState('');
  const [parsed,setParsed]=useState<ParsedNotice|null>(null);
  const [mode,setMode]=useState<'informational'|'troop_participation'>('troop_participation');
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{loadState().then(setS).catch(e=>setErr(e.message))},[]);

  async function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(!file)return;
    setErr('');setMsg('');
    try{
      if(file.name.endsWith('.txt')||file.type==='text/plain'){
        const text=await file.text();
        setRawText(text);
        setParsed(parseNoticeText(text));
      }else if(file.name.endsWith('.docx')){
        // 動態載入 mammoth
        const mammoth=await import('mammoth/mammoth.browser');
        const arrayBuffer=await file.arrayBuffer();
        const result=await mammoth.extractRawText({arrayBuffer});
        setRawText(result.value);
        setParsed(parseNoticeText(result.value));
      }else{
        setErr('請上傳 .docx 或 .txt 檔案。');
      }
    }catch(e:any){setErr('讀取檔案失敗：'+(e?.message||String(e)))}
  }

  function parseManual(){
    if(!rawText.trim()){setErr('請先貼上通告文字或上傳檔案。');return;}
    setParsed(parseNoticeText(rawText));
    setErr('');
  }

  async function save(){
    if(!parsed){setErr('請先抽取通告內容。');return;}
    setErr('');setMsg('');
    const session=getSession();
    try{
      // 旅團參與 → 建立活動 + 書籤
      if(mode==='troop_participation'){
        const fresh=await apiCreateEvent({
          title:parsed.title||'未命名活動',
          scope:'troop',
          date:parsed.eventDate||parsed.internalDeadline||'',
          location:parsed.location||'待定',
          kind:'notice_troop_participation',
          status:'published',
          fee:parsed.fee||'',
          source:'通告上傳',
        });
        setS(fresh);
        await apiImportBookmark({
          title:parsed.title||'未命名活動',
          mode:'troop_participation',
          source:parsed.source||'通告上傳',
          officialDeadline:parsed.officialDeadline||'',
          internalDeadline:parsed.internalDeadline||'',
          fee:parsed.fee||'',
        });
        setMsg('✅ 通告已轉成活動並加入行事曆！');
      }else{
        // 資訊性 → 只加書籤
        const fresh=await apiImportBookmark({
          title:parsed.title||'未命名通告',
          mode:'informational',
          source:parsed.source||'通告上傳',
          officialDeadline:parsed.officialDeadline||'',
          internalDeadline:parsed.internalDeadline||'',
          fee:parsed.fee||'',
        });
        setS(fresh);
        setMsg('✅ 已加入資訊性通告。');
      }
      // 重新 load 取得更新
      const updated=await loadState();
      setS(updated);
    }catch(e:any){setErr(e.message)}
  }

  if(err&&!s)return <div className="card"><p className="badge red">{err}</p></div>;
  if(!s)return <div className="card">載入中...</div>;

  return (
    <div className="stack">
      <section className="hero">
        <span className="badge gold">通告上傳</span>
        <h1>上傳 Word 通告</h1>
        <p>上傳 .docx 或 .txt 通告，系統會抽取重點。旅團參與模式會建立活動並加入行事曆。</p>
      </section>

      {err&&<p className="badge red">{err}</p>}
      {msg&&<p className="badge green">{msg}</p>}

      <section className="card stack">
        <h2>① 上傳檔案或貼上文字</h2>
        <input type="file" ref={fileRef} accept=".docx,.txt" onChange={handleFile} />
        <details style={{marginTop:8}}>
          <summary className="muted" style={{cursor:'pointer'}}>或直接貼上通告文字</summary>
          <textarea rows={10} value={rawText} onChange={e=>setRawText(e.target.value)} placeholder="貼上通告文字..." style={{width:'100%',marginTop:8}} />
          <button className="btn" onClick={parseManual} style={{marginTop:8}}>抽取重點</button>
        </details>
        {rawText&&!parsed&&<button className="btn primary" onClick={parseManual} style={{marginTop:8}}>抽取重點</button>}
      </section>

      {parsed&&(
        <section className="card stack">
          <h2>② 抽取結果（請確認）</h2>
          {parsed.warnings.length>0&&(
            <div style={{background:'#fff3cd',padding:8,borderRadius:8,marginBottom:8}}>
              <strong>⚠️ 提示：</strong>
              <ul>{parsed.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>
            </div>
          )}
          <div className="grid">
            <label>標題<input defaultValue={parsed.title||''} readOnly /></label>
            <label>來源<input defaultValue={parsed.source||''} readOnly /></label>
            <label>活動日期<input defaultValue={parsed.eventDate||''} readOnly /></label>
            <label>活動地點<input defaultValue={parsed.location||''} readOnly /></label>
            <label>參加資格<input defaultValue={parsed.eligibility||''} readOnly /></label>
            <label>收費<input defaultValue={parsed.fee||''} readOnly /></label>
            <label>官方截止<input defaultValue={parsed.officialDeadline||''} readOnly /></label>
            <label>本旅截止<input defaultValue={parsed.internalDeadline||''} readOnly /></label>
          </div>
          {parsed.meetingItems.length>0&&(
            <div>
              <strong>集會項目（{parsed.meetingItems.length} 項）：</strong>
              <table className="table" style={{marginTop:8}}>
                <thead><tr><th>日期</th><th>時間</th><th>地點</th><th>活動</th><th>費用</th></tr></thead>
                <tbody>{parsed.meetingItems.map((m,i)=><tr key={i}><td>{m.date||'—'}</td><td>{m.gatherTime||''}-{m.dismissTime||''}</td><td>{m.location||''}</td><td>{m.activity||''}</td><td>{m.fee||''}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {parsed&&(
        <section className="card stack">
          <h2>③ 接入模式</h2>
          <div className="row">
            <button className={`btn ${mode==='troop_participation'?'primary':''}`} onClick={()=>setMode('troop_participation')}>🏕️ 旅團參與（加入行事曆 + 家長回覆）</button>
            <button className={`btn ${mode==='informational'?'primary':''}`} onClick={()=>setMode('informational')}>📢 資訊性（只作提醒，不加入行事曆）</button>
          </div>
          <button className="btn primary" onClick={save}>確認儲存</button>
        </section>
      )}
    </div>
  );
}
