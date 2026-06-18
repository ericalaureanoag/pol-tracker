import { useState, useEffect, useCallback } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTadX1b6xeRnmK3LwaHqLPM9beD9XCJYQ8v5G4wfQLaIX78eJSDB2BXhSgjNa2vuIz/exec";
const STORES = ["Store 53", "Store 55", "Store 89"];

const PRESET_EMPLOYEES = {
  "Store 53": [], "Store 55": [],
  "Store 89": ["Vivian","Ebbel","Jennifer","Amanda","Kelly","Glayna","Cielia","Ashlen","Mauro","Dylan","Angelica","Shiva","Melany","Nathan","Doret"],
};
const PRESET_MANAGERS = {
  "Store 53": [], "Store 55": [],
  "Store 89": ["Carmen","Magalis","Manuel","Dayanma","Carlos","Yonel","Jonathan"],
};

async function gsGet(key) {
  try {
    const res = await fetch(`${SCRIPT_URL}?key=${encodeURIComponent(key)}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch { return null; }
}

async function gsSet(key, value) {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ key, value: JSON.stringify(value) }),
    });
  } catch (e) { console.error("gsSet error", e); }
}

function useGSData(key, preset) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    gsGet(key).then(val => {
      if (val !== null) setData(val);
      else if (preset !== undefined) setData(preset);
      else setData(null);
      setLoading(false);
    });
  }, [key]);

  const save = useCallback(async (newVal) => {
    setData(newVal);
    await gsSet(key, newVal);
  }, [key]);

  return [data, save, loading];
}

function localStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayStr() { return localStr(new Date()); }
function weekLabel(dateStr) {
  const d = new Date(dateStr+"T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day===0?-6:1));
  return localStr(d);
}
function monthLabel(dateStr) { return dateStr.slice(0,7); }
function currentWeek() { return weekLabel(todayStr()); }
function currentMonth() { return monthLabel(todayStr()); }
function formatDate(s) { const [y,m,d]=s.split("-"); return `${m}/${d}/${y}`; }
function formatMonth(ym) { const [y,m]=ym.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]} ${y}`; }
function pct(pol,shifts) { if(!shifts) return "—"; return ((pol/shifts)*100).toFixed(1)+"%"; }
function pctNum(pol,shifts) { if(!shifts) return -1; return (pol/shifts)*100; }

function Badge({value,size}) {
  const num=parseFloat(value);
  const color=isNaN(num)?"#475569":num>=75?"#dc2626":num>=50?"#ea580c":num>=25?"#d97706":"#16a34a";
  return <span style={{background:color,color:"#fff",borderRadius:999,padding:size==="lg"?"4px 14px":"2px 10px",fontSize:size==="lg"?15:13,fontWeight:700,minWidth:50,display:"inline-block",textAlign:"center"}}>{value}</span>;
}
function Toast({msg}) {
  return <div style={{background:"#22c55e",color:"#fff",borderRadius:10,padding:"10px 16px",marginBottom:16,fontWeight:600,fontSize:14,textAlign:"center"}}>{msg}</div>;
}
function Empty({msg}) { return <div style={{textAlign:"center",color:"#475569",marginTop:60,fontSize:15}}>{msg}</div>; }
function SectionLabel({text}) { return <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>{text}</div>; }
function Card({children,style}) { return <div style={{background:"#1e293b",borderRadius:12,padding:16,marginBottom:14,...style}}>{children}</div>; }
function Spinner() { return <div style={{textAlign:"center",padding:"40px 0",color:"#64748b",fontSize:14}}>Loading live data…</div>; }

export default function App() {
  const [activeStore, setActiveStore] = useState(STORES[0]);
  const [tab, setTab] = useState("log");
  const showingAll = activeStore==="all";
  const TABS=[["log","Log"],["leaderboard","🏆"],["summary","Summary"],["employees","Staff"],["managers","Managers"]];

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:"#0f172a",minHeight:"100vh",color:"#f1f5f9"}}>
      <div style={{background:"#1e293b",borderBottom:"1px solid #334155",padding:"14px 16px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:"#94a3b8",textTransform:"uppercase",marginBottom:4}}>POL Tracker</div>
        <div style={{fontSize:10,color:"#22c55e",marginBottom:8,fontWeight:600}}>🟢 LIVE — Google Sheets</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {STORES.map(s=>(
            <button key={s} onClick={()=>setActiveStore(s)} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:activeStore===s?"#3b82f6":"#334155",color:activeStore===s?"#fff":"#94a3b8"}}>{s}</button>
          ))}
          <button onClick={()=>setActiveStore("all")} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:showingAll?"#f59e0b":"#334155",color:showingAll?"#0f172a":"#94a3b8"}}>🏪 Stores</button>
        </div>
      </div>
      {!showingAll && (
        <div style={{display:"flex",borderBottom:"1px solid #1e293b",background:"#0f172a"}}>
          {TABS.map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"11px 2px",background:"none",border:"none",borderBottom:tab===id?"2px solid #3b82f6":"2px solid transparent",color:tab===id?"#3b82f6":"#64748b",fontWeight:600,fontSize:12,cursor:"pointer"}}>{label}</button>
          ))}
        </div>
      )}
      <div style={{padding:"16px 14px",maxWidth:540,margin:"0 auto"}}>
        {showingAll ? <AllStoresTab /> : (
          <>
            {tab==="log" && <LogTab store={activeStore} />}
            {tab==="leaderboard" && <LeaderboardTab store={activeStore} />}
            {tab==="summary" && <SummaryTab store={activeStore} />}
            {tab==="employees" && <EmployeesTab store={activeStore} />}
            {tab==="managers" && <ManagersTab store={activeStore} />}
          </>
        )}
      </div>
    </div>
  );
}

function AllStoresTab() {
  const [allData, setAllData] = useState({});
  const [view, setView] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(STORES.map(async store => {
      const [logs, shifts] = await Promise.all([gsGet(`${store}_logs`), gsGet(`${store}_shifts`)]);
      return { store, logs: logs||[], shifts: shifts||{} };
    })).then(results => {
      const d = {};
      results.forEach(r => d[r.store]=r);
      setAllData(d);
      setLoading(false);
    });
  }, []);

  if(loading) return <Spinner />;

  function prevWeekStart() { const d=new Date(currentWeek()+"T00:00:00"); d.setDate(d.getDate()-7); return localStr(d); }
  const lastWeek=prevWeekStart(), month=currentMonth();

  const storeStats=STORES.map(store=>{
    const {logs=[],shifts={}}=allData[store]||{};
    const lwLogs=logs.filter(l=>weekLabel(l.date)===lastWeek);
    const lwShifts=Object.entries(shifts).filter(([d])=>weekLabel(d)===lastWeek).reduce((s,[,v])=>s+v,0);
    const mtdLogs=logs.filter(l=>monthLabel(l.date)===month);
    const mtdShifts=Object.entries(shifts).filter(([d])=>monthLabel(d)===month).reduce((s,[,v])=>s+v,0);
    return {store,lw:{pol:lwLogs.length,shifts:lwShifts,pctNum:pctNum(lwLogs.length,lwShifts)},mtd:{pol:mtdLogs.length,shifts:mtdShifts,pctNum:pctNum(mtdLogs.length,mtdShifts)}};
  });

  const isWeek=view==="week";
  const ranked=[...storeStats].filter(s=>isWeek?s.lw.shifts>0:s.mtd.shifts>0).sort((a,b)=>isWeek?a.lw.pctNum-b.lw.pctNum:a.mtd.pctNum-b.mtd.pctNum);
  const unranked=storeStats.filter(s=>isWeek?!s.lw.shifts:!s.mtd.shifts);
  const winner=ranked[0];
  const medals=["💀","😬","😐"];
  function formatWeekRange(wk) { const d=new Date(wk+"T00:00:00"),end=new Date(d); end.setDate(d.getDate()+6); return formatDate(wk)+" – "+formatDate(localStr(end)); }
  const periodLabel=isWeek?formatWeekRange(lastWeek):formatMonth(month);

  return (
    <div>
      <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:4,marginBottom:16,gap:4}}>
        {[["week","Last Week"],["month","Month to Date"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:14,background:view===v?"#f59e0b":"transparent",color:view===v?"#0f172a":"#64748b"}}>{l}</button>
        ))}
      </div>
      <div style={{fontSize:12,color:"#475569",textAlign:"center",marginBottom:16}}>{periodLabel}</div>
      {ranked.length===0 ? (
        <Card><div style={{textAlign:"center",color:"#64748b",fontSize:14,padding:"20px 0"}}>No shift data logged yet for this period.</div></Card>
      ) : (
        <>
          <div style={{background:isWeek?"linear-gradient(135deg,#1e3a5f,#0f172a)":"linear-gradient(135deg,#3b1f63,#0f172a)",border:isWeek?"1px solid #1e40af":"1px solid #6d28d9",borderRadius:14,padding:"20px 16px",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:11,color:isWeek?"#93c5fd":"#c4b5fd",fontWeight:700,letterSpacing:1.5,marginBottom:6}}>🏆 BEST STORE {isWeek?"LAST WEEK":"THIS MONTH"} — LOWEST POL %</div>
            <div style={{fontSize:28,fontWeight:900}}>{winner.store}</div>
            <div style={{fontSize:42,fontWeight:900,color:isWeek?"#93c5fd":"#c4b5fd",margin:"6px 0",lineHeight:1}}>{pct(isWeek?winner.lw.pol:winner.mtd.pol,isWeek?winner.lw.shifts:winner.mtd.shifts)}</div>
            <div style={{fontSize:13,color:"#475569"}}>{isWeek?winner.lw.pol:winner.mtd.pol} POL / {isWeek?winner.lw.shifts:winner.mtd.shifts} shifts</div>
          </div>
          <Card>
            <SectionLabel text="Store Rankings — Lowest POL % Wins"/>
            {ranked.map((s,i)=>{
              const d=isWeek?s.lw:s.mtd;
              return (
                <div key={s.store} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:i<ranked.length-1?"1px solid #334155":"none"}}>
                  <div style={{fontSize:24,width:32,textAlign:"center"}}>{medals[i]||`#${i+1}`}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:17}}>{s.store}</div><div style={{fontSize:13,color:"#64748b",marginTop:2}}>{d.pol} POL / {d.shifts} shifts</div></div>
                  <Badge value={pct(d.pol,d.shifts)} size="lg"/>
                </div>
              );
            })}
            {unranked.map(s=>(
              <div key={s.store} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderTop:"1px solid #334155",opacity:0.4}}>
                <div style={{fontSize:24,width:32,textAlign:"center"}}>—</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:17}}>{s.store}</div><div style={{fontSize:13,color:"#64748b",marginTop:2}}>No data</div></div>
                <Badge value="—"/>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function LogTab({store}) {
  const [date,setDate]=useState(todayStr());
  const [logs,saveLogs,logsLoading]=useGSData(`${store}_logs`,[]);
  const [employees,,empLoading]=useGSData(`${store}_employees`,PRESET_EMPLOYEES[store]||[]);
  const [managers,,mgrLoading]=useGSData(`${store}_managers`,PRESET_MANAGERS[store]||[]);
  const [selectedEmp,setSelectedEmp]=useState("");
  const [selectedMgr,setSelectedMgr]=useState("");
  const [extraMgrs,setExtraMgrs]=useState([]);
  const [shiftType,setShiftType]=useState("");
  const [toast,setToast]=useState("");
  const [saving,setSaving]=useState(false);

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2500);}

  async function logPOL() {
    if(!selectedEmp||!selectedMgr){showToast("Select employee & manager");return;}
    if(!shiftType){showToast("Select a shift type");return;}
    setSaving(true);
    const entry={id:Date.now(),date,employee:selectedEmp,manager:selectedMgr,extraManagers:extraMgrs.filter(m=>m),shiftType};
    await saveLogs([...(logs||[]),entry]);
    setSelectedEmp("");setSelectedMgr("");setExtraMgrs([]);setShiftType("");
    setSaving(false);showToast("POL logged ✓");
  }

  async function deletePOL(id){await saveLogs((logs||[]).filter(l=>l.id!==id));}
  function updateExtraMgr(idx,val){const u=[...extraMgrs];u[idx]=val;setExtraMgrs(u);}
  function addExtraMgr(){if(extraMgrs.length<3)setExtraMgrs([...extraMgrs,""]);}
  function removeExtraMgr(idx){setExtraMgrs(extraMgrs.filter((_,i)=>i!==idx));}

  if(logsLoading||empLoading||mgrLoading) return <Spinner/>;
  const dateLogs=(logs||[]).filter(l=>l.date===date);

  return (
    <div>
      {toast&&<Toast msg={toast}/>}
      <Card>
        <SectionLabel text="Date"/>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{display:"block",width:"100%",background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:16}}/>
      </Card>
      <div style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",border:"1px solid #334155",borderRadius:12,padding:16,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,letterSpacing:1.5}}>TODAY'S POL COUNT</div>
          <div style={{fontSize:34,fontWeight:800,marginTop:4}}>{dateLogs.length}</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Set shifts in Summary to see %</div>
        </div>
        <span style={{background:"#334155",color:"#f1f5f9",borderRadius:999,padding:"4px 14px",fontSize:15,fontWeight:700}}>{dateLogs.length} POL</span>
      </div>
      <Card>
        <SectionLabel text="Log a POL Punch"/>
        <label style={{fontSize:12,color:"#64748b",fontWeight:600}}>EMPLOYEE / MANAGER</label>
        <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)}
          style={{display:"block",width:"100%",marginTop:4,marginBottom:12,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"10px 12px",color:selectedEmp?"#f1f5f9":"#64748b",fontSize:15}}>
          <option value="">Select who punched out late…</option>
          {(employees||[]).length>0&&<optgroup label="── Staff ──">{(employees||[]).map(e=><option key={e} value={e}>{e}</option>)}</optgroup>}
          {(managers||[]).length>0&&<optgroup label="── Managers ──">{(managers||[]).map(m=><option key={m} value={m}>{m}</option>)}</optgroup>}
        </select>
        <label style={{fontSize:12,color:"#64748b",fontWeight:600}}>MANAGER ON SHIFT</label>
        <select value={selectedMgr} onChange={e=>setSelectedMgr(e.target.value)}
          style={{display:"block",width:"100%",marginTop:4,marginBottom:8,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"10px 12px",color:selectedMgr?"#f1f5f9":"#64748b",fontSize:15}}>
          <option value="">Select manager…</option>
          {(managers||[]).map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        {extraMgrs.map((val,idx)=>{
          const taken=[selectedMgr,...extraMgrs.filter((_,i)=>i!==idx)].filter(Boolean);
          const ordinals=["2nd","3rd","4th"];
          return (
            <div key={idx} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <label style={{fontSize:12,color:"#64748b",fontWeight:600}}>{ordinals[idx].toUpperCase()} MANAGER</label>
                <button onClick={()=>removeExtraMgr(idx)} style={{fontSize:11,color:"#ef4444",background:"none",border:"none",cursor:"pointer"}}>Remove ✕</button>
              </div>
              <select value={val} onChange={e=>updateExtraMgr(idx,e.target.value)}
                style={{display:"block",width:"100%",background:"#0f172a",border:"1px solid #6366f1",borderRadius:8,padding:"10px 12px",color:val?"#f1f5f9":"#64748b",fontSize:15}}>
                <option value="">Select {ordinals[idx]} manager…</option>
                {(managers||[]).filter(m=>!taken.includes(m)).map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          );
        })}
        {extraMgrs.length<3&&<button onClick={addExtraMgr} style={{fontSize:12,color:"#64748b",background:"none",border:"1px solid #334155",borderRadius:6,padding:"4px 12px",cursor:"pointer",marginBottom:12}}>+ Add {["2nd","3rd","4th"][extraMgrs.length]} manager</button>}
        <label style={{fontSize:12,color:"#64748b",fontWeight:600}}>SHIFT TYPE</label>
        <div style={{display:"flex",gap:6,marginTop:6,marginBottom:14}}>
          {[["morning","🌅 Morning"],["mid","☀️ Mid"],["closing","🌙 Closing"]].map(([v,l])=>(
            <button key={v} onClick={()=>setShiftType(v)} style={{flex:1,padding:"10px 4px",borderRadius:8,border:shiftType===v?"2px solid #ef4444":"2px solid #334155",background:shiftType===v?"#ef444422":"#0f172a",color:shiftType===v?"#f1f5f9":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <button onClick={logPOL} disabled={saving} style={{width:"100%",background:saving?"#475569":"#ef4444",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontWeight:700,fontSize:16,cursor:saving?"not-allowed":"pointer"}}>
          {saving?"Saving…":"+ Log POL"}
        </button>
      </Card>
      {dateLogs.length>0&&(
        <Card>
          <SectionLabel text={`POL Log — ${formatDate(date)}`}/>
          {dateLogs.map((l,i)=>(
            <div key={l.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<dateLogs.length-1?"1px solid #334155":"none"}}>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>{l.employee}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Mgr: {[l.manager,...(l.extraManagers||[])].filter(Boolean).join(" & ")} · {l.shiftType==="morning"?"🌅 Morning":l.shiftType==="mid"?"☀️ Mid":"🌙 Closing"}</div>
              </div>
              <button onClick={()=>deletePOL(l.id)} style={{background:"none",border:"1px solid #ef4444",color:"#ef4444",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>Remove</button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function LeaderboardTab({store}) {
  const [logs,,logsLoading]=useGSData(`${store}_logs`,[]);
  const [denominators,saveDenominators,denomLoading]=useGSData(`${store}_leaderboardDenominators`,{});
  const [view,setView]=useState("week");
  const [selectedWeeks,setSelectedWeeks]=useState([]);
  const [editingDenom,setEditingDenom]=useState(null);
  const [denomInput,setDenomInput]=useState("");

  useEffect(()=>{if(view==="multi"&&selectedWeeks.length===0)setSelectedWeeks([currentWeek()]);},[view]);
  if(logsLoading||denomLoading) return <Spinner/>;

  const week=currentWeek(),month=currentMonth();
  const allWeeks=Array.from(new Set([week,...(logs||[]).map(l=>weekLabel(l.date))])).sort().reverse();
  function toggleWeek(wk){setSelectedWeeks(prev=>prev.includes(wk)?prev.filter(w=>w!==wk):[...prev,wk]);}

  const periodKey=view==="week"?`week_${week}`:view==="month"?`month_${month}`:`multi_${[...selectedWeeks].sort().join("_")}`;
  const periodDenoms=(denominators||{})[periodKey]||{};
  function getDenom(name){return periodDenoms[name]!==undefined?periodDenoms[name]:view==="month"?20:5;}

  async function saveDenom(name){
    const n=Number(denomInput);
    if(!denomInput||isNaN(n)||n<1)return;
    await saveDenominators({...(denominators||{}),[periodKey]:{...periodDenoms,[name]:n}});
    setEditingDenom(null);
  }

  let filteredLogs,periodLabel;
  if(view==="week"){filteredLogs=(logs||[]).filter(l=>weekLabel(l.date)===week);periodLabel=`Week of ${formatDate(week)}`;}
  else if(view==="month"){filteredLogs=(logs||[]).filter(l=>monthLabel(l.date)===month);periodLabel=`${formatMonth(month)} — MTD`;}
  else{const s=new Set(selectedWeeks);filteredLogs=(logs||[]).filter(l=>s.has(weekLabel(l.date)));periodLabel=selectedWeeks.length===0?"No weeks selected":selectedWeeks.length===1?`Week of ${formatDate(selectedWeeks[0])}`:`${selectedWeeks.length} weeks`;}

  const polCounts={};
  filteredLogs.forEach(l=>{if(l.employee)polCounts[l.employee]=(polCounts[l.employee]||0)+1;});
  const ranked=Object.entries(polCounts).map(([name,pol])=>({name,pol,denom:getDenom(name),pctNum:pctNum(pol,getDenom(name))})).sort((a,b)=>b.pctNum-a.pctNum);
  const leader=ranked[0];
  const medals=["💀","😬","😐"];

  return (
    <div>
      <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:4,marginBottom:14,gap:4}}>
        {[["week","This Week"],["multi","Select Weeks"],["month","MTD"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:view===v?"#3b82f6":"transparent",color:view===v?"#fff":"#64748b"}}>{l}</button>
        ))}
      </div>
      {view==="multi"&&(
        <Card>
          <SectionLabel text="Select Weeks"/>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {allWeeks.map(wk=>{
              const isSel=selectedWeeks.includes(wk);
              const wkPol=(logs||[]).filter(l=>weekLabel(l.date)===wk).length;
              return (
                <button key={wk} onClick={()=>toggleWeek(wk)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:isSel?"#1e3a5f":"#0f172a",border:isSel?"2px solid #3b82f6":"2px solid #334155",borderRadius:8,padding:"10px 12px",cursor:"pointer",color:"#f1f5f9"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{isSel?"✓":"○"}</span><span style={{fontWeight:600,fontSize:14}}>Week of {formatDate(wk)}</span></div>
                  <span style={{fontSize:12,color:"#64748b"}}>{wkPol} POL</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}
      <div style={{fontSize:12,color:"#475569",textAlign:"center",marginBottom:14}}>{periodLabel}</div>
      {ranked.length===0?(
        <Card><div style={{textAlign:"center",color:"#64748b",fontSize:14,padding:"20px 0"}}>No POL punches logged for this period.</div></Card>
      ):(
        <>
          {leader&&(
            <div style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)",border:"2px solid #ef4444",borderRadius:14,padding:"18px 16px",marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#fca5a5",fontWeight:700,letterSpacing:1.5,marginBottom:6}}>⚠️ NEEDS ATTENTION</div>
              <div style={{fontSize:26,fontWeight:800,color:"#fff"}}>{leader.name}</div>
              <div style={{fontSize:36,fontWeight:900,margin:"6px 0",color:"#ef4444"}}>{pct(leader.pol,leader.denom)}</div>
              <div style={{fontSize:13,color:"#fca5a5"}}>{leader.pol} POL / {leader.denom} shifts</div>
            </div>
          )}
          <Card>
            <SectionLabel text={`Staff Ranking — ${ranked.length} with POL`}/>
            <div style={{fontSize:11,color:"#475569",marginBottom:10}}>Default: {view==="month"?"20":"5"} shifts — tap ✏️ to adjust</div>
            {ranked.map((m,i)=>(
              <div key={m.name} style={{padding:"12px 0",borderBottom:i<ranked.length-1?"1px solid #334155":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:20,width:28,textAlign:"center"}}>{medals[i]||`#${i+1}`}</div>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:15}}>{m.name}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{m.pol} POL / {m.denom} shifts</div></div>
                  <Badge value={pct(m.pol,m.denom)}/>
                  <button onClick={()=>{setEditingDenom(m.name);setDenomInput(String(m.denom));}} style={{background:"none",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 8px",fontSize:12,cursor:"pointer"}}>✏️</button>
                </div>
                {editingDenom===m.name&&(
                  <div style={{display:"flex",gap:8,marginTop:8,paddingLeft:38}}>
                    <input type="number" min="1" value={denomInput} onChange={e=>setDenomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveDenom(m.name);if(e.key==="Escape")setEditingDenom(null);}} autoFocus placeholder="# shifts"
                      style={{width:90,background:"#0f172a",border:"1px solid #3b82f6",borderRadius:8,padding:"7px 10px",color:"#f1f5f9",fontSize:14,textAlign:"center"}}/>
                    <button onClick={()=>saveDenom(m.name)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Save</button>
                    <button onClick={()=>setEditingDenom(null)} style={{background:"none",border:"1px solid #475569",color:"#64748b",borderRadius:8,padding:"7px 10px",fontSize:13,cursor:"pointer"}}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryTab({store}) {
  const [logs,,logsLoading]=useGSData(`${store}_logs`,[]);
  const [savedShifts,saveSavedShifts,shiftsLoading]=useGSData(`${store}_shifts`,{});
  const [viewMode,setViewMode]=useState("weekly");
  const [editingShiftsDate,setEditingShiftsDate]=useState(null);
  const [shiftsInput,setShiftsInput]=useState("");
  const [saving,setSaving]=useState(false);

  if(logsLoading||shiftsLoading) return <Spinner/>;

  async function saveShiftsForDate(date){
    const n=Number(shiftsInput);
    if(!shiftsInput||isNaN(n)||n<1)return;
    setSaving(true);
    await saveSavedShifts({...(savedShifts||{}),[date]:n});
    setSaving(false);setEditingShiftsDate(null);setShiftsInput("");
  }

  const today=todayStr(),week=currentWeek();
  const [cy,cm]=today.split("-").map(Number);
  const monthStart=`${String(cy).padStart(4,"0")}-${String(cm).padStart(2,"0")}-01`;
  const allCurrentMonthDays=[];
  {const s=new Date(monthStart+"T00:00:00"),e=new Date(today+"T00:00:00"),c=new Date(s);while(c<=e){allCurrentMonthDays.push(localStr(c));c.setDate(c.getDate()+1);}}

  const byDate={};
  allCurrentMonthDays.forEach(d=>{if(!byDate[d])byDate[d]=[];});
  (logs||[]).forEach(l=>{if(!byDate[l.date])byDate[l.date]=[];byDate[l.date].push(l);});
  Object.keys(savedShifts||{}).forEach(d=>{if(!byDate[d])byDate[d]=[];});

  const byWeek={};
  (logs||[]).forEach(l=>{const wk=weekLabel(l.date);if(!byWeek[wk])byWeek[wk]={pol:0,shifts:0};byWeek[wk].pol+=1;});
  Object.keys(savedShifts||{}).forEach(d=>{const wk=weekLabel(d);if(!byWeek[wk])byWeek[wk]={pol:0,shifts:0};byWeek[wk].shifts+=(savedShifts||{})[d];});
  if(!byWeek[week])byWeek[week]={pol:0,shifts:0};

  const byMonth={};
  (logs||[]).forEach(l=>{const mo=monthLabel(l.date);if(!byMonth[mo])byMonth[mo]={pol:0,shifts:0};byMonth[mo].pol+=1;});
  Object.keys(savedShifts||{}).forEach(d=>{const mo=monthLabel(d);if(!byMonth[mo])byMonth[mo]={pol:0,shifts:0};byMonth[mo].shifts+=(savedShifts||{})[d];});
  if(!byMonth[currentMonth()])byMonth[currentMonth()]={pol:0,shifts:0};

  const sortedDates=Object.keys(byDate).sort().reverse();
  const sortedWeeks=Object.keys(byWeek).sort().reverse();
  const sortedMonths=Object.keys(byMonth).sort().reverse();

  return (
    <div>
      <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:4,marginBottom:16,gap:4}}>
        {[["daily","Daily"],["weekly","Weekly"],["mtd","MTD"],["monthly","Monthly"],["dayofweek","By Day"],["shifts","By Shift"]].map(([v,l])=>(
          <button key={v} onClick={()=>setViewMode(v)} style={{flex:1,padding:"8px 1px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:10,background:viewMode===v?"#3b82f6":"transparent",color:viewMode===v?"#fff":"#64748b"}}>{l}</button>
        ))}
      </div>
      {viewMode==="daily"&&sortedDates.map(date=>{
        const entries=byDate[date]||[],shifts=(savedShifts||{})[date]||0,isToday=date===todayStr();
        return (
          <Card key={date}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontWeight:700,fontSize:15}}>{formatDate(date)}</div>
                {isToday&&<span style={{fontSize:11,background:"#3b82f6",color:"#fff",borderRadius:99,padding:"1px 8px",fontWeight:700}}>TODAY</span>}
                {entries.length===0&&<span style={{fontSize:11,background:"#334155",color:"#94a3b8",borderRadius:99,padding:"1px 8px"}}>No POL</span>}
              </div>
              <Badge value={pct(entries.length,shifts)}/>
            </div>
            <div style={{fontSize:13,color:"#64748b",marginTop:4,marginBottom:8}}>{entries.length} POL / {shifts||"?"} shifts</div>
            {editingShiftsDate===date?(
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input type="number" min="1" value={shiftsInput} onChange={e=>setShiftsInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveShiftsForDate(date);if(e.key==="Escape")setEditingShiftsDate(null);}} placeholder="Total shifts" autoFocus
                  style={{flex:1,background:"#0f172a",border:"1px solid #3b82f6",borderRadius:8,padding:"7px 10px",color:"#f1f5f9",fontSize:14}}/>
                <button onClick={()=>saveShiftsForDate(date)} disabled={saving} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>{saving?"…":"Save"}</button>
                <button onClick={()=>setEditingShiftsDate(null)} style={{background:"none",border:"1px solid #475569",color:"#64748b",borderRadius:8,padding:"7px 10px",fontSize:13,cursor:"pointer"}}>✕</button>
              </div>
            ):(
              <button onClick={()=>{setEditingShiftsDate(date);setShiftsInput((savedShifts||{})[date]||"");}} style={{fontSize:12,color:"#64748b",background:"none",border:"1px solid #334155",borderRadius:6,padding:"4px 10px",cursor:"pointer",marginBottom:8}}>
                {shifts?`📋 Edit shifts (${shifts})`:"📋 Set total shifts for this day"}
              </button>
            )}
            <div style={{borderTop:"1px solid #334155",paddingTop:8}}>
              {entries.map(e=>(
                <div key={e.id} style={{fontSize:13,color:"#94a3b8",padding:"3px 0"}}>
                  • {e.employee} <span style={{color:"#475569"}}>– Mgr: {[e.manager,...(e.extraManagers||[])].filter(Boolean).join(" & ")} · {e.shiftType==="morning"?"🌅 Morning":e.shiftType==="mid"?"☀️ Mid":"🌙 Closing"}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      {viewMode==="weekly"&&sortedWeeks.map(wk=>{
        const {pol,shifts}=byWeek[wk],isCur=wk===currentWeek();
        return (
          <Card key={wk} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontWeight:700,fontSize:15}}>Week of {formatDate(wk)}</div>
                {isCur&&<span style={{fontSize:11,background:"#3b82f6",color:"#fff",borderRadius:99,padding:"1px 8px",fontWeight:700}}>CURRENT</span>}
              </div>
              <div style={{fontSize:13,color:"#64748b",marginTop:3}}>{pol} POL / {shifts} shifts</div>
            </div>
            <Badge value={pct(pol,shifts)}/>
          </Card>
        );
      })}
      {viewMode==="mtd"&&sortedMonths.map(mo=>{
        const {pol,shifts}=byMonth[mo],isCur=mo===currentMonth();
        return (
          <Card key={mo}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{fontWeight:700,fontSize:16}}>{formatMonth(mo)}</div>
                  {isCur&&<span style={{fontSize:11,background:"#3b82f6",color:"#fff",borderRadius:99,padding:"1px 8px",fontWeight:700}}>CURRENT</span>}
                </div>
                <div style={{fontSize:13,color:"#64748b",marginTop:3}}>{pol} POL / {shifts} total shifts</div>
              </div>
              <Badge value={pct(pol,shifts)} size="lg"/>
            </div>
          </Card>
        );
      })}
      {viewMode==="monthly"&&(
        <>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12,textAlign:"center"}}>Full month totals</div>
          {sortedMonths.length===0?<Empty msg="No data yet."/>:(
            <>
              {sortedMonths.length>1&&(()=>{
                const prev=byMonth[sortedMonths[1]],curr=byMonth[sortedMonths[0]];
                const currP=curr.shifts>0?(curr.pol/curr.shifts)*100:null,prevP=prev.shifts>0?(prev.pol/prev.shifts)*100:null;
                const diff=currP!=null&&prevP!=null?currP-prevP:null;
                return diff!=null?(
                  <div style={{background:diff<=0?"#14532d":"#7f1d1d",border:`1px solid ${diff<=0?"#16a34a":"#ef4444"}`,borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div><div style={{fontSize:12,color:diff<=0?"#86efac":"#fca5a5",fontWeight:700}}>MONTH OVER MONTH</div><div style={{fontSize:13,color:"#f1f5f9",marginTop:3}}>{formatMonth(sortedMonths[1])} → {formatMonth(sortedMonths[0])}</div></div>
                    <div style={{fontSize:22,fontWeight:900,color:diff<=0?"#22c55e":"#ef4444"}}>{diff<=0?"▼":"▲"} {Math.abs(diff).toFixed(1)}%</div>
                  </div>
                ):null;
              })()}
              {sortedMonths.map((mo,i)=>{
                const {pol,shifts}=byMonth[mo],isCur=mo===currentMonth();
                const prevMo=sortedMonths[i+1],prevPct=prevMo&&byMonth[prevMo]?.shifts>0?(byMonth[prevMo].pol/byMonth[prevMo].shifts)*100:null;
                const currPct=shifts>0?(pol/shifts)*100:null,diff=currPct!=null&&prevPct!=null?currPct-prevPct:null;
                return (
                  <Card key={mo}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontWeight:700,fontSize:16}}>{formatMonth(mo)}</div>
                          {isCur&&<span style={{fontSize:11,background:"#3b82f6",color:"#fff",borderRadius:99,padding:"1px 8px",fontWeight:700}}>CURRENT</span>}
                          {diff!=null&&<span style={{fontSize:11,color:diff<=0?"#22c55e":"#ef4444",fontWeight:700}}>{diff<=0?"▼":"▲"}{Math.abs(diff).toFixed(1)}%</span>}
                        </div>
                        <div style={{fontSize:13,color:"#64748b",marginTop:3}}>{pol} POL / {shifts||"?"} shifts</div>
                      </div>
                      <Badge value={pct(pol,shifts)} size="lg"/>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </>
      )}
      {viewMode==="dayofweek"&&(()=>{
        const DAY_NAMES=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        const dayStats=Array.from({length:7},(_,i)=>({day:i,name:DAY_NAMES[i],pol:0,shifts:0}));
        (logs||[]).forEach(l=>{const d=new Date(l.date+"T00:00:00");dayStats[d.getDay()].pol+=1;});
        Object.entries(savedShifts||{}).forEach(([date,count])=>{const d=new Date(date+"T00:00:00");dayStats[d.getDay()].shifts+=count;});
        const ordered=[1,2,3,4,5,6,0].map(i=>dayStats[i]);
        const maxPol=Math.max(...ordered.map(d=>d.pol),1);
        const worstDay=[...ordered].filter(d=>d.pol>0).sort((a,b)=>b.pol-a.pol)[0];
        return (
          <div>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:12,textAlign:"center"}}>All-time POL count by day of week</div>
            {worstDay&&(
              <div style={{background:"linear-gradient(135deg,#7f1d1d,#0f172a)",border:"1px solid #ef4444",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontSize:11,color:"#fca5a5",fontWeight:700}}>⚠️ HIGHEST POL DAY</div><div style={{fontSize:20,fontWeight:800,marginTop:2}}>{worstDay.name}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:900,color:"#ef4444"}}>{worstDay.pol}</div><div style={{fontSize:12,color:"#fca5a5"}}>POL punches</div></div>
              </div>
            )}
            <Card>
              <SectionLabel text="POL by Day of Week"/>
              {ordered.map((d)=>{
                const barPct=(d.pol/maxPol)*100,isWorst=worstDay?.day===d.day&&d.pol>0;
                return (
                  <div key={d.day} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontWeight:700,fontSize:14,color:isWorst?"#ef4444":"#f1f5f9"}}>{d.name}</span>
                        {isWorst&&<span style={{fontSize:10,background:"#ef4444",color:"#fff",borderRadius:99,padding:"1px 6px",fontWeight:700}}>MOST</span>}
                      </div>
                      <span style={{fontWeight:700,fontSize:14,color:isWorst?"#ef4444":"#94a3b8"}}>{d.pol} POL</span>
                    </div>
                    <div style={{background:"#0f172a",borderRadius:99,height:10,overflow:"hidden"}}>
                      <div style={{width:`${barPct}%`,height:"100%",background:isWorst?"#ef4444":"#3b82f6",borderRadius:99}}/>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        );
      })()}
      {viewMode==="shifts"&&<ShiftBreakdownChart logs={logs||[]}/>}
    </div>
  );
}

function ShiftBreakdownChart({logs}) {
  const SHIFTS=[{key:"morning",label:"🌅 Morning",color:"#f59e0b"},{key:"mid",label:"☀️ Mid",color:"#3b82f6"},{key:"closing",label:"🌙 Closing",color:"#8b5cf6"}];
  const counts={morning:0,mid:0,closing:0,unknown:0};
  logs.forEach(l=>counts[l.shiftType]!==undefined?counts[l.shiftType]++:counts.unknown++);
  const total=logs.length;
  if(!total) return <Empty msg="No POL data with shift type yet."/>;
  return (
    <Card>
      <SectionLabel text="All-Time POL by Shift Type"/>
      {SHIFTS.map(({key,label,color})=>{
        const count=counts[key],barPct=total>0?(count/total)*100:0;
        return (
          <div key={key} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontWeight:600,fontSize:14}}>{label}</span>
              <span style={{fontWeight:700,fontSize:14,color}}>{count} POL <span style={{color:"#64748b",fontWeight:400}}>({barPct.toFixed(0)}%)</span></span>
            </div>
            <div style={{background:"#0f172a",borderRadius:99,height:10,overflow:"hidden"}}>
              <div style={{width:`${barPct}%`,height:"100%",background:color,borderRadius:99}}/>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function EmployeesTab({store}) {
  const [logs,,logsLoading]=useGSData(`${store}_logs`,[]);
  const [people,savePeople,empLoading]=useGSData(`${store}_employees`,PRESET_EMPLOYEES[store]||[]);
  const [newName,setNewName]=useState("");
  const [editingName,setEditingName]=useState(null);
  const [editValue,setEditValue]=useState("");
  const [toast,setToast]=useState("");

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2500);}
  if(logsLoading||empLoading) return <Spinner/>;

  async function addPerson(){
    const name=newName.trim();
    if(!name||(people||[]).includes(name)){showToast("Enter a unique name");return;}
    await savePeople([...(people||[]),name].sort());
    setNewName("");showToast(`${name} added ✓`);
  }

  async function removePerson(name){await savePeople((people||[]).filter(p=>p!==name));}

  async function saveEdit(oldName){
    const newVal=editValue.trim();
    if(!newVal){showToast("Name can't be empty");return;}
    if(newVal!==oldName&&(people||[]).includes(newVal)){showToast("Name already exists");return;}
    await savePeople((people||[]).map(p=>p===oldName?newVal:p).sort());
    setEditingName(null);showToast("Name updated ✓");
  }

  const counts={};
  (logs||[]).forEach(l=>{counts[l.employee]=(counts[l.employee]||0)+1;});

  return (
    <div>
      {toast&&<Toast msg={toast}/>}
      <Card>
        <SectionLabel text="Add Employee"/>
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPerson()} placeholder="Employee name…"
            style={{flex:1,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:15}}/>
          <button onClick={addPerson} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Add</button>
        </div>
      </Card>
      {(people||[]).length===0?<Empty msg="No employees added yet."/>:(
        <Card>
          <SectionLabel text="Employee POL Count"/>
          {(people||[]).map((p,i)=>(
            <div key={p} style={{padding:"11px 0",borderBottom:i<(people||[]).length-1?"1px solid #334155":"none"}}>
              {editingName===p?(
                <div style={{display:"flex",gap:8}}>
                  <input value={editValue} onChange={e=>setEditValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(p);if(e.key==="Escape")setEditingName(null);}} autoFocus
                    style={{flex:1,background:"#0f172a",border:"1px solid #3b82f6",borderRadius:8,padding:"8px 12px",color:"#f1f5f9",fontSize:15}}/>
                  <button onClick={()=>saveEdit(p)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Save</button>
                  <button onClick={()=>setEditingName(null)} style={{background:"none",border:"1px solid #475569",color:"#64748b",borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer"}}>✕</button>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:15}}>{p}</div>
                    <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{counts[p]||0} POL punch{counts[p]!==1?"es":""}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:counts[p]?"#ef4444":"#334155",color:"#fff",borderRadius:999,padding:"3px 12px",fontWeight:700,fontSize:14}}>{counts[p]||0}</span>
                    <button onClick={()=>{setEditingName(p);setEditValue(p);}} style={{background:"none",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>✏️</button>
                    <button onClick={()=>removePerson(p)} style={{background:"none",border:"1px solid #475569",color:"#64748b",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function ManagersTab({store}) {
  const [logs,saveLogs,logsLoading]=useGSData(`${store}_logs`,[]);
  const [managers,saveManagers,mgrLoading]=useGSData(`${store}_managers`,PRESET_MANAGERS[store]||[]);
  const [savedShifts,,shiftsLoading]=useGSData(`${store}_shifts`,{});
  const [newName,setNewName]=useState("");
  const [toast,setToast]=useState("");
  const [editingName,setEditingName]=useState(null);
  const [editValue,setEditValue]=useState("");
  const [view,setView]=useState("week");
  const [selectedWeeks,setSelectedWeeks]=useState([]);

  useEffect(()=>{if(view==="multi"&&selectedWeeks.length===0)setSelectedWeeks([currentWeek()]);},[view]);
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),3000);}
  if(logsLoading||mgrLoading||shiftsLoading) return <Spinner/>;

  async function addManager(){
    const name=newName.trim();
    if(!name||(managers||[]).includes(name)){showToast("Enter a unique name");return;}
    await saveManagers([...(managers||[]),name].sort());
    setNewName("");showToast(`${name} added ✓`);
  }

  async function removeManager(name){await saveManagers((managers||[]).filter(m=>m!==name));}

  async function saveEditName(oldName){
    const newVal=editValue.trim();
    if(!newVal){showToast("Name can't be empty");return;}
    if(newVal!==oldName&&(managers||[]).includes(newVal)){showToast("Name already exists");return;}
    await saveManagers((managers||[]).map(m=>m===oldName?newVal:m).sort());
    const updatedLogs=(logs||[]).map(l=>({...l,manager:l.manager===oldName?newVal:l.manager,extraManagers:(l.extraManagers||[]).map(em=>em===oldName?newVal:em)}));
    await saveLogs(updatedLogs);
    setEditingName(null);showToast("Name updated ✓");
  }

  function toggleWeek(wk){setSelectedWeeks(prev=>prev.includes(wk)?prev.filter(w=>w!==wk):[...prev,wk]);}

  const week=currentWeek(),month=currentMonth();
  const allWeeks=Array.from(new Set([week,...(logs||[]).map(l=>weekLabel(l.date)),...Object.keys(savedShifts||{}).map(d=>weekLabel(d))])).sort().reverse();

  let filteredLogs,totalShifts,periodLabel;
  if(view==="week"){
    filteredLogs=(logs||[]).filter(l=>weekLabel(l.date)===week);
    totalShifts=Object.entries(savedShifts||{}).filter(([d])=>weekLabel(d)===week).reduce((s,[,v])=>s+v,0);
    periodLabel=`Week of ${formatDate(week)}`;
  } else if(view==="month"){
    filteredLogs=(logs||[]).filter(l=>monthLabel(l.date)===month);
    totalShifts=Object.entries(savedShifts||{}).filter(([d])=>monthLabel(d)===month).reduce((s,[,v])=>s+v,0);
    periodLabel=formatMonth(month)+" MTD";
  } else {
    const s=new Set(selectedWeeks);
    filteredLogs=(logs||[]).filter(l=>s.has(weekLabel(l.date)));
    totalShifts=Object.entries(savedShifts||{}).filter(([d])=>s.has(weekLabel(d))).reduce((s,[,v])=>s+v,0);
    periodLabel=selectedWeeks.length===0?"No weeks selected":selectedWeeks.length===1?`Week of ${formatDate(selectedWeeks[0])}`:`${selectedWeeks.length} weeks selected`;
  }

  const polCounts={};
  filteredLogs.forEach(l=>{[l.manager,...(l.extraManagers||[])].filter(Boolean).forEach(m=>{polCounts[m]=(polCounts[m]||0)+1;});});
  const sorted=[...(managers||[])].sort((a,b)=>pctNum(polCounts[b]||0,totalShifts)-pctNum(polCounts[a]||0,totalShifts));

  return (
    <div>
      {toast&&<Toast msg={toast}/>}
      <Card>
        <SectionLabel text="Add Manager / ASM"/>
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addManager()} placeholder="Manager name…"
            style={{flex:1,background:"#0f172a",border:"1px solid #334155",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:15}}/>
          <button onClick={addManager} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Add</button>
        </div>
      </Card>
      {(managers||[]).length>0&&(
        <>
          <div style={{display:"flex",background:"#1e293b",borderRadius:10,padding:4,marginBottom:14,gap:4}}>
            {[["week","This Week"],["multi","Select Weeks"],["month","MTD"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:view===v?"#3b82f6":"transparent",color:view===v?"#fff":"#64748b"}}>{l}</button>
            ))}
          </div>
          {view==="multi"&&(
            <Card>
              <SectionLabel text="Select Weeks"/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {allWeeks.map(wk=>{
                  const isSel=selectedWeeks.includes(wk);
                  const wkShifts=Object.entries(savedShifts||{}).filter(([d])=>weekLabel(d)===wk).reduce((s,[,v])=>s+v,0);
                  const wkPol=(logs||[]).filter(l=>weekLabel(l.date)===wk).length;
                  return (
                    <button key={wk} onClick={()=>toggleWeek(wk)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:isSel?"#1e3a5f":"#0f172a",border:isSel?"2px solid #3b82f6":"2px solid #334155",borderRadius:8,padding:"10px 12px",cursor:"pointer",color:"#f1f5f9"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{isSel?"✓":"○"}</span><span style={{fontWeight:600,fontSize:14}}>Week of {formatDate(wk)}</span></div>
                      <span style={{fontSize:12,color:"#64748b"}}>{wkPol} POL · {wkShifts} shifts</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
          <div style={{fontSize:12,color:"#475569",textAlign:"center",marginBottom:10}}>{periodLabel} · {totalShifts} total store shifts</div>
          {!totalShifts&&<div style={{background:"#1e293b",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#f59e0b",textAlign:"center"}}>Set daily shifts in Summary → Daily to calculate %</div>}
          <Card>
            <SectionLabel text="Manager POL % — Highest to Lowest"/>
            {sorted.map((m,i)=>{
              const pol=polCounts[m]||0;
              return (
                <div key={m} style={{padding:"12px 0",borderBottom:i<sorted.length-1?"1px solid #334155":"none"}}>
                  {editingName===m?(
                    <div style={{display:"flex",gap:8}}>
                      <input value={editValue} onChange={e=>setEditValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEditName(m);if(e.key==="Escape")setEditingName(null);}} autoFocus
                        style={{flex:1,background:"#0f172a",border:"1px solid #3b82f6",borderRadius:8,padding:"8px 12px",color:"#f1f5f9",fontSize:15}}/>
                      <button onClick={()=>saveEditName(m)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Save</button>
                      <button onClick={()=>setEditingName(null)} style={{background:"none",border:"1px solid #475569",color:"#64748b",borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer"}}>✕</button>
                    </div>
                  ):(
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{fontWeight:600,fontSize:15}}>{m}</div>
                          {i===0&&pol>0&&<span style={{fontSize:10,background:"#ef4444",color:"#fff",borderRadius:99,padding:"1px 7px",fontWeight:700}}>HIGHEST</span>}
                        </div>
                        <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{pol} POL / {totalShifts||"?"} store shifts</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <Badge value={pct(pol,totalShifts)}/>
                        <button onClick={()=>{setEditingName(m);setEditValue(m);}} style={{background:"none",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>✏️</button>
                        <button onClick={()=>removeManager(m)} style={{background:"none",border:"1px solid #475569",color:"#64748b",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer"}}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
