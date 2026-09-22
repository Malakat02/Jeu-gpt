const ForestContent = (() => {
  const heal = (p, amount) => { p.hp = Math.min(p.max, p.hp + amount); };
  const heart = (p, amount = 1) => { p.max += amount; heal(p, amount); };
  const relics = [
    {id:'blade',icon:'⚔',name:'Éclat de puissance',desc:'+1 dégât · +8 % de cadence',apply:p=>{p.damage++;p.attackRate*=1.08;}},
    {id:'heart',icon:'♥',name:'Cœur de la forêt',desc:'+1 cœur max · soigne 2 cœurs',apply:p=>{heart(p);heal(p,1);}},
    {id:'boots',icon:'»',name:'Bottes du vent',desc:'+15 % de vitesse · esquive −12 % de recharge',apply:p=>{p.speed*=1.15;p.dashCooldown*=.88;}},
    {id:'feather',icon:'⌁',name:'Plume du zéphyr',desc:'+22 % de cadence · +5 % de vitesse',apply:p=>{p.attackRate*=1.22;p.speed*=1.05;}},
    {id:'sand',icon:'⌛',name:'Sablier des sables',desc:'Esquive : −30 % de recharge · +0,02 s de durée',apply:p=>{p.dashCooldown*=.7;p.dashDuration+=.02;}},
    {id:'ruby',icon:'◆',name:'Rubis du volcan',desc:'+0,65 dégât · +1 cœur max',apply:p=>{p.damage+=.65;heart(p);}},
    {id:'moon',icon:'☾',name:'Croissant ancestral',desc:'+2 dégâts au boomerang · recharge −20 %',apply:p=>{p.boomDamage+=2;p.boomCooldown*=.8;}},
    {id:'gloves',icon:'✦',name:'Gantelets du héros',desc:'+0,6 dégât · +15 % de cadence',apply:p=>{p.damage+=.6;p.attackRate*=1.15;}},
    {id:'scale',icon:'◇',name:'Écaille azurée',desc:'+1 cœur max · esquive −15 % de recharge',apply:p=>{heart(p);p.dashCooldown*=.85;}},
    {id:'seed',icon:'❋',name:'Graine de vie',desc:'+1 cœur max · +0,5 cœur par salle gagnée',apply:p=>{heart(p);p.regen+=.5;}},
    {id:'ribbon',icon:'≈',name:'Ruban des tempêtes',desc:'+15 % de cadence · esquive −20 % de recharge',apply:p=>{p.attackRate*=1.15;p.dashCooldown*=.8;}},
    {id:'mask',icon:'◈',name:'Masque du veilleur',desc:'+0,75 dégât · +8 % de vitesse',apply:p=>{p.damage+=.75;p.speed*=1.08;}},
    {id:'lantern',icon:'☀',name:'Lanterne des âmes',desc:'+1 dégât au boomerang · +1 cœur max',apply:p=>{p.boomDamage++;heart(p);}},
    {id:'bell',icon:'♧',name:'Clochette des fées',desc:'+1 cœur max · soigne entièrement',apply:p=>{heart(p);p.hp=p.max;}},
    {id:'amber',icon:'▣',name:'Ambre du temps',desc:'+20 % de cadence · boomerang : recharge −15 %',apply:p=>{p.attackRate*=1.2;p.boomCooldown*=.85;}},
    {id:'compass',icon:'✧',name:'Boussole des vents',desc:'+12 % de vitesse · esquive −18 % de recharge',apply:p=>{p.speed*=1.12;p.dashCooldown*=.82;}},
    {id:'onyx',icon:'⬟',name:'Onyx du crépuscule',desc:'+1 dégât · boomerang : +1 dégât',apply:p=>{p.damage++;p.boomDamage++;}},
    {id:'crown',icon:'♛',name:'Couronne des bois',desc:'+0,5 dégât · +1 cœur max · +5 % de cadence',apply:p=>{p.damage+=.5;heart(p);p.attackRate*=1.05;}}
  ];
  const weapons = {
    sword:{id:'sword',name:'Épée du voyageur',icon:'⚔',reach:78,width:7,mult:1,cooldown:.36,duration:.23,color:'#e5e8c7',desc:'Une lame courte, vive et précise.'},
    flail:{id:'flail',name:'Boulet du crépuscule',icon:'✹',reach:250,width:38,mult:4.6,cooldown:1.18,duration:.9,color:'#a5b8bc',desc:'Un boulet à pointes lancé en ligne droite. Portée 250 · dégâts ×4,6 · cadence lente.'},
    greatsword:{id:'greatsword',name:'Lame de la divinité',icon:'⚔',reach:126,width:13,mult:1.7,cooldown:.57,duration:.34,color:'#c5dcff',desc:'Une grande épée à deux mains. Portée 126 · dégâts ×1,7 · cadence modérée.'},
    master:{id:'master',name:'Master Sword',icon:'✧',reach:94,width:9,mult:1.4,cooldown:.34,duration:.23,color:'#bff9ee',desc:'Lame améliorée. Rayon à vie pleine ; maintenez puis relâchez l’attaque pour tournoyer.'}
  };
  const blessings = [
    {id:'force',icon:'▲',name:'Don de Force',desc:'Tous vos dégâts augmentent de 75 %.',apply:p=>{p.power*=1.75;}},
    {id:'courage',icon:'△',name:'Don de Courage',desc:'Une résurrection à la moitié de vos cœurs max.',apply:p=>{p.revive=1;}},
    {id:'wisdom',icon:'◬',name:'Don de Sagesse',desc:'Cœurs cerclés de blanc : tous les dégâts reçus sont divisés par deux.',apply:p=>{p.wisdom=true;}}
  ];
  const first = [[0,0,'start','Le seuil du sanctuaire'],[0,-1,'fight','Le cloître des fougères'],[-1,-1,'fight','Les pierres murmurantes'],[-2,-1,'treasure','La chambre des offrandes'],[1,-1,'fight','La galerie des lucioles'],[2,-1,'shop','Le refuge du colporteur'],[0,-2,'fight','Le jardin des épines'],[-1,-2,'fight','La crypte verte'],[-2,-2,'key','L’autel de la petite lune'],[1,-2,'fight','Le passage des sentinelles'],[1,-3,'ante','Le dernier souffle'],[2,-3,'boss','Le cœur des racines']];
  const second = [[0,0,'start','L’escalier sans soleil'],[1,0,'fight','Les lanternes éteintes'],[2,0,'fight','Le couloir des soupirs'],[2,1,'fight','Le carrefour brisé'],[1,1,'fight','Les tombeaux jumeaux'],[0,1,'treasure','L’offrande oubliée'],[0,2,'fight','La galerie des ombres'],[1,2,'fight','Le dédale des cendres'],[2,2,'fight','Le puits silencieux'],[3,2,'fight','Les piliers noirs'],[3,1,'fight','Le détour des spectres'],[3,0,'shop','La dernière lanterne'],[4,0,'fight','Les marches creuses'],[4,1,'treasure','Le trésor du veilleur'],[4,2,'fight','La croisée des destins'],[4,3,'fight','Le passage des masques'],[3,3,'fight','La prison des échos'],[2,3,'key','L’autel de la nuit'],[1,3,'treasure','La cache de l’exilé'],[0,3,'ante','La source enfouie'],[5,2,'fight','Les sentinelles du vide'],[5,3,'ante','La fontaine des murmures'],[5,4,'boss','Le trône des ombres']];
  // Adjacent cells do not necessarily share a door: the maze has explicit passages.
  const secondEdges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[14,20],[20,21],[21,22],[7,18],[9,16]];
  const third = [[0,0,'start','Le seuil de l’éclipse'],[0,-1,'ante','La grande fontaine des fées'],[0,-2,'boss','L’arène de l’éternelle nuit']];
  const floors = [
    {name:'Les racines anciennes',chapter:'I',theme:'forest',layout:first,edges:null,bossName:'MORNE-RACINE',bossHP:54,key:true},
    {name:'Le dédale des ombres',chapter:'II',theme:'crypt',layout:second,edges:secondEdges,bossName:'LE VEILLEUR DES OMBRES',bossHP:120,key:true},
    {name:'Le sanctuaire de l’éclipse',chapter:'III',theme:'eclipse',layout:third,edges:[[0,1],[1,2]],bossName:'VORAGH · LE ROI SANS AUBE',bossHP:180,key:false}
  ];
  function sample(list,n){const copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy.slice(0,n);}
  function makeRooms(level){
    const config=floors[level];
    return config.layout.map(([x,y,type,name],id)=>({id,x,y,type,name,visited:false,clear:['start','treasure','shop','ante'].includes(type),enemies:null,objects:[],drops:[],opened:false,rewardTaken:false,seed:Math.random()*1000,offer:sample(relics,3),shop:sample(relics,2),sold:[false,false,false],width:level===2&&type==='boss'?1440:960,height:level===2&&type==='boss'?960:640}));
  }
  return {relics,weapons,blessings,floors,makeRooms,sample,heal};
})();
