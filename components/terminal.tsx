"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gauge, Meter, RouteLine } from "@/components/instruments";
import { fmtBrl } from "@/components/ui";

export type FlightStatus = "scanning" | "checking" | "validating" | "candidate" | "rejected" | "live" | "cache" | "demo" | "gold";
const statusTone: Record<string, string> = { gold: "status-gold", live: "status-live", candidate: "status-candidate", validating: "status-validating", checking: "status-checking", scanning: "status-scanning", rejected: "status-rejected", cache: "status-cache", demo: "status-demo" };

export function GateStatusBadge({ status }: { status: string }) {
  return <span className={`status-chip ${statusTone[status] || "status-cache"}`}><i />{status}</span>;
}

const flights = [
  ["GRU", "LIS", "T4", "08:45", "live"], ["CGH", "EZE", "B7", "11:20", "validating"],
  ["VCP", "SCL", "A2", "13:10", "candidate"], ["GRU", "CDG", "T3", "18:35", "gold"],
  ["GRU", "FCO", "C9", "22:05", "cache"],
];

export function FlightRow({ row = flights[0] }: { row?: string[] }) {
  return <div className="flight-row"><span className="flight-time">{row[3]}</span><strong>{row[0]}</strong><span className="route-dash">→</span><strong>{row[1]}</strong><span className="gate">GATE {row[2]}</span><GateStatusBadge status={row[4]} /></div>;
}

export function DepartureBoard({ title = "next best departures", compact = false }: { title?: string; compact?: boolean }) {
  return <section className="terminal-panel overflow-hidden"><div className="panel-head"><span>{title}</span><span className="live-pulse">live intelligence</span></div><div>{flights.slice(0, compact ? 3 : 5).map((r, i) => <FlightRow key={i} row={r} />)}</div></section>;
}

const nodes = [{x:12,y:55,l:"GRU",hub:true},{x:18,y:69,l:"CGH",hub:true},{x:22,y:42,l:"VCP",hub:true},{x:53,y:27,l:"LIS"},{x:64,y:18,l:"CDG"},{x:72,y:38,l:"FCO"},{x:83,y:66,l:"EZE"},{x:55,y:76,l:"SCL"},{x:88,y:28,l:"MAD"}];
export function RouteCanvas({ mode = "idle", className = "" }: { mode?: "idle" | "searching" | "reveal"; className?: string }) {
  const targets = nodes.slice(3);
  return <div className={`route-canvas ${className}`} aria-label="Mapa abstrato de rotas">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs><linearGradient id="routeGlow"><stop stopColor="#3468ff"/><stop offset="1" stopColor="#b7ef42"/></linearGradient></defs>
      <g className="map-contours"><path d="M-5 28 Q20 5 48 19 T105 14"/><path d="M-4 72 Q26 52 48 68 T105 58"/><path d="M14 100 Q31 55 67 44 T92 -5"/></g>
      {targets.map((n,i)=><motion.path key={n.l} d={`M 12 55 Q ${(12+n.x)/2} ${22+i*5} ${n.x} ${n.y}`} fill="none" stroke={i===1&&mode==="reveal"?"#90c923":"url(#routeGlow)"} strokeWidth={i===1&&mode==="reveal"?0.7:0.25} strokeDasharray="2 2" initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:mode==="idle"?.25:.75}} transition={{duration:1.6,delay:i*.12,repeat:mode==="searching"?Infinity:0,repeatType:"reverse"}} />)}
      {nodes.map((n,i)=><g key={n.l}><motion.circle cx={n.x} cy={n.y} r={n.hub?1.4:.8} fill={n.hub?"#151a21":i===4&&mode==="reveal"?"#a3e635":"#fff"} stroke="#151a21" strokeWidth=".3" animate={mode==="searching"&&!n.hub?{r:[.7,1.6,.7]}:{}} transition={{duration:1.6,delay:i*.16,repeat:Infinity}}/><text x={n.x+2} y={n.y-2} className="node-label">{n.l}</text></g>)}
    </svg><div className="canvas-coordinates">23°33′S · LIVE ROUTE GRAPH · {mode.toUpperCase()}</div>
  </div>;
}

export function TerminalStatusBar() { return <div className="terminal-status"><span><b>FF/OPS</b> SÃO PAULO HUB</span><span><i className="dot-live"/> 03 SOURCES ACTIVE</span><span>LATENCY 184MS</span><span>UTC−03 · LIVE</span></div>; }
export function FlightTicker() { return <div className="ticker"><div>{[...flights,...flights].map((r,i)=><span key={i}><b>{r[0]}→{r[1]}</b> {r[4]} <em>R$ {1290+i*137}</em></span>)}</div></div>; }

export function CommandBar({ href="/search", label="me ache uma viagem imperdível saindo de são paulo" }: { href?: string; label?: string }) { return <Link href={href} className="command-bar group"><span className="command-key">⌘</span><span>{label}</span><span className="command-action">iniciar caça <b>↗</b></span></Link>; }

export function BoardingPassCard({ from="GRU", to="CDG", destination="Paris", price=2870, score=86, quality="live", className="" }: { from?:string;to?:string;destination?:string;price?:number;score?:number;quality?:string;className?:string }) {
 return <article className={`boarding-pass ${className}`}><div className="pass-main"><div className="pass-meta"><span>FF // CANDIDATE</span><GateStatusBadge status={quality}/></div><div className="pass-route"><strong>{from}</strong><div><i/><span>DIRECT ROUTE</span></div><strong>{to}</strong></div><div className="pass-destination">{destination}</div><div className="pass-foot"><span>09 SEP — 15 SEP</span><span>CHECKED 02:14 AGO</span></div></div><div className="pass-stub"><span>DEAL SCORE</span><b>{score}</b><small>{fmtBrl(price)}</small><div className="barcode"/></div></article>
}

export function AgentProgressLoader({ progress=68 }: { progress?: number }) { const stages=["varrendo hubs de são paulo","testando destinos abertos","comparando preço típico","validando fontes","calculando ouro"]; return <div className="terminal-panel agent-loader"><div className="loader-orbit"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="43"/><motion.circle cx="50" cy="50" r="43" initial={{pathLength:0}} animate={{pathLength:progress/100}} transition={{duration:1.5}}/><text x="50" y="55">{progress}%</text></svg></div><div className="loader-log"><div className="panel-head"><span>agent progress</span><GateStatusBadge status="scanning"/></div>{stages.map((s,i)=><div key={s} className={i<=Math.floor(progress/22)?"done":""}><span>0{i+1}</span>{s}<b>{i<=Math.floor(progress/22)?"DONE":"WAIT"}</b></div>)}</div></div> }

export function StrategyCard({ code, title, status, text }: {code:string;title:string;status:string;text:string}) { return <article className="strategy-card"><div className="pass-meta"><span>{code}</span><GateStatusBadge status={status}/></div><h3>{title}</h3><p>{text}</p><div className="strategy-line"><i/><i/><i/></div></article> }
export function MetricPanel({ label, value, note, tone="blue" }: {label:string;value:string;note:string;tone?:string}) { return <div className={`metric-panel metric-${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
export { Gauge as DealScoreGauge, Meter as ConfidenceMeter, RouteLine as RouteTimeline };

// Semantic wrappers keep the visual language reusable across product surfaces.
export const CandidateCard = BoardingPassCard;
export const LuckyRevealCard = BoardingPassCard;
export const GoldDepartureCard = BoardingPassCard;
export const AirportNodeMap = RouteCanvas;
export const RouteMapPanel = RouteCanvas;
export function SourceBadge({ source, state="live" }: {source:string;state?:string}) { return <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[.12em] text-ink"><i className="h-1.5 w-1.5 rounded-full bg-accent-blue"/>{source}<GateStatusBadge status={state}/></span> }
export function DataQualityBadge({ quality }: {quality:string}) { return <GateStatusBadge status={quality}/> }
export function RiskMeter({ value=28 }: {value?:number}) { return <Meter value={value} label={`risk · ${value}%`} tone={value>65?"bad":value>35?"warn":"good"}/> }
export function ProofPanel({ sources=[] }: {sources?:string[]}) { return <div className="terminal-panel"><div className="panel-head"><span>proof / validation chain</span><GateStatusBadge status="validating"/></div><div className="flex flex-wrap gap-2 p-5">{(sources.length?sources:["baseline","live fare","route engine"]).map(s=><SourceBadge key={s} source={s}/>)}</div></div> }
export function SplitFlapText({ children }: {children:string}) { return <span className="inline-block bg-ink px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-accent-lime shadow-[2px_0_0_#fff,4px_0_0_#151a21]">{children}</span> }
