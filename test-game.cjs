// Deterministic simulation checks. No browser, downloads or dependencies needed.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const nodes=new Map(),handlers={},choices=[{dataset:{choice:'0'}},{dataset:{choice:'1'}},{dataset:{choice:'2'}}];
const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
function node(id){if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){},remove(){}},getContext:()=>context,focus(){},addEventListener(){},textContent:'',innerHTML:''});return nodes.get(id);}
const sandbox={console,Math,Set,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},document:{getElementById:node,querySelectorAll:()=>choices,addEventListener:(k,f)=>handlers[k]=f},window:{addEventListener(){}}};
const source=readFileSync('game.js','utf8').replace(/\}\)\(\);\s*$/,`globalThis.test={newRun,update,draw,enter,interact,attack,throwBoom,hurt,pause,hit,keys,get state(){return {mode,rooms,room,player,drops,shots,boomerang,time,legacy};}};})();`);
vm.runInNewContext(readFileSync('audio.js','utf8'),sandbox);vm.runInNewContext(source,sandbox);const g=sandbox.test;
const tick=(n=1)=>{for(let i=0;i<n;i++)g.update(1/60);};
const press=(key,n)=>{g.keys.add(key);tick(n);g.keys.delete(key);};
g.newRun();assert.equal(g.state.rooms.length,12);g.draw();
press('z',110);assert.equal(g.state.room.id,1,'walking north enters combat');
const combat=g.state.room;press('s',25);assert.equal(g.state.room,combat,'combat seals doors');
for(const e of combat.enemies)g.hit(e,100);tick();assert.equal(combat.clear,true);assert.ok(g.state.player.money>=3);
press('s',30);assert.equal(g.state.room.id,0,'cleared doors reopen');
g.enter(combat);assert.equal(g.state.room.clear,true,'revisited combat stays cleared');assert.equal(g.state.room.enemies.length,0);
g.enter(g.state.rooms.find(r=>r.type==='treasure'));Object.assign(g.state.player,{x:480,y:300});g.interact();assert.equal(g.state.mode,'choice');choices[0].onclick();assert.equal(g.state.player.items.length,1);g.interact();assert.equal(g.state.mode,'play','chest cannot be reopened');
g.enter(g.state.rooms.find(r=>r.type==='shop'));Object.assign(g.state.player,{x:480,y:365,money:0});const dmg=g.state.player.damage;g.interact();assert.equal(g.state.player.damage,dmg,'cannot buy without money');g.state.player.money=30;g.interact();assert.equal(g.state.player.damage,dmg+1);assert.equal(g.state.player.money,14);g.interact();assert.equal(g.state.player.money,14,'sold item cannot be bought twice');
g.enter(g.state.rooms.find(r=>r.type==='ante'));Object.assign(g.state.player,{x:480,y:260,hp:1});g.interact();assert.equal(g.state.player.hp,g.state.player.max,'fountain heals');
Object.assign(g.state.player,{x:887,y:320,key:0});tick(30);press('d',2);assert.equal(g.state.room.type,'ante','boss needs key');
g.enter(g.state.rooms.find(r=>r.type==='key'));for(const e of g.state.room.enemies)g.hit(e,100);tick();assert.ok(g.state.drops.some(d=>d.type==='key'));Object.assign(g.state.player,{x:480,y:300});tick();assert.equal(g.state.player.key,1);
g.enter(g.state.rooms.find(r=>r.type==='ante'));Object.assign(g.state.player,{x:887,y:320});tick(65);press('d',2);assert.equal(g.state.room.type,'boss');assert.equal(g.state.player.key,0);
const boss=g.state.room.enemies[0];boss.hp=20;tick();assert.equal(boss.phase,1,'boss enrages below half health');g.draw();
g.throwBoom();assert.ok(g.state.boomerang);tick(200);assert.equal(g.state.boomerang,null,'boomerang comes back');
g.pause();const before=g.state.time;tick(100);assert.equal(g.state.time,before,'pause freezes simulation');g.pause();
g.hit(boss,100);tick();assert.equal(g.state.mode,'win');assert.equal(g.state.legacy.wins,1);
g.newRun();Object.assign(g.state.player,{hp:1,inv:0,dash:0});g.hurt();assert.equal(g.state.mode,'dead');g.newRun();assert.equal(g.state.mode,'play');assert.equal(g.state.player.hp,5);assert.equal(g.state.player.items.length,0);
// Every room is connected, even without entering the boss room.
const visited=new Set([0]),queue=[g.state.rooms[0]];while(queue.length){const r=queue.shift();for(const n of g.state.rooms)if(!visited.has(n.id)&&Math.abs(n.x-r.x)+Math.abs(n.y-r.y)===1){visited.add(n.id);queue.push(n);}}assert.equal(visited.size,12);
for(const r of g.state.rooms){g.enter(r);g.draw();}
// Charge warning must offer real reaction time and retain the announced aim.
g.newRun();g.enter(g.state.rooms.find(r=>r.type==='boss'));
const gentlerBoss=g.state.room.enemies[0];
assert.equal(gentlerBoss.max,54);
Object.assign(g.state.player,{x:800,y:450,inv:100});
Object.assign(gentlerBoss,{pattern:2,cool:0});tick();
assert.ok(gentlerBoss.windup>.9);assert.equal(gentlerBoss.charge,0);g.draw();
const warnedX=gentlerBoss.x,warnedY=gentlerBoss.y,aim=gentlerBoss.aim;
g.state.player.y=140;tick(40);
assert.equal(gentlerBoss.x,warnedX);assert.equal(gentlerBoss.y,warnedY);
assert.equal(gentlerBoss.aim,aim,'charge cannot track the player after warning');
assert.equal(gentlerBoss.charge,0,'warning lasts longer than two thirds of a second');
tick(20);assert.ok(gentlerBoss.charge>0);tick(42);
assert.ok(gentlerBoss.recover>1,'boss leaves a generous punish window');
const vulnerableHP=gentlerBoss.hp;g.hit(gentlerBoss,2,true);
assert.equal(gentlerBoss.hp,vulnerableHP-4);g.draw();
g.newRun();g.enter(g.state.rooms.find(r=>r.type==='boss'));
Object.assign(g.state.player,{x:800,y:450,inv:100});
Object.assign(g.state.room.enemies[0],{pattern:0,cool:0});tick();
assert.equal(g.state.shots.length,6,'first-phase radial pattern leaves wider gaps');
assert.ok(g.state.shots.every(s=>Math.hypot(s.vx,s.vy)<101));
console.log('PASS: 12 connected rooms, movement, sealed doors, room persistence, treasure, shop, fountain, boss key, boss phase, boomerang, pause, victory, death, restart, all room render paths.');
console.log('PASS: easier boss health, slower projectiles, charge telegraph with locked aim, recovery and double damage.');
