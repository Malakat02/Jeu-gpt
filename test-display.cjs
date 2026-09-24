const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('display.js','utf8');let saved='1.25',applied;
const boot=()=>{const env={document:{documentElement:{style:{setProperty:(name,value)=>{assert.equal(name,'--ui-scale');applied=value;}}}},localStorage:{getItem:()=>saved,setItem:(key,value)=>saved=value}};vm.runInNewContext(code,env);return env.ForestDisplay;};
let display=boot();assert.equal(applied,1.25);display.apply(1.4);assert.equal(boot().scale,1.4);display.apply(9);assert.equal(applied,1.5);display.apply(.1);assert.equal(applied,.8);display.apply('invalid');assert.equal(applied,1);
vm.runInNewContext(code,{document:{documentElement:{style:{setProperty(){}}}},localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
console.log('PASS: UI scale persists, stays bounded and works when storage is unavailable.');
