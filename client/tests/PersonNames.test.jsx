import {it,expect} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {useState} from 'react';
it('styles whole names, preserves surrounding words and updates revealed text',()=>{
 function Example(){const [open,setOpen]=useState(false);return <div><p>ANU PATEL and Kushal Patel, Anushka and Kushali.</p><button onClick={()=>setOpen(true)}>Reveal</button>{open&&<p>{'With wishes, KUSHAL'}</p>}</div>}
 const {container}=render(<Example/>);
 expect([...container.querySelectorAll('.birthday-person-name')].map(n=>n.textContent)).toEqual(['ANU PATEL','Kushal Patel']);
 fireEvent.click(screen.getByRole('button',{name:'Reveal'}));
 expect([...container.querySelectorAll('.birthday-person-name')].map(n=>n.textContent)).toEqual(['ANU PATEL','Kushal Patel','KUSHAL']);
});
