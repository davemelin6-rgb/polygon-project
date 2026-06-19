import { readFileSync } from "fs";
for (const line of readFileSync(".env","utf8").split("\n")) {
  const [k,...v] = line.split("="); if (k&&v.length) process.env[k.trim()]=v.join("=").trim();
}
const POLYGON = "https://api.polygon.io";
const FMP     = "https://financialmodelingprep.com/stable";
const RESEND  = "https://api.resend.com/emails";
const polygonKey = process.env.POLYGON_API_KEY;
const fmpKey     = process.env.FMP_API_KEY;
const resendKey  = process.env.RESEND_API_KEY;
const SECTORS = [
  { id:"quantum",  name:"Quantum",         icon:"⚛️",  tickers:["IONQ","RGTI","IBM","GOOGL","MSFT"] },
  { id:"ai",       name:"AI",              icon:"🧠",  tickers:["NVDA","AMD","META","PLTR","AI"] },
  { id:"defence",  name:"Defence & Space", icon:"🛡️",  tickers:["LMT","RTX","RKLB","ASTS"] },
  { id:"biotech",  name:"Biotech",         icon:"🧬",  tickers:["LLY","NVO","MRNA","REGN","VRTX"] },
];
const ALL = [...new Set(SECTORS.flatMap(s => s.tickers))];
const FLAGS = { US:"🇺🇸", EU:"🇪🇺", GB:"🇬🇧", SE:"🇸🇪", JP:"🇯🇵", CN:"🇨🇳", CA:"🇨🇦", DE:"🇩🇪" };
function fmt(n,d=2){return(n==null||isNaN(n))?"—":Number(n).toFixed(d);}
function sign(n){return n>=0?"+":"";}
function arrow(n){return n>=0?"▲":"▼";}
function col(n){return n>=0?"#00dc82":"#ff3c50";}

const today    = new Date().toISOString().slice(0,10);
const nextWeek = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
const [snapRes,calRes,earningsRes] = await Promise.all([
  fetch(`${POLYGON}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${encodeURIComponent(ALL.join(","))}&apiKey=${polygonKey}`),
  fetch(`${FMP}/economic-calendar?from=${today}&to=${today}&apikey=${fmpKey}`),
  fetch(`${FMP}/earnings-calendar?from=${today}&to=${nextWeek}&apikey=${fmpKey}`),
]);
const snap = snapRes.ok?await snapRes.json():{tickers:[]};
const priceMap={};
for(const t of(snap.tickers||[])) priceMap[t.ticker]={symbol:t.ticker,price:t.lastTrade?.p||t.day?.c||t.prevDay?.c||null,changePercent:t.todaysChangePerc??null};
const allMovers=ALL.map(t=>priceMap[t]).filter(t=>t&&t.changePercent!=null).sort((a,b)=>Math.abs(b.changePercent)-Math.abs(a.changePercent)).slice(0,5);
// Log prices to verify
console.log("Prices:", allMovers.map(m=>`${m.symbol} $${fmt(m.price)} ${sign(m.changePercent)}${fmt(m.changePercent)}%`).join(" | "));
const sectors=SECTORS.map(s=>({...s,movers:s.tickers.map(t=>priceMap[t]).filter(t=>t&&t.changePercent!=null).sort((a,b)=>Math.abs(b.changePercent)-Math.abs(a.changePercent)).slice(0,2)}));
const calArr=calRes.ok?await calRes.json():[];
const events=(Array.isArray(calArr)?calArr:[]).filter(e=>e.impact==="High"||e.impact==="Medium").sort((a,b)=>(a.impact==="High"?0:1)-(b.impact==="High"?0:1)).slice(0,6).map(e=>({time:e.date?e.date.slice(11,16):"",flag:FLAGS[e.country]??"🌐",event:e.event,impact:e.impact}));
const earningsArr=earningsRes.ok?await earningsRes.json():[];
const earnings=(Array.isArray(earningsArr)?earningsArr:[]).filter(e=>new Set(ALL).has(e.symbol)).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,4).map(e=>({symbol:e.symbol,date:e.date,epsEst:e.epsEstimated??null}));
const now=new Date();
const subjectDate=now.toLocaleDateString("en-SE",{weekday:"long",day:"numeric",month:"long"});
const dateShort=now.toLocaleDateString("en-SE",{day:"numeric",month:"long",year:"numeric"});
const moverRows=allMovers.map(m=>`<tr><td style="padding:11px 0;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#e8f0fa;">${m.symbol}</td><td style="padding:11px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:13px;color:#4a6a88;text-align:center;">$${fmt(m.price)}</td><td style="padding:11px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:${col(m.changePercent)};text-align:right;">${arrow(m.changePercent)} ${sign(m.changePercent)}${fmt(m.changePercent)}%</td></tr>`).join("");
const filtered=sectors.filter(s=>s.movers.length>0);
const sectorPairs=[];for(let i=0;i<filtered.length;i+=2)sectorPairs.push(filtered.slice(i,i+2));
const sectorGrid=sectorPairs.map(pair=>`<tr>${pair.map(s=>`<td width="50%" valign="top" style="padding:0 8px 16px 0;"><div style="background:#060c18;border:1px solid #0f1e36;border-radius:10px;padding:16px 18px;"><div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#2a4060;margin-bottom:12px;">${s.icon} ${s.name}</div>${s.movers.map(m=>`<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;"><tr><td style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#c8d8e8;">${m.symbol}</td><td align="right" style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:${col(m.changePercent)};">${sign(m.changePercent)}${fmt(m.changePercent)}%</td></tr><tr><td colspan="2" style="font-family:'Courier New',monospace;font-size:11px;color:#2a4060;padding-bottom:6px;border-bottom:1px solid #0a1428;">$${fmt(m.price)}</td></tr></table>`).join("")}</div></td>`).join("")}${pair.length===1?`<td width="50%"></td>`:""}</tr>`).join("");
const eventsHtml=events.length?events.map(e=>`<tr><td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-size:13px;color:#4a6a88;white-space:nowrap;">${e.flag} ${e.time}</td><td style="padding:9px 14px;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:13px;color:#c8d8e8;">${e.event}</td><td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:11px;font-weight:700;color:${e.impact==="High"?"#ff3c50":"#f59e0b"};text-align:right;">${e.impact.toUpperCase()}</td></tr>`).join(""):`<tr><td colspan="3" style="padding:14px 0;font-size:13px;color:#2a4060;">No high-impact events today.</td></tr>`;
const earningsHtml=earnings.length?earnings.map(e=>`<tr><td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#e8f0fa;">${e.symbol}</td><td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:12px;color:#4a6a88;">${e.date}</td><td style="padding:9px 0;border-bottom:1px solid #0f1e36;font-family:'Courier New',monospace;font-size:12px;color:#2a4060;text-align:right;">${e.epsEst!=null?"EPS est. $"+fmt(e.epsEst):"—"}</td></tr>`).join(""):`<tr><td colspan="3" style="padding:14px 0;font-size:13px;color:#2a4060;">No tracked earnings this week.</td></tr>`;
const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#040810;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#040810;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;"><tr><td style="background:#040810;padding:24px 32px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#1a3050;">QUANTDIVER</td><td align="right" style="font-family:'Courier New',monospace;font-size:10px;color:#1a3050;letter-spacing:0.12em;text-transform:uppercase;">${dateShort}</td></tr></table></td></tr><tr><td style="background:linear-gradient(180deg,#060f20 0%,#040810 100%);padding:36px 32px 32px;border-bottom:1px solid #0d1f38;"><div style="font-family:'Courier New',monospace;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00b4ff;margin-bottom:14px;">☀️ Morning Brief</div><div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.1;margin-bottom:18px;">Good morning.</div><div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#6a8aaa;line-height:1.65;">The biggest movers, macro events, and upcoming earnings — before the market opens.</div></td></tr><tr><td style="background:#040810;padding:32px;"><div style="margin-bottom:32px;"><div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00b4ff;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">TOP MOVERS TODAY</div><table width="100%" cellpadding="0" cellspacing="0">${moverRows}</table></div><div style="margin-bottom:32px;"><div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#1a3050;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">BY SECTOR</div><table width="100%" cellpadding="0" cellspacing="0">${sectorGrid}</table></div><div style="margin-bottom:32px;"><div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#f59e0b;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">MACRO EVENTS TODAY</div><table width="100%" cellpadding="0" cellspacing="0">${eventsHtml}</table></div><div style="margin-bottom:36px;"><div style="font-family:'Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8b5cf6;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #0d1f38;">EARNINGS WATCH · NEXT 7 DAYS</div><table width="100%" cellpadding="0" cellspacing="0">${earningsHtml}</table></div><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;"><tr><td align="center" style="background:#060f20;border:1px solid #0d1f38;border-radius:12px;padding:28px;"><div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#ffffff;margin-bottom:6px;">Full scores are live.</div><div style="font-family:Georgia,serif;font-size:14px;color:#4a6a88;margin-bottom:20px;">MOMENTUM · RISK · TECH VALUE — updated every 60 seconds.</div><a href="https://quantdiver.com" style="display:inline-block;background:#0066cc;color:#ffffff;font-family:'Courier New',monospace;font-size:13px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;">Open QuantDiver</a></td></tr></table><div style="border-top:1px solid #0a1428;padding-top:20px;"><p style="margin:0;font-family:'Courier New',monospace;font-size:10px;color:#12253a;line-height:1.8;letter-spacing:0.04em;">QUANTDIVER · BRIEFME SUBSCRIPTION<br/>To unsubscribe, open Settings at quantdiver.com and toggle off this brief.<br/>This is not financial advice.</p></div></td></tr></table></td></tr></table></body></html>`;
console.log("Sending...");
const r=await fetch(RESEND,{method:"POST",headers:{"Authorization":`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:"QuantDiver BriefMe <briefme@quantdiver.com>",to:["davemelin6@gmail.com"],subject:`☀️ Morning Brief · ${subjectDate}`,html})});
const result=await r.json();
console.log(r.status, result.id?"Sent! ID:"+result.id:JSON.stringify(result));
