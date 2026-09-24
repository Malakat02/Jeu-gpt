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
  palette(level){return [
    {floor:['#59634c','#606b52','#657056'],line:'#7c8365',wall:'#65715e',top:'#a0ab87',moss:'#78984b',accent:'#e0d399',dark:'#283c2b'},
    {floor:['#293c37','#2d403c','#31443e'],line:'#43544b',wall:'#3b4d47',top:'#67796b',moss:'#49674a',accent:'#b7d6a2',dark:'#101f1c'},
    {floor:['#252d2b','#2a322e','#303932'],line:'#3e453e',wall:'#424d42',top:'#727d62',moss:'#645273',accent:'#e6c09d',dark:'#130f1c'}
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
      const shades=night?['#3b4a43','#45534a','#34473f']:['#69735f','#737c65','#5f6c59'];
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
  floor(g){
    const {room:r,level,time,player:p}=g,c=this.ctx,t=this.palette(level),w=r.width,h=r.height;
    if(level<2)this.terrain(g);else{
    this.rect(0,0,w,h,t.dark);
    for(let y=0;y<h/32;y++)for(let x=0;x<w/32;x++){
      const n=this.noise(x,y,r.seed),wall=x<2||x>=w/32-2||y<2||y>=h/32-2;
      this.rect(x*32,y*32,32,32,wall?t.wall:t.floor[Math.floor(n*3)]);
      this.rect(x*32+1,y*32+1,30,wall?4:1,wall?t.top:t.line);
      if(wall)this.rect(x*32,y*32+27,32,5,t.dark);
      else this.rect(x*32,y*32,1,32,t.dark);
      if(wall&&n>.65)this.rect(x*32+3,y*32+7,7,12,t.moss);
      if(!wall&&n>.76){this.rect(x*32+8,y*32+9,7,2,t.line);this.rect(x*32+21,y*32+25,3,3,t.moss);}
    }
    this.rect(64,64,w-128,9,t.dark);
    for(const [x,y] of [[85,92],[w-107,92],[85,h-113],[w-107,h-113]]){
      this.rect(x-6,y-8,32,38,t.dark);this.rect(x-2,y-8,24,28,t.top);this.rect(x+4,y,12,16,t.wall);
    }
    for(let i=0;i<60;i++){
      const x=75+this.noise(i,50,r.seed)*(w-150),y=i%2?78+this.noise(i,40,r.seed)*30:h-105+this.noise(i,45,r.seed)*30;
      this.rect(x,y,3,9,t.moss);this.rect(x-3,y+4,9,3,t.top);
    }
    // Broken masonry, hanging vines and roots remain decorative and passable.
    for(let i=0;i<24;i++){
      const x=85+this.noise(i,72,r.seed)*(w-170),side=i%2,y=side?h-75:64;
      for(let j=0;j<4+i%4;j++){this.rect(x+Math.sin(j+i)*9,y+(side?-j:j)*8,5,10,t.moss);if(j%2)this.rect(x+Math.sin(j+i)*9-5,y+(side?-j:j)*8,14,4,t.top);}
      if(i%3===0){this.rect(x,side?h-122:102,22,11,t.wall);this.rect(x+3,side?h-124:100,16,4,t.top);}
    }
    }
    if(level===0){c.save();c.globalAlpha=.06;c.fillStyle='#ffffb0';for(let i=0;i<3;i++){c.beginPath();c.moveTo(170+i*240,64);c.lineTo(235+i*240,64);c.lineTo(400+i*200,h-64);c.lineTo(265+i*200,h-64);c.fill();}c.restore();}
    for(const [dx,dy,x,y,vertical] of [[-1,0,32,h/2-40,true],[1,0,w-80,h/2-40,true],[0,-1,w/2-40,32,false],[0,1,w/2-40,h-80,false]]){
      const next=g.neighbor(dx,dy);if(!next)continue;
      const locked=!r.clear||(next.type==='boss'&&!next.visited&&ForestContent.floors[level].key&&!p.key);
      this.templeDoor(x+(vertical?24:40),y+(vertical?40:24),dx<0?-Math.PI/2:dx>0?Math.PI/2:dy>0?Math.PI:0,locked,t,next.type==='boss');
    }
    const crack=g.secretEntrance();
    if(crack){
      c.save();c.translate(crack.x+crack.dx*8,crack.y+crack.dy*24);if(crack.dx)c.rotate(Math.PI/2);
      for(const [x,y,ww,hh] of [[-2,-15,3,9],[-6,-7,7,3],[-6,-5,3,9],[-4,3,9,3],[2,5,3,10],[-10,-1,5,2]])this.rect(x,y,ww,hh,'#070b08');
      if(crack.secret.entranceHits>0)this.rect(-12,1,8,3,'#070b08');if(crack.secret.entranceHits>1)this.rect(5,5,10,3,'#070b08');c.restore();
    }
    for(const [x,y] of [[168,87],[w-172,87],[168,h-89],[w-172,h-89]]){
      this.rect(x-6,y,12,13,'#3b3225');this.rect(x-8,y-8,16,11,t.top);
      this.rect(x-5,y-15-Math.sin(time*9+x)*2,10,13,level===1?'#86ace2':'#e6b660');this.rect(x-2,y-15,4,8,'#f5dfa0');
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
  chest(x,y,opened,boss=false){
    const gold=boss?'#e6cb82':'#d2b163';
    this.rect(x-31,y+8,62,13,'#14251c');this.rect(x-28,y-17,56,35,boss?'#55405b':'#745634');
    this.rect(x-25,y-21,50,17,opened?'#242d22':boss?'#96729b':'#b48c4b');this.rect(x-25,y-21,50,5,gold);
    this.rect(x-24,y+7,48,5,gold);this.rect(x-19,y-18,5,35,gold);this.rect(x+14,y-18,5,35,gold);
    this.rect(x-5,y-7,10,12,gold);this.rect(x-1,y-3,3,6,'#594630');
  }
  fountain(g){
    const {room:r,time}=g,x=r.width/2,y=r.height*.4,large=g.level===2;
    this.rect(x-56,y-15,112,65,'#495967');this.rect(x-48,y-23,96,58,'#718698');
    this.rect(x-39,y-16,78,39,r.opened?'#38524a':'#68a29b');this.rect(x-28,y-9,52,4,'#bbf1db');
    this.text(large?'LA GRANDE FÉE':'SOURCE DES FÉES',x,y-58,14,'#c2eadb');
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
      for(let i=0;i<3;i++)this.rect(x-83+i*12,210+i*12,166-i*24,105-i*24,this.palette(level).wall);
      this.text(level===0?'✦':level===1?'☾':'▲',x,284,55,this.palette(level).top);
      this.text(ForestContent.floors[level].name.toUpperCase(),x,480,12,this.palette(level).accent);
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
    this.rect(-61,-265,122,315,'#2b2430');this.rect(-48,-235,25,270,'#463743');this.rect(23,-255,20,295,'#534047');
    for(let i=0;i<30;i++){const a=i*2.4,px=Math.cos(a)*(130+i%4*40),py=-250+Math.sin(a)*80;this.rect(px-38,py-25,76,45,i%3?'#374638':'#526043');if(i%3===0)this.rect(px-30,py-25,40,6,'#756078');}
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
    this.sprite(e.type,0,0,3,e.hit>0);c.restore();
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
  boss(e,g){
    const c=this.ctx;
    c.save();
    const pose=this.bossPose(e),anticipation=pose.p;
    c.translate(e.x,e.y+pose.lift);c.rotate(pose.lean);c.scale(pose.sx,pose.sy);c.translate(-e.x,-e.y+Math.sin(e.t*4)*3);
    if(e.bossLevel===0){
      c.save();c.translate(Math.round(e.x),Math.round(e.y));if(e.hit>0)c.globalAlpha=.65;
      for(let i=0;i<5;i++){const rx=-55+i*24,rootLift=e.action==='roots'?anticipation*(i%2?20:8):0;this.rect(rx,8,16,37+rootLift,'#554832');this.rect(rx-8,35+rootLift,28,10,'#726341');}
      this.rect(-39,-47,78,76,'#766447');this.rect(-47,-33,94,47,'#61573c');this.rect(-33,-50,66,8,'#a2905a');
      this.rect(-48,-69,26,34,'#495e3c');this.rect(23,-71,29,37,'#53683b');this.rect(-59,-79,33,18,'#718449');this.rect(32,-86,32,23,'#7e8d4f');this.rect(-15,-73,34,29,'#627940');this.rect(-21,-84,46,17,'#839551');
      this.rect(-28,-30,20,14,'#252f23');this.rect(9,-30,20,14,'#252f23');this.rect(-23,-26,10,7,e.phase?'#f6a56d':'#e2d486');this.rect(13,-26,10,7,e.phase?'#f6a56d':'#e2d486');this.rect(-16,1,34,8+(e.action==='seeds'?anticipation*20:0),'#2e3727');if(e.action==='seeds'&&anticipation>0)this.rect(-7,5,14,anticipation*13,'#d2bc79');c.restore();
    }else if(e.bossLevel===1){
      c.save();c.translate(e.x,e.y+Math.sin(g.time*2)*4);if(e.hit>0)c.globalAlpha=.6;
      for(let i=0;i<5;i++)this.rect(-48+i*20,-17+Math.sin(g.time*3+i)*5,20,54,'#30344d');
      this.rect(-43,-53,86,67,'#4b4268');this.rect(-35,-69,70,38,'#72658a');this.rect(-25,-60,50,30,'#161b31');
      this.rect(-19,-53,11,6,'#a6ecfb');this.rect(9,-53,11,6,'#a6ecfb');this.rect(-7,-35,14,20,'#cfb380');
      for(const sign of [-1,1]){const hand=sign*(62+pose.armX);this.rect(hand-10,-29+pose.armY,20,40,'#80758e');this.rect(hand-7,-34+pose.armY,14,8,'#c2b6ca');if(e.action==='volley'&&anticipation>0)this.rect(hand-6,-42+pose.armY,12,12,'#bce2cd');}
      c.restore();
    }else{
      const second=e.stage===2;
      c.save();c.translate(e.x,e.y);if(e.hit>0)c.globalAlpha=.65;if(e.transform>0)c.globalAlpha=.4+Math.sin(g.time*30)*.25;
      if(second){
        for(const sign of [-1,1])for(let i=0;i<5;i++){
          this.rect(sign*(76+i*17)-(sign<0?25:0),-98+i*18,30,60-i*7,'#613a59');
          this.rect(sign*(80+i*17)-(sign<0?25:0),-102+i*18,30,7,'#bd647a');
        }
      }
      for(const sign of [-1,1]){
        this.rect(sign*44-21,23,43,49,'#39344c');this.rect(sign*44-26,62,55,18,'#71617b');
        const armY=pose.armY*(e.action==='rootsweep'&&sign===1?-.25:1),armX=sign*(98+pose.armX);
        this.rect(armX-23,-56+armY,46,86,second?'#694250':'#524b67');this.rect(armX-28,-67+armY,56,27,'#a08591');
        this.rect(sign*37-13,-135,26,40,'#c0a58a');this.rect(sign*45-10,-146,19,19,'#e9cc9b');
      }
      this.rect(-69,-89,138,131,second?'#773e50':'#605571');this.rect(-57,-80,114,12,'#b39999');
      this.rect(-47,-124,94,52,second?'#a16062':'#8b7890');this.rect(-33,-109,66,26,'#211d34');
      this.rect(-25,-102,16,8,second?'#ffb376':'#addbfb');this.rect(11,-102,16,8,second?'#ffb376':'#addbfb');
      this.rect(-11,-66,22,58,second?'#f0a170':'#bcabc7');this.rect(-30,-51,60,15,second?'#bd6270':'#9684a6');
      this.rect(-56,25,112,13,'#bd9c72');
      if(e.action==='spiral'&&anticipation>0)for(let i=0;i<6;i++){const a=g.time*5+i*Math.PI/3;this.rect(Math.cos(a)*75-4,-65+Math.sin(a)*24,8,8,'#d697c0');}
      c.restore();
    }
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
      else this.text(d.type==='heart'?'♥':'⚿',d.x,y,25,d.type==='heart'?'#e68f7e':'#e7cf79');
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
      if(r.visited||r.type==='boss'){c.fillStyle=r===g.room?'#263d24':r.type==='treasure'||r.type==='key'?'#dfbe6f':r.type==='boss'?'#dd8e76':'#a3b69a';c.font=`${Math.min(11,step*.4)}px monospace`;c.textAlign='center';c.fillText(({treasure:'◆',shop:'$',boss:'☠',key:'⚿',start:'·',ante:'+'})[r.type]||'·',x+rw/2,y+rh*.8);}
    }
  }
}
