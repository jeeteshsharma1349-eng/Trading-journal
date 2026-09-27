const KEY="t2_1000_60k_v1";
const TARGET=60000, START=1000, DAYS=30;
const dailyRate=Math.pow(TARGET/START,1/DAYS)-1;
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{actual:{},trades:[],workflow:{}};

const money=n=>"₹"+Math.round(Number(n)||0).toLocaleString("en-IN");
const money2=n=>"₹"+(Number(n)||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const projected=d=>START*Math.pow(1+dailyRate,d);
const dayTarget=d=>projected(d);

function render(){
  const actual=Object.values(state.actual);
  const current=actual.length?actual[actual.length-1]:START;
  const lastDay=actual.length?Math.max(...Object.keys(state.actual).map(Number)):0;
  document.getElementById("currentBalance").textContent=money2(current);
  document.getElementById("pnl").textContent=(current>=START?"+":"")+money2(current-START);
  document.getElementById("progress").textContent=Math.min(100,current/TARGET*100).toFixed(1)+"%";
  document.getElementById("dayNo").textContent=`${Math.min(lastDay+1,DAYS)} / ${DAYS}`;
  document.getElementById("status").textContent=actual.length?"Tracking":"Not started";
  document.getElementById("todayPill").textContent=`Day ${Math.min(lastDay+1,DAYS)}`;
  document.getElementById("todayTarget").textContent=money2(dayTarget(Math.min(lastDay+1,DAYS)));
  document.getElementById("progressText").textContent=`${lastDay} / ${DAYS} days`;
  document.getElementById("progressBar").style.width=Math.min(100,current/TARGET*100)+"%";
  renderPlan(); renderJournal(); renderScenarios(); updateTradeCalc();
}
function renderPlan(){
  const body=document.getElementById("planBody"); body.innerHTML="";
  for(let d=1;d<=DAYS;d++){
    const start=d===1?START:projected(d-1), target=projected(d), actual=state.actual[d];
    const status=actual==null?"Pending":(actual>=target?"Ahead":"Behind");
    const tr=document.createElement("tr");
    tr.innerHTML=`<td><b>${d}</b></td><td>${money2(start)}</td><td>${money2(target)}</td><td>${(dailyRate*100).toFixed(2)}%</td><td>${actual!=null?money2(actual):"—"}</td><td>${status}</td>`;
    body.appendChild(tr);
  }
}
function renderScenarios(){
  const box=document.getElementById("scenarios"); box.innerHTML="";
  [1,2,3,4,5].forEach(r=>{const v=START*Math.pow(1+r/100,DAYS);box.innerHTML+=`<div class="scenario"><b>${r}% / day</b><strong>${money2(v)}</strong><small>30 periods</small></div>`});
}
function renderJournal(){
  const body=document.getElementById("journalBody"); body.innerHTML="";
  state.trades.forEach((t,i)=>body.innerHTML+=`<tr><td>${i+1}</td><td>${t.time}</td><td>${money2(t.start)}</td><td>${t.result>=0?"+":""}${money2(t.result)}</td><td>${money2(t.start+t.result)}</td><td>${t.note||""}</td></tr>`);
  document.getElementById("tradeCountLabel").textContent=`${state.trades.length} trade${state.trades.length===1?"":"s"}`;
}
function updateTradeCalc(){
  const s=+document.getElementById("tradeStart").value||0,r=+document.getElementById("tradeRate").value||0,n=+document.getElementById("tradeCount").value||0;
  document.getElementById("tradeResult").textContent=money2(s*Math.pow(1+r/100,n));
}
function calc(){
  const s=+document.getElementById("calcStart").value||0,d=+document.getElementById("calcDays").value||0,r=+document.getElementById("calcRate").value||0;
  const v=s*Math.pow(1+r/100,d);
  document.getElementById("calcResult").textContent=money2(v);
  const target=+document.getElementById("calcTarget").value||0;
  document.getElementById("calcNote").textContent=target?`Target gap: ${money2(target-v)}`:"";
}
function workflow(){
  const items=[
    ["10:00–10:30","Preparation","Set target, review journal and define a stop condition."],
    ["10:30–12:00","Session 1","Log decisions/results; avoid forcing trades."],
    ["12:00–12:30","Review","Check P/L, drawdown and whether the day is on track."],
    ["12:30–14:00","Break / analysis","No-pressure review and planning."],
    ["14:00–15:30","Session 2","Continue only within your predefined risk rules."],
    ["15:30–16:00","Review","Update balance and compare with today's projection."],
    ["16:00–17:00","Close","Journal, final numbers and stop for the day."]
  ];
  const el=document.getElementById("workflow");el.innerHTML="";
  items.forEach((x,i)=>el.innerHTML+=`<div class="workflow-item"><input type="checkbox" data-w="${i}" ${state.workflow[i]?"checked":""}><div><b>${x[0]} · ${x[1]}</b><span>${x[2]}</span></div></div>`);
  el.querySelectorAll("input").forEach(c=>c.onchange=()=>{state.workflow[c.dataset.w]=c.checked;save()});
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.getElementById(b.dataset.tab).classList.add("active")});
document.getElementById("calcBtn").onclick=calc;
["tradeStart","tradeRate","tradeCount"].forEach(id=>document.getElementById(id).oninput=updateTradeCalc);
document.getElementById("addTrade").onclick=()=>{
  const time=document.getElementById("jTime").value,start=+document.getElementById("jStart").value||0,result=+document.getElementById("jResult").value||0,note=document.getElementById("jNote").value.trim();
  state.trades.push({time,start,result,note});save();renderJournal();
  document.getElementById("jStart").value=start+result;document.getElementById("jResult").value=0;document.getElementById("jNote").value="";
};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Reset all saved tracker data?")){localStorage.removeItem(KEY);location.reload()}};
workflow();render();calc();
