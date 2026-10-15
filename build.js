import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','data.js','format.js','icons.js','comparison.js','hugol-source.js','hugol-model.js','hugol-ui.js','login.js']) await copyFile(file,`dist/${file}`);
await cp('assets','dist/assets',{recursive:true});
console.log('Site gerado em dist');
