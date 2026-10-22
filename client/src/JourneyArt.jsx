export function A({name,as:Tag='div',children,...props}) {return <Tag data-anim={name} {...props}>{children}</Tag>;}
export function KeyArt({index=0,...props}) {
  return <svg viewBox="0 0 100 48" fill="none" aria-hidden="true" {...props}>
    {index%3===0?<path d="M22 5L37 20L22 35L7 20Z" stroke="currentColor" strokeWidth="3"/>:index%3===1?<circle cx="22" cy="20" r="14" stroke="currentColor" strokeWidth="3"/>:<path d="M22 5Q48 20 22 35Q-4 20 22 5Z" stroke="currentColor" strokeWidth="3"/>}
    <path d={`M36 20H90M${65+index%4*3} 20V34M82 20V${28+index%3*4}`} stroke="currentColor" strokeWidth="3"/>
    <circle cx="22" cy="20" r={3+index%4} stroke="currentColor" strokeWidth="2"/>
  </svg>;
}
export function LockArt({open}) {return <svg viewBox="0 0 60 70" aria-hidden="true"><path data-anim={open?'lock-release':undefined} d="M18 32V19a12 12 0 0 1 24 0v13" fill="none" stroke="currentColor" strokeWidth="3"/><rect x="10" y="30" width="40" height="32" rx="7" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="30" cy="43" r="3" fill="currentColor"/><path d="M30 45v8" stroke="currentColor" strokeWidth="2"/></svg>;}
