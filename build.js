import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','data.js','format.js','icons.js','comparison.js','comparison-model.js','increment-model.js','hugol-source.js','hugol-model.js','hugo-source.js','hugo-model.js','updated-source.js','updated-model.js','production-source.js','production-increments-source.js','production-model.js','rebalance-source.js','rebalance-model.js','occupancy.js','hugol-ui.js','login.js']) await copyFile(file,`dist/${file}`);
await cp('assets','dist/assets',{recursive:true});
console.log('Site gerado em dist');
