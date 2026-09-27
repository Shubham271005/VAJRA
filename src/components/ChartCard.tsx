import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

type Props={name:string,value:string|number,unit:string,trend:string,status:string,series:number[]}
export default function ChartCard({name,value,unit,trend,status,series}:Props){
 const data=series.map((v,i)=>({i,v}))
 const down=trend.includes('-')||status==='DECREASING'||status==='COOLING'
 return <div className="signal-card">
   <div className="signal-head"><span className="eyebrow">{name}</span><span className={`status-pill ${down?'amber':'green'}`}>{status}</span></div>
   <div className="signal-value">{value} <small>{unit}</small></div>
   <div className="signal-meta">{down?<ArrowDownRight size={14}/>:<ArrowUpRight size={14}/>} {trend} <span>vs recent window</span></div>
   <div className="mini-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><YAxis hide domain={['dataMin','dataMax']}/><Tooltip contentStyle={{background:'#0b1628',border:'1px solid #23334d',borderRadius:8,color:'#e2e8f0'}}/><Line type="monotone" dataKey="v" dot={false} strokeWidth={2.5} stroke={down?'#f59e0b':'#22d3ee'} activeDot={{r:3}}/></LineChart></ResponsiveContainer></div>
 </div>
}
