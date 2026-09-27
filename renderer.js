class ForestRenderer {
  constructor(canvas,map){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.map=map.getContext('2d');
    // Keep simulation coordinates at 960 × 640; render all art at 1080p height.
    this.canvas.width=1620;this.canvas.height=1080;
    this.renderScale=1620/960;
    this.ctx.imageSmoothingEnabled=true;
    this.ctx.imageSmoothingQuality='high';
    this.terrainCache=new Map();
    this.palettes={hero:{g:'#6b994c',G:'#adc96d',d:'#2a4834',s:'#edc48f',h:'#a57c43',b:'#805b3c'},slime:{a:'#6f9f78',b:'#9ccb99',d:'#294c43',e:'#e8dfad'},bat:{a:'#89719a',b:'#b49aac',d:'#423b59',e:'#f4cba0'},spitter:{a:'#b27752',b:'#d6a16b',d:'#5f4b3c',e:'#f5d9a2'},knight:{a:'#759a99',b:'#b0c1ab',d:'#334951',e:'#e4a574'}};
    this.sprites={hero:['.....ggg......','....gGGgg.....','...ggGGggg....','...hhhss......','...hssds......','....ssss......','..ddggggdd....','.ddgGGgggdd...','..sgGGgggs....','...gggggg.....','...bbbbb......','...bb.bb......','..bbb.bbb.....'],slime:['....aaaa....','..aabbbbaa..','.abbbbbbbba.','aabbbbbbbbaa','abddbbddbbba','abedbbedbbba','aabbbbbbbbaa','.aaddddddaa.','..aaaaaaaa..'],bat:['a..........a','aa........aa','aba..aa..aba','abbaaaaaabba','abbbabbabbba','.abbdeedbba.','..aabbbbaa..','....aaaa....'],spitter:['....aaaa....','..aabbbbaa..','.abbbbbbbba.','abddbbddbbba','abeebbeebbaa','aabddddbbaa.','.aabddbaa...','..aaaaaaa...','.aaa..aaa...'],knight:['....bbbb....','...baaaab...','..bbaaaabb..','..bddddebb..','...dddddd...','.aaaaaaaaaa.','abbaaaaaabba','abbaaaaaabba','.dadaaaadad.','...aaaaaa...','...dd.dd....','..ddd.ddd...']};
  }
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(x,y,w,h);}
  text(value,x,y,size=12,color='#dce7bb'){const c=this.ctx;c.font=`${size}px monospace`;c.fillStyle=color;c.textAlign='center';c.fillText(value,x,y);}
  sprite(name,x,y,scale=3,flash=false){
    const rows=this.sprites[name],palette=this.palettes[name];
    rows.forEach((row,j)=>[...row].forEach((key,i)=>{if(palette[key])this.rect(x-rows[0].length*scale/2+i*scale,y-rows.length*scale+j*scale,scale,scale,flash?'#fff4d0':palette[key]);}));
  }
  noise(x,y,seed){const n=Math.sin(x*127.1+y*311.7+seed)*43758.5453;return n-Math.floor(n);}
  palette(level,room){if(level===2&&room&&room.type!=='boss')return {floor:['#d7d0c6','#dfd8cb','#d2cdc6'],line:'#c2b9b0',wall:'#bcb9b6',top:'#ece2d2',moss:'#d2c19a',accent:'#8d7054',dark:'#8d8c92'};return [
    {floor:['#59634c','#606b52','#657056'],line:'#7c8365',wall:'#93958d',top:'#c7c7b4',moss:'#78984b',accent:'#e0d399',dark:'#283c2b'},
    {floor:['#293c37','#2d403c','#31443e'],line:'#43544b',wall:'#3b4d47',top:'#67796b',moss:'#49674a',accent:'#b7d6a2',dark:'#101f1c'},
    {floor:['#191321','#201829','#251b30'],line:'#34243e',wall:'#2b2138',top:'#574266',moss:'#743e84',accent:'#c69bbd',dark:'#0a0810'}
  ][level];}
  terrain(g){
    const room=g.room,c=this.ctx;
    // Cache only static scenery. Doors, cracks, flames and gameplay stay live.
    if(typeof document.createElement==='function'){
      let cached=this.terrainCache.get(room);
      if(!cached){
        // Every room, including the larger final arena, has the same screen density.
        const density=this.renderScale;
        cached=document.createElement('canvas');cached.width=Math.ceil(room.width*density);cached.height=Math.ceil(room.height*density);
        this.ctx=cached.getContext('2d');this.ctx.imageSmoothingEnabled=true;
        this.ctx.imageSmoothingQuality='high';this.ctx.scale(density,density);
        try{this.paintTerrain(g);}finally{this.ctx=c;}
        this.terrainCache.set(room,cached);
        // Bound HD bitmap memory by pixels as well as room count (about 64 MB).
        while(this.terrainCache.size>6||[...this.terrainCache.values()].reduce((sum,tile)=>sum+tile.width*tile.height,0)>16000000){if(this.terrainCache.size===1)break;this.terrainCache.delete(this.terrainCache.keys().next().value);}
      }
      c.drawImage(cached,0,0,room.width,room.height);
    }else this.paintTerrain(g);
  }
  paintTerrain(g){
    if(g.level===2){this.paintSanctuary(g);return;}
    const {room:r,level}=g,c=this.ctx,w=r.width,h=r.height,t=this.palette(level),night=level===1;
    const n=(x,y)=>this.noise(x,y,r.seed),soil=night?'#26342e':'#42533a';
    this.rect(0,0,w,h,soil);
    // Uneven flagstones, recessed joints and chipped corners.
    for(let row=0;row<h/48;row++)for(let col=-1;col<w/48;col++){
      const x=col*48+(row%2?24:0),y=row*48,v=n(col,row),shade=t.floor[Math.floor(v*3)];
      this.rect(x+2,y+2,44,44,night?'#1a2c27':'#344733');
      this.rect(x+3,y+3,42,40,shade);this.rect(x+5,y+3,36,2,t.line);this.rect(x+3,y+5,2,30,t.line);
      this.rect(x+5,y+40,38,3,night?'#243730':'#505d45');
      this.rect(x+3,y+3,2+Math.floor(v*5),2,soil);this.rect(x+40,y+37,5,6,soil);
      for(let k=0;k<4;k++)this.rect(x+8+n(col+k,35+row)*30,y+8+n(col,80+k+row)*25,2+k%2,1,k%2?t.line:shade);
      if(v>.68){this.rect(x+24,y+4,2,9,soil);this.rect(x+20,y+12,6,2,soil);this.rect(x+20,y+14,2,8,soil);}
      if(v<.25){this.rect(x+7,y+44,14,3,night?'#385241':'#637c43');this.rect(x+16,y+41,5,4,t.moss);}
    }
    // Organic islands soften paving without resembling solid obstacles.
    for(let patch=0;patch<9;patch++){
      const cx=105+n(patch,130)*(w-210),cy=105+n(patch,150)*(h-210),rx=35+n(patch,170)*64,ry=22+n(patch,180)*34;
      for(let yy=-ry;yy<ry;yy+=5)for(let xx=-rx;xx<rx;xx+=5){
        const v=n(xx+patch*71,yy+patch*53),edge=xx*xx/(rx*rx)+yy*yy/(ry*ry);
        if(edge>.72+v*.35)continue;
        const x=cx+xx,y=cy+yy;
        if(night){
          this.rect(x,y,6,5,v>.6?'#293d36':'#253830');
          if(v>.8)this.rect(x,y,5,2,'#3c5248');
          if(v<.035){this.rect(x,y-3,2,6,'#7b8065');this.rect(x-2,y-4,6,3,'#a19579');}
        }else{
          this.rect(x,y,6,5,['#476b3b','#52763e','#5e8243'][Math.floor(v*3)]);
          if(v>.55){this.rect(x+1,y-3,2,6,'#78974d');this.rect(x+4,y-1,1,4,'#a2b664');}
          if(v<.025){this.rect(x,y-3,2,5,'#3e663b');this.rect(x-2,y-5,6,2,patch%2?'#e8dba4':'#bcc5dd');this.rect(x,y-7,2,6,patch%2?'#e8dba4':'#bcc5dd');this.rect(x,y-5,2,2,'#d8ac65');}
        }
      }
      if(night&&patch%3===0)for(let k=0;k<8;k++)this.rect(cx-rx*.5+n(k,patch+210)*rx,cy-ry*.3+k*3,8+n(k,patch+230)*24,1,k%3?'#3b524c':'#4b645b');
    }
    this.roomFloorDesign(g);
    // Staggered ashlar stones form a continuous, textured masonry ring.
    c.save();c.beginPath();c.rect(0,0,w,h);c.rect(64,64,w-128,h-128);c.clip('evenodd');
    this.rect(0,0,w,h,night?'#142520':'#334736');
    for(let row=0;row<h/24;row++)for(let col=-1;col<w/56;col++){
      const x=col*56+(row%2?28:0),y=row*24,v=n(col+70,row+310);
      if(x>64&&x+56<w-64&&y>=64&&y+24<=h-64)continue;
      const shades=night?['#3b4a43','#45534a','#34473f']:['#93968d','#a0a296','#858c83'];
      this.rect(x+2,y+2,52,20,shades[Math.floor(v*3)]);this.rect(x+5,y+2,46,3,t.top);this.rect(x+2,y+5,3,12,t.wall);
      this.rect(x+5,y+19,49,3,night?'#25382f':'#4a5945');this.rect(x+51,y+6,3,13,night?'#25382f':'#4a5945');
      this.rect(x+2,y+2,3+v*5,3,night?'#24362e':'#475742');this.rect(x+48,y+17,6,5,night?'#24362e':'#475742');
      for(let k=0;k<5;k++)this.rect(x+8+n(k+col,410+row)*38,y+7+n(k+row,440+col)*10,2+k%3,1,k%2?t.wall:t.top);
      if(v>.55){this.rect(x+14,y+4,2,6,night?'#25352e':'#4b5946');this.rect(x+14,y+9,9,2,night?'#25352e':'#4b5946');}
      if(v<.4){this.rect(x+7,y+17,20,5,t.moss);this.rect(x+12,y+14,9,4,night?'#3f5e42':'#839b52');}
    }
    c.restore();
    this.rect(64,64,w-128,7,night?'#122620':'#304930');this.rect(64,71,w-128,5,night?'#1c3028':'#40573a');
    this.rect(64,64,5,h-128,night?'#182b24':'#3a4e34');this.rect(w-69,64,5,h-128,night?'#182b24':'#3a4e34');this.rect(64,h-67,w-128,3,t.top);
    // Keep the middle of every wall clear for doors and secret fissures.
    for(let side=0;side<4;side++)for(let i=0;i<10;i++){
      const horizontal=side<2,length=horizontal?w:h,along=85+n(i+side*19,500)*(length-170);
      if(Math.abs(along-length/2)<85)continue;
      c.save();if(side===0)c.translate(along,22);if(side===1){c.translate(along,h-22);c.rotate(Math.PI);}if(side===2){c.translate(22,along);c.rotate(-Math.PI/2);}if(side===3){c.translate(w-22,along);c.rotate(Math.PI/2);}
      const extent=35+n(i+side,510)*65;
      for(let j=0;j<extent;j+=5){const x=Math.sin(j*.09+i)*9;
        this.rect(x,j,night?4:2,7,night?'#302d28':'#365736');
        if(night){this.rect(x+1,j,1,6,'#786b4c');if(j%10===0){this.rect(x-5,j+2,6,2,'#62583f');this.rect(x-5,j-1,2,4,'#8b7954');this.rect(x+4,j+4,5,2,'#62583f');}}
        else if(j%10===0){for(const sign of [-1,1]){this.rect(x+sign*5-3,j,6,5,'#426b39');this.rect(x+sign*5-2,j,4,2,'#92ac5b');this.rect(x+sign*7-1,j+2,3,2,'#6f9245');}}
      }c.restore();
    }
    for(const [x,y] of [[80,80],[w-105,80],[80,h-108],[w-105,h-108]]){
      this.rect(x-4,y+9,33,29,night?'#14251e':'#34482f');this.rect(x,y,25,29,t.wall);this.rect(x-3,y-3,31,8,t.top);this.rect(x+6,y+8,4,18,t.line);this.rect(x+14,y+8,4,18,t.dark);this.rect(x-3,y+27,31,5,t.wall);
    }
  }
  roomFloorDesign(g){
    const r=g.room,c=this.ctx,night=g.level===1;
    if(!['fight','key'].includes(r.type))return;
    const stone=night?'#52665b':'#adb28b',dark=night?'#20332e':'#475943',grass=night?'#314938':'#628044';
    for(let cy=0;cy<(r.spanY||1);cy++)for(let cx=0;cx<(r.spanX||1);cx++){
      const design=((r.design||0)+cx+cy*2)%6;c.save();c.scale(r.width/(960*(r.spanX||1)),r.height/(640*(r.spanY||1)));c.translate(cx*960,cy*640);
      if(design===0){ // Cloister: long inlaid paths and planted borders.
        for(const x of [372,578]){this.rect(x,110,10,420,dark);this.rect(x+3,110,3,420,stone);}
        for(let y=145;y<520;y+=55)for(const x of [352,599]){this.rect(x-8,y,16,22,grass);this.rect(x-4,y-4,3,14,stone);}
      }else if(design===1){ // A broken ceremonial mosaic between four columns.
        c.strokeStyle=stone;c.lineWidth=4;c.beginPath();c.ellipse(480,320,155,112,0,0,Math.PI*2);c.stroke();
        c.lineWidth=2;c.beginPath();c.ellipse(480,320,136,94,0,0,Math.PI*2);c.stroke();
        for(let i=0;i<8;i++){const a=i*Math.PI/4,x=480+Math.cos(a)*114,y=320+Math.sin(a)*77;this.rect(x-5,y-5,10,10,stone);}
        this.contour([[480,277],[512,320],[480,363],[448,320]],night?'#394f48':'#768568',dark);
      }else if(design===2){ // Shallow water is decoration, never an invisible obstacle.
        for(let i=0;i<10;i++){const y=160+i*32,x=430+Math.sin(i*.55+r.seed)*45;this.rect(x,y,95,35,night?'#1e3538':'#416666');this.rect(x+8,y+8,65,2,night?'#426064':'#84a49a');this.rect(x+22,y+21,57,1,stone);}
        for(let i=0;i<5;i++)this.plate(429+i%2*35,220+i*43,78,27,night?'#56635c':'#a0a28c',stone,dark);
      }else if(design===3){ // Fallen sanctuary avenue, with staggered paving.
        for(let i=0;i<7;i++){const y=140+i*53;this.rect(392+i%2*30,y,157,32,night?'#3c5147':'#77836a');this.rect(398+i%2*30,y+4,145,1,stone);this.rect(398+i%2*30,y+26,145,1,dark);for(let j=1;j<4;j++)this.rect(392+i%2*30+j*39,y+2,2,28,dark);}
        for(let i=0;i<18;i++){const x=230+this.noise(i,41,r.seed)*510,y=160+this.noise(i,42,r.seed)*330;this.rect(x,y,12+i%3*7,5,stone);}
      }else if(design===4){ // Overgrown garden, bright flowers or pale mushrooms.
        for(let i=0;i<85;i++){const x=330+this.noise(i,71,r.seed)*300,y=160+this.noise(i,72,r.seed)*320;this.rect(x,y,15,8,grass);this.rect(x+4,y-5,2,11,night?'#58704b':'#97ae65');if(i%7===0){this.rect(x+1,y-7,8,3,night?'#afa68b':'#e3cfb0');this.rect(x+4,y-9,3,7,night?'#c7c0a0':'#dcd8ef');}}
      }else{ // Funerary geometric inlay and scattered leaves.
        for(const x of [375,575])for(let y=140;y<510;y+=44){this.rect(x,y,10,28,stone);this.rect(x-4,y+6,18,4,dark);}
        for(let i=0;i<5;i++){this.rect(430,190+i*55,100,30,dark);this.rect(442,198+i*55,76,3,stone);this.rect(477,204+i*55,6,10,stone);}
      }
      c.restore();
    }
  }
  paintSanctuary(g){
    const r=g.room,c=this.ctx,w=r.width,h=r.height,dark=r.type==='boss',t=this.palette(2,r),n=(x,y)=>this.noise(x,y,r.seed);
    this.rect(0,0,w,h,t.dark);
    for(let row=0;row<h/48;row++)for(let col=-1;col<w/48;col++){
      const x=col*48+(row%2?24:0),y=row*48,v=n(col,row);
      this.rect(x+1,y+1,46,46,t.floor[Math.floor(v*3)]);this.rect(x+3,y+2,41,1,dark?'#392a45':'#eae2d3');
      if(v>.45){this.rect(x+10,y+15,12,1,t.line);this.rect(x+20,y+16,7,1,t.line);this.rect(x+26,y+17,3,5,t.line);}
      if(dark&&v>.65){this.rect(x+35,y+2,2,17,'#090710');this.rect(x+28,y+18,9,2,'#090710');}
    }
    // The same stonework vocabulary, transformed into marble or blackened stone.
    c.save();c.beginPath();c.rect(0,0,w,h);c.rect(64,64,w-128,h-128);c.clip('evenodd');this.rect(0,0,w,h,t.dark);
    for(let row=0;row<h/24;row++)for(let col=-1;col<w/56;col++){
      const x=col*56+(row%2?28:0),y=row*24;
      if(x>64&&x+56<w-64&&y>=64&&y+24<=h-64)continue;
      this.rect(x+2,y+2,52,20,dark?(n(col,row)>.5?'#30233e':'#241b31'):(n(col,row)>.5?'#cfcac3':'#c6c3bf'));
      this.rect(x+4,y+2,48,3,t.top);this.rect(x+4,y+19,48,3,t.wall);this.rect(x+49,y+5,4,14,t.wall);
      if(n(col,row)>.65)this.rect(x+12,y+11,17,1,t.line);
    }c.restore();
    this.rect(64,64,w-128,7,t.dark);this.rect(64,64,5,h-128,t.dark);this.rect(w-69,64,5,h-128,t.dark);
    for(const x of [110,w-114]){this.rect(x,90,3,h-180,dark?'#4e315e':'#c6b995');this.rect(x+5,90,1,h-180,dark?'#31213e':'#ffffff');}
    for(const y of [94,h-98])this.rect(114,y,w-228,2,dark?'#4e315e':'#c6b995');
    if(!dark){
      for(const x of [w/2-94,w/2+92])this.rect(x,104,2,h-208,'#ddd4b8');
      for(const x of [151,w-151])for(const y of [195,h-180])this.sanctuaryStatue(x,y);
      // Low sunset light colours the white stone without a full-screen flash.
      this.rect(0,0,w,h,'#b2766220');
      const dusk=c.createRadialGradient(120,70,20,w*.25,h*.2,w);dusk.addColorStop(0,'#ffd69b24');dusk.addColorStop(1,'#51435f32');c.fillStyle=dusk;c.fillRect(0,0,w,h);
    }else{
      // Branching stains run inward from the walls and leave the arena readable.
      for(let i=0;i<26;i++){
        const side=i%4,along=90+n(i,800)*((side<2?w:h)-180),length=60+n(i,820)*170;
        c.save();if(side===0)c.translate(along,62);if(side===1){c.translate(along,h-62);c.rotate(Math.PI);}if(side===2){c.translate(62,along);c.rotate(-Math.PI/2);}if(side===3){c.translate(w-62,along);c.rotate(Math.PI/2);}
        for(let j=0;j<length;j+=7){const bend=Math.sin(j*.047+i)*21,width=Math.max(2,18-j*.07);this.rect(bend,j,width,9,'#0d0915');this.rect(bend+2,j,2,8,'#4d285e');if(j%21===0)this.rect(bend-13,j,17,3,'#2c173b');}c.restore();
      }
    }
  }
  sanctuaryStatue(x,y){
    const c=this.ctx;c.save();c.translate(x,y);
    this.rect(-26,20,52,13,'#bbc7c7');this.rect(-28,16,56,7,'#ffffff');this.rect(-22,6,44,12,'#e1e6e4');
    // Robed guardian, folded wings and a ceremonial blade.
    for(const s of [-1,1]){this.rect(s<0?-31:18,-54,13,40,'#d0dada');this.rect(s<0?-34:24,-62,10,27,'#f9fbf6');this.rect(s<0?-26:17,-37,9,29,'#eef2ed');}
    this.rect(-14,-46,28,50,'#d4dddc');this.rect(-10,-48,18,49,'#ffffff');this.rect(-5,-43,3,42,'#e4e9e5');this.rect(8,-34,5,35,'#b8c8ca');
    this.rect(-11,-67,22,20,'#eff3f0');this.rect(-8,-70,16,7,'#ffffff');this.rect(-6,-57,12,2,'#a7b9bd');
    this.rect(-18,-35,36,7,'#fafffa');this.rect(-2,-40,4,44,'#b7a679');this.rect(-9,-27,18,3,'#ccb98c');this.rect(-1,-24,2,27,'#f5f5ed');
    c.restore();
  }
  corruptionGate(x,y,angle,time){
    const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);
    for(let i=0;i<15;i++){
      const side=i%2?-1:1,length=62+(i*37)%110,start=side*(43+(i*13)%52);
      for(let j=0;j<length;j+=6){const bend=start+side*j*.35+Math.sin(j*.07+i)*9,thickness=Math.max(2,15-j*.07);
        this.rect(bend,j-24,thickness,8,'#1a1026');this.rect(bend+2,j-24,2,7,'#573363');
        if(j%18===0)this.rect(bend-side*9,j-24,12,3,'#32203f');
      }
      const pulse=(time*.3+i*.13)%1;c.globalAlpha=.18+Math.sin(pulse*Math.PI)*.3;this.rect(start+side*pulse*length*.35,pulse*length-24,3,6,'#b36bd0');c.globalAlpha=1;
    }c.restore();
  }
  floor(g){
    const {room:r,level,time,player:p}=g,c=this.ctx,t=this.palette(level,r),w=r.width,h=r.height;
    this.terrain(g);
    if(level===0){c.save();c.globalAlpha=.06;c.fillStyle='#ffffb0';for(let i=0;i<3;i++){c.beginPath();c.moveTo(170+i*240,64);c.lineTo(235+i*240,64);c.lineTo(400+i*200,h-64);c.lineTo(265+i*200,h-64);c.fill();}c.restore();}
    const passages=g.passages?g.passages():[[-1,0,64,h/2],[1,0,w-64,h/2],[0,-1,w/2,80],[0,1,w/2,h-80]].map(([dx,dy,x,y])=>({dx,dy,x,y,next:g.neighbor(dx,dy)})).filter(d=>d.next);
    for(const {dx,dy,x,y,next} of passages){
      const locked=!g.cheat&&(!r.clear||(next.type==='boss'&&!next.visited&&ForestContent.floors[level].key&&!p.key));
      const angle=dx<0?-Math.PI/2:dx>0?Math.PI/2:dy>0?Math.PI:0,px=x+dx*8,py=y+dy*24,infected=level===2&&next.type==='boss';
      if(infected)this.corruptionGate(px,py,angle,time);
      if(level<2&&next.type==='boss')this.bossDoor(px,py,angle,locked,t,level,time);
      else this.templeDoor(px,py,angle,locked,infected?this.palette(2,next):t,next.type==='boss');
    }
    const crack=g.secretEntrance();
    if(crack){
      c.save();c.translate(crack.x+crack.dx*8,crack.y+crack.dy*24);if(crack.dx)c.rotate(Math.PI/2);
      for(const [x,y,ww,hh] of [[-2,-15,3,9],[-6,-7,7,3],[-6,-5,3,9],[-4,3,9,3],[2,5,3,10],[-10,-1,5,2]])this.rect(x,y,ww,hh,'#070b08');
      if(crack.secret.entranceHits>0)this.rect(-12,1,8,3,'#070b08');if(crack.secret.entranceHits>1)this.rect(5,5,10,3,'#070b08');c.restore();
    }
    for(const [x,y] of [[168,87],[w-172,87],[168,h-89],[w-172,h-89]]){
      this.rect(x-6,y,12,13,'#3b3225');this.rect(x-8,y-8,16,11,t.top);
      this.rect(x-5,y-15-Math.sin(time*9+x)*2,10,13,level===2?(r.type==='boss'?'#8e50be':'#e5f8ff'):level===1?'#86ace2':'#e6b660');this.rect(x-2,y-15,4,8,level===2?'#f4efff':'#f5dfa0');
      const glow=c.createRadialGradient(x,y,4,x,y,80);glow.addColorStop(0,level===1?'#78a9ea24':'#e8b74b20');glow.addColorStop(1,'#00000000');c.fillStyle=glow;c.fillRect(x-80,y-80,160,160);
    }
    for(const o of r.objects){
      this.rect(o.x-4,o.y+8,o.w+8,o.h,t.dark);this.rect(o.x,o.y,o.w,o.h,t.wall);
      this.rect(o.x+4,o.y+4,o.w-8,7,t.top);this.rect(o.x+8,o.y+16,o.w-16,o.h-22,t.line);
    }
  }
  templeDoor(x,y,angle,locked,t,boss){
    const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);
    this.rect(-42,-26,84,60,'#081510');
    // An arch of worn blocks, with chipped capitals and a carved keystone.
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const bx=side<0?-58:40;this.rect(bx,-20+i*19,18,17,t.wall);this.rect(bx+2,-20+i*19,14,4,t.top);
      this.rect(bx+(i%2?5:11),-15+i*19,2,8,t.dark);
    }
    this.rect(-53,-32,106,13,t.wall);this.rect(-43,-42,86,13,t.top);this.rect(-29,-47,58,7,t.wall);
    this.rect(-10,-39,20,20,t.accent);this.rect(-5,-34,10,10,t.wall);this.rect(-2,-32,4,6,t.accent);
    this.rect(-61,32,24,8,t.top);this.rect(37,32,24,8,t.top);
    if(locked){
      for(const side of [-1,1]){const bx=side<0?-38:2;this.rect(bx,-22,36,55,t.wall);this.rect(bx+3,-19,29,4,t.top);this.rect(bx+5,-11,25,30,t.top);this.rect(bx+9,-7,17,22,t.wall);this.rect(bx+15,-3,5,14,t.accent);}
      this.rect(-39,22,78,7,t.top);this.rect(-6,-6,12,25,boss?'#cb9b63':'#a3a078');this.rect(-3,1,6,9,t.dark);
      this.rect(-30,9,11,3,t.dark);this.rect(-22,12,3,11,t.dark);
    }else{
      this.rect(-38,-22,9,52,t.wall);this.rect(29,-22,9,52,t.wall);
      for(let i=0;i<3;i++){this.rect(-29,8+i*9,58,7,i%2?t.wall:t.top);this.rect(-29,14+i*9,58,2,t.dark);}
      this.rect(-23,31,46,5,t.accent);
    }
    this.rect(-52,-28,8,13,t.moss);this.rect(-49,-17,5,22,t.moss);this.rect(35,-39,16,5,t.moss);c.restore();
  }
  skull(x,y,scale=1,bone='#ead8ae'){
    const c=this.ctx;c.save();c.translate(x,y);c.scale(scale,scale);
    this.rect(-9,-9,18,14,'#352b2f');this.rect(-7,-11,14,18,'#352b2f');
    this.rect(-7,-8,14,11,bone);this.rect(-5,-10,10,3,'#fff0cf');this.rect(-5,2,10,6,bone);
    this.rect(-6,-4,5,4,'#352b2f');this.rect(2,-4,5,4,'#352b2f');this.rect(-1,0,2,3,'#634f45');
    for(const dx of [-3,1])this.rect(dx,4,1,4,'#81694f');c.restore();
  }
  bossKey(x,y){
    const c=this.ctx;c.save();c.translate(x,y);
    this.rect(-5,-2,10,28,'#392e30');this.rect(-3,-1,6,25,'#c49c50');this.rect(-3,0,2,23,'#f2d991');
    this.rect(0,15,13,5,'#392e30');this.rect(0,16,11,3,'#e3bb65');this.rect(8,18,4,7,'#c49c50');
    this.rect(-5,23,10,3,'#9e713d');this.skull(0,-10,1.5);c.restore();
  }
  bossDoor(x,y,angle,locked,t,level,time){
    this.templeDoor(x,y,angle,locked,t,true);
    const c=this.ctx,trim=level?'#9886a5':'#b9a16c',metal=level?'#393247':'#415043';c.save();c.translate(x,y);c.rotate(angle);
    for(const side of [-1,1]){
      const sx=side<0?-83:61;
      this.rect(sx-3,-25,28,65,'#1b2422');this.rect(sx,-27,22,62,t.wall);this.rect(sx+3,-25,5,59,t.top);this.rect(sx+10,-21,9,53,t.dark);
      for(let j=0;j<3;j++){this.rect(sx-4,-27+j*24,30,5,trim);this.rect(sx+12,-17+j*24,4,4,trim);}
      this.rect(sx-6,34,34,10,t.top);
      for(let j=0;j<7;j++){const xx=side*(58+j*3),yy=-24+j*8;this.rect(xx,yy,6,10,level?'#3e2d3a':'#514535');this.rect(xx+1,yy,2,8,level?'#88707c':'#8f7950');}
    }
    this.rect(-78,-39,156,12,t.dark);this.rect(-72,-42,144,8,trim);this.rect(-57,-49,114,7,t.top);
    this.rect(-24,-50,48,25,metal);this.skull(0,-37,.9,trim);
    if(locked){
      for(const side of [-1,1]){const sx=side<0?-37:2;this.rect(sx,-21,35,52,metal);this.rect(sx+3,-19,3,47,trim);this.rect(sx+11,-12,14,34,t.dark);this.rect(sx+16,-8,4,22,trim);}
      for(let i=-3;i<=3;i++){this.rect(i*9-3,i*6-3,7,4,trim);this.rect(i*9-3,-i*6+4,7,4,trim);}
      this.skull(0,3,1.05,level?'#cfbed0':'#ead39a');
    }else{this.rect(-30,28,60,4,trim);this.rect(-25,34,50,2,t.top);}
    const glow=.55+Math.sin(time*2)*.12;c.globalAlpha=glow;for(const side of [-1,1])this.rect(side*71-2,-15,4,5,level?'#b991e0':'#ebc971');c.restore();
  }
  chest(x,y,opened,boss=false){
    const gold=boss?'#e6cb82':'#d2b163';
    this.rect(x-31,y+8,62,13,'#14251c');this.rect(x-28,y-17,56,35,boss?'#55405b':'#745634');
    this.rect(x-25,y-21,50,17,opened?'#242d22':boss?'#96729b':'#b48c4b');this.rect(x-25,y-21,50,5,gold);
    this.rect(x-24,y+7,48,5,gold);this.rect(x-19,y-18,5,35,gold);this.rect(x+14,y-18,5,35,gold);
    this.rect(x-5,y-7,10,12,gold);this.rect(x-1,y-3,3,6,'#594630');
  }
  fountain(g){
    const {room:r,time}=g,x=r.width/2,y=r.height*.4,large=g.level===2;
    this.rect(x-56,y-15,112,65,large?'#b4b4b7':'#495967');this.rect(x-48,y-23,96,58,large?'#e5d9c7':'#718698');
    this.rect(x-39,y-16,78,39,large?(r.opened?'#acccd2':'#7cbfcf'):r.opened?'#38524a':'#68a29b');this.rect(x-28,y-9,52,4,large?'#f4ffff':'#bbf1db');
    if(large){this.rect(x-51,y+33,102,3,'#c4af7d');this.rect(x-32,y+18,64,2,'#e0f8fc');}
    this.text(large?'LA GRANDE FÉE':'SOURCE DES FÉES',x,y-58,14,large?'#687c8a':'#c2eadb');
    if(!r.opened){
      const fx=x+Math.sin(time)*22,fy=y-17+Math.sin(time*2)*6;
      this.rect(fx-15,fy-5,11,9,'#d3f6e9');this.rect(fx+4,fy-5,11,9,'#d3f6e9');this.rect(fx-3,fy-9,6,18,'#e7de99');
      for(let i=0;i<(large?12:5);i++)this.rect(x+Math.cos(time+i)*(large?75:48),y-5+Math.sin(time*1.5+i)*29,3,3,'#b6ecce');
    }
  }
  decorations(g){
    const {room:r,level,time}=g,c=this.ctx,x=r.width/2;
    if(level===2&&r.type==='boss')this.corruptedTree(g);
    if(r.type==='start'){
      for(let i=0;i<3;i++)this.rect(x-83+i*12,210+i*12,166-i*24,105-i*24,this.palette(level,r).wall);
      this.text(level===0?'✦':level===1?'☾':'▲',x,284,55,level===2?'#b3a16d':this.palette(level,r).top);
      this.text(ForestContent.floors[level].name.toUpperCase(),x,480,12,this.palette(level,r).accent);
    }
    if(r.type==='treasure'){this.chest(x,285,r.opened);if(!r.opened)this.text('✦',x,242+Math.sin(time*2)*4,18,'#e2ce8b');}
    if(r.type==='key'&&!r.clear){this.rect(x-40,270,80,50,this.palette(level).wall);this.text('☾',x,303,32,'#c8ba7b');}
    if(r.type==='ante')this.fountain(g);
    if(r.type==='shop'){
      this.sprite('hero',480,235,4);this.rect(458,184,44,11,'#af8963');this.rect(445,188,68,8,'#9e714c');
      this.text('« Quelques rubis contre un peu d’espoir ? »',480,153,13,'#bcc8a4');
      for(let i=0;i<3;i++){
        const sx=330+i*150;this.rect(sx-40,328,80,52,'#4f5136');this.rect(sx-44,324,88,8,'#a18a58');
        if(!r.sold[i]){
          const item=i?r.shop[i-1]:{icon:'♥',name:'Potion'};
          this.text(item.icon,sx,311,30,i?'#e6dca5':'#dc8e88');this.text(item.name,sx,404,10);
          this.text(`${i?18+level*4:8+level*2} ◆`,sx,427,14,'#dfc778');
        }else this.text('VENDU',sx,410,12,'#789077');
      }
    }
    if(r.type==='boss'){
      c.strokeStyle=this.palette(level).top;c.lineWidth=3;c.beginPath();c.arc(x,r.height/2,level===2?265:150,0,Math.PI*2);c.stroke();
      for(let i=0;i<12;i++){const a=i*Math.PI/6;this.text('◆',x+Math.cos(a)*(level===2?265:150),r.height/2+6+Math.sin(a)*(level===2?265:150),18,this.palette(level).moss);}
      if(r.clear){
        this.chest(x,r.height/2-35,r.rewardTaken,true);
        if(!r.rewardTaken)this.text(level===0?'TRÉSOR · ARME':level===1?'TRÉSOR · DON SACRÉ':'LE CŒUR DE L’AUBE',x,r.height/2-81,15,'#f1d99a');
        if(r.rewardTaken&&level<2){
          const py=r.height*.72;
          this.rect(x-39,py-26,78,53,'#465462');
          for(let i=0;i<5;i++)this.rect(x-32+i*4,py-20+i*9,64-i*8,7,'#161b2b');
          this.text('E · DESCENDRE',x,py+56,12,'#cbdcb1');
        }
      }
    }
  }
  contour(points,color,outline='#233a35',line=1){
    const c=this.ctx;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=color;c.fill();
    if(outline){c.strokeStyle=outline;c.lineWidth=line;c.lineJoin='round';c.stroke();}
  }
  oval(x,y,rx,ry,color){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
  hero(g){
    const {player:p,attack:a}=g,c=this.ctx;
    const facing=a?.kind==='spin'?ForestCombat.pose(a,p).angle:a?a.dir:p.dir,back=Math.sin(facing)<-.55,side=Math.abs(Math.cos(facing))>.72;
    const step=p.moving&&!p.dash?Math.sin(p.walkCycle||0):0,bob=Math.round(Math.abs(step)),sign=Math.cos(facing)<0?-1:1;
    c.save();c.translate(Math.round(p.x),Math.round(p.y));
    // Separate boots, tunic, arms and head give a small sprite readable weight.
    for(const s of [-1,1]){
      const foot=Math.round(step*s*3),x=s<0?-10:3;
      this.rect(x,-1,7,12+foot,'#182c27');this.rect(x+2,0,4,8+foot,'#ded4a4');
      this.rect(x-1,8+foot,9,7,'#392f29');this.rect(x,8+foot,6,3,'#916841');this.rect(x-1,14+foot,9,2,'#152722');
    }
    const effort=a?Math.sin(Math.min(1,a.age/a.duration)*Math.PI):0;
    c.translate(p.dash?sign*3:Math.round(step*.6+Math.cos(facing)*effort*2),-bob+(p.dash?3:Math.round(Math.sin(facing)*effort)));
    if(p.dash)c.rotate(sign*.22);
    this.rect(-12,-16,24,22,'#183d31');this.rect(-10,-17,20,21,'#39704b');
    this.rect(-8,-16,8,19,'#6b9b57');this.rect(-6,-14,3,13,'#a0bf70');
    this.rect(3,-13,6,16,'#52864c');this.rect(-11,3,9,3,'#92ae62');this.rect(2,3,8,3,'#50744a');
    // Leather baldric and belt with a tiny brass clasp.
    for(let i=0;i<5;i++)this.rect(-7+i*3,-15+i*3,4,4,'#715337');
    this.rect(-11,-2,22,4,'#4b392c');this.rect(-10,-2,19,1,'#aa8150');
    if(!back){this.rect(-2,-3,5,5,'#d9b363');this.rect(0,-1,2,2,'#5f5034');}
    this.rect(back?7:-12,0,6,6,'#6f5739');this.rect(back?8:-11,0,4,2,'#b09658');
    const swing=Math.round(step*2);
    for(const s of [-1,1]){
      // The weapon hand is drawn at its actual grip by drawWeapon.
      this.rect(s<0?-15:10,-14,5,9,'#224b37');this.rect(s<0?-14:11,-13,3,5,'#91b466');
      if(s===-sign&&p.weapon!=='greatsword'){this.rect(s<0?-15:11,-5+s*swing,4,5,'#dfac76');this.rect(s<0?-15:11,-1+s*swing,4,3,'#695038');}
    }
    c.save();if(side)c.scale(sign,1);
    const palette={o:'#18382e',g:'#3b7546',l:'#8bb95b',d:'#28513b',h:'#b88443',H:'#ecc476',s:'#f3c897',t:'#c68c62',w:'#f7efca',e:'#304b56'};
    const rows=back?[
      '.....ooooo......','....oglllgoo....','...oglllllggo...','..ogllllggggdo..','..ogggggggdddo..','..ogggggdddgoo..','...ohHHhhHho....','...ohhhhhhoo....','....ohhhhoo.....','.....otto.......'
    ]:side?[
      '.....ooooo......','....oglllgoo....','...ogllllgggo...','..ogggggggggo...','..ogddhHHHhho...','...odhHsswwso...','....ohHssessto..','....ohstsssso...','.....otsssso....','......otto......'
    ]:[
      '.....ooooo......','....oglllgoo....','...oglllllggo...','..oggggggggggo..','..ohHHHHHHHhho..','..tsHssHssHsst..','..otsweswesso...','...osssssssso...','....otssssto....','.....otto.......'
    ];
    rows.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(palette[row[x]])this.rect(x*2-16,y*2-34,2,2,palette[row[x]]);});
    // Cap tail trails softly instead of rotating the whole face with aim.
    this.rect(side?-16:8,-26+Math.round(step),6,5,'#28513b');this.rect(side?-18:11,-23+Math.round(step),5,3,'#70a34e');
    c.restore();c.restore();
  }

  blade(id,reach,width){
    const master=id==='master',deity=id==='greatsword',half=width/2;
    this.rect(6,-3,15,6,master?'#44365e':deity?'#315e58':'#543d2c');
    for(let x=8;x<20;x+=3)this.rect(x,-2,1,4,master?'#ad9aca':deity?'#82bda5':'#b3945c');
    this.rect(4,-4,4,8,master?'#9483bd':deity?'#83c9ad':'#d7b76b');
    this.rect(20,-half-4,4,width+8,master?'#7764a2':deity?'#458f81':'#b19050');
    this.rect(20,-half-4,2,width+8,master?'#baa6e2':deity?'#a0dbc0':'#f0d08b');
    if(master){this.rect(15,-half-7,7,3,'#9380c3');this.rect(15,half+4,7,3,'#9380c3');}
    if(deity){
      for(let x=24;x<reach;x+=1){const t=(x-24)/(reach-24),off=Math.sin(t*Math.PI*4)*half*.62*Math.min(1,(1-t)*6),thick=Math.min(3,(reach-x)*.4);
        for(const dir of [-1,1]){const y=Math.round(dir*off-thick/2);this.rect(x,y,Math.min(1,reach-x),thick,dir<0?'#659ed0':'#66b99b');this.rect(x,y,Math.min(1,reach-x),Math.min(1,thick),dir<0?'#c1e2ed':'#b5e9c3');}}
    }else{
      // Short pointed taper leaves enough straight blade to read as a full sword.
      const edge=[[24,-half],[reach-half/.38,-half],[reach,0]];
      this.contour([...edge,[24,0]],master?'#e5fff8':'#f0efd8',null);
      this.contour([[24,0],[reach,0],[reach-half/.38,half],[24,half]],master?'#79abb8':'#80969c',null);
      this.rect(27,-1,Math.max(0,reach-37),1,master?'#bce5df':'#c7d6cb');
      if(master){
        // Gilded collar and three small triangles engraved into the ricasso.
        this.rect(25,-half,3,width,'#b69348');this.rect(25,-half,1,width,'#f2d98d');
        for(const [x,y] of [[33,-2],[30,1],[36,1]]){this.rect(x,y,1,1,'#f2d98d');this.rect(x-1,y+1,3,1,'#c9a459');}
        this.rect(28,-half,11,1,'#afcaC7');
      }
    }
    this.rect(20,-2,4,4,master?'#ead283':deity?'#c3eccd':'#f0d39b');
  }
  weaponArm(p,angle,twoHanded=false){
    const c=this.ctx;c.save();c.translate(p.x,p.y);c.rotate(angle);
    this.rect(2,-5,9,9,'#234934');this.rect(3,-5,7,3,'#85a75e');
    this.rect(10,-4,7,8,'#513d2e');this.rect(11,-4,5,5,'#ebbd87');
    if(twoHanded){this.rect(0,3,10,5,'#244d37');this.rect(6,1,5,5,'#e6b581');}
    c.restore();
  }

  chain(x1,y1,x2,y2){
    const c=this.ctx,d=Math.hypot(x2-x1,y2-y1),angle=Math.atan2(y2-y1,x2-x1),count=Math.max(1,Math.ceil(d/7));
    c.save();c.translate(x1,y1);c.rotate(angle);c.lineWidth=1.3;
    for(let i=0;i<count;i++){const x=i*d/count;c.beginPath();c.ellipse(x,0,4,i%2?1.3:2.6,0,0,Math.PI*2);c.strokeStyle=i%2?'#71909c':'#c2d4d6';c.stroke();}c.restore();
  }
  twilightBall(x,y,r=19,angle=0){
    const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;c.save();c.rotate(a);this.contour([[r*.62,-3],[r,0],[r*.62,3]],'#bdced0','#354b59',.8);c.restore();}
    this.oval(0,0,r*.76,r*.76,'#304b59');this.oval(-1,-1,r*.66,r*.66,'#6c929f');this.oval(-4,-5,r*.38,r*.28,'#b4ced0');
    c.strokeStyle='#385968';c.lineWidth=2;c.beginPath();c.ellipse(0,0,r*.58,r*.2,.6,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,0,r*.2,r*.63,.4,0,Math.PI*2);c.stroke();
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;this.oval(Math.cos(a)*r*.47,Math.sin(a)*r*.47,1.5,1.5,'#e3e1ba');}
    this.contour([[-3,-2],[0,-7],[4,-1],[0,5]],'#91d8c8','#365c60',.8);c.restore();
  }
  drawWeapon(g){
    const {player:p,attack:a,time}=g,c=this.ctx,weapon=ForestContent.weapons[p.weapon];
    if(!a){
      const angle=p.dir+.35;c.save();c.translate(p.x,p.y);c.rotate(angle);
      if(weapon.id==='flail'){
        this.chain(16,0,45,0);this.twilightBall(48,0,18,time*.15);
      }else{
        this.blade(weapon.id,weapon.id==='greatsword'?88:weapon.id==='master'?82:68,weapon.width);
      }c.restore();this.weaponArm(p,angle,weapon.id==='greatsword');
    }else{
      const pose=ForestCombat.pose(a,p);
      if(pose.kind==='ball'){
        const x=pose.x,y=pose.y;this.chain(p.x,p.y,x,y);this.twilightBall(x,y,pose.radius||19,time*2);
        this.weaponArm(p,Math.atan2(y-p.y,x-p.x));
      }else{
        c.save();c.translate(p.x,p.y);c.rotate(pose.angle);
        this.blade(weapon.id,pose.reach,pose.width);
        c.restore();this.weaponArm(p,pose.angle,weapon.id==='greatsword');
      }
    }
    if(p.holding&&p.weapon==='master'){
      const charge=Math.min(1,p.holdTime/.7);this.rect(p.x-20,p.y+33,40,4,'#283b46');this.rect(p.x-20,p.y+33,40*charge,4,charge===1?'#f6e49e':'#8be3e1');
      if(charge===1){for(let i=0;i<4;i++)this.rect(p.x+Math.cos(time*5+i*Math.PI/2)*25,p.y+Math.sin(time*5+i*Math.PI/2)*25,3,3,'#f6e49e');}
    }
  }
  corruptedTree(g){
    const c=this.ctx,x=g.room.width/2,y=g.room.height/2;
    c.save();c.translate(x,y);c.globalAlpha=.8;
    for(let side of [-1,1]){
      for(let i=0;i<8;i++){this.rect(side*(38+i*30)-18,40+i*12,48,19,'#292030');this.rect(side*(42+i*30)-12,40+i*12,32,5,'#735070');}
      for(let i=0;i<7;i++){this.rect(side*(40+i*28)-20,-100-i*25,54,28,'#322936');this.rect(side*(46+i*28)-10,-110-i*25,16,31,'#533d55');}
    }
    this.rect(-61,-265,122,315,'#171020');this.rect(-48,-235,25,270,'#322039');this.rect(23,-255,20,295,'#422848');
    for(let i=0;i<30;i++){const a=i*2.4,px=Math.cos(a)*(130+i%4*40),py=-250+Math.sin(a)*80;this.rect(px-38,py-25,76,45,i%3?'#21152e':'#352141');if(i%3===0)this.rect(px-30,py-25,40,6,'#644373');}
    for(let i=0;i<12;i++){this.rect(-8+Math.sin(i*1.2)*18,-240+i*24,13,27,'#8b4b87');this.rect(-4+Math.sin(i*1.2)*18,-237+i*24,4,15,'#bd699a');}
    c.restore();
    this.text('L’ARBRE-MÈRE CORROMPU',x,y-355,15,'#b899ab');
  }
  mob(e,g){
    const c=this.ctx,wind=e.windup>0,progress=wind?1-e.windup/(e.windupMax||1):0;
    c.save();c.translate(e.x,e.y+12);
    if(e.type==='slime')c.scale(wind?1+progress*.35:1+Math.sin(e.t*7)*.06,wind?1-progress*.3:e.charge>0?1.25:1-Math.sin(e.t*7)*.06);
    if(e.type==='bat'){c.translate(0,e.charge>0?-12:Math.sin(e.t*12)*5);c.scale(wind?.7:1+Math.sin(e.t*17)*.22,1);}
    if(e.type==='spitter')c.scale(wind?1+progress*.25:1,wind?1+progress*.15:1);
    if(e.type==='knight')c.rotate(wind?Math.cos(e.aim)*-.18:Math.sin(e.t*8)*.04);
    // Continuous paths avoid magnifying and rounding the old 3px sprite cells.
    const pal=this.palettes[e.type],body=e.hit>0?'#fff0ce':pal.a,light=pal.b,dark=pal.d;
    const oval=(x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
    const shape=(points,color)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=dark;c.lineWidth=1.2;c.lineJoin='round';c.stroke();};
    const eyes=(y,spread=7)=>{for(const s of [-1,1]){oval(s*spread,y,3,4,dark);oval(s*spread+.5,y-1,1.2,1.6,pal.e);}};
    if(e.type==='slime'){
      oval(0,-11,18,13,dark);oval(0,-13,16.5,12,body);oval(-4,-18,9,5,light);
      oval(-9,-21,3,1.6,'#d5e5b3');eyes(-12);oval(0,-5,3,1.1,dark);
      for(let i=0;i<3;i++)oval(-10+i*10,-2,4,2,body);
    }else if(e.type==='bat'){
      const flap=Math.sin(e.t*17)*(wind?2:9);
      for(const s of [-1,1]){c.save();c.scale(s,1);shape([[4,-14],[18,-24-flap],[29,-17-flap],[24,-6],[17,-10],[10,-4],[4,-6]],body);shape([[7,-13],[18,-20-flap],[23,-16-flap],[16,-12],[10,-8]],light);c.restore();}
      oval(0,-12,8,11,dark);oval(0,-12,6,9,body);shape([[-7,-19],[-6,-29],[-1,-21],[5,-28],[7,-18]],body);eyes(-15,3.5);oval(0,-5,2,1,pal.e);
    }else if(e.type==='spitter'){
      for(const s of [-1,1]){oval(s*10,-2+Math.sin(e.t*6+s)*1.3,6,3,dark);shape([[s*4,-21],[s*8,-32],[s*15,-26],[s*10,-20]],'#647c48');}
      oval(0,-13,16,15,dark);oval(0,-15,14,13,body);oval(-4,-22,8,4,light);eyes(-18);
      oval(0,-8,6+progress*2,5+progress*2,light);oval(0,-8,3+progress*2,3+progress*2,dark);
      for(const s of [-1,1]){oval(s*11,-12,2,3,'#936444');oval(s*9,-25,1.5,1.5,'#ead09a');}
    }else{
      const step=Math.sin(e.t*(e.charge>0?18:7))*2;
      for(const s of [-1,1]){oval(s*7,-2+s*step,5,3,dark);shape([[s*3,-5+s*step],[s*4,-13],[s*10,-13],[s*11,-4+s*step]],body);}
      shape([[-11,-21],[-8,-9],[8,-9],[11,-21],[6,-27],[-6,-27]],body);shape([[-7,-22],[-5,-12],[1,-12],[1,-24]],light);
      oval(0,-29,11,10,dark);oval(0,-30,9.5,8,body);shape([[-8,-34],[-3,-38],[3,-38],[8,-34],[1,-34],[1,-25],[-1,-25],[-1,-34]],light);
      shape([[-8,-30],[8,-30],[7,-27],[-7,-27]],dark);oval(4,-28.5,2,1,pal.e);
      c.save();c.translate(-13,-17);c.rotate(-progress*.5);shape([[-6,-7],[5,-7],[6,4],[0,9],[-6,4]],dark);shape([[-4,-5],[3,-5],[3,3],[0,6],[-4,3]],light);c.restore();
      c.save();c.translate(14,-16);c.rotate(progress*.7+(e.charge>0?-.7:0));shape([[-2,2],[-2,-15],[0,-21],[2,-15],[2,2]],light);shape([[-5,1],[5,1],[5,3],[-5,3]],pal.e);c.restore();
    }
    c.restore();
  }
  bossPose(e){
    const p=e.windup>0?Math.sin((1-e.windup/(e.windupMax||1))*Math.PI/2):0;
    const pose={sx:1,sy:1,lean:0,lift:0,armX:0,armY:0,p};
    if(e.action==='seeds'){pose.sx+=p*.23;pose.sy+=p*.12;}
    if(e.action==='roots'){pose.sy+=p*.22;pose.lift=-p*12;pose.armY=p*22;}
    if(e.action==='charge'||e.action==='hunt'){pose.sy-=p*.25;pose.lean=Math.cos(e.aim)*p*.25;pose.armX=-p*22;}
    if(e.action==='volley'){pose.armX=-p*30;pose.armY=-p*28;pose.lift=-p*8;}
    if(e.action==='thorns'){pose.armX=p*18;pose.armY=p*27;pose.lift=-p*22;}
    if(e.action==='eruption'){pose.armY=-p*90;pose.armX=-p*15;pose.sy+=p*.07;}
    if(e.action==='spiral'){pose.armX=p*35;pose.armY=-p*38;pose.lift=-p*14;}
    if(e.action==='rootsweep'){pose.lean=-p*.18;pose.armX=p*20;pose.armY=-p*55;}
    return pose;
  }
  plate(x,y,w,h,base,light,shadow){
    this.rect(x+3,y,w-6,h,shadow);this.rect(x,y+3,w,h-6,shadow);
    this.rect(x+3,y+3,w-6,h-6,base);this.rect(x+5,y+3,w-10,2,light);this.rect(x+3,y+5,2,h-12,light);
    this.rect(x+w-6,y+7,3,h-12,shadow);this.rect(x+7,y+h-5,w-14,2,shadow);
  }
  rootGuardian(e,g,pose){
    const c=this.ctx,t=g.time,wind=pose.p,eye=e.phase?'#ffba72':'#f3da87';
    for(let i=0;i<6;i++){
      const x=-51+i*19,step=Math.sin(t*(e.charge>0?18:3)+i)*3,lift=e.action==='roots'?wind*(i%2?18:8):0;
      for(let k=0;k<4;k++){const rx=x+Math.sin(i+k)*k*2,y=14+k*8+step+lift;this.rect(rx-7,y,15-k,10,'#3c352b');this.rect(rx-4,y,3,8,'#93805b');this.rect(rx+2,y+2,2,7,'#68533b');}
      this.rect(x-10,44+step+lift,20,5,'#302e25');
    }
    // Gnarled branch shoulders with hanging lichen.
    for(const sign of [-1,1]){
      c.save();c.translate(sign*39,-35);c.rotate(sign*(.12+Math.sin(t*1.8)*.025+(e.action==='roots'?wind*.25:0)));
      for(let k=0;k<5;k++){this.plate(sign*k*5-11,-k*13,22,21,'#665641','#a79266','#302f27');if(k>1){this.rect(sign*k*5+sign*9,-k*13+4,sign<0?8:6,4,'#8e7855');}}
      c.restore();
    }
    this.plate(-43,-52,86,83,'#716348','#a89467','#353c2b');
    for(let i=0;i<9;i++){
      const x=-36+i*8,h=26+(i*13)%24;this.rect(x,-44,3,h,'#4f4834');this.rect(x+3,-42,2,h-5,'#96805a');this.rect(x,10,4,17+i%3*3,'#4e4431');
    }
    this.plate(-37,-38,74,47,'#81735b','#b7a67a','#494533');
    const gaze=Math.max(-2,Math.min(2,(g.player.x-e.x)/100));
    for(const sign of [-1,1]){
      const x=sign<0?-29:10;this.rect(x,-28,20,12,'#232d24');this.rect(x+2,-25,15,6,eye);this.rect(x+7+gaze,-25,3,6,'#5e5934');this.rect(x-2,-33,24,5,'#4f533b');this.rect(x,-34,20,2,'#a39b6d');
    }
    this.rect(-4,-20,8,21,'#a29167');this.rect(3,-17,3,20,'#5b5038');
    const jaw=e.action==='seeds'?wind*16:Math.sin(t*2)*1.5;
    this.plate(-21,0,42,15+jaw,'#282f24','#5b6443','#1d261e');
    for(let i=0;i<5;i++)this.rect(-17+i*8,3,4,4,'#bbab72');
    if(e.action==='seeds'&&wind>0){this.rect(-8,8,16,Math.max(2,jaw-3),'#b7bf73');this.rect(-4,10,7,4,'#e7df9a');}
    // Small, layered leaves soften the former rectangular canopy.
    for(let i=0;i<24;i++){
      const x=Math.cos(i*2.4)*(24+i%4*9),y=-61-Math.sin(i*1.7)*17+Math.sin(t*2+i)*1.5;
      this.plate(x-8,y-5,17,12,i%3?'#547344':'#77914f','#a1b467','#334d35');
      if(i%4===0){this.rect(x,y+6,2,13,'#66894b');this.rect(x-3,y+13,5,3,'#8b9d54');}
    }
  }
  shadowWarden(e,g,pose){
    const c=this.ctx,t=g.time,wind=pose.p; c.translate(0,Math.sin(t*2)*3);
    // Torn cloth follows the hover, while the mask stays legible.
    for(let i=0;i<7;i++){
      const x=-43+i*13,sway=Math.sin(t*2.6+i*.8)*(e.charge>0?7:3),hem=24+Math.sin(t*3+i)*7;
      this.rect(x+sway,-29,14,57+hem,'#222b3a');this.rect(x+sway+3,-24,5,48+hem,i%2?'#3b4556':'#303a4b');this.rect(x+sway+8,16,2,hem+9,'#596075');
    }
    this.plate(-39,-53,78,65,'#444d63','#7d8592','#202b3c');
    for(const sign of [-1,1]){
      this.plate(sign<0?-46:21,-48,25,46,'#55586e','#a1a4a8','#2a3346');
      for(let i=0;i<4;i++)this.rect(sign*(14+i*5)-2,-37+i*12,3,13,'#95846b');
    }
    this.plate(-35,-76,70,42,'#45495e','#9193a0','#1c2333');this.plate(-26,-66,52,33,'#151f30','#343e50','#0c1421');
    this.plate(-21,-62,42,38,'#87969d','#c7d2cc','#43596a');
    for(const sign of [-1,1]){
      this.rect(sign<0?-18:5,-55,14,8,'#192b3a');this.rect(sign<0?-16:7,-52,10,3,'#aee7e5');
      this.rect(sign<0?-21:16,-38,5,13,'#b0bbb7');
    }
    this.rect(-3,-49,6,20,'#c9c3a4');this.rect(-7,-30,14,3,'#283747');this.rect(-1,-70,2,8,'#cfb986');
    this.plate(-9,-16,18,24,'#6a727e','#ad9d7a','#303b4d');this.rect(-3,-11,6,9,'#b8cfbb');
    for(const sign of [-1,1]){
      const x=sign*(57+pose.armX),y=-25+pose.armY+Math.sin(t*2+sign)*3;
      this.plate(x-11,y-4,22,26,'#63717f','#b3c2bf','#2c3e4b');
      for(let i=0;i<3;i++){const curl=wind*(e.action==='volley'?-5:4);this.rect(x-8+i*6,y+16,4,11+curl+i%2*4,'#bec8c0');this.rect(x-8+i*6,y+24+curl,4,3,'#788d95');}
      this.rect(x-sign*14-2,y+8,5,12,'#9fb1b2');
      if(e.action==='volley'&&wind>0){this.rect(x-6,y-17,12,12,'#588f91');this.rect(x-3,y-14,6,6,'#d6f7db');}
    }
    for(let i=0;i<3;i++){const x=Math.sin(t*.8+i*2)*33;this.rect(x,41+Math.sin(t*2+i)*6,2,5,'#718b92');}
  }
  darkKing(e,g,pose){
    if(e.stage===2){this.unboundKing(e,g,pose);return;}
    const c=this.ctx,t=g.time,rage=e.stage===2,base=rage?'#634052':'#4e4b65',edge=rage?'#c08a81':'#aaa2b7',shade='#242031',gold='#bd9d70';
    // Split cape and jagged second-phase wings follow independent rhythms.
    for(const sign of [-1,1]){
      for(let i=0;i<5;i++){const sway=Math.sin(t*2+i*.7)*4;this.rect(sign*(50+i*8)-9,-73+i*6,18,125-i*9+sway,rage?'#3b203d':'#302b45');this.rect(sign*(50+i*8)-7,-66+i*6,3,111-i*8+sway,'#55405c');}
      if(rage)for(let i=0;i<6;i++){const flap=Math.sin(t*3)*i*2,x=sign*(77+i*14);this.plate(x-12,-115+i*14+flap,26,64-i*6,'#482747','#a06483','#21182f');this.rect(x,-110+i*14+flap,2,44-i*4,'#c08297');}
      const step=Math.sin(t*(e.charge>0?16:2)+sign)*2;
      this.plate(sign*36-17,13,34,55,base,edge,shade);this.plate(sign*36-22,57+step,44,20,base,edge,shade);
      this.plate(sign*36-14,28,28,20,'#666073',gold,shade);this.rect(sign*36-2,35,4,11,gold);
      const ax=sign*(91+pose.armX),ay=pose.armY*(e.action==='rootsweep'&&sign===1?-.25:1);
      this.plate(ax-20,-45+ay,40,64,base,edge,shade);
      for(let i=0;i<3;i++)this.plate(ax-19,-38+ay+i*18,38,20,i%2?base:'#62596e',edge,shade);
      this.plate(ax-22,7+ay,44,24,base,gold,shade);for(let i=0;i<4;i++)this.rect(ax-15+i*8,19+ay,5,12,edge);
      this.plate(ax-29,-70+ay,58,29,base,edge,shade);
      for(let i=0;i<3;i++){this.rect(ax-18+i*18,-77+ay-i%2*5,8,13,gold);this.rect(ax-16+i*18,-80+ay-i%2*5,4,5,'#e1c59a');}
    }
    this.plate(-65,-87,130,121,base,edge,shade);
    for(let row=0;row<4;row++)for(const sign of [-1,1]){
      const x=sign<0?-53:5,y=-75+row*23;this.plate(x,y,48,25,row%2?base:'#655c73',edge,shade);this.rect(x+(sign<0?39:5),y+7,3,3,gold);
    }
    this.plate(-16,-77,32,89,'#372e43',gold,shade);
    const pulse=.7+Math.sin(t*3)*.2;c.save();c.globalAlpha=pulse;this.rect(-5,-57,10,34,rage?'#ed997c':'#c4c2e2');this.rect(-12,-47,24,5,rage?'#ed997c':'#c4c2e2');c.restore();
    this.plate(-43,-125,86,48,base,edge,shade);this.rect(-31,-109,62,22,'#171626');
    // Obsidian faceplate, serrated crown and violet seams in the demonic armour.
    for(const sign of [-1,1]){
      for(let i=0;i<5;i++){this.rect(sign*(44+i*8)-5,-133-i*7,10,15,'#282337');this.rect(sign*(44+i*8)-3,-135-i*7,3,9,'#86718f');}
      this.rect(sign<0?-21:9,-95,12,18,'#292335');this.rect(sign<0?-18:10,-94,7,3,'#9657bd');
      for(let i=0;i<4;i++){this.rect(sign*(24+i*8)-2,-73+i*20,3,12,'#422445');this.rect(sign*(24+i*8)-1,-72+i*20,1,7,'#b677cb');}
    }
    for(const sign of [-1,1]){
      this.rect(sign<0?-26:10,-102,16,5,rage?'#ffc78d':'#b9e7ec');this.rect(sign<0?-31:8,-113,24,5,edge);
      this.rect(sign*34-5,-144,10,24,gold);this.rect(sign*40-4,-154,8,17,'#e2c795');this.rect(sign*44-2,-159,4,9,gold);
      this.plate(sign<0?-41:22,-96,19,25,base,edge,shade);
    }
    this.rect(-5,-122,10,39,gold);this.rect(-2,-119,3,34,'#e6cf9f');
    this.plate(-59,23,118,16,'#78674f',gold,shade);this.skull(0,30,1.05,gold);
    if(rage)for(let i=0;i<6;i++){const x=-45+i*17;this.rect(x,-63+(i%3)*22,2,16,'#ef9b8c');this.rect(x,-49+(i%3)*22,7,2,'#783f60');}
    if(e.action==='spiral'&&pose.p>0)for(let i=0;i<6;i++){const a=t*5+i*Math.PI/3;this.rect(Math.cos(a)*73-3,-61+Math.sin(a)*24,6,6,'#e0a4d3');}
  }
  unboundKing(e,g,pose){
    const c=this.ctx,t=g.time,wind=pose.p,opening=Math.max(0,1-(e.transform||0)/1.8);
    // One anatomical silhouette: broad shoulders, elbows, wrists and a horned face.
    const ribbon=(points,width,color)=>{for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let i=0;i<=steps;i++){const f=i/steps;this.rect(Math.round((a[0]+(b[0]-a[0])*f)/2)*2-width/2,Math.round((a[1]+(b[1]-a[1])*f)/2)*2-width/2,width,width,color);}}};
    const shape=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
    for(const sign of [-1,1]){
      const mirror=points=>points.map(([x,y])=>[x*sign,y]);
      // Heavy torn mantle, connected to the waist rather than floating ribbons.
      const sway=Math.sin(t*1.8+sign)*7;
      shape(mirror([[16,-25],[43,-15],[57,18],[63+sway,61],[39+sway,107],[20,85],[28,42],[8,8]]),'#170e2e');
      shape(mirror([[31,-9],[45,20],[47+sway,58],[28+sway,93],[35,53],[25,24]]),'#472277');
      ribbon(mirror([[40,9],[53+sway,56],[35+sway,89]]),4,'#7140a0');
      // Two substantial arms; shoulder stays attached while elbow and hand anticipate attacks.
      const shoulder=[sign*41,-91],elbow=[sign*(78+pose.armX*.3),-59+pose.armY*.25],hand=[sign*(101+pose.armX*.65),-93+pose.armY*.8+Math.sin(t*2.3+sign)*3];
      ribbon([shoulder,elbow,hand],31,'#0c0a19');
      ribbon([[shoulder[0],shoulder[1]+2],elbow,[hand[0],hand[1]+4]],24,'#362049');
      ribbon([[shoulder[0]-sign*3,shoulder[1]-5],[elbow[0]-sign*5,elbow[1]-4]],10,'#614078');
      ribbon([[elbow[0]+sign*3,elbow[1]-4],[hand[0]+sign*3,hand[1]+5]],10,'#71305f');
      this.plate(shoulder[0]-19,shoulder[1]-14,38,30,'#382346','#80618e','#160d24');
      shape(mirror([[47,-104],[54,-121],[61,-100],[69,-101],[64,-90]]),'#a088b3');
      this.plate(elbow[0]-12,elbow[1]-10,24,21,'#4f2a60','#856291','#1b112d');
      this.plate(hand[0]-15,hand[1]-15,30,28,'#91245c','#d34d89','#36112e');
      for(let finger=0;finger<4;finger++){
        const x=hand[0]-12+finger*8,len=13+(finger===1||finger===2?7:0),curl=wind*(e.action==='eruption'?11:4);
        ribbon([[x,hand[1]-7],[x+sign*2,hand[1]-len-10],[x-sign*3,hand[1]-len-17+curl]],6,'#c84481');
        ribbon([[x-sign*3,hand[1]-len-17+curl],[x-sign*6,hand[1]-len-12+curl]],3,'#ead3dd');
      }
      ribbon([[hand[0]-sign*11,hand[1]+4],[hand[0]-sign*23,hand[1]-3],[hand[0]-sign*20,hand[1]-13]],7,'#b33372');
    }
    // Tapered ribcage and abdomen anchor both shoulders and the neck.
    shape([[-35,-109],[35,-109],[53,-88],[42,-52],[29,-26],[24,5],[0,27],[-24,5],[-29,-26],[-42,-52],[-53,-88]],'#100d22');
    for(const sign of [-1,1]){
      shape([[sign*5,-96],[sign*33,-100],[sign*43,-84],[sign*34,-69],[sign*8,-73]],'#4b2b61');
      ribbon([[sign*10,-95],[sign*31,-97],[sign*39,-87]],4,'#795184');
      for(let i=0;i<3;i++)ribbon([[sign*8,-63+i*15],[sign*(30-i*4),-67+i*15],[sign*(34-i*5),-60+i*15]],6,'#452653');
      ribbon([[sign*24,-12],[sign*15,9]],5,'#613576');
    }
    this.plate(-13,-122,26,23,'#3c284d','#796282','#110d20');
    // Clearly separated skull: brow, eye sockets, cheekbones and pointed jaw.
    shape([[-21,-156],[-12,-166],[12,-166],[21,-156],[24,-132],[17,-119],[8,-110],[-8,-110],[-17,-119],[-24,-132]],'#100d20');
    shape([[-18,-151],[-10,-159],[10,-159],[18,-151],[17,-134],[10,-128],[0,-135],[-10,-128],[-17,-134]],'#644569');
    for(const sign of [-1,1]){
      ribbon([[sign*15,-154],[sign*30,-166],[sign*33,-184],[sign*25,-198]],10,'#24182f');
      ribbon([[sign*17,-156],[sign*28,-167],[sign*30,-183]],4,'#92749d');
      shape([[sign*3,-143],[sign*18,-147],[sign*16,-137],[sign*5,-137]],'#100b20');
      ribbon([[sign*6,-140],[sign*15,-142]],3,'#e5edff');
      shape([[sign*19,-134],[sign*12,-127],[sign*12,-118],[sign*21,-128]],'#a77b9a');
    }
    shape([[-9,-128],[0,-131],[9,-128],[7,-119],[0,-115],[-7,-119]],'#352037');
    this.rect(-7,-124,14,3,'#060810');for(let i=0;i<3;i++)this.rect(-5+i*4,-125,2,4,'#d6bbd1');
    const pulse=.8+Math.sin(t*5)*.12;
    c.save();c.globalAlpha*=pulse;
    const crack=[[0,-103],[-3,-86],[3,-72],[-2,-54],[2,-35],[0,-18]];
    ribbon(crack,8,'#453d91');ribbon(crack,3,'#c1eaff');
    ribbon([[0,-83],[-14,-90]],2,'#8eaeef');ribbon([[1,-70],[17,-81]],2,'#b9e2ff');c.restore();
    if(wind>0){
      if(e.action==='spiral')for(let i=0;i<7;i++){const a=t*4+i*Math.PI*2/7;this.rect(Math.cos(a)*65-2,-61+Math.sin(a)*26,4,7,'#a577e8');}
      if(e.action==='rootsweep')for(const sign of [-1,1])ribbon([[sign*27,-15],[sign*(55+wind*25),9],[sign*(68+wind*34),35]],4,'#7130b1');
    }
    // Armour fragments separate visibly during the existing invulnerable transition.
    if(e.transform>0){
      c.save();c.globalAlpha*=1-opening;
      for(let i=0;i<12;i++){const a=i*Math.PI*2/12,x=Math.cos(a)*(24+opening*150),y=-58+Math.sin(a)*(30+opening*115)+opening*opening*40;c.save();c.translate(x,y);c.rotate(opening*(i%2?1:-1)*2);this.plate(-12,-15,24,30,'#51465e','#ac99b2','#211e30');c.restore();}c.restore();
    }
  }
  boss(e,g){
    const c=this.ctx;
    c.save();
    const pose=this.bossPose(e),anticipation=pose.p;
    c.translate(e.x,e.y+pose.lift);c.rotate(pose.lean);c.scale(pose.sx,pose.sy);c.translate(-e.x,-e.y+Math.sin(e.t*4)*3);
    c.save();c.translate(e.x,e.y);if(e.hit>0)c.globalAlpha=.68;
    if(e.transform>0)c.globalAlpha*=.85;
    if(e.bossLevel===0)this.rootGuardian(e,g,pose);
    else if(e.bossLevel===1)this.shadowWarden(e,g,pose);
    else this.darkKing(e,g,pose);
    c.restore();
    if(e.recover>0)this.text('VULNÉRABLE ×2',e.x,e.y-(e.bossLevel===2?166:106),12,'#c8e98b');
    c.restore();
  }
  warnings(g){
    const c=this.ctx,tau=Math.PI*2;
    const palettes={
      roots:{rim:'#e6cd83',earth:'#393325',vein:'#987449',body:'#705132',edge:'#b59359',tip:'#e4d197'},
      thorns:{rim:'#ecadda',earth:'#261d36',vein:'#80528e',body:'#472444',edge:'#ab6588',tip:'#f4c6cf'},
      eruption:{rim:'#d4bcff',earth:'#160d28',vein:'#9c59df',body:'#512576',edge:'#ab5be7',tip:'#eee0ff'},
      rootsweep:{rim:'#d9b4fa',earth:'#201027',vein:'#8842a3',body:'#351b4c',edge:'#9a57c3',tip:'#e0b7f5'}
    };
    for(const h of g.hazards){
      const kind=h.kind||(g.level===0?'roots':g.level===1?'thorns':'eruption'),p=palettes[kind]||palettes.roots;
      const warning=h.delay>0,progress=1-Math.max(0,h.delay)/(h.warningDuration||1),age=Math.max(0,Math.min(1,1-h.life/.35));
      const r=h.radius,seed=h.x*.17+h.y*.31;
      c.save();c.translate(h.x,h.y);
      const circle=(radius)=>{c.beginPath();c.arc(0,0,radius,0,tau);};
      const line=(points,color,width=2)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
      const polygon=(points,color)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();};
      // A fixed boundary always matches the damaging circle, including during impact.
      circle(r);c.fillStyle=p.earth;c.globalAlpha=warning?.42+progress*.18:.88;c.fill();c.globalAlpha=1;
      circle(r);c.strokeStyle='#120e1b';c.lineWidth=5;c.stroke();
      circle(r);c.strokeStyle=p.rim;c.lineWidth=2;c.stroke();
      c.save();circle(r-3);c.clip();
      // Branching fissures stay on the ground throughout the anticipation.
      for(let i=0;i<6;i++){
        const a=seed+i*tau/6,cs=Math.cos(a),sn=Math.sin(a),extent=r*(.38+progress*.49);
        const bend=[cs*extent*.52-sn*5,sn*extent*.52+cs*5],end=[cs*extent,sn*extent];
        line([[cs*5,sn*5],bend,end],p.vein,warning?2:3);
        line([bend,[bend[0]+Math.cos(a+.8)*extent*.34,bend[1]+Math.sin(a+.8)*extent*.34]],p.vein,1);
      }
      if(warning){
        // A closing inner ring communicates timing without changing the unsafe area.
        c.globalAlpha=.4+progress*.5;circle(r*(.85-.6*progress));c.strokeStyle=p.rim;c.lineWidth=1.5;c.stroke();c.globalAlpha=1;
        for(let i=0;i<4;i++){const a=i*tau/4;const x=Math.cos(a)*r*.72,y=Math.sin(a)*r*.72;
          polygon([[x-3,y],[x,y-4],[x+3,y],[x,y+4]],p.rim);
        }
      }else{
        // Every visible burst remains within the marked footprint; no oversized hitbox cues.
        const rise=Math.min(1,age/.16),fade=Math.min(1,(1-age)/.22);
        c.globalAlpha=fade;
        const count=kind==='eruption'?7:kind==='rootsweep'?3:5;
        for(let i=0;i<count;i++){
          const a=seed+i*2.4,spread=i===0?0:r*(.25+(i%3)*.14),x=Math.cos(a)*spread,y=Math.sin(a)*spread*.65+r*.25;
          const height=r*(.62+(i%3)*.16)*rise,bend=Math.sin(seed+i)*r*.16,w=r*(kind==='eruption'?.22:.15);
          if(kind==='roots'){
            polygon([[x-w,y],[x-w*.8,y-height*.38],[x+bend-w*.45,y-height*.76],[x+bend+5,y-height],[x+bend+w*.38,y-height*.63],[x+w,y-height*.22],[x+w,y]],p.body);
            line([[x-w*.3,y-3],[x-w*.35,y-height*.35],[x+bend,y-height*.7],[x+bend+5,y-height]],p.edge,3);
            line([[x,y-height*.38],[x+w*1.4,y-height*.54],[x+w*1.7,y-height*.78]],p.edge,2);
          }else if(kind==='rootsweep'){
            polygon([[x-w,y],[x-w*1.1,y-height*.38],[x-w*.4,y-height*.8],[x+w*.8,y-height],[x+w*1.5,y-height*.73],[x+w*.5,y-height*.79],[x+w*.1,y-height*.58],[x+w*.6,y-height*.23],[x+w,y]],p.body);
            polygon([[x-w*.55,y-2],[x-w*.65,y-height*.4],[x-w*.15,y-height*.75],[x+w*.8,y-height],[x+w*.3,y-height*.68],[x-w*.1,y-height*.39]],p.edge);
            line([[x+w*.8,y-height],[x+w*1.5,y-height*.73]],p.tip,2);
          }else if(kind==='thorns'){
            polygon([[x-w,y],[x-w*.6,y-height*.45],[x+bend,y-height],[x+w*.55,y-height*.48],[x+w,y]],p.body);
            polygon([[x-w*.2,y-2],[x+bend,y-height],[x+w*.4,y-height*.45]],p.edge);
            for(let j=1;j<3;j++){const by=y-height*j*.26;polygon([[x-w*.45,by+4],[x-w*(1.8-j*.25),by-9],[x,by-4]],p.edge);}
            line([[x+bend,y-height],[x+bend*.8,y-height*.76]],p.tip,2);
          }else{
            const flicker=Math.sin(g.time*24+i)*r*.07;
            polygon([[x-w,y],[x-w*.85,y-height*.36],[x-w*.15,y-height*.64],[x+bend,y-height+flicker],[x+w*.42,y-height*.58],[x+w,y-height*.3],[x+w*.7,y]],p.body);
            polygon([[x-w*.45,y],[x-w*.3,y-height*.34],[x+bend*.7,y-height*.77+flicker],[x+w*.4,y-height*.31],[x+w*.4,y]],p.edge);
            polygon([[x-w*.16,y],[x,y-height*.55],[x+w*.17,y]],p.tip);
          }
          const moteY=y-height-6-age*12;this.rect(x+bend-1,moteY,3,3,p.tip);
        }
        c.globalAlpha=fade*.7;circle(r*(.4+age*.6));c.strokeStyle=p.tip;c.lineWidth=2;c.stroke();
      }
      c.restore();
      // Keep the danger outline legible even where several effects overlap.
      c.globalAlpha=warning?.8:1;circle(r);c.strokeStyle=p.rim;c.lineWidth=2;c.stroke();c.restore();
    }
  }
  camera(g){
    return {x:Math.max(0,Math.min(g.room.width-960,g.player.x-480)),y:Math.max(0,Math.min(g.room.height-640,g.player.y-320))};
  }
  draw(g){
    const c=this.ctx,{room:r,player:p,time}=g,w=r.width,h=r.height,view=this.camera(g);
    c.save();c.setTransform(this.renderScale,0,0,this.renderScale,0,0);
    c.save();c.clearRect(0,0,960,640);c.translate(-view.x,-view.y);
    c.translate(Math.round((Math.random()-.5)*g.shake),Math.round((Math.random()-.5)*g.shake));
    this.floor(g);this.decorations(g);
    if(g.level===1){
      const light=c.createRadialGradient(p.x,p.y,70,p.x,p.y,370);light.addColorStop(0,'#060a1400');light.addColorStop(1,'#060a1478');c.fillStyle=light;c.fillRect(0,0,w,h);
    }
    this.warnings(g);
    for(const d of g.drops){
      const y=d.y+Math.sin(time*4)*3;
      if(d.type==='rupee'){c.save();c.translate(d.x,y);c.rotate(Math.PI/4);this.rect(-6,-6,12,12,'#85c7a2');this.rect(-4,-4,4,9,'#d0e7a6');c.restore();}
      else if(d.type==='key')this.bossKey(d.x,y);
      else this.text('♥',d.x,y,25,'#e68f7e');
    }
    const actors=[...r.enemies,{...p,type:'player'}].sort((a,b)=>a.y-b.y);
    for(const e of actors){
      c.fillStyle='#07131e70';c.beginPath();c.ellipse(e.x,e.y+12,e.radius+5,e.type==='boss'?e.radius*.35:7,0,0,Math.PI*2);c.fill();
      if(e.type==='player'){
        if(p.inv>0&&Math.floor(time*15)%2===0)c.globalAlpha=.45;
        const behind=g.attack?Math.sin(ForestCombat.pose(g.attack,p).angle??p.dir)<-.3:Math.sin(p.dir+.35)<-.3;
        if(behind)this.drawWeapon(g);this.hero(g);if(!behind)this.drawWeapon(g);c.globalAlpha=1;
        if(p.dashCD>0){this.rect(p.x-16,p.y+24,32,3,'#233c2c');this.rect(p.x-16,p.y+24,32*(1-p.dashCD/g.dashCooldown()),3,'#a9c97a');}
      }else if(e.type==='boss')this.boss(e,g);
      else{
        this.mob(e,g);
        if(e.hp<e.max){this.rect(e.x-16,e.y-29,32,3,'#23392b');this.rect(e.x-16,e.y-29,32*Math.max(0,e.hp/e.max),3,'#c1c283');}
      }
    }
    for(const s of g.shots){this.rect(s.x-6,s.y-6,12,12,g.level===1?'#9977c8':'#b46e5c');this.rect(s.x-3,s.y-3,6,6,'#f9d69c');}
    for(const b of g.beams){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));this.rect(-10,-b.radius,20,b.radius*2,'#99e3e3');this.rect(-8,-2,16,4,'#f2fff4');c.restore();}
    if(g.boomerang){c.save();c.translate(g.boomerang.x,g.boomerang.y);c.rotate(time*20);this.contour([[-14,-10],[-11,-14],[11,-12],[14,10],[10,14],[5,-5]],'#d7aa5e','#62452f');this.contour([[-11,-12],[9,-10],[12,10],[9,7],[6,-7]],'#f4d995',null);c.restore();}
    for(const particle of g.particles)this.rect(particle.x,particle.y,particle.size,particle.size,particle.color);
    for(let i=0;i<16;i++){const x=(i*177+Math.sin(time*.4+i)*60+g.runSeed)%(w-130)+65,y=(i*97+time*(3+i%3))%(h-170)+85;c.globalAlpha=.25+Math.sin(time*2+i)*.2;this.rect(x,y,3,3,g.level===1?'#a3b6f6':'#d6e6a2');}c.globalAlpha=1;
    const vignette=c.createRadialGradient(view.x+480,view.y+320,290,view.x+480,view.y+320,590);vignette.addColorStop(0,'#06151000');vignette.addColorStop(1,'#06151088');c.fillStyle=vignette;c.fillRect(view.x,view.y,960,640);c.restore();
    if((r.units||1)>1&&!r.clear){
      const sectors=new Set();
      for(const enemy of r.enemies){
        const x=enemy.x-view.x,y=enemy.y-view.y;if(enemy.hp<=0||(x>=20&&x<=940&&y>=20&&y<=620))continue;
        const a=Math.atan2(y-320,x-480),sector=Math.round(a*4/Math.PI);if(sectors.has(sector))continue;sectors.add(sector);
        const factor=Math.min(445/Math.max(1,Math.abs(x-480)),240/Math.max(1,Math.abs(y-320)));
        c.save();c.translate(480+(x-480)*factor,320+(y-320)*factor);c.rotate(a);this.contour([[8,0],[-5,-5],[-2,0],[-5,5]],'#d6a284','#442b38');c.restore();
      }
    }
    const boss=r.enemies.find(e=>e.type==='boss');
    if(boss){
      this.text(ForestContent.floors[g.level].bossName,480,38,14,'#ead5b4');
      this.rect(260,48,440,10,'#1f2030');this.rect(262,50,436*Math.max(0,boss.hp/boss.max),6,boss.stage===2?'#e39888':'#c4b476');
    }
    c.restore();
  }
  mapLayout(g){
    const rooms=g.rooms.filter(r=>r.type!=='secret'||r.visited);
    const minX=Math.min(...rooms.map(r=>r.x)),maxX=Math.max(...rooms.map(r=>r.x+(r.spanX||1)));
    const minY=Math.min(...rooms.map(r=>r.y)),maxY=Math.max(...rooms.map(r=>r.y+(r.spanY||1)));
    const step=Math.min(39,240/(maxX-minX),135/(maxY-minY)),gap=step*.23;
    const ox=(260-(maxX-minX)*step)/2,oy=(155-(maxY-minY)*step)/2;
    const visible=r=>r.visited||rooms.some(v=>v.visited&&g.connected(v,r));
    const boxes=rooms.filter(visible).map(room=>({room,x:ox+(room.x-minX)*step+gap/2,y:oy+(room.y-minY)*step+gap/2,w:(room.spanX||1)*step-gap,h:(room.spanY||1)*step-gap}));
    const links=[];
    for(const a of boxes)for(const b of boxes){
      if(a.room.id>=b.room.id||!g.connected(a.room,b.room)||(!a.room.visited&&!b.room.visited))continue;
      const ar=a.room,br=b.room,d=ForestContent.doorBetween(ar,br);if(!d)continue;
      if(d.dx){const y=oy+((Math.max(ar.y,br.y)+Math.min(ar.y+(ar.spanY||1),br.y+(br.spanY||1)))/2-minY)*step;
        links.push({a,b,x1:d.dx>0?a.x+a.w:a.x,y1:y,x2:d.dx>0?b.x:b.x+b.w,y2:y});
      }else{const x=ox+((Math.max(ar.x,br.x)+Math.min(ar.x+(ar.spanX||1),br.x+(br.spanX||1)))/2-minX)*step;
        links.push({a,b,x1:x,y1:d.dy>0?a.y+a.h:a.y,x2:x,y2:d.dy>0?b.y:b.y+b.h});
      }
    }
    return {boxes,links,step};
  }
  drawMap(g){
    const c=this.map,canvas=c.canvas;
    if(canvas&&(canvas.width!==780||canvas.height!==465)){canvas.width=780;canvas.height=465;}
    c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,780,465);c.scale(3,3);
    const {boxes,links,step}=this.mapLayout(g);
    c.strokeStyle='#839979';c.lineWidth=Math.max(1.5,step*.08);
    for(const link of links){c.beginPath();c.moveTo(link.x1,link.y1);c.lineTo(link.x2,link.y2);c.stroke();}
    for(const {room:r,x,y,w,h} of boxes){
      c.fillStyle=r===g.room?'#bedf87':r.visited?'#3a5140':'#23342a';c.fillRect(x,y,w,h);
      c.strokeStyle=r===g.room?'#effbc7':'#526346';c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);
      if(r.visited||r.type==='boss'){
        c.fillStyle=r===g.room?'#263d24':r.type==='treasure'||r.type==='key'?'#dfbe6f':r.type==='boss'?'#dd8e76':'#a3b69a';
        if(r.type==='key'){
          c.save();c.translate(x+w/2,y+h/2);c.scale(step/39,step/39);c.strokeStyle=c.fillStyle;c.lineWidth=1.5;c.beginPath();c.arc(-4,0,3,0,Math.PI*2);c.stroke();
          c.fillRect(-1,-.75,8,1.5);c.fillRect(3,0,1.5,3);c.fillRect(6,0,1.5,3);c.restore();
        }else if(r.type!=='fight'){
          c.font=`${Math.min(11,step*.46)}px monospace`;c.textAlign='center';c.fillText(({treasure:'◆',shop:'$',boss:'☠',start:'·',ante:'+'})[r.type]||'·',x+w/2,y+h/2+3);
        }
      }
      if(r===g.room){const px=x+2+Math.max(0,Math.min(1,g.player.x/r.width))*(w-4),py=y+2+Math.max(0,Math.min(1,g.player.y/r.height))*(h-4);
        c.fillStyle='#233724';c.fillRect(px-2,py-2,4,4);c.fillStyle='#fff5d2';c.fillRect(px-1,py-1,2,2);
      }
    }
    c.restore();
  }
}
