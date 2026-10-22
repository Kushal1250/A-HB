import './person-name.css';
export default function PersonName({children}){return <span className="person-name">{children}</span>;}
export function NameText({children,names=['ANU PATEL','KUSHAL PATEL','ANU','KUSHAL']}){
 if(typeof children!=='string')return children;
 const unique=[...new Set(names.filter(Boolean).flatMap(n=>[n,n.trim().split(/\s+/)[0]]))].sort((a,b)=>b.length-a.length);
 if(!unique.length)return children;
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp(`\\b(${unique.map(escape).join('|')})\\b`,'gi');
 const match=new RegExp(`^(?:${unique.map(escape).join('|')})$`,'i');
 return children.split(pattern).map((part,i)=>match.test(part)?<PersonName key={i}>{part}</PersonName>:part);
}
