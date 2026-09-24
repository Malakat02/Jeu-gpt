class ForestRenderer {
  constructor(canvas,map){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.map=map.getContext('2d');
    this.ctx.imageSmoothingEnabled=false;
    this.terrainCache=new WeakMap();
    this.palettes={hero:{g:'#6b994c',G:'#adc96d',d:'#2a4834',s:'#edc48f',h:'#a57c43',b:'#805b3c'},slime:{a:'#6f9f78',b:'#9ccb99',d:'#294c43',e:'#e8dfad'},bat:{a:'#89719a',b:'#b49aac',d:'#423b59',e:'#f4cba0'},spitter:{a:'#b27752',b:'#d6a16b',d:'#5f4b3c',e:'#f5d9a2'},knight:{a:'#759a99',b:'#b0c1ab',d:'#334951',e:'#e4a574'}};
    this.sprites={hero:['.....ggg......','....gGGgg.....','...ggGGggg....','...hhhss......','...hssds......','....ssss......','..ddggggdd....','.ddgGGgggdd...','..sgGGgggs....','...gggggg.....','...bbbbb......','...bb.bb......','..bbb.bbb.....'],slime:['....aaaa....','..aabbbbaa..','.abbbbbbbba.','aabbbbbbbbaa','abddbbddbbba','abedbbedbbba','aabbbbbbbbaa','.aaddddddaa.','..aaaaaaaa..'],bat:['a..........a','aa........aa','aba..aa..aba','abbaaaaaabba','abbbabbabbba','.abbdeedbba.','..aabbbbaa..','....aaaa....'],spitter:['....aaaa....','..aabbbbaa..','.abbbbbbbba.','abddbbddbbba','abeebbeebbaa','aabddddbbaa.','.aabddbaa...','..aaaaaaa...','.aaa..aaa...'],knight:['....bbbb....','...baaaab...','..bbaaaabb..','..bddddebb..','...dddddd...','.aaaaaaaaaa.','abbaaaaaabba','abbaaaaaabba','.dadaaaadad.','...aaaaaa...','...dd.dd....','..ddd.ddd...']};
  }
  rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),w,h);}
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
        cached=document.createElement('canvas');cached.width=room.width;cached.height=room.height;
        this.ctx=cached.getContext('2d');this.ctx.imageSmoothingEnabled=false;
        try{this.paintTerrain(g);}finally{this.ctx=c;}
        this.terrainCache.set(room,cached);
      }
      c.drawImage(cached,0,0);
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
    for(const [dx,dy,x,y,vertical] of [[-1,0,32,h/2-40,true],[1,0,w-80,h/2-40,true],[0,-1,w/2-40,32,false],[0,1,w/2-40,h-80,false]]){
      const next=g.neighbor(dx,dy);if(!next)continue;
      const locked=!r.clear||(next.type==='boss'&&!next.visited&&ForestContent.floors[level].key&&!p.key);
      const angle=dx<0?-Math.PI/2:dx>0?Math.PI/2:dy>0?Math.PI:0,px=x+(vertical?24:40),py=y+(vertical?40:24),infected=level===2&&next.type==='boss';
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
    // All blades end at the combat pose's tip; no decorative swing arc.
    const master=id==='master',deity=id==='greatsword',start=24,tip=reach,half=width/2;
    this.rect(7,-3,15,6,deity?'#245954':master?'#433766':'#4e392d');
    for(let x=9;x<20;x+=4)this.rect(x,-2,2,4,deity?'#6eb3a0':master?'#a795db':'#b69160');
    this.rect(5,-4,4,8,deity?'#77c5b0':master?'#a199d5':'#d9b771');
    this.rect(20,-half-5,5,width+10,deity?'#287c75':master?'#7164a4':'#a9894d');
    this.rect(20,-half-5,3,width+10,deity?'#86d4b5':master?'#b0a5ed':'#e5c987');
    if(master){this.rect(15,-half-8,7,4,'#8e81cd');this.rect(15,half+4,7,4,'#8e81cd');this.rect(21,-2,4,4,'#f3d67a');}
    if(deity){
      // Two blue/sea-green ribbons cross twice and join at a sharp tip.
      for(let x=start;x<tip;x+=2){
        const t=(x-start)/(tip-start),envelope=Math.min(1,(1-t)*6),offset=Math.sin(t*Math.PI*4)*half*.62*envelope;
        const thick=Math.max(1,Math.min(4,(tip-x)*.42)),span=Math.min(2,tip-x);
        for(const s of [-1,1]){const y=s*offset-thick/2;this.rect(x,y,span,thick,s<0?'#5595d0':'#55bd9e');this.rect(x,y,span,1,s<0?'#b6e2fa':'#b3f2c8');}
      }
      this.rect(25,-2,5,4,'#d0eac5');
    }else{
      for(let x=start;x<tip;x+=2){
        const h=Math.max(1,Math.min(half,(tip-x)*.32)),span=Math.min(2,tip-x);
        this.rect(x,-h,span,h*2,master?'#689cae':'#758e94');
        this.rect(x,-h,span,Math.max(1,h),master?'#e1fff5':'#f0f0d7');
        if(h>2)this.rect(x,0,span,1,master?'#b3ecdd':'#c0d3cc');
      }
      if(master){this.rect(30,-2,2,4,'#d8c976');this.rect(34,-1,2,2,'#d8c976');}
    }
  }
  weaponArm(p,angle,twoHanded=false){
    const c=this.ctx;c.save();c.translate(p.x,p.y);c.rotate(angle);
    this.rect(2,-5,9,9,'#234934');this.rect(3,-5,7,3,'#85a75e');
    this.rect(10,-4,7,8,'#513d2e');this.rect(11,-4,5,5,'#ebbd87');
    if(twoHanded){this.rect(0,3,10,5,'#244d37');this.rect(6,1,5,5,'#e6b581');}
    c.restore();
  }
  drawWeapon(g){
    const {player:p,attack:a,time}=g,c=this.ctx,weapon=ForestContent.weapons[p.weapon];
    if(!a){
      const angle=p.dir+.35;c.save();c.translate(p.x,p.y);c.rotate(angle);
      if(weapon.id==='flail'){
        for(let i=0;i<4;i++)this.rect(16+i*7,-2,4,4,'#b1c4cb');
        this.rect(36,-12,24,24,'#7b939e');this.rect(40,-9,8,7,'#c7d4d7');
        this.rect(44,-16,6,5,'#dfded0');this.rect(44,11,6,5,'#dfded0');this.rect(59,-3,5,6,'#dfded0');
      }else{
        this.blade(weapon.id,weapon.id==='greatsword'?77:weapon.id==='master'?61:49,weapon.width);
      }c.restore();this.weaponArm(p,angle,weapon.id==='greatsword');
    }else{
      const pose=ForestCombat.pose(a,p);
      if(pose.kind==='ball'){
        const distance=Math.hypot(pose.x-p.x,pose.y-p.y),segments=Math.max(1,Math.ceil(distance/9));
        for(let i=0;i<segments;i++){const t=i/segments;this.rect(p.x+(pose.x-p.x)*t-2,p.y+(pose.y-p.y)*t-2,5,5,i%2?'#788e9a':'#c1cace');}
        const x=pose.x,y=pose.y;
        this.rect(x-12,y-16,24,32,'#566b78');this.rect(x-16,y-12,32,24,'#566b78');this.rect(x-12,y-12,24,24,'#92a9b3');this.rect(x-9,y-10,11,8,'#cad5d5');
        for(const [dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]])this.rect(x+dx*17-3,y+dy*17-3,6,6,'#dfded0');
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
  boss(e,g){
    const c=this.ctx;
    c.save();
    const pose=this.bossPose(e),anticipation=pose.p;
    c.translate(e.x,e.y+pose.lift);c.rotate(pose.lean);c.scale(pose.sx,pose.sy);c.translate(-e.x,-e.y+Math.sin(e.t*4)*3);
    c.save();c.translate(e.x,e.y);if(e.hit>0)c.globalAlpha=.68;
    if(e.transform>0)c.globalAlpha=.55+Math.sin(g.time*22)*.18;
    if(e.bossLevel===0)this.rootGuardian(e,g,pose);
    else if(e.bossLevel===1)this.shadowWarden(e,g,pose);
    else this.darkKing(e,g,pose);
    c.restore();
    if(e.recover>0)this.text('VULNÉRABLE ×2',e.x,e.y-(e.bossLevel===2?166:106),12,'#c8e98b');
    c.restore();
  }
  warnings(g){
    const c=this.ctx;
    for(const h of g.hazards){
      c.strokeStyle=h.delay>0?'#d998c3':'#ffd1bc';c.fillStyle=h.delay>0?'#af547526':'#ec8e7580';c.lineWidth=3;c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();c.stroke();
      if(h.delay>0)this.text('!',h.x,h.y+5,18,'#f5d09e');
      else for(let i=-2;i<=2;i++){this.rect(h.x+i*14-5,h.y-20+Math.abs(i)*6,10,42-Math.abs(i)*8,'#9a637e');this.rect(h.x+i*14-2,h.y-27+Math.abs(i)*6,4,35,'#e1a6a6');}
    }
  }
  draw(g){
    const c=this.ctx,{room:r,player:p,time}=g,w=r.width,h=r.height,scale=960/w;
    c.save();c.clearRect(0,0,960,640);c.scale(scale,scale);
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
    if(g.boomerang){c.save();c.translate(g.boomerang.x,g.boomerang.y);c.rotate(time*20);this.rect(-12,-12,24,5,'#edce7a');this.rect(7,-12,5,24,'#bb8d4f');c.restore();}
    for(const particle of g.particles)this.rect(particle.x,particle.y,particle.size,particle.size,particle.color);
    for(let i=0;i<16;i++){const x=(i*177+Math.sin(time*.4+i)*60+g.runSeed)%(w-130)+65,y=(i*97+time*(3+i%3))%(h-170)+85;c.globalAlpha=.25+Math.sin(time*2+i)*.2;this.rect(x,y,3,3,g.level===1?'#a3b6f6':'#d6e6a2');}c.globalAlpha=1;
    const vignette=c.createRadialGradient(w/2,h/2,w*.3,w/2,h/2,w*.6);vignette.addColorStop(0,'#06151000');vignette.addColorStop(1,'#06151088');c.fillStyle=vignette;c.fillRect(0,0,w,h);c.restore();
    const boss=r.enemies.find(e=>e.type==='boss');
    if(boss){
      this.text(ForestContent.floors[g.level].bossName,480,38,14,'#ead5b4');
      this.rect(260,48,440,10,'#1f2030');this.rect(262,50,436*Math.max(0,boss.hp/boss.max),6,boss.stage===2?'#e39888':'#c4b476');
      if(g.level===2)this.text(boss.transform>0?'LA SECONDE FORME S’ÉVEILLE…':`PHASE ${boss.stage} / 2 · ${Math.ceil(Math.max(0,boss.hp))} / ${boss.max}`,480,76,10,'#c9bbc9');
    }
  }
  drawMap(g){
    const mapCanvas=this.map.canvas;
    if(mapCanvas&&mapCanvas.width!==780){mapCanvas.width=780;mapCanvas.height=465;}
    this.map.save();this.map.scale(3,3);
    const c=this.map,rooms=g.rooms.filter(r=>r.type!=='secret'||r.visited),minX=Math.min(...rooms.map(r=>r.x)),maxX=Math.max(...rooms.map(r=>r.x)),minY=Math.min(...rooms.map(r=>r.y)),maxY=Math.max(...rooms.map(r=>r.y));
    const step=Math.min(39,230/(maxX-minX+1),130/(maxY-minY+1)),rw=step*.65,rh=step*.48;
    const originX=(260-(maxX-minX)*step-rw)/2,originY=(155-(maxY-minY)*step-rh)/2;
    const pos=r=>({x:originX+(r.x-minX)*step,y:originY+(r.y-minY)*step});
    c.clearRect(0,0,260,155);
    const visible=r=>r.visited||rooms.some(v=>v.visited&&g.connected(v,r));
    for(const r of rooms.filter(visible)){
      const a=pos(r);for(const next of rooms)if(next.visited&&g.connected(r,next)){const b=pos(next);c.fillStyle='#435145';c.fillRect(Math.min(a.x,b.x)+rw/2,Math.min(a.y,b.y)+rh/2,Math.abs(a.x-b.x)+2,Math.abs(a.y-b.y)+2);}
    }
    for(const r of rooms.filter(visible)){
      const {x,y}=pos(r);c.fillStyle=r===g.room?'#bedf87':r.visited?'#3a5140':'#23342a';c.fillRect(x,y,rw,rh);c.strokeStyle=r===g.room?'#effbc7':'#526346';c.strokeRect(x+.5,y+.5,rw-1,rh-1);
      if(r.visited||r.type==='boss'){c.fillStyle=r===g.room?'#263d24':r.type==='treasure'||r.type==='key'?'#dfbe6f':r.type==='boss'?'#dd8e76':'#a3b69a';c.font=`${Math.min(11,step*.4)}px monospace`;c.textAlign='center';c.fillText(({treasure:'◆',shop:'$',boss:'☠',key:'☠',start:'·',ante:'+'})[r.type]||'·',x+rw/2,y+rh*.8);}
    }
    this.map.restore();
  }
}
