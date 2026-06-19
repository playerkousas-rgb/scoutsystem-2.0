import { NextRequest, NextResponse } from 'next/server';
import { APPROVED_TROOPS } from '@/lib/troops';

/**
 * ScoutSystem 2.0 — API Proxy
 * 
 * 前端不直接呼叫 Google Apps Script，而是經此代理。
 * API Key 存在 Vercel 環境變數，不會出現在前端 JS。
 * 
 * 環境變數命名：TROOP_{旅團號}_APIKEY
 * 例如：TROOP_0083_APIKEY=ak_xxxxxxxx
 * 
 * 路由：/api/proxy?troopKey=troop_0083&action=xxx&...
 * Debug：/api/proxy?troopKey=troop_0083&action=proxyDebug
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const troopKey = searchParams.get('troopKey');
  const action = searchParams.get('action') || 'health';

  if (!troopKey || troopKey === 'unknown') {
    return NextResponse.json({ success: false, error: '請先選擇旅團' }, { status: 400 });
  }

  // 從 troops.ts 找旅團
  const troop = APPROVED_TROOPS.find(t => t.key === troopKey);
  if (!troop) {
    return NextResponse.json({ success: false, error: '未知旅團，請確認已開通' }, { status: 400 });
  }

  // 從 Vercel 環境變數讀 API Key
  const envVarName = `TROOP_${troop.id}_APIKEY`;
  const apiKey = process.env[envVarName] || '';

  // ★ Debug 模式：檢查 env var 是否讀到
  if (action === 'proxyDebug') {
    return NextResponse.json({
      success: true,
      debug: true,
      troopKey,
      troopId: troop.id,
      troopName: troop.name,
      envVarName,
      apiKeyFound: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 6) + '...' : '(empty)',
      apiKeyLength: apiKey.length,
      allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('TROOP_')),
      webAppUrl: troop.webAppUrl,
    });
  }

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: `旅團 API Key 尚未設定（需要環境變數 ${envVarName}），請聯絡平台管理員`,
    }, { status: 500 });
  }

  // 構建目標 URL
  const url = new URL(troop.webAppUrl);
  url.searchParams.set('action', action);
  url.searchParams.set('apiKey', apiKey);

  // 複製其他參數（排除 troopKey 和 action）
  searchParams.forEach((value, key) => {
    if (key !== 'troopKey' && key !== 'action') {
      url.searchParams.set(key, value);
    }
  });

  try {
    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    const text = await res.text();

    if (/<!doctype html|<html/i.test(text)) {
      return NextResponse.json(
        { success: false, error: 'Apps Script 未公開（請確認 Deploy → Anyone）' },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Proxy fetch failed' },
      { status: 502 }
    );
  }
}
