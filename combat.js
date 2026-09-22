// Rendering and collision both consume these exact weapon poses.
const ForestCombat = (() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function pointSegmentDistance(p,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
    const t=length?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/length,0,1):0;
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  }
  function pose(attack,player,age=attack.age){
    const t=clamp(age/attack.duration,0,1),weapon=ForestContent.weapons[attack.weapon];
    if(attack.kind==='flail'){
      // The head travels out and back along the original launch line.
      const extension=Math.sin(Math.PI*t)*attack.reach;
      return {kind:'ball',x:attack.origin.x+Math.cos(attack.dir)*extension,y:attack.origin.y+Math.sin(attack.dir)*extension,radius:19,anchor:{x:player.x,y:player.y}};
    }
    const angle=attack.dir+(attack.kind==='spin'?t*Math.PI*2:-1.12+t*2.24);
    const reach=attack.kind==='spin'?112:weapon.reach;
    return {kind:'blade',a:{x:player.x+Math.cos(angle)*17,y:player.y+Math.sin(angle)*17},b:{x:player.x+Math.cos(angle)*reach,y:player.y+Math.sin(angle)*reach},width:weapon.width,angle,reach};
  }
  function touches(pose,enemy){
    return pose.kind==='ball'?Math.hypot(pose.x-enemy.x,pose.y-enemy.y)<=pose.radius+enemy.radius:
      pointSegmentDistance(enemy,pose.a,pose.b)<=enemy.radius+pose.width/2;
  }
  function sweepHits(attack,player,enemy,fromAge,toAge){
    // Small substeps avoid tunnelling with fast swords or the linear ball.
    const steps=Math.max(1,Math.ceil((toAge-fromAge)/attack.duration*120));
    for(let i=0;i<=steps;i++)if(touches(pose(attack,player,fromAge+(toAge-fromAge)*i/steps),enemy))return true;
    return false;
  }
  return {pose,touches,sweepHits,pointSegmentDistance};
})();
