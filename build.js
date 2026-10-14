import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','data.js','format.js']) await copyFile(file,`dist/${file}`);
console.log('Site gerado em dist');
