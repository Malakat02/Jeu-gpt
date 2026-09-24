// Simulation tests run the actual engine with a minimal DOM and Canvas adapter.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map(),handlers={},choices=[0,1,2].map(i=>({dataset:{choice:String(i)}}));
let seed=8675309;
const seededMath=Object.create(Math);seededMath.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),fillRect(...args){assert.ok(args.every(Number.isFinite),'render geometry is finite');}}, {get:(o,k)=>k in o?o[k]:(()=>{})});
function node(id){if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){},remove(){}},setAttribute(k,v){this[k]=v;},getContext:()=>ctx,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:128,height:128}),focus(){},addEventListener(k,fn){handlers[id+':'+k]=fn;},textContent:'',innerHTML:''});return nodes.get(id);}
const sandbox={console,Math:seededMath,Set,Map,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},document:{body:node('body'),getElementById:node,querySelectorAll:()=>choices,addEventListener:(k,f)=>handlers[k]=f},window:{addEventListener:(k,f)=>handlers['window:'+k]=f}};
for(const file of ['content.js','combat.js','audio.js','renderer.js','touch.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),sandbox);
const source=fs.readFileSync('game.js','utf8').replace(/\}\)\(\);\s*$/,`globalThis.test={g,C,Combat,renderer,keys,legacy,newRun,loadFloor,enter,enemy,attack,beginAttack,releaseAttack,updateAttack,updateEnemies,updateProjectiles,resolveDeaths,collectDrops,update,interact,chooseReward,hit,hurt,pause,addRelic,equipWeapon,grantBlessing,weaponCooldown,dashCooldown,updateHUD,blocked,tryExit,throwBoom,musicTheme,soundtrack,touchControls,canTouchInteract};})();`);
vm.runInNewContext(source,sandbox);
const t=sandbox.test,g=t.g;
function tick(n=1){for(let i=0;i<n;i++)t.update(1/60);}
function press(key,n){t.keys.add(key);tick(n);t.keys.delete(key);}
function enterType(type){t.enter(g.rooms.find(r=>r.type===type));}
function killRoom(){for(const e of g.room.enemies)t.hit(e,10000);t.resolveDeaths();}
function standByChest(){Object.assign(g.player,{x:g.room.width/2,y:g.room.height/2-35});}
function descend(){Object.assign(g.player,{x:g.room.width/2,y:g.room.height*.72});t.interact();}
function target(x,y){return {...t.enemy('slime',x,y),hp:100,max:100,radius:10};}
function startCombat(weapon='sword'){t.newRun();t.equipWeapon(weapon);Object.assign(g.player,{x:400,y:320,dir:0,inv:100});g.room.enemies=[];g.room.objects=[];}

// Every floor is connected, with a reachable key before its locked boss.
for(let level=0;level<3;level++){
  t.newRun();t.loadFloor(level);assert.ok(level===2?g.rooms.length===3:level===0?g.rooms.length>=11&&g.rooms.length<=13:g.rooms.length>=18&&g.rooms.length<=22);
  const visited=new Set([0]),queue=[g.rooms[0]];
  while(queue.length){const r=queue.shift();for(const n of g.rooms)if(!visited.has(n.id)&&g.connected(r,n)&&n.type!=='boss'){visited.add(n.id);queue.push(n);}}
  assert.equal(visited.size,g.rooms.length-(level===2?1:2),'all ordinary non-boss rooms reachable without the boss or secret');
  if(level<2)assert.ok(g.rooms.some(r=>r.type==='key'&&visited.has(r.id)));
  const boss=g.rooms.find(r=>r.type==='boss');assert.ok(g.rooms.some(r=>visited.has(r.id)&&g.connected(r,boss)));
  for(const r of g.rooms){t.enter(r);for(const e of r.enemies)assert.equal(t.blocked(e.x,e.y,e.radius),false,'enemies spawn outside obstacles');t.renderer.draw(g);t.renderer.drawMap(g);}
}
t.newRun();t.loadFloor(1);assert.equal(g.rooms.filter(r=>r.type==='treasure').length,1);
t.loadFloor(2);assert.deepEqual(Array.from(g.rooms,r=>r.type),['start','ante','boss']);assert.equal(g.rooms[2].width,1440);assert.equal(g.rooms[2].height,960);

// Initial-floor movement, sealed doors, persistence, key and economy.
t.newRun();const initialY=g.player.y;press('z',10);assert.ok(g.player.y<initialY);
function exitToward(next){const dx=next.x-g.room.x,dy=next.y-g.room.y;Object.assign(g.player,{x:dx<0?71:dx>0?889:480,y:dy<0?88:dy>0?552:320});g.transition=0;t.tryExit(dx,dy);}
const combatRoom=g.rooms.find(r=>r.type==='fight'),returnRoom=g.rooms.find(r=>g.connected(combatRoom,r)&&r.type!=='boss');t.enter(combatRoom);exitToward(returnRoom);assert.equal(g.room,combatRoom);
killRoom();assert.ok(g.room.clear);exitToward(returnRoom);assert.equal(g.room,returnRoom);t.enter(combatRoom);assert.equal(g.room.enemies.length,0);
enterType('treasure');Object.assign(g.player,{x:480,y:285});t.interact();assert.equal(g.mode,'choice');t.chooseReward(0);assert.equal(g.player.items.length,1);t.interact();assert.equal(g.mode,'play');
enterType('shop');Object.assign(g.player,{x:480,y:350,money:0});let items=g.player.items.length;t.interact();assert.equal(g.player.items.length,items);g.player.money=50;t.interact();assert.equal(g.player.money,32);assert.equal(g.player.items.length,items+1);t.interact();assert.equal(g.player.money,32);
enterType('ante');Object.assign(g.player,{x:480,y:256,hp:1});t.interact();assert.equal(g.player.hp,g.player.max);g.player.hp=1;t.interact();assert.equal(g.player.hp,1,'fountain has a single use');
const gateBoss=g.rooms.find(r=>r.type==='boss'),gateRoom=g.rooms.find(r=>g.connected(r,gateBoss));t.enter(gateRoom);killRoom();g.player.key=0;exitToward(gateBoss);assert.equal(g.room,gateRoom);
enterType('key');killRoom();Object.assign(g.player,{x:480,y:300});t.collectDrops();assert.equal(g.player.key,1);t.collectDrops();assert.equal(g.player.key,1);
t.enter(gateRoom);exitToward(gateBoss);assert.equal(g.room.type,'boss');assert.equal(g.player.key,0);

// Real sword geometry: hits occur during the visible sweep, once per target.
startCombat();const front=target(470,320),back=target(350,320),outside=target(510,320);g.room.enemies=[front,back,outside];
t.attack();assert.equal(front.hp,100,'no instantaneous invisible sector hit');
t.updateAttack(.115);assert.equal(front.hp,99);t.updateAttack(.115);assert.equal(front.hp,99,'one hit per swing');assert.equal(back.hp,100);assert.equal(outside.hp,100);
startCombat('greatsword');const far=target(515,320);g.room.enemies=[far];t.attack();t.updateAttack(.34);assert.ok(far.hp<100,'two-handed blade reaches beyond starter sword');assert.ok(t.weaponCooldown()>.36);
startCombat('flail');const aligned=target(615,320),offAxis=target(570,385);g.room.enemies=[aligned,offAxis];t.attack();t.updateAttack(.45);assert.equal(aligned.hp,95.4);assert.equal(offAxis.hp,100);t.updateAttack(.45);assert.equal(aligned.hp,95.4,'returning ball cannot damage twice');assert.ok(t.weaponCooldown()>1);
startCombat('flail');g.room.objects=[{x:490,y:290,w:45,h:60}];const behindWall=target(610,320);g.room.enemies=[behindWall];t.attack();assert.ok(g.attack.reach<100);t.updateAttack(.9);assert.equal(behindWall.hp,100);

// Rendering poses define the precise collision shape, including the ball head only.
startCombat();t.attack();const pose=t.Combat.pose(g.attack,g.player,.115);assert.equal(pose.b.x,478);assert.equal(pose.b.y,320);assert.equal(t.Combat.touches(pose,{x:483,y:320,radius:1}),false);assert.equal(t.Combat.touches(pose,{x:477,y:320,radius:1}),true);
startCombat('flail');t.attack();const ball=t.Combat.pose(g.attack,g.player,.45);assert.equal(t.Combat.touches(ball,{x:450,y:320,radius:10}),false,'chain itself does not hurt');

// Master Sword: a ray requires full hearts; a real hold/release spins 360 degrees.
startCombat('master');t.attack();assert.equal(g.beams.length,1);t.updateAttack(.23);g.player.attackCD=0;g.player.hp-=.5;t.attack();assert.equal(g.beams.length,1,'half a missing heart already disables the ray');
startCombat('master');g.player.hp=4;const rear=target(320,320);g.room.enemies=[rear];t.beginAttack();tick(46);t.releaseAttack();assert.equal(g.attack.kind,'spin');t.updateAttack(.48);assert.ok(rear.hp<100,'spin damages behind the hero');
startCombat('master');t.beginAttack();tick(8);t.releaseAttack();assert.notEqual(g.attack?.kind,'spin','short press is not a charged spin');
startCombat('master');const beamTarget=target(570,320);g.room.enemies=[beamTarget];t.attack();t.updateProjectiles(.3);assert.ok(beamTarget.hp<100,'beam applies damage along its path');

// Relics all work, can stack, and cadence changes the animation as well as cooldown.
assert.equal(t.C.relics.length,18);
for(const relic of t.C.relics){t.newRun();const before={...g.player};t.addRelic(relic);assert.ok(Object.keys(before).filter(k=>typeof before[k]==='number'&&before[k]!==g.player[k]).length>=2,`${relic.id} improves several statistics`);}
startCombat();const beforeCD=t.weaponCooldown();t.addRelic(t.C.relics.find(r=>r.id==='feather'));t.attack();assert.ok(t.weaponCooldown()<beforeCD);assert.ok(g.attack.duration<.23);
const beforeDash=t.dashCooldown();t.addRelic(t.C.relics.find(r=>r.id==='sand'));assert.ok(t.dashCooldown()<beforeDash);

// Force, Courage and Sagesse have distinct, attempt-scoped effects.
startCombat();t.grantBlessing('force');t.attack();assert.equal(g.attack.damage,1.75);t.grantBlessing('wisdom');assert.equal(g.player.wisdom,false,'only one blessing can be selected');
t.newRun();t.grantBlessing('wisdom');g.player.inv=0;t.hurt();assert.equal(g.player.hp,4.5);assert.ok(node('health').innerHTML.includes('armored'));assert.ok(node('health').innerHTML.includes('--fill:50%'));
g.player.inv=0;g.player.dash=.1;t.hurt();assert.equal(g.player.hp,4.5,'dash still avoids damage');
t.newRun();t.grantBlessing('courage');Object.assign(g.player,{hp:1,inv:0});t.hurt();assert.equal(g.mode,'play');assert.equal(g.player.hp,2.5);assert.equal(g.player.revive,0);Object.assign(g.player,{hp:1,inv:0});t.hurt();assert.equal(g.mode,'dead');
t.newRun();assert.equal(g.player.blessing,null);assert.equal(g.player.revive,0);assert.equal(g.player.power,1);assert.equal(g.player.wisdom,false);

// The eased first boss keeps its warning, fixed aim, and punish window.
t.newRun();enterType('boss');const firstBoss=g.room.enemies[0];assert.equal(firstBoss.max,54);Object.assign(g.player,{x:800,y:450,inv:100});Object.assign(firstBoss,{pattern:2,cool:0});tick();assert.ok(firstBoss.windup>.9);
const aim=firstBoss.aim,x=firstBoss.x,y=firstBoss.y;g.player.y=140;tick(40);assert.equal(firstBoss.x,x);assert.equal(firstBoss.y,y);assert.equal(firstBoss.aim,aim);tick(60);assert.ok(firstBoss.recover>0);const hp=firstBoss.hp;t.hit(firstBoss,2);assert.equal(firstBoss.hp,hp-4);
t.newRun();enterType('boss');Object.assign(g.player,{x:800,y:450,inv:100});Object.assign(g.room.enemies[0],{pattern:0,cool:0});tick();assert.equal(g.shots.length,0,'seed volley is telegraphed');tick(52);assert.equal(g.shots.length,6);assert.ok(g.shots.every(s=>Math.hypot(s.vx,s.vy)<111));

// Every creature locks its aim while visibly preparing its attack.
for(const type of ['slime','bat','spitter','knight']){
  startCombat();const e=t.enemy(type,600,320);e.cool=0;g.room.enemies=[e];tick();
  assert.ok(e.windup>=.5);const aim=e.aim,x=e.x,y=e.y;g.player.y=500;tick(20);
  assert.equal(e.aim,aim);assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(g.shots.length,0);
  t.renderer.draw(g);tick(30);assert.ok(type==='spitter'?g.shots.length>0:e.charge>0||e.recover>0);
}
const kits=[];
for(let level=0;level<3;level++){
  const actions=[];
  for(let pattern=0;pattern<3;pattern++){
    t.newRun();t.loadFloor(level);enterType('boss');g.player.inv=100;
    const e=g.room.enemies[0];Object.assign(e,{cool:0,pattern});tick();actions.push(e.action);
    assert.ok(e.windup>=.6);t.renderer.draw(g);
    if(level>0)assert.ok(e.windup<=.9,'later bosses prepare attacks faster');
  }
  kits.push(actions);
}
assert.deepEqual(kits,[['seeds','roots','charge'],['volley','hunt','thorns'],['eruption','spiral','rootsweep']]);
const attacks=[];
for(let level=0;level<3;level++){
  t.newRun();t.loadFloor(level);enterType('boss');g.player.inv=100;tick(1200);attacks.push(g.room.enemies[0].pattern);
}
assert.ok(attacks[1]>attacks[0]&&attacks[2]>attacks[0],'later bosses chain more attacks in twenty seconds');
for(const stage of [1,2]){
  t.newRun();t.loadFloor(2);enterType('boss');g.player.inv=100;const boss=g.room.enemies[0];Object.assign(boss,{stage,pattern:1,cool:0});tick();
  const windup=boss.windup;tick(Math.ceil(windup*60)+1);assert.equal(g.shots.length,stage===1?12:18,'second phase intensifies projectile crowns');
}
t.newRun();t.loadFloor(2);enterType('boss');assert.equal(t.blocked(720,480),false,'central tree never blocks movement');

// Loot is optional and a fully explored campaign cannot produce hundreds of rubies.
let emptyKills=0,totalKills=0,income=0;
for(let run=0;run<20;run++){
  t.newRun();g.player.money=0;let loot=0;
  for(let level=0;level<2;level++){
    t.loadFloor(level);
    for(const r of g.rooms.filter(r=>['fight','key'].includes(r.type))){
      t.enter(r);const count=r.enemies.length;totalKills+=count;killRoom();
      emptyKills+=Math.max(0,count-g.drops.filter(d=>d.type!=='key').length);
      loot+=g.drops.filter(d=>d.type==='rupee').reduce((sum,d)=>sum+d.value,0);
    }
  }
  income+=g.player.money+loot;assert.ok(g.player.money+loot<100);
}
assert.ok(emptyKills/totalKills>.35);assert.ok(income/20>35&&income/20<80);

// Complete every weapon/blessing combination through reward chests and both descents.
for(const weapon of ['flail','greatsword','master'])for(const blessing of ['force','courage','wisdom']){
  t.newRun();enterType('boss');killRoom();assert.equal(g.mode,'play','first boss is not the ending');descend();assert.equal(g.level,0,'reward must be collected first');
  standByChest();t.interact();assert.equal(g.mode,'choice');assert.equal((node('overlay').innerHTML.match(/data-choice=/g)||[]).length,3);t.chooseReward(['flail','greatsword','master'].indexOf(weapon));assert.equal(g.player.weapon,weapon);assert.ok(g.room.rewardTaken);
  const gear=g.player;descend();assert.equal(g.level,1);assert.equal(g.player,gear,'equipment persists between floors');assert.equal(g.player.key,0);
  enterType('boss');assert.equal(g.room.enemies[0].max,120);killRoom();standByChest();t.interact();t.chooseReward(t.C.blessings.findIndex(b=>b.id===blessing));assert.equal(g.player.blessing,blessing);descend();assert.equal(g.level,2);assert.equal(g.rooms.length,3);
  enterType('ante');Object.assign(g.player,{x:480,y:256,hp:1});t.interact();assert.equal(g.player.hp,g.player.max);
  Object.assign(g.player,{x:480,y:80});g.transition=0;t.tryExit(0,-1);assert.equal(g.room.type,'boss','final boss needs no key');assert.equal(g.player.x,720);assert.equal(g.player.y,874);
  const finalBoss=g.room.enemies[0],count=g.kills;assert.equal(finalBoss.hp,180);t.hit(finalBoss,10000);t.resolveDeaths();assert.equal(finalBoss.stage,2);assert.equal(finalBoss.hp,220);assert.equal(finalBoss.max,220);assert.equal(g.kills,count);assert.equal(g.room.clear,false);assert.equal(g.mode,'play');
  t.hit(finalBoss,10000);assert.equal(finalBoss.hp,220,'second phase cannot be skipped during transformation');t.renderer.draw(g);finalBoss.transform=0;t.hit(finalBoss,10000);t.resolveDeaths();assert.ok(g.room.clear);assert.equal(g.mode,'play','final treasure remains to collect');standByChest();t.interact();assert.equal(g.mode,'win');assert.ok(g.player.items.some(i=>i.id==='dawn'));
}

// Pause freezes simulation and cancels a pending charge safely.
startCombat('master');t.beginAttack();tick(45);t.pause();const pausedAt=g.time;tick(90);assert.equal(g.time,pausedAt);assert.equal(g.player.holding,false);t.pause();t.releaseAttack();assert.notEqual(g.attack?.kind,'spin');
t.newRun();t.throwBoom();tick(200);assert.equal(g.boomerang,null);
// Anticipation is silent, and only actual shots/lunges play quiet, distinct effects.
// Touch controls feed the actual movement/combat engine and choose interaction by distance.
function touchEvent(id){return {pointerId:id,pointerType:'touch',clientX:128,clientY:64,preventDefault(){}};}
startCombat();const touchX=g.player.x;handlers.pointerdown(touchEvent(91));tick(2);assert.equal(g.player.x,touchX,'floating touch starts neutral');handlers['touch-stick:pointermove']({...touchEvent(91),clientX:200});tick(10);assert.ok(g.player.x>touchX);handlers['touch-action:pointerdown'](touchEvent(92));assert.ok(g.player.holding);handlers['touch-stick:pointerup'](touchEvent(91));assert.ok(g.player.holding);handlers['touch-action:pointerup'](touchEvent(92));assert.equal(g.player.holding,false);
startCombat('master');handlers['touch-action:pointerdown'](touchEvent(93));tick(46);handlers['touch-action:pointerup'](touchEvent(93));assert.equal(g.attack.kind,'spin');
startCombat();enterType('treasure');Object.assign(g.player,{x:480,y:285});handlers['touch-action:pointerdown'](touchEvent(94));assert.equal(g.mode,'choice');assert.equal(g.player.holding,false);t.chooseReward(0);assert.ok(g.room.opened);assert.equal(t.canTouchInteract(),false);
startCombat();handlers['touch-dodge:pointerdown'](touchEvent(95));tick();assert.ok(g.player.dash>0,'touch dodge also works from rest');t.pause();assert.equal(t.touchControls.x,0);assert.equal(t.touchControls.active,false);
const played=[],originalPlay=t.soundtrack.play;t.soundtrack.play=name=>played.push(name);
startCombat();const caster=t.enemy('spitter',650,320);caster.cool=0;g.room.enemies=[caster];played.length=0;tick(20);assert.deepEqual(played,[]);tick(20);assert.ok(played.includes('enemyShot'));assert.ok(!played.includes('warning'));
startCombat();const charger=t.enemy('knight',650,320);charger.cool=0;g.room.enemies=[charger];played.length=0;tick(30);assert.deepEqual(played,[]);tick(20);assert.ok(played.includes('enemyCharge'));t.soundtrack.play=originalPlay;
for(let level=0;level<3;level++){t.newRun();t.loadFloor(level);enterType('boss');assert.equal(t.musicTheme(),level===2?'finalBoss':'boss');g.room.clear=true;assert.notEqual(t.musicTheme(),'finalBoss');}
// Attack previews disappear, but area warnings still render at the damage radius.
let arcs=0,lines=0;ctx.arc=()=>arcs++;ctx.lineTo=()=>lines++;ctx.strokeRect=()=>lines++;
startCombat();g.room.enemies=[{...t.enemy('boss',500,200),action:'charge',windup:.4}];arcs=0;lines=0;t.renderer.warnings(g);assert.equal(arcs+lines,0);
g.hazards=[{x:300,y:300,radius:55,delay:.9,life:.35}];t.renderer.warnings(g);assert.equal(arcs,1);
for(const kit of kits){const poses=kit.map(action=>JSON.stringify(t.renderer.bossPose({action,windup:.2,windupMax:1,aim:.2})));assert.equal(new Set(poses).size,3,'each boss attack uses a distinct pose');}
const drawn=[],savedRect=t.renderer.rect;t.renderer.rect=(...args)=>drawn.push(args);
startCombat('master');t.renderer.drawWeapon(g);assert.ok(drawn.some(r=>r[0]>=50&&r[4]==='#e1fff5'),'Master Sword tip remains visible at rest');assert.ok(drawn.some(r=>r[4]==='#7164a4'),'purple guard is visible at rest');t.renderer.rect=savedRect;
// Walking follows actual displacement, and stops against scenery or at rest.
startCombat();press('d',8);assert.ok(g.player.moving&&g.player.walkCycle>0);const gait=g.player.walkCycle;tick();assert.equal(g.player.moving,false);assert.equal(g.player.walkCycle,gait);
g.room.objects=[{x:g.player.x+12,y:g.player.y-30,w:50,h:60}];press('d',4);assert.equal(g.player.moving,false);assert.equal(g.player.walkCycle,gait);
for(const weapon of ['sword','master','greatsword','flail'])for(const dir of [0,Math.PI/2,Math.PI,-Math.PI/2]){startCombat(weapon);g.player.dir=dir;t.renderer.draw(g);t.attack();tick(4);t.renderer.draw(g);}
console.log('PASS: quiet anticipation, distinct launch sounds and boss poses, preserved AOE warnings, final boss music routing and idle Master Sword.');
// Every equipped weapon opens each wall direction in exactly three separate blows.
for(const weapon of ['sword','master','greatsword','flail'])for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  startCombat(weapon);const parent=g.rooms[0],secret=g.rooms.find(r=>r.type==='secret');
  Object.assign(parent,{x:0,y:0,links:[secret.id],clear:true});Object.assign(secret,{x:dx,y:dy,links:[parent.id]});g.rooms=[parent,secret];g.room=parent;
  const entrance=g.secretEntrance();Object.assign(g.player,{x:entrance.x-dx*40,y:entrance.y-dy*40,dir:Math.atan2(dy,dx)});
  assert.equal(g.neighbor(dx,dy),undefined);
  for(let blow=1;blow<=3;blow++){
    g.player.attackCD=0;t.attack();for(let step=0;step<110&&g.attack;step++)t.updateAttack(.01);
    assert.equal(secret.entranceHits,blow,weapon+' counts one impact per swing');assert.equal(secret.entranceOpen,blow===3);
  }
  assert.equal(g.neighbor(dx,dy),secret);assert.equal(secret.visited,false);
  let mapped=0;const stroke=ctx.strokeRect;ctx.strokeRect=()=>mapped++;t.renderer.drawMap(g);ctx.strokeRect=stroke;assert.equal(mapped,1,'unvisited secret remains absent even after breaking the wall');
  g.transition=0;g.player.x=entrance.x-dx*4;g.player.y=entrance.y-dy*4;t.tryExit(dx,dy);assert.equal(g.room,secret);assert.equal(secret.visited,true);assert.equal(g.neighbor(-dx,-dy),parent);
  assert.equal(secret.drops.length,2);t.enter(parent);t.enter(secret);assert.equal(secret.drops.length,2,'secret rewards cannot respawn');
}
console.log('PASS: randomized connected floors, secret walls in all four directions with every weapon, three-hit opening, hidden map and persistent rewards.');
console.log('PASS: visible blade collision, large sword reach, linear flail, obstacles, charged spin and full-health rays.');
console.log('PASS: 18 relics, Force/Courage/Sagesse, half hearts, one resurrection and attempt resets.');
console.log('PASS: all 9 weapon/blessing campaigns, boss rewards, equipment persistence and full final-phase health reset.');
console.log('PASS: manual weapon selection, four creature telegraphs, three distinct boss kits, aggression and optional loot across 20 campaigns.');
