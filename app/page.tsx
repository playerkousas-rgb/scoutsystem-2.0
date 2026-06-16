'use client';
import Link from 'next/link';
import { FeatureCard } from '@/components/Cards';
import { mutate } from '@/lib/store';
import { useEffect, useState } from 'react';

export default function Home(){
  const [selected,setSelected]=useState<any>(null);
  const [code,setCode]=useState('0082');
  const [name,setName]=useState('第82旅');
  const [scriptUrl,setScriptUrl]=useState('https://script.google.com/macros/s/AKfycbypJw25bnKxDwYoSZBTWHjq2BIQ_eC4PVdS1MDSLlT7m6SZRUHX1MihkQcSAO8_Kq2F/exec');
  const [sheetUrl,setSheetUrl]=useState('https://docs.google.com/spreadsheets/d/1wrHoYMTVXd68TbnmPwqCxqISQ7IQWEnoS_dtBVDDCsg/edit');
  const [msg,setMsg]=useState('');
  useEffect(()=>{try{const t=JSON.parse(localStorage.getItem('scoutsystem2_selected_troop')||'null');setSelected(t); if(t){setCode(t.id||'');setName(t.name||'');setScriptUrl(t.webAppUrl||'');setSheetUrl(t.sheetUrl||'')}}catch{}},[]);
  async function testAndSave(){
    setMsg('');
    if(!/^\d+$/.test(code.replace(/^0+/, '')||'0')){setMsg('旅團號必須是純數字，例如 0082');return;}
    if(!scriptUrl.includes('/exec')){setMsg('請填 Apps Script Web App /exec URL');return;}
    const troop={id:code.padStart(4,'0'), rawId:code.replace(/^0+/, '')||code, name, webAppUrl:scriptUrl, sheetUrl};
    try{
      const url=new URL(scriptUrl); url.searchParams.set('action','health');
      const res=await fetch(url.toString(),{cache:'no-store'});
      const text=await res.text();
      if(!res.ok || /Access Denied|<!doctype html|<html/i.test(text)) throw new Error('Apps Script 未公開或未正確回傳 JSON');
      try{JSON.parse(text)}catch{throw new Error('health 不是 JSON：'+text.slice(0,80));}
      setMsg('✅ 後台連接成功，已選擇旅團。');
    }catch(e:any){
      setMsg('⚠️ 已儲存旅團，但後台測試失敗：'+(e?.message||String(e))+'。請確認 Deploy → Anyone。');
    }
    localStorage.setItem('scoutsystem2_selected_troop',JSON.stringify(troop));
    mutate(s=>{s.config.TROOP_CODE=troop.id;s.config.TROOP_NAME=troop.name;s.config.WEB_APP_URL=scriptUrl;s.config.SHEET_URL=sheetUrl});
    setSelected(troop);
  }
  return <div className="stack">
    <section className="hero"><span className="badge gold">ScoutSystem 2.0 · 實測模式</span><h1>{selected?`${selected.name} ScoutSystem`:'第 1 步：連接你的旅團後台'}</h1><p>這裡不再讓你選示範單位。請填入你實際的旅團資料、Google Sheet 及 Apps Script URL。登入、成員、活動等實測都應由這個後台提供。</p><div className="row"><Link className="btn primary" href="/login">登入旅團</Link><Link className="btn gold" href="/setup">🧩 小白接入教學</Link><Link className="btn" href="/downloads">下載模板</Link></div></section>
    <section className="card stack"><h2>旅團連接設定</h2><div className="grid"><label>旅團號（純數字）<input value={code} onChange={e=>setCode(e.target.value)} placeholder="0082"/></label><label>旅團名稱<input value={name} onChange={e=>setName(e.target.value)} placeholder="第82旅"/></label></div><label>Apps Script Web App URL<input value={scriptUrl} onChange={e=>setScriptUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec"/></label><label>Google Sheet URL<input value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../edit"/></label><button className="btn primary" onClick={testAndSave}>測試並使用此旅團</button>{msg&&<p className="badge gold">{msg}</p>}<p className="muted">如果出現 Access Denied，請到 Apps Script Deploy 設定：Execute as Me、Who has access Anyone。</p></section>
    <section className="grid"><FeatureCard title="旅團接入教學" icon="🧩" text="由建立 Sheet、貼 GS、執行 setup，到提交 URL。" href="/setup"/><FeatureCard title="模板下載" icon="⬇️" text="下載 Google Apps Script 模板及通告格式。" href="/downloads"/><FeatureCard title="更新公告" icon="📢" text="查看平台及元件市場更新。" href="/updates"/><FeatureCard title="使用旅團" icon="🌏" text="公開展示已接入旅團。" href="/troops"/></section>
  </div>
}
