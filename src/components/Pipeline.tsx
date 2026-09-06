import { useState } from 'react'
import { ChevronRight, Cpu, Database, Map, Satellite, Sparkles } from 'lucide-react'
import { pipeline } from '../data/mock'
const icons=[Satellite,Database,Map,Cpu,Cpu,Sparkles,Map,Map,Sparkles]
export default function Pipeline(){
 const [active,setActive]=useState(0)
 return <div className="pipeline-card"><div className="section-top"><div><div className="kicker">MODEL INSIGHTS</div><h2>AI Nowcasting Engine</h2></div><span className="simulation-chip">PROPOSED ARCHITECTURE</span></div>
   <div className="pipeline-scroll">{pipeline.map(([title,desc],i)=>{const I=icons[i];return <button key={title} className={`pipeline-node ${active===i?'active':''}`} onClick={()=>setActive(i)}><I size={17}/><span>{title}</span>{i<pipeline.length-1&&<ChevronRight className="pipeline-arrow" size={15}/>}</button>})}</div>
   <div className="pipeline-detail"><div className="node-index">0{active+1}</div><div><h3>{pipeline[active][0]}</h3><p>{pipeline[active][1]}</p></div></div>
 </div>
}
