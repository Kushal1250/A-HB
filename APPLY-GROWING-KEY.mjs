import {readFile,writeFile,mkdir,copyFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const settings={key:'Growing Key',label:'Turn the Growing Key',instruction:'Choose the Growing Key, then turn it to open your garden of wishes.',unlock:'turn'};
const read=rel=>readFile(path.join(root,rel),'utf8');
async function main(){
 const sourcePath='client/src/journeyState.js',defaultsPath='shared/journey.js';
 const source=await read(sourcePath),defaults=await read(defaultsPath);
 const previous='return index===0||index>0&&unlocked.includes(chapters[index-1].id);';
 const replacement="return (id==='wishes'&&index>=0)||index===0||index>0&&unlocked.includes(chapters[index-1].id);";
 if(!source.includes(previous)&&!source.includes(replacement))throw Error('This project has a different unlock function. No files were changed.');
 const definition=/^([ \t]*)\['wishes',[^\n]+$/m;
 if(!definition.test(defaults))throw Error('The growing wishes definition was not found. No files were changed.');
 const newDefinition="  ['wishes', 'The growing wishes', 'Growing Key', 'Turn the Growing Key', 'Choose the Growing Key, then turn it to open your garden of wishes.', 'turn'],";
 const changes=[{rel:sourcePath,before:source,after:source.replace(previous,replacement)},{rel:defaultsPath,before:defaults,after:defaults.replace(definition,newDefinition)}];
 try{
  const before=await read('data/birthday.json'),state=JSON.parse(before);
  for(const snapshot of ['draft','published']){
   const chapters=state[snapshot]?.journey?.chapters;
   if(chapters){const wishes=chapters.find(ch=>ch.id==='wishes');if(!wishes)throw Error('Missing wishes chapter in '+snapshot+'. No files were changed.');Object.assign(wishes,settings);}
  }
  if(typeof state.revision==='number')state.revision++;
  changes.push({rel:'data/birthday.json',before,after:JSON.stringify(state,null,2)+'\n'});
 }catch(e){if(e.code!=='ENOENT')throw e;}
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const backup=path.join(root,'data','backups','growing-key-'+stamp);
 for(const item of changes){const dest=path.join(backup,item.rel);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(root,item.rel),dest);}
 const written=[];
 try{
  for(const item of changes){const dest=path.join(root,item.rel);await writeFile(dest+'.growing-key.tmp',item.after);await rename(dest+'.growing-key.tmp',dest);written.push(item);}
 }catch(e){for(const item of written)await writeFile(path.join(root,item.rel),item.before);throw e;}
 console.log('\nUpdated chapter 04: Choose the Growing Key -> Turn the Growing Key.');
 console.log('The previous chapter is no longer required for chapter 04.');
 console.log('Songs, photos, accounts and other chapter settings are preserved.');
 console.log('Backup: '+backup+'\nRun START-LOCAL.cmd, then refresh the page with Ctrl+F5.');
}
main().catch(e=>{console.error('\nUpdate failed: '+e.message+'\nPut this script in the project root beside package.json and stop the server first.');process.exitCode=1;});
