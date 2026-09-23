(() => {
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('game');
  const C=ForestContent,Combat=ForestCombat,soundtrack=new ForestAudio(),renderer=new ForestRenderer(canvas,$('map'));
  const keys=new Set(),TAU=Math.PI*2,rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let last=0,pointerHeld=false,pendingChoice=null,touchControls=null,touchDash=false,mobileView=null,touchLayout=null,layoutPreviousMode=null;
  let legacy={deaths:0,wins:0};
  try{const saved=JSON.parse(localStorage.getItem('forest-echoes'));if(saved&&Number.isFinite(saved.deaths)&&Number.isFinite(saved.wins))legacy=saved;}catch{}
  const g={mode:'title',level:0,rooms:[],room:null,player:null,particles:[],shots:[],beams:[],hazards:[],drops:[],boomerang:null,attack:null,time:0,shake:0,toastTime:0,runSeed:0,kills:0,clears:0,transition:0,neighbor,connected,dashCooldown};
  function sfx(name){soundtrack.play(name);}
  function syncSoundButton(){$('sound').textContent='SON : '+(soundtrack.enabled?'ON':'OFF');$('sound').title=soundtrack.enabled?'Couper musique et bruitages':'Activer musique et bruitages';}
  function toast(message){$('toast').textContent=touchControls?.enabled?message.replace(/\bE\b/g,'A'):message;$('toast').style.opacity=1;g.toastTime=3.8;}
  function persist(){try{localStorage.setItem('forest-echoes',JSON.stringify(legacy));}catch{}}
  function makePlayer(){return {x:480,y:410,radius:12,hp:5,max:5,money:Math.min(8,(legacy.deaths+legacy.wins)*2),key:0,damage:1,attackRate:1,power:1,weapon:'sword',boomDamage:2,boomCooldown:1.4,speed:205,dir:-Math.PI/2,inv:0,attackCD:0,dash:0,dashCD:0,dashCooldown:.85,dashDuration:.18,boomCD:0,items:[],regen:0,wisdom:false,revive:0,blessing:null,holding:false,holdTime:0,chargeSound:false};}
  function clearInput(){touchControls?.reset();touchDash=false;keys.clear();pointerHeld=false;if(g.player){g.player.holding=false;g.player.holdTime=0;g.player.chargeSound=false;}}
  function clearRoomEffects(){g.shots=[];g.beams=[];g.hazards=[];g.boomerang=null;g.attack=null;g.particles=[];}
  function newRun(){
    mobileView?.closeMap(false);soundtrack.setPaused(false);soundtrack.unlock();clearInput();g.player=makePlayer();g.time=0;g.kills=0;g.clears=0;g.shake=0;g.runSeed=rand(0,99999);g.mode='play';pendingChoice=null;
    loadFloor(0);$('overlay').classList.add('hidden');canvas.focus();toast('Trois étages vous attendent. Retrouvez la clé de lune !');
  }
  function loadFloor(level){g.level=level;g.rooms=C.makeRooms(level);g.player.key=0;g.player.x=480;g.player.y=410;clearInput();clearRoomEffects();enter(g.rooms[0]);updateHUD();}
  function connected(a,b){
    if(!a||!b||Math.abs(a.x-b.x)+Math.abs(a.y-b.y)!==1)return false;
    const edges=C.floors[g.level].edges;return !edges||edges.some(([i,j])=>(a.id===i&&b.id===j)||(a.id===j&&b.id===i));
  }
  function neighbor(dx,dy){return g.rooms.find(r=>r.x===g.room.x+dx&&r.y===g.room.y+dy&&connected(g.room,r));}
  function enemy(type,x,y){
    const boss=type==='boss',base=type==='knight'?6:3,hp=boss?C.floors[g.level].bossHP:Math.ceil(base*(g.level===1?1.4:1));
    return {x,y,type,hp,max:hp,radius:boss?[40,44,80][g.level]:type==='knight'?17:14,bossLevel:g.level,stage:1,t:rand(0,2),cool:boss?2.4:rand(.6,1.8),windup:0,recover:0,pattern:0,aim:0,hit:0,phase:0,charge:0,chargeSpeed:220,chargeTime:.65,transform:0,vx:0,vy:0};
  }
  function roomObjects(r){
    if(!['fight','key'].includes(r.type))return [];
    if(g.level===0)return [{x:320,y:256,w:48,h:48},{x:592,y:352,w:48,h:48}];
    return [
      [{x:320,y:175,w:48,h:152},{x:592,y:360,w:48,h:128}],
      [{x:280,y:252,w:135,h:45},{x:550,y:360,w:130,h:45}],
      [{x:310,y:180,w:48,h:75},{x:600,y:180,w:48,h:75},{x:310,y:410,w:48,h:65},{x:600,y:410,w:48,h:65}]
    ][r.id%3];
  }
  function enter(r,from){
    g.room=r;r.visited=true;clearRoomEffects();g.drops=r.drops;g.transition=.4;g.player.inv=Math.max(g.player.inv,.8);g.player.holding=false;g.player.holdTime=0;
    if(r.enemies===null){
      r.objects=roomObjects(r);r.enemies=[];
      if(!r.clear){
        if(r.type==='boss'){r.enemies.push(enemy('boss',r.width/2,r.height*.38));toast(`${C.floors[g.level].bossName} · Esquivez puis ripostez !`);sfx('boss');}
        else{
          const count=r.type==='key'?5:g.level===1?5:3+Math.floor(Math.random()*2),positions=[[235,190],[715,190],[235,440],[715,440],[480,270],[480,460]];
          for(let i=0;i<count;i++)r.enemies.push(enemy(['slime','bat','spitter','knight'][Math.floor(Math.random()*(r.id>5||g.level?4:3))],...positions[i]));
        }
      }
    }
    const p=g.player;
    if(from==='left'){p.x=83;p.y=r.height/2;}if(from==='right'){p.x=r.width-83;p.y=r.height/2;}
    if(from==='top'){p.x=r.width/2;p.y=86;}if(from==='bottom'){p.x=r.width/2;p.y=r.height-86;}
    if(from)sfx('door');$('room-label').textContent=r.name;updateHUD();
  }
  function burst(x,y,color,n=12){for(let i=0;i<n;i++)g.particles.push({x,y,vx:rand(-120,120),vy:rand(-130,100),life:rand(.2,.6),color,size:rand(2,6)});}
  function dashCooldown(){return Math.max(.25,g.player.dashCooldown);}
  function weaponCooldown(){return Math.max(.12,C.weapons[g.player.weapon].cooldown/g.player.attackRate);}
  const number=n=>Number(n.toFixed(2)).toString();
  function updateHUD(){
    const p=g.player;if(!p||!g.room)return;
    $('health').innerHTML=Array.from({length:p.max},(_,i)=>{const fill=clamp(p.hp-i,0,1)*100;return `<span class="heart ${p.wisdom?'armored':''}" style="--fill:${fill}%" title="${number(Math.min(1,Math.max(0,p.hp-i)))} cœur">♥</span>`;}).join('');
    $('health').setAttribute('aria-label',`${number(p.hp)} cœurs sur ${p.max}${p.wisdom?', protection de Sagesse':''}`);
    $('money').textContent=String(p.money).padStart(2,'0');$('keys').textContent=p.key;
    $('weapon-name').textContent=C.weapons[p.weapon].name;$('weapon-icon').textContent=C.weapons[p.weapon].icon;
    $('damage').textContent=`Dégâts : ${number(p.damage*C.weapons[p.weapon].mult*p.power)} · ${number(weaponCooldown())} s / attaque`;
    $('hero-stats').textContent=`Esquive ${number(dashCooldown())} s · vitesse ${Math.round(p.speed)} · ${p.blessing?C.blessings.find(b=>b.id===p.blessing).name:'Aucun don sacré'}${p.blessing==='courage'?(p.revive?' (disponible)':' (consommé)'):''}`;
    $('floor-label').textContent=`ÉTAGE ${g.level+1} / 3`;$('chapter-number').textContent=`CHAPITRE ${C.floors[g.level].chapter}`;
    $('chapter-name').textContent=C.floors[g.level].name;$('chapter-detail').textContent=`${g.rooms.length} salles · ${g.level===2?'deux phases · une dernière épreuve':'trésors et gardien'}`;
    $('explored').textContent=`${g.rooms.filter(r=>r.visited).length} / ${g.rooms.length}`;$('relic-count').textContent=p.items.length;
    $('room-status').textContent=g.room.clear?'ZONE SÛRE':'COMBAT EN COURS';$('room-status').style.color=g.room.clear?'#c8e98b':'#eb9b7c';
    $('relics').innerHTML=p.items.length?p.items.map(r=>`<div class="relic"><span>${r.icon}</span><div>${r.name}<small>${r.desc}</small></div></div>`).join(''):'<p class="empty">Les grandes légendes<br>commencent les mains vides.</p>';
    $('weapon-help').textContent=p.weapon==='master'?'Maintenir + relâcher : attaque circulaire. Vie pleine : rayon.':p.weapon==='flail'?'Le boulet inflige ses dégâts en ligne droite.':p.weapon==='greatsword'?'Grande portée, cadence modérée.':'La lame visible définit la zone de frappe.';
    $('touch-status').innerHTML=`<div class="mobile-hearts">${$('health').innerHTML}</div><span class="mobile-wallet">◆ ${p.money} rubis · ⚿ ${p.key}</span>`;renderer.drawMap(g);
  }
  function blocked(x,y,radius=12){
    const r=g.room;return x<48+radius||x>r.width-48-radius||y<64+radius||y>r.height-64-radius||r.objects.some(o=>x+radius>o.x&&x-radius<o.x+o.w&&y+radius>o.y&&y-radius<o.y+o.h);
  }
  function move(e,dx,dy,radius=e.radius){if(!blocked(e.x+dx,e.y,radius))e.x+=dx;if(!blocked(e.x,e.y+dy,radius))e.y+=dy;}
  function lineBlocked(a,b){const length=dist(a,b),steps=Math.ceil(length/7);for(let i=1;i<steps;i++)if(blocked(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,1))return true;return false;}
  function attack(kind='slash'){
    const p=g.player;if(g.mode!=='play'||p.attackCD>0||g.attack)return false;
    const weapon=C.weapons[p.weapon],spin=kind==='spin'&&p.weapon==='master';let reach=weapon.reach;
    if(p.weapon==='flail')for(let d=20;d<=reach;d+=5)if(blocked(p.x+Math.cos(p.dir)*d,p.y+Math.sin(p.dir)*d,19)){reach=Math.max(0,d-5);break;}
    g.attack={kind:spin?'spin':p.weapon==='flail'?'flail':'slash',weapon:p.weapon,age:0,duration:spin?.48:weapon.duration/p.attackRate,dir:p.dir,origin:{x:p.x,y:p.y},reach,hit:new Set(),damage:p.damage*weapon.mult*p.power*(spin?1.5:1)};
    p.attackCD=weaponCooldown()*(spin?1.6:1);sfx(p.weapon==='flail'?'charge':spin?'relic':'sword');
    if(p.weapon==='master'&&!spin&&p.hp>=p.max){g.beams.push({x:p.x+Math.cos(p.dir)*23,y:p.y+Math.sin(p.dir)*23,vx:Math.cos(p.dir)*520,vy:Math.sin(p.dir)*520,radius:6,life:1.3,damage:p.damage*weapon.mult*p.power});sfx('shot');}
    return true;
  }
  function beginAttack(){if(g.mode!=='play'||g.player.holding)return;g.player.holding=true;g.player.holdTime=0;g.player.chargeSound=false;attack();}
  function releaseAttack(){const p=g.player;if(!p||!p.holding)return;if(g.mode==='play'&&p.weapon==='master'&&p.holdTime>=.7)attack('spin');p.holding=false;p.holdTime=0;p.chargeSound=false;}
  function updateAttack(dt){
    const a=g.attack;if(!a)return;const previous=a.age;a.age=Math.min(a.duration,a.age+dt);
    for(const e of g.room.enemies){if(e.hp<=0||a.hit.has(e)||e.transform>0)continue;if(Combat.sweepHits(a,g.player,e,previous,a.age)&&!lineBlocked(a.kind==='flail'?a.origin:g.player,e)){a.hit.add(e);hit(e,a.damage);}}
    if(a.age>=a.duration)g.attack=null;
  }
  function hit(e,damage){
    if(e.hp<=0||e.transform>0)return;e.hp-=damage*(e.type==='boss'&&e.recover>0?2:1);e.hit=.14;burst(e.x,e.y,e.type==='boss'?'#dbbf78':'#d5df9c',7);sfx('hit');
    if(e.type!=='boss'){const a=Math.atan2(e.y-g.player.y,e.x-g.player.x);move(e,Math.cos(a)*9,Math.sin(a)*9);}
  }
  function hurt(amount=1){
    const p=g.player;if(g.mode!=='play'||p.inv>0||p.dash>0)return;
    p.hp=Math.max(0,p.hp-amount*(p.wisdom?.5:1));p.inv=1.2;g.shake=9;burst(p.x,p.y,'#ef9c83');sfx('hurt');
    if(p.hp<=0){
      if(p.revive>0){p.revive--;p.hp=p.max/2;p.inv=3;g.shots=[];g.hazards=[];burst(p.x,p.y,'#ecf4b1',40);toast('Le Courage vous relève · moitié de vos cœurs restaurée');sfx('heal');}
      else end(false);
    }updateHUD();
  }
  function throwBoom(){const p=g.player;if(g.mode!=='play'||g.boomerang||p.boomCD>0)return;g.boomerang={x:p.x,y:p.y,vx:Math.cos(p.dir)*410,vy:Math.sin(p.dir)*410,t:0,hit:new Set()};p.boomCD=Math.max(.45,p.boomCooldown);sfx('boomerang');}
  function showChoices(title,description,options,onSelect){
    clearInput();g.mode='choice';pendingChoice={options,onSelect};sfx('treasure');
    $('overlay').innerHTML=`<div class="intro-symbol">◆</div><div class="eyebrow">ÉTAGE ${g.level+1} · TRÉSOR</div><h2>${title}</h2><p>${description}</p><div class="choices">${options.map((r,i)=>`<button class="choice" data-choice="${i}"><em>${r.icon}</em><strong>${r.name}</strong><small>${r.desc}</small></button>`).join('')}</div>`;
    $('overlay').classList.remove('hidden');document.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>chooseReward(Number(button.dataset.choice)));
  }
  function chooseReward(index){if(g.mode!=='choice'||!pendingChoice||!pendingChoice.options[index])return;const {options,onSelect}=pendingChoice;pendingChoice=null;g.mode='play';$('overlay').classList.add('hidden');onSelect(options[index]);updateHUD();canvas.focus();}
  function addRelic(relic){relic.apply(g.player);g.player.items.push(relic);sfx('relic');toast(`${relic.name} · ${relic.desc}`);updateHUD();}
  function equipWeapon(id){g.player.weapon=id;g.player.attackCD=0;g.attack=null;g.beams=[];sfx('relic');toast(`${C.weapons[id].name} équipée !`);updateHUD();}
  function grantBlessing(id){if(g.player.blessing)return;const blessing=C.blessings.find(b=>b.id===id);if(!blessing)return;blessing.apply(g.player);g.player.blessing=id;g.player.items.push(blessing);sfx('relic');toast(`${blessing.name} · actif jusqu’à la fin de cette tentative`);updateHUD();}
  function canTouchInteract(){
    const p=g.player,r=g.room,cx=r.width/2;if(!r.clear)return false;
    if(r.type==='treasure')return !r.opened&&dist(p,{x:cx,y:285})<92;
    if(r.type==='shop')return [330,480,630].some((x,i)=>!r.sold[i]&&dist(p,{x,y:350})<72);
    if(r.type==='ante')return !r.opened&&dist(p,{x:cx,y:r.height*.4})<92;
    if(r.type==='boss')return !r.rewardTaken?dist(p,{x:cx,y:r.height/2-35})<95:g.level<2&&dist(p,{x:cx,y:r.height*.72})<80;
    return false;
  }
  function interact(){
    if(g.mode!=='play'||!g.room.clear)return;const p=g.player,r=g.room,cx=r.width/2;
    if(r.type==='treasure'&&!r.opened&&dist(p,{x:cx,y:285})<92){showChoices('Un don de la forêt.','Choisissez une relique. Ses bonus se cumulent avec vos objets.',r.offer,relic=>{r.opened=true;addRelic(relic);});return;}
    if(r.type==='shop'){
      const index=[330,480,630].findIndex((x,i)=>!r.sold[i]&&dist(p,{x,y:350})<72);
      if(index>=0){const price=index?18+g.level*4:8+g.level*2;if(p.money<price){toast(`Il vous faut ${price} rubis.`);return;}if(index===0&&p.hp>=p.max){toast('Vos cœurs sont déjà pleins.');return;}
        p.money-=price;r.sold[index]=true;if(index)addRelic(r.shop[index-1]);else{C.heal(p,3);sfx('heal');}toast('Merci, voyageur. Que la forêt vous protège.');sfx('buy');updateHUD();}return;
    }
    if(r.type==='ante'&&!r.opened&&dist(p,{x:cx,y:r.height*.4})<92){p.hp=p.max;r.opened=true;burst(cx,r.height*.4,'#b7e4ac',35);toast('La fontaine des fées restaure tous vos cœurs.');sfx('heal');updateHUD();return;}
    if(r.type==='boss'){
      if(!r.rewardTaken&&dist(p,{x:cx,y:r.height/2-35})<95){
        if(g.level===0){showChoices('Choisissez votre arme.','Un seul choix pour la suite de cette tentative.', ['flail','greatsword','master'].map(id=>C.weapons[id]),item=>{equipWeapon(item.id);r.rewardTaken=true;toast('Arme obtenue · E près de l’escalier pour descendre');});}
        else if(g.level===1)showChoices('Les trois vertus.','Un seul don. Il dure jusqu’à la fin de cette tentative.',C.blessings,item=>{grantBlessing(item.id);r.rewardTaken=true;});
        else{r.rewardTaken=true;g.player.items.push({id:'dawn',icon:'☀',name:'Cœur de l’aube',desc:'Le trésor du roi vaincu.'});sfx('treasure');updateHUD();end(true);}return;
      }
      if(r.rewardTaken&&g.level<2&&dist(p,{x:cx,y:r.height*.72})<80){loadFloor(g.level+1);toast(`${C.floors[g.level].name} · votre équipement vous accompagne`);sfx('door');}
    }
  }
  function end(win){
    g.mode=win?'win':'dead';if(win)legacy.wins++;else legacy.deaths++;persist();clearInput();
    $('overlay').innerHTML=`<div class="intro-symbol">${win?'☀':'❧'}</div><div class="eyebrow">${win?'LES TROIS ÉTAGES SONT LIBÉRÉS':'LA FORÊT GARDE VOTRE ÉCHO'}</div><h2>${win?'Une nouvelle aube.':'Une légende s’achève.'}</h2><p>${win?'Voragh est tombé. Le Cœur de l’aube est entre vos mains.':'Vos objets et votre don sacré disparaissent avec cette tentative.'}<br>Étage ${g.level+1} · ${Math.floor(g.time/60)} min ${Math.floor(g.time%60)} s · ${g.kills} ennemis vaincus<br>${legacy.wins} victoires · ${legacy.deaths} chutes</p><button class="primary" id="again">${win?'UNE NOUVELLE AVENTURE':'REPRENDRE L’ÉPÉE'} →</button><small>HÉRITAGE : ${Math.min(8,(legacy.deaths+legacy.wins)*2)} RUBIS À LA PROCHAINE TENTATIVE</small>`;
    $('overlay').classList.remove('hidden');$('again').onclick=newRun;soundtrack.update(false,'');sfx(win?'win':'death');
  }
  function pause(){
    if(g.mode==='play'){g.mode='pause';soundtrack.setPaused(true);clearInput();$('overlay').innerHTML='<div class="intro-symbol">Ⅱ</div><div class="eyebrow">LE TEMPS SUSPEND SON VOL</div><h2>Un instant de répit.</h2><p>Votre aventure vous attend.</p><button class="primary" id="resume">REPRENDRE →</button><button class="mobile-layout-pause" id="pause-layout">⚙ Position des boutons</button>';$('overlay').classList.remove('hidden');$('resume').onclick=pause;$('pause-layout').onclick=()=>touchLayout?.open();}
    else if(g.mode==='pause'){g.mode='play';soundtrack.setPaused(false);soundtrack.unlock();$('overlay').classList.add('hidden');canvas.focus();}
  }
  function projectile(e,angle,speed=150){sfx('enemyShot');g.shots.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:6,life:6});}
  function hazard(x,y,radius=48,delay=.95){g.hazards.push({x:clamp(x,100,g.room.width-100),y:clamp(y,110,g.room.height-110),radius,delay,life:.35});}
  function prepare(e,action,delay,angle){
    e.action=action;e.aim=angle;e.windup=delay;e.windupMax=delay;
  }
  function launchCharge(e,speed,duration){e.chargeSpeed=speed;e.chargeTime=duration;e.charge=duration;e.vx=Math.cos(e.aim)*speed;e.vy=Math.sin(e.aim)*speed;sfx('enemyCharge');}
  function updateBoss(e,dt,angle){
    if(e.transform>0){e.transform=Math.max(0,e.transform-dt);return;}
    const tier=e.bossLevel,rage=tier===2?e.stage===2:e.hp<e.max*.5;
    if(rage&&!e.phase)sfx('rage');e.phase=rage?1:0;
    if(e.recover>0){e.recover=Math.max(0,e.recover-dt);return;}
    if(e.charge>0){
      e.charge=Math.max(0,e.charge-dt);move(e,e.vx*dt,e.vy*dt);
      if(!e.charge){e.recover=tier===0?1.35:.45;e.cool=e.recover+(tier===0?1.3:.35);}
      return;
    }
    if(e.windup>0){
      e.windup=Math.max(0,e.windup-dt);if(e.windup)return;
      if(e.action==='charge'||e.action==='hunt')launchCharge(e,e.chargeSpeed,e.chargeTime);
      if(e.action==='seeds')for(let i=0;i<6;i++)projectile(e,e.aim+(i-2.5)*.28,110);
      if(e.action==='volley')for(let i=-2;i<=2;i++)projectile(e,e.aim+i*.19,rage?230:200);
      if(e.action==='spiral')for(let i=0;i<(rage?18:12);i++)projectile(e,e.aim+i*TAU/(rage?18:12),rage?190:155);
      if(!e.charge){e.recover=tier===0?.95:tier===1?.25:.4;e.cool=e.recover+(tier===0?1.5:tier===1?.5:rage?.4:.65);}
      return;
    }
    const speed=tier===0?25:tier===1?(rage?85:65):(rage?78:50);
    move(e,Math.cos(angle)*speed*dt,Math.sin(angle)*speed*dt);if(e.cool>0)return;
    const pattern=e.pattern++%3,p=g.player;
    if(tier===0){
      if(pattern===0)prepare(e,'seeds',.85,angle);
      if(pattern===1){prepare(e,'roots',1.05,angle);for(let i=0;i<4;i++)hazard(p.x+(i-1.5)*66,p.y,30,1.05);}
      if(pattern===2){e.chargeSpeed=220;e.chargeTime=.65;prepare(e,'charge',.95,angle);}
    }else if(tier===1){
      // A mobile hunter: alternating aimed volleys, lunges and a delayed trail.
      if(pattern===0)prepare(e,'volley',.6,angle);
      if(pattern===1){e.chargeSpeed=rage?370:320;e.chargeTime=.55;prepare(e,'hunt',.65,angle);}
      if(pattern===2){prepare(e,'thorns',.65,angle);for(let i=0;i<5;i++)hazard(p.x+Math.cos(angle)*i*60,p.y+Math.sin(angle)*i*60,34,.75+i*.14);}
    }else{
      // The sanctuary guardian controls space; phase two adds denser sequences.
      if(pattern===0){prepare(e,'eruption',.9,angle);const count=rage?7:4;for(let i=0;i<count;i++){const a=i*TAU/count;hazard(p.x+Math.cos(a)*140,p.y+Math.sin(a)*140,55,.9+i*.09);}hazard(p.x,p.y,60,.9);}
      if(pattern===1)prepare(e,'spiral',rage?.65:.8,angle);
      if(pattern===2){prepare(e,'rootsweep',.85,angle);for(let i=0;i<(rage?12:9);i++){const a=angle-.95+i*.19;hazard(e.x+Math.cos(a)*230,e.y+Math.sin(a)*230,48,.85+i*.08);}}
    }
  }
  function updateMob(e,dt,a,d){
    if(e.recover>0){e.recover=Math.max(0,e.recover-dt);return;}
    if(e.charge>0){e.charge=Math.max(0,e.charge-dt);move(e,e.vx*dt,e.vy*dt);if(!e.charge){e.recover=.4;e.cool=e.type==='knight'?1.1:.65;}return;}
    if(e.windup>0){
      e.windup=Math.max(0,e.windup-dt);if(e.windup)return;
      if(e.type==='spitter'){projectile(e,e.aim,g.level?175:150);e.recover=.35;e.cool=g.level?1.5:1.9;}
      else launchCharge(e,e.type==='knight'?270:e.type==='bat'?240:175,e.type==='knight'?.55:e.type==='bat'?.45:.35);
      return;
    }
    if(e.cool<=0){prepare(e,e.type==='spitter'?'spit':'lunge',e.type==='knight'?.75:e.type==='bat'?.5:.6,a);e.chargeSpeed=e.type==='knight'?270:e.type==='bat'?240:175;e.chargeTime=e.type==='knight'?.55:e.type==='bat'?.45:.35;return;}
    const speed=e.type==='spitter'?(d<185?-35:0):e.type==='knight'?38:e.type==='bat'?45:24;
    move(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt);
  }
  function updateEnemies(dt){
    for(const e of g.room.enemies){
      if(e.hp<=0)continue;e.t+=dt;e.cool-=dt;e.hit=Math.max(0,e.hit-dt);const p=g.player,a=Math.atan2(p.y-e.y,p.x-e.x),d=dist(p,e);
      if(e.type==='boss')updateBoss(e,dt,a);else updateMob(e,dt,a,d);
      if(e.transform<=0&&dist(p,e)<e.radius+p.radius)hurt();if(g.mode!=='play')return;
    }
  }
  function updateProjectiles(dt){
    const p=g.player;
    if(g.boomerang){const b=g.boomerang;b.t+=dt;if(b.t>.48){const a=Math.atan2(p.y-b.y,p.x-b.x);b.vx=Math.cos(a)*480;b.vy=Math.sin(a)*480;if(dist(b,p)<22){g.boomerang=null;sfx('catch');}}const previous={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;for(const e of g.room.enemies)if(e.hp>0&&!b.hit.has(e)&&Combat.pointSegmentDistance(e,previous,b)<e.radius+10){b.hit.add(e);hit(e,p.boomDamage*p.power);}if(b.t>3)g.boomerang=null;}
    for(const b of g.beams){const previous={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(blocked(b.x,b.y,b.radius)||lineBlocked(previous,b)){b.life=0;continue;}for(const e of g.room.enemies)if(e.hp>0&&e.transform<=0&&Combat.pointSegmentDistance(e,previous,b)<e.radius+b.radius){hit(e,b.damage);b.life=0;break;}}g.beams=g.beams.filter(b=>b.life>0);
    for(const shot of g.shots){const previous={x:shot.x,y:shot.y};shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;if(blocked(shot.x,shot.y,shot.radius)){shot.life=0;continue;}if(Combat.pointSegmentDistance(p,previous,shot)<p.radius+shot.radius){hurt();shot.life=0;}if(g.mode!=='play')return;}g.shots=g.shots.filter(s=>s.life>0);
    for(const h of g.hazards){if(h.delay>0)h.delay=Math.max(0,h.delay-dt);else{h.life-=dt;if(dist(p,h)<h.radius+p.radius)hurt();}}g.hazards=g.hazards.filter(h=>h.life>0);
  }
  function resolveDeaths(){
    const r=g.room;
    for(const e of r.enemies.filter(e=>e.hp<=0)){
      if(e.type==='boss'&&e.bossLevel===2&&e.stage===1){e.stage=2;e.max=220;e.hp=e.max;e.phase=1;e.transform=1.8;e.cool=3;e.charge=0;e.windup=0;e.recover=0;e.pattern=0;clearRoomEffects();g.player.inv=Math.max(g.player.inv,2.2);clearInput();burst(e.x,e.y,'#e3aec0',55);g.shake=14;toast('Voragh brise son armure · PHASE II · nouvelle barre de vie');sfx('rage');continue;}
      g.kills++;sfx('enemy');burst(e.x,e.y,'#c6d187',22);if(e.type!=='boss'){if(Math.random()<.38)g.drops.push({x:e.x,y:e.y,type:'rupee',value:Math.random()<.2?2:1});if(Math.random()<.12)g.drops.push({x:e.x+18,y:e.y,type:'heart'});}
    }
    r.enemies=r.enemies.filter(e=>e.hp>0);
    if(!r.clear&&!r.enemies.length){r.clear=true;g.clears++;g.player.money+=1;C.heal(g.player,g.player.regen);g.shots=[];g.hazards=[];sfx('clear');
      if(r.type==='boss'){toast(g.level===2?'Le roi est vaincu ! Ouvrez son trésor pour achever la légende.':'Un trésor de boss apparaît · approchez et appuyez sur E');}
      else if(r.type==='key'){g.drops.push({x:r.width/2,y:300,type:'key'});toast('La clé du gardien apparaît !');}else toast('Salle purifiée · +1 rubis');updateHUD();
    }
  }
  function collectDrops(){
    const p=g.player;for(const d of g.drops)if(dist(d,p)<27&&(d.type!=='heart'||p.hp<p.max)){
      if(d.type==='rupee')p.money+=d.value;if(d.type==='heart')C.heal(p,1);if(d.type==='key'){p.key++;toast('Clé obtenue · trouvez le gardien de cet étage.');}d.taken=true;sfx(d.type==='rupee'?'coin':d.type==='heart'?'heal':'key');updateHUD();
    }g.drops=g.drops.filter(d=>!d.taken);g.room.drops=g.drops;
  }
  function tryExit(dx,dy){
    const p=g.player,r=g.room;if(!r.clear||g.transition>0)return;let next,from;
    if(p.x<77&&Math.abs(p.y-r.height/2)<47&&dx<0){next=neighbor(-1,0);from='right';}if(p.x>r.width-77&&Math.abs(p.y-r.height/2)<47&&dx>0){next=neighbor(1,0);from='left';}
    if(p.y<94&&Math.abs(p.x-r.width/2)<47&&dy<0){next=neighbor(0,-1);from='bottom';}if(p.y>r.height-94&&Math.abs(p.x-r.width/2)<47&&dy>0){next=neighbor(0,1);from='top';}
    if(!next)return;if(next.type==='boss'&&!next.visited&&C.floors[g.level].key&&!p.key){toast('La porte réclame la clé de cet étage. Explorez les autres passages.');g.transition=1;return;}
    if(next.type==='boss'&&!next.visited&&C.floors[g.level].key)p.key--;r.drops=g.drops;enter(next,from);
  }
  function updateHint(){
    const r=g.room;let hint=r.clear?'Empruntez une porte pour explorer':'Éliminez les ennemis pour ouvrir les portes';
    if(r.type==='treasure'&&!r.opened)hint='E près du coffre · une relique au choix';if(r.type==='shop')hint='Approchez d’un article · E pour acheter';if(r.type==='ante'&&!r.opened)hint='E près de la fontaine · soin complet';if(r.type==='boss'&&r.clear)hint=r.rewardTaken?'E près de l’escalier · étage suivant':'E près du trésor du boss';
    $('touch-action-label').textContent=canTouchInteract()?'INTERAGIR':'ATTAQUER';$('hint').textContent=touchControls?.enabled?hint.replace(/E près/g,'A près'):hint;$('timer').textContent=`${String(Math.floor(g.time/60)).padStart(2,'0')}:${String(Math.floor(g.time%60)).padStart(2,'0')}`;
  }
  function update(dt){
    if(g.mode!=='play')return;const p=g.player;g.time+=dt;g.transition=Math.max(0,g.transition-dt);
    for(const key of ['inv','attackCD','dash','dashCD','boomCD'])p[key]=Math.max(0,p[key]-dt);
    let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('q')||keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('z')||keys.has('w')||keys.has('arrowup')?1:0);
    if(!dx&&!dy&&touchControls){dx=touchControls.x;dy=touchControls.y;}if(dx||dy){const length=Math.max(1,Math.hypot(dx,dy));dx/=length;dy/=length;if(!p.dash)p.dir=Math.atan2(dy,dx);}
    if((keys.has('shift')||touchDash)&&p.dashCD<=0&&(dx||dy||touchDash)){p.dash=Math.min(.3,p.dashDuration);p.dashCD=dashCooldown();sfx('dash');burst(p.x,p.y,'#b6d5ac',6);}touchDash=false;if(p.dash>0){dx=Math.cos(p.dir);dy=Math.sin(p.dir);}
    const speed=Math.min(340,p.speed)*(p.dash>0?3.3:g.attack?.kind==='flail'?.65:1),oldX=p.x,oldY=p.y;move(p,dx*speed*dt,dy*speed*dt);
    // Distance-driven footfalls stay planted when pushing against a wall.
    const travelled=Math.hypot(p.x-oldX,p.y-oldY);p.moving=travelled>.05;p.walkCycle=(p.walkCycle||0)+travelled/9;
    if(p.holding){p.holdTime+=dt;if(p.weapon==='master'){if(p.holdTime>=.7&&!p.chargeSound){p.chargeSound=true;sfx('key');}}else attack();}
    if(keys.has('k'))throwBoom();tryExit(dx,dy);updateAttack(dt);updateEnemies(dt);if(g.mode!=='play')return;updateProjectiles(dt);if(g.mode!=='play')return;resolveDeaths();collectDrops();
    for(const particle of g.particles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.life-=dt;}g.particles=g.particles.filter(p=>p.life>0);g.shake=Math.max(0,g.shake-dt*35);
    if(g.toastTime>0){g.toastTime-=dt;if(g.toastTime<=0)$('toast').style.opacity=0;}updateHint();
  }
  function musicTheme(){return g.room.type==='boss'&&!g.room.clear?(g.level===2?'finalBoss':'boss'):g.room.type==='shop'?'shop':g.level===1?'crypt':g.level===2?'eclipse':'forest';}
  function frame(timestamp){const dt=Math.min((timestamp-last)/1000,.035);last=timestamp;document.body.classList[g.mode==='play'?'add':'remove']('touch-playing');soundtrack.update(g.mode==='play',musicTheme());update(dt);renderer.draw(g);requestAnimationFrame(frame);}
  document.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(key))event.preventDefault();keys.add(key);if(event.repeat)return;if(key==='escape')pause();if(key==='e')interact();if(key==='enter'&&g.mode==='title')newRun();if(key===' '||key==='j')beginAttack();});
  document.addEventListener('keyup',event=>{keys.delete(event.key.toLowerCase());if(!keys.has(' ')&&!keys.has('j')&&!pointerHeld&&!touchControls?.active)releaseAttack();});
  function unfocus(){clearInput();if(g.mode==='play')pause();}
  window.addEventListener('blur',unfocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)unfocus();});
  canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'||event.button!==0)return;canvas.focus();if(g.mode!=='play')return;const bounds=canvas.getBoundingClientRect();g.player.dir=Math.atan2((event.clientY-bounds.top)*g.room.height/bounds.height-g.player.y,(event.clientX-bounds.left)*g.room.width/bounds.width-g.player.x);pointerHeld=true;beginAttack();});
  window.addEventListener('pointerup',event=>{if(event.pointerType==='touch')return;pointerHeld=false;if(!keys.has(' ')&&!keys.has('j'))releaseAttack();});window.addEventListener('pointercancel',event=>{if(event.pointerType==='touch')return;pointerHeld=false;releaseAttack();});
  $('start').onclick=newRun;$('pause').onclick=pause;$('sound').onclick=()=>{soundtrack.setEnabled(!soundtrack.enabled);syncSoundButton();if(soundtrack.enabled)sfx('coin');};
  $('fullscreen').onclick=()=>{const promise=document.fullscreenElement?document.exitFullscreen():$('game-panel').requestFullscreen?.();promise?.catch(()=>toast('Le plein écran n’est pas disponible dans ce navigateur.'));};
  touchControls=new ForestTouch({stick:$('touch-stick'),knob:$('touch-knob'),action:$('touch-action'),dodge:$('touch-dodge'),boom:$('touch-boom'),canMove:()=>g.mode==='play',isEditing:()=>!!touchLayout?.editing,
    onAttack:()=>{soundtrack.unlock();if(g.mode!=='play')return;if(canTouchInteract())interact();else beginAttack();},
    onRelease:()=>{if(!keys.has(' ')&&!keys.has('j')&&!pointerHeld)releaseAttack();},
    onCancel:()=>{if(g.player){g.player.holding=false;g.player.holdTime=0;g.player.chargeSound=false;}},
    onDodge:()=>{if(g.mode==='play')touchDash=true;},onBoom:throwBoom,onChange:()=>{touchDash=false;}});
  if(document.createElement)mobileView=new ForestMobileView({onReset:clearInput,onMapOpen:()=>{if(g.mode!=='play')return false;g.mode='map';soundtrack.setPaused(true);return true;},onMapClose:()=>{if(g.mode==='map'){g.mode='play';soundtrack.setPaused(false);}}});
  if(document.createElement)touchLayout=new ForestTouchLayout({onReset:clearInput,onOpen:()=>{if(!['play','pause','title','dead','win'].includes(g.mode))return false;layoutPreviousMode=g.mode;g.mode='layout';soundtrack.setPaused(true);return true;},onClose:()=>{g.mode=layoutPreviousMode;layoutPreviousMode=null;soundtrack.setPaused(g.mode!=='play');}});
  if(mobileView)mobileView.onViewport=()=>touchLayout?.apply();
  g.player=makePlayer();g.rooms=C.makeRooms(0);g.room=g.rooms[0];g.room.visited=true;g.room.enemies=[];syncSoundButton();updateHUD();
  if(legacy.wins||legacy.deaths)$('legacy').textContent=`Héritage : ${Math.min(8,(legacy.deaths+legacy.wins)*2)} rubis · ${legacy.wins} victoires · ${legacy.deaths} chutes`;requestAnimationFrame(frame);
})();
