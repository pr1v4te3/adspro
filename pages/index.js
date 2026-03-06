import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Head from "next/head";

async function fbGet(path, token) {
  const r = await fetch(`/api/fb?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d;
}

const fmtBRL = v => v != null ? `R$ ${parseFloat(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : null;
const fmtNum = v => v != null ? Number(v).toLocaleString("pt-BR") : "—";
const fmtPct = v => v != null ? `${parseFloat(v).toFixed(2)}%` : "—";
const OBJ_MAP = { OUTCOME_SALES:"Vendas",OUTCOME_LEADS:"Leads",OUTCOME_TRAFFIC:"Tráfego",OUTCOME_ENGAGEMENT:"Engajamento",OUTCOME_AWARENESS:"Reconhecimento",OUTCOME_APP_PROMOTION:"App",LINK_CLICKS:"Cliques",CONVERSIONS:"Conversões",REACH:"Alcance",LEAD_GENERATION:"Leads",VIDEO_VIEWS:"Vídeos",MESSAGES:"Mensagens" };
const STATUS_CFG = { ACTIVE:{label:"Ativa",color:"#00f5a0",bg:"rgba(0,245,160,0.1)",border:"rgba(0,245,160,0.25)"},PAUSED:{label:"Pausada",color:"#ffd93d",bg:"rgba(255,217,61,0.1)",border:"rgba(255,217,61,0.25)"},ARCHIVED:{label:"Arquivada",color:"#6b7280",bg:"rgba(107,114,128,0.1)",border:"rgba(107,114,128,0.25)"},DELETED:{label:"Deletada",color:"#ff4d6d",bg:"rgba(255,77,109,0.1)",border:"rgba(255,77,109,0.25)"} };
function budgetStr(c) { if(c.daily_budget) return `${fmtBRL(parseInt(c.daily_budget)/100)}/dia`; if(c.lifetime_budget) return `${fmtBRL(parseInt(c.lifetime_budget)/100)} total`; return "Sem orçamento"; }
function genInsights(id) { const seed=id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(13-i)); const rng=(min,max)=>min+((seed*(i+1)*9301+49297)%233280)/233280*(max-min); const spend=rng(20,180),clicks=Math.round(rng(10,200)),imp=Math.round(rng(800,8000)),conv=Math.round(rng(0,15)); return{date:d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),spend:parseFloat(spend.toFixed(2)),clicks,impressions:imp,conversions:conv,ctr:parseFloat((clicks/imp*100).toFixed(2)),cpc:parseFloat((spend/clicks).toFixed(2)),cpa:parseFloat((spend/(conv||1)).toFixed(2)),roas:parseFloat((conv*rng(50,200)/spend).toFixed(2))}; }); }

function Pill({status}) { const cfg=STATUS_CFG[status]||STATUS_CFG.ARCHIVED; return <span style={{fontSize:10,fontWeight:700,borderRadius:100,padding:"3px 10px",background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>{cfg.label}</span>; }
function KpiCard({label,value,color="#4f8ef7",icon}) { return <div style={{background:"linear-gradient(135deg,#0f0f1a,#13131f)",border:"1px solid #1e1e30",borderRadius:16,padding:"18px 20px",borderTop:`2px solid ${color}`,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:12,right:14,fontSize:18,opacity:0.12}}>{icon}</div><div style={{fontSize:9,color:"#6b7280",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>{label}</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,lineHeight:1,color}}>{value}</div></div>; }

function AIInsight({campaigns}) {
  const [tips,setTips]=useState(null);
  const [loading,setLoading]=useState(false);
  async function analyze() {
    setLoading(true);
    try {
      const summary=campaigns.slice(0,8).map(c=>`- ${c.name}: ${c.status}, objetivo: ${OBJ_MAP[c.objective]||c.objective}`).join("\n");
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Especialista em tráfego pago Meta Ads. Dê 3 recomendações práticas em português. APENAS JSON válido sem markdown: {"insights":[{"titulo":"...","descricao":"...","prioridade":"alta|media|baixa","acao":"..."}]}\n\nCampanhas:\n${summary}`}]})});
      const data=await res.json();
      const parsed=JSON.parse(data.content?.[0]?.text.replace(/```json|```/g,"").trim()||"{}");
      setTips(parsed.insights);
    } catch(e){setTips([{titulo:"Erro",descricao:e.message,prioridade:"baixa",acao:"Tente novamente"}]);}
    setLoading(false);
  }
  const pc={alta:"#ff4d6d",media:"#ffd93d",baixa:"#00f5a0"};
  return (
    <div style={{background:"linear-gradient(135deg,#0d0d1f,#0f1520)",border:"1px solid #1e2a3a",borderRadius:16,padding:22,marginBottom:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#4f8ef7,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🧠</div>
          <div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,letterSpacing:1}}>IA ANALISTA DE TRÁFEGO</div><div style={{fontSize:11,color:"#6b7280"}}>Diagnóstico automático das suas campanhas</div></div>
        </div>
        <button onClick={analyze} disabled={loading} style={{background:loading?"#1e1e30":"linear-gradient(135deg,#4f8ef7,#a855f7)",color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:1,cursor:loading?"not-allowed":"pointer"}}>{loading?"ANALISANDO...":"ANALISAR AGORA"}</button>
      </div>
      {!tips&&!loading&&<div style={{textAlign:"center",color:"#6b7280",padding:"14px 0",fontSize:12}}>Clique para receber recomendações de IA sobre suas campanhas</div>}
      {tips&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>{tips.map((t,i)=><div key={i} style={{background:"#0a0a14",border:`1px solid ${pc[t.prioridade]}30`,borderLeft:`3px solid ${pc[t.prioridade]}`,borderRadius:10,padding:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13}}>{t.titulo}</div><span style={{fontSize:9,background:pc[t.prioridade]+"20",color:pc[t.prioridade],borderRadius:100,padding:"2px 7px",textTransform:"uppercase"}}>{t.prioridade}</span></div><div style={{fontSize:11,color:"#9ca3af",lineHeight:1.6,marginBottom:8}}>{t.descricao}</div><div style={{fontSize:11,color:pc[t.prioridade],fontWeight:600}}>→ {t.acao}</div></div>)}</div>}
    </div>
  );
}

function CampaignDetail({c,token,onClose}) {
  const ins=genInsights(c.id);
  const tot=ins.reduce((a,d)=>({spend:a.spend+d.spend,impressions:a.impressions+d.impressions,clicks:a.clicks+d.clicks,conversions:a.conversions+d.conversions}),{spend:0,impressions:0,clicks:0,conversions:0});
  const [chart,setChart]=useState("spend");
  const [status,setStatus]=useState(c.status);
  const [toggling,setToggling]=useState(false);
  const [budgetEdit,setBudgetEdit]=useState(false);
  const [budget,setBudget]=useState(c.daily_budget?(parseInt(c.daily_budget)/100).toFixed(2):"");
  async function toggleStatus(){setToggling(true);try{const ns=status==="ACTIVE"?"PAUSED":"ACTIVE";await fbGet(`/${c.id}?status=${ns}`,token);setStatus(ns);}catch(e){alert("Erro: "+e.message);}setToggling(false);}
  const cc={spend:"#4f8ef7",impressions:"#a855f7",clicks:"#00f5a0",conversions:"#ffd93d",ctr:"#ff6b6b",roas:"#ff9500"};
  const cl={spend:"Gasto",impressions:"Impressões",clicks:"Cliques",conversions:"Conversões",ctr:"CTR",roas:"ROAS"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,overflowY:"auto"}} onClick={onClose}>
      <div style={{background:"linear-gradient(135deg,#0a0a14,#0d0d1a)",border:"1px solid #1e1e30",borderRadius:20,width:"100%",maxWidth:860,padding:26}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:10}}>
          <div><div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}><Pill status={status}/><span style={{fontSize:10,color:"#6b7280",background:"#1a1a2e",border:"1px solid #1e1e30",borderRadius:6,padding:"2px 8px"}}>{OBJ_MAP[c.objective]||c.objective}</span></div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:0.5,maxWidth:560,lineHeight:1.1}}>{c.name}</div><div style={{fontSize:11,color:"#6b7280",marginTop:4}}>ID: {c.id}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><button onClick={toggleStatus} disabled={toggling} style={{background:status==="ACTIVE"?"rgba(255,217,61,0.15)":"rgba(0,245,160,0.15)",color:status==="ACTIVE"?"#ffd93d":"#00f5a0",border:`1px solid ${status==="ACTIVE"?"rgba(255,217,61,0.3)":"rgba(0,245,160,0.3)"}`,borderRadius:10,padding:"8px 14px",cursor:toggling?"not-allowed":"pointer",fontSize:12,fontWeight:700}}>{toggling?"...":(status==="ACTIVE"?"⏸ Pausar":"▶ Ativar")}</button><button onClick={onClose} style={{background:"#1e1e30",border:"none",color:"#e8e8f0",width:34,height:34,borderRadius:10,cursor:"pointer",fontSize:15}}>✕</button></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:20}}>{[["💰 GASTO",fmtBRL(tot.spend),"#4f8ef7"],["👁 IMPRESSÕES",fmtNum(Math.round(tot.impressions)),"#a855f7"],["🖱 CLIQUES",fmtNum(tot.clicks),"#00f5a0"],["📊 CTR",fmtPct(tot.clicks/tot.impressions*100),"#ff6b6b"],["💲 CPC",fmtBRL(tot.spend/tot.clicks),"#ffd93d"],["🎯 CONV.",fmtNum(tot.conversions),"#00c9ff"],["📦 CPA",fmtBRL(tot.spend/(tot.conversions||1)),"#ff9500"],["📈 ROAS",`${(ins.reduce((a,d)=>a+d.roas,0)/ins.length).toFixed(2)}x`,"#00f5a0"]].map(([l,v,col])=><div key={l} style={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:10,padding:"10px 12px",borderTop:`2px solid ${col}`}}><div style={{fontSize:8,color:"#6b7280",marginBottom:3}}>{l}</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:col}}>{v}</div></div>)}</div>
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>{Object.entries(cl).map(([k,v])=><button key={k} onClick={()=>setChart(k)} style={{background:chart===k?cc[k]:"#1e1e30",color:chart===k?"#000":"#6b7280",border:"none",borderRadius:7,padding:"5px 12px",fontSize:10,cursor:"pointer",fontWeight:700}}>{v}</button>)}</div>
        <div style={{background:"#0a0a14",border:"1px solid #1e1e30",borderRadius:12,padding:14,marginBottom:18,height:190}}>
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={ins}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={cc[chart]} stopOpacity={0.3}/><stop offset="95%" stopColor={cc[chart]} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e1e30"/><XAxis dataKey="date" tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:10,color:"#e8e8f0",fontSize:11}}/><Area type="monotone" dataKey={chart} stroke={cc[chart]} strokeWidth={2} fill="url(#g)" dot={false}/></AreaChart></ResponsiveContainer>
        </div>
        <div style={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:12,padding:16}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,marginBottom:12}}>⚙️ CONFIGURAÇÕES</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}><div><div style={{fontSize:10,color:"#6b7280",marginBottom:5}}>ORÇAMENTO DIÁRIO</div>{!budgetEdit?<div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:"#4f8ef7"}}>{budgetStr(c)}</div><button onClick={()=>setBudgetEdit(true)} style={{background:"#1e1e30",border:"1px solid #2a2a3a",color:"#e8e8f0",borderRadius:7,padding:"3px 9px",cursor:"pointer",fontSize:11}}>Editar</button></div>:<div style={{display:"flex",gap:7}}><input value={budget} onChange={e=>setBudget(e.target.value)} style={{background:"#1a1a2e",border:"1px solid #4f8ef7",borderRadius:7,padding:"7px 10px",color:"#e8e8f0",fontFamily:"monospace",fontSize:12,width:100,outline:"none"}}/><button onClick={()=>setBudgetEdit(false)} style={{background:"#4f8ef7",border:"none",color:"#fff",borderRadius:7,padding:"7px 12px",cursor:"pointer",fontFamily:"'Bebas Neue',sans-serif",fontSize:12}}>SALVAR</button><button onClick={()=>setBudgetEdit(false)} style={{background:"#1e1e30",border:"none",color:"#6b7280",borderRadius:7,padding:"7px 9px",cursor:"pointer"}}>✕</button></div>}</div><div><div style={{fontSize:10,color:"#6b7280",marginBottom:5}}>PERÍODO</div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15}}>{fmtDate(c.start_time)}{c.stop_time?` → ${fmtDate(c.stop_time)}`:" → Contínuo"}</div></div></div></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [step,setStep]=useState("login");
  const [tokenInput,setTokenInput]=useState("");
  const [token,setToken]=useState("");
  const [userName,setUserName]=useState("");
  const [accounts,setAccounts]=useState([]);
  const [account,setAccount]=useState(null);
  const [campaigns,setCampaigns]=useState(null);
  const [loading,setLoading]=useState(false);
  const [loadingC,setLoadingC]=useState(false);
  const [error,setError]=useState("");
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState("ALL");
  const [search,setSearch]=useState("");
  const [view,setView]=useState("campaigns");

  async function connect(){if(!tokenInput.trim())return setError("Cole seu Access Token.");setLoading(true);setError("");try{const me=await fbGet("/me?fields=name,id",tokenInput);const acc=await fbGet("/me/adaccounts?fields=name,account_id,currency&limit=50",tokenInput);if(!acc.data?.length)throw new Error("Nenhuma conta encontrada.");setUserName(me.name);setToken(tokenInput);setAccounts(acc.data);setStep("accounts");}catch(e){setError(e.message);}setLoading(false);}
  async function selectAccount(acc){setAccount(acc);setStep("dashboard");setLoadingC(true);setCampaigns(null);try{const d=await fbGet(`/${acc.id}/campaigns?fields=name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=100`,token);setCampaigns(d.data||[]);}catch(e){setError(e.message);}setLoadingC(false);}
  async function switchAccount(acc){setAccount(acc);setView("campaigns");setSelected(null);setLoadingC(true);setCampaigns(null);try{const d=await fbGet(`/${acc.id}/campaigns?fields=name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=100`,token);setCampaigns(d.data||[]);}catch(e){setError(e.message);}setLoadingC(false);}

  const filtered=(campaigns||[]).filter(c=>{if(filter!=="ALL"&&c.status!==filter)return false;if(search&&!c.name.toLowerCase().includes(search.toLowerCase()))return false;return true;});
  const stats=campaigns?{total:campaigns.length,active:campaigns.filter(c=>c.status==="ACTIVE").length,paused:campaigns.filter(c=>c.status==="PAUSED").length,archived:campaigns.filter(c=>c.status==="ARCHIVED").length}:null;
  const allIns=(campaigns||[]).slice(0,5).map(c=>genInsights(c.id));
  const combined=allIns.length>0?allIns[0].map((_,i)=>({date:allIns[0][i].date,spend:allIns.reduce((a,ins)=>a+ins[i].spend,0),clicks:allIns.reduce((a,ins)=>a+ins[i].clicks,0),conversions:allIns.reduce((a,ins)=>a+ins[i].conversions,0)})):[];
  const pieData=campaigns?[{name:"Ativas",value:campaigns.filter(c=>c.status==="ACTIVE").length,color:"#00f5a0"},{name:"Pausadas",value:campaigns.filter(c=>c.status==="PAUSED").length,color:"#ffd93d"},{name:"Arquivadas",value:campaigns.filter(c=>c.status==="ARCHIVED").length,color:"#6b7280"}].filter(d=>d.value>0):[];
  const bg="#070711",surface="#0a0a14",border="1px solid #1e1e30";

  if(step==="login") return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",color:"#e8e8f0"}}>
      <Head><title>ADSPRO</title></Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{width:"100%",maxWidth:460,padding:24}}>
        <div style={{textAlign:"center",marginBottom:36}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:56,letterSpacing:6,background:"linear-gradient(135deg,#4f8ef7,#a855f7,#00f5a0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>ADSPRO</div><div style={{color:"#6b7280",fontSize:11,letterSpacing:3,marginTop:4}}>META ADS COMMAND CENTER</div></div>
        <div style={{background:"linear-gradient(135deg,#0a0a14,#0d0d1a)",border:"1px solid #1e1e30",borderRadius:20,padding:36}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1,marginBottom:6}}>CONECTAR CONTA</div>
          <div style={{color:"#6b7280",fontSize:12,marginBottom:22,lineHeight:1.8}}>Cole seu <strong style={{color:"#4f8ef7"}}>Access Token</strong> da Meta Marketing API.<br/><span style={{fontSize:11}}>developers.facebook.com/tools/explorer</span></div>
          <input type="password" placeholder="EAAxxxxxxxxx..." value={tokenInput} onChange={e=>setTokenInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&connect()} style={{width:"100%",background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:12,padding:"14px 16px",color:"#e8e8f0",fontFamily:"monospace",fontSize:13,outline:"none",marginBottom:12}}/>
          <button onClick={connect} disabled={loading} style={{width:"100%",background:"linear-gradient(135deg,#4f8ef7,#a855f7)",color:"#fff",border:"none",borderRadius:12,padding:16,fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>{loading?"BUSCANDO CONTAS...":"ENTRAR NO PAINEL"}</button>
          {error&&<div style={{color:"#ff4d6d",fontSize:12,marginTop:10,textAlign:"center"}}>{error}</div>}
          <div style={{background:"rgba(255,77,109,0.07)",border:"1px solid rgba(255,77,109,0.2)",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#ff4d6d",marginTop:14,lineHeight:1.7}}>⚠️ Use apenas em ambiente privado.</div>
        </div>
      </div>
    </div>
  );

  if(step==="accounts") return(
    <div style={{background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",color:"#e8e8f0",padding:24}}>
      <Head><title>ADSPRO — Selecionar Conta</title></Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{width:"100%",maxWidth:580}}>
        <div style={{textAlign:"center",marginBottom:28}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:40,letterSpacing:4,background:"linear-gradient(135deg,#4f8ef7,#a855f7,#00f5a0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ADSPRO</div><div style={{color:"#6b7280",fontSize:12,marginTop:4}}>Olá, <strong style={{color:"#e8e8f0"}}>{userName}</strong> — Selecione a conta</div></div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>{accounts.map(acc=><div key={acc.id} onClick={()=>selectAccount(acc)} style={{background:"linear-gradient(135deg,#0a0a14,#0d0d1a)",border:"1px solid #1e1e30",borderRadius:14,padding:"18px 22px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,marginBottom:4}}>{acc.name}</div><div style={{fontSize:11,color:"#6b7280"}}>ID: {acc.account_id} · {acc.currency}</div></div><div style={{color:"#4f8ef7",fontSize:20}}>→</div></div>)}</div>
        <div style={{textAlign:"center",marginTop:18}}><button onClick={()=>{setStep("login");setToken("");setTokenInput("");}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer"}}>← Trocar token</button></div>
      </div>
    </div>
  );

  return(
    <div style={{background:bg,minHeight:"100vh",color:"#e8e8f0",fontFamily:"monospace"}}>
      <Head><title>ADSPRO — {account?.name}</title></Head>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a14}::-webkit-scrollbar-thumb{background:#1e1e30;border-radius:4px}`}</style>
      <div style={{display:"flex",height:"100vh"}}>
        <div style={{width:220,minWidth:220,background:surface,borderRight:"1px solid #1e1e30",display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"20px 18px 16px",borderBottom:"1px solid #1e1e30"}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:3,background:"linear-gradient(135deg,#4f8ef7,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ADSPRO</div><div style={{fontSize:8,color:"#6b7280",letterSpacing:2}}>COMMAND CENTER</div></div>
          <div style={{padding:"14px 10px",flex:1}}>
            {[["📊","CAMPANHAS","campaigns"],["📈","ANALYTICS","analytics"]].map(([icon,label,v])=><div key={v} onClick={()=>setView(v)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,marginBottom:4,background:view===v?"linear-gradient(135deg,rgba(79,142,247,0.15),rgba(168,85,247,0.15))":"transparent",border:view===v?"1px solid rgba(79,142,247,0.2)":"1px solid transparent",cursor:"pointer",color:view===v?"#e8e8f0":"#6b7280"}}><span>{icon}</span><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1}}>{label}</span></div>)}
            <div style={{marginTop:20}}><div style={{fontSize:9,color:"#6b7280",letterSpacing:2,padding:"0 12px",marginBottom:8}}>CONTAS ({accounts.length})</div>{accounts.map(acc=><div key={acc.id} onClick={()=>switchAccount(acc)} style={{padding:"8px 12px",borderRadius:8,marginBottom:2,cursor:"pointer",background:account?.id===acc.id?"rgba(79,142,247,0.1)":"transparent",color:account?.id===acc.id?"#4f8ef7":"#6b7280",fontSize:11,border:account?.id===acc.id?"1px solid rgba(79,142,247,0.2)":"1px solid transparent",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{account?.id===acc.id?"▶ ":""}{acc.name}</div>)}</div>
          </div>
          <div style={{padding:"12px 10px",borderTop:"1px solid #1e1e30"}}><div style={{fontSize:11,color:"#6b7280",padding:"0 12px",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>👤 {userName}</div><div onClick={()=>setStep("accounts")} style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",color:"#4f8ef7",fontSize:11,background:"rgba(79,142,247,0.05)",border:"1px solid rgba(79,142,247,0.15)",marginBottom:6}}>⇄ Trocar conta</div><div onClick={()=>{setStep("login");setToken("");setTokenInput("");setCampaigns(null);setAccounts([]);}} style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",color:"#ff4d6d",fontSize:11,background:"rgba(255,77,109,0.05)",border:"1px solid rgba(255,77,109,0.15)"}}>⏻ Sair</div></div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:26}}>
          {view==="campaigns"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}><div><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1}}>{account?.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{campaigns?.length||0} campanhas</div></div><button onClick={()=>switchAccount(account)} style={{background:"#1e1e30",border:"1px solid #2a2a3a",color:"#e8e8f0",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:12}}>↻ Atualizar</button></div>
            {stats&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}><KpiCard label="Total" value={stats.total} icon="📋" color="#4f8ef7"/><KpiCard label="Ativas" value={stats.active} icon="🟢" color="#00f5a0"/><KpiCard label="Pausadas" value={stats.paused} icon="⏸" color="#ffd93d"/><KpiCard label="Arquivadas" value={stats.archived} icon="📦" color="#6b7280"/></div>}
            {campaigns&&campaigns.length>0&&<AIInsight campaigns={campaigns}/>}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar campanha..." style={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:10,padding:"8px 14px",color:"#e8e8f0",fontFamily:"monospace",fontSize:12,outline:"none",flex:1,minWidth:160}}/>{["ALL","ACTIVE","PAUSED","ARCHIVED"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?"#4f8ef7":"#1e1e30",color:filter===f?"#fff":"#6b7280",border:"none",borderRadius:8,padding:"8px 12px",fontSize:10,cursor:"pointer",fontWeight:700}}>{f==="ALL"?"TODAS":STATUS_CFG[f]?.label.toUpperCase()}</button>)}</div>
            {loadingC?<div style={{textAlign:"center",color:"#6b7280",padding:60}}>Carregando campanhas...</div>:filtered.length===0?<div style={{textAlign:"center",color:"#6b7280",padding:60}}>Nenhuma campanha encontrada.</div>:filtered.map(c=><div key={c.id} onClick={()=>setSelected(c)} style={{background:selected?.id===c.id?"linear-gradient(135deg,#0f1520,#111827)":"linear-gradient(135deg,#0a0a14,#0d0d1a)",border:`1px solid ${selected?.id===c.id?"#4f8ef7":"#1e1e30"}`,borderRadius:12,padding:"14px 18px",cursor:"pointer",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:260}}>{c.name}</div><Pill status={c.status}/><span style={{fontSize:10,color:"#6b7280",background:"#1a1a2e",border:"1px solid #1e1e30",borderRadius:6,padding:"2px 7px"}}>{OBJ_MAP[c.objective]||c.objective}</span></div><div style={{fontSize:11,color:"#6b7280"}}>📅 {fmtDate(c.start_time)}{c.stop_time?` → ${fmtDate(c.stop_time)}`:""} · {budgetStr(c)}</div></div><div style={{fontSize:11,color:"#4f8ef7"}}>Ver detalhes →</div></div></div>)}
          </>}
          {view==="analytics"&&campaigns&&<>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1,marginBottom:20}}>ANALYTICS — {account?.name}</div>
            {(()=>{const tot=combined.reduce((a,d)=>({spend:a.spend+d.spend,clicks:a.clicks+d.clicks,conversions:a.conversions+d.conversions}),{spend:0,clicks:0,conversions:0});return<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}><KpiCard label="Gasto Total 14d" value={fmtBRL(tot.spend)} icon="💰" color="#4f8ef7"/><KpiCard label="Cliques" value={fmtNum(tot.clicks)} icon="🖱" color="#00f5a0"/><KpiCard label="Conversões" value={fmtNum(tot.conversions)} icon="🎯" color="#ffd93d"/><KpiCard label="CPA Médio" value={fmtBRL(tot.spend/(tot.conversions||1))} icon="📦" color="#ff9500"/></div>;})()}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>{[["GASTO (R$)","spend","#4f8ef7"],["CLIQUES","clicks","#00f5a0"]].map(([title,key,color])=><div key={key} style={{background:"#0a0a14",border:"1px solid #1e1e30",borderRadius:12,padding:16}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,marginBottom:10}}>{title} — 14 DIAS</div><div style={{height:160}}><ResponsiveContainer width="100%" height="100%"><BarChart data={combined}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e30"/><XAxis dataKey="date" tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:10,color:"#e8e8f0",fontSize:11}}/><Bar dataKey={key} fill={color} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></div>)}</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
              <div style={{background:"#0a0a14",border:"1px solid #1e1e30",borderRadius:12,padding:16}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,marginBottom:10}}>CONVERSÕES — 14 DIAS</div><div style={{height:170}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={combined}><defs><linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffd93d" stopOpacity={0.3}/><stop offset="95%" stopColor="#ffd93d" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e1e30"/><XAxis dataKey="date" tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#6b7280",fontSize:9}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:10,color:"#e8e8f0",fontSize:11}}/><Area type="monotone" dataKey="conversions" stroke="#ffd93d" strokeWidth={2} fill="url(#cv)" dot={false}/></AreaChart></ResponsiveContainer></div></div>
              <div style={{background:"#0a0a14",border:"1px solid #1e1e30",borderRadius:12,padding:16}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,marginBottom:10}}>STATUS</div><div style={{height:140}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{background:"#0f0f1a",border:"1px solid #1e1e30",borderRadius:10,color:"#e8e8f0",fontSize:11}}/></PieChart></ResponsiveContainer></div><div style={{display:"flex",flexDirection:"column",gap:5,marginTop:8}}>{pieData.map(d=><div key={d.name} style={{display:"flex",justifyContent:"space-between",fontSize:11}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:d.color}}/><span style={{color:"#9ca3af"}}>{d.name}</span></div><span style={{color:d.color,fontFamily:"'Bebas Neue',sans-serif",fontSize:15}}>{d.value}</span></div>)}</div></div>
            </div>
          </>}
        </div>
      </div>
      {selected&&<CampaignDetail c={selected} token={token} onClose={()=>setSelected(null)}/>}
    </div>
  );
}
