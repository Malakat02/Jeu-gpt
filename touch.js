// Independent pointers allow moving, holding an attack and dodging together.
class ForestTouch {
  constructor({stick,knob,action,dodge,boom,onAttack,onRelease,onCancel,onDodge,onBoom,onChange}) {
    this.x=0;this.y=0;this.active=false;this.stickId=null;this.buttons=new Map();this.knob=knob;
    this.enabled=!!window.matchMedia?.('(pointer: coarse) and (hover: none)').matches;
    const enable=()=>{this.enabled=true;document.body.classList.add('touch-device');};
    if(this.enabled)enable();
    const capture=(el,e)=>{e.preventDefault();enable();el.setPointerCapture(e.pointerId);};
    const move=e=>{if(e.pointerId!==this.stickId)return;const b=stick.getBoundingClientRect(),radius=b.width*.32,dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,length=Math.hypot(dx,dy),scale=Math.min(1,length/radius);this.x=length>radius*.15?dx/length*scale:0;this.y=length>radius*.15?dy/length*scale:0;knob.style.transform=`translate(${this.x*radius}px,${this.y*radius}px)`;};
    stick.addEventListener('pointerdown',e=>{if(this.stickId!==null)return;capture(stick,e);this.stickId=e.pointerId;move(e);});
    stick.addEventListener('pointermove',move);
    const releaseStick=e=>{if(e.pointerId!==this.stickId)return;this.stickId=null;this.x=0;this.y=0;knob.style.transform='translate(0px,0px)';};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,releaseStick);
    for(const [el,start,primary] of [[action,onAttack,true],[dodge,onDodge,false],[boom,onBoom,false]]){
      el.addEventListener('pointerdown',e=>{if(this.buttons.has(el))return;capture(el,e);this.buttons.set(el,e.pointerId);el.classList.add('pressed');if(primary)this.active=true;start();});
      const end=(e,cancel)=>{if(this.buttons.get(el)!==e.pointerId)return;this.buttons.delete(el);el.classList.remove('pressed');if(primary){this.active=false;(cancel?onCancel:onRelease)();}};
      el.addEventListener('pointerup',e=>end(e,false));
      for(const type of ['pointercancel','lostpointercapture'])el.addEventListener(type,e=>end(e,true));
    }
    this.onCancel=onCancel;
    window.addEventListener('resize',()=>{this.reset();onChange?.();});
  }
  reset(){this.x=0;this.y=0;this.stickId=null;this.active=false;for(const el of this.buttons.keys())el.classList.remove('pressed');this.buttons.clear();this.knob.style.transform='translate(0px,0px)';this.onCancel();}
}
