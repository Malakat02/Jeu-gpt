// Button positions are stored as viewport fractions, separately for each orientation.
class ForestTouchLayout {
  constructor({onOpen,onClose,onReset}){
    this.onClose=onClose;this.onReset=onReset;this.onOpen=onOpen;this.editing=false;this.positions={};this.drag=null;
    this.buttons=['touch-action','touch-dodge','touch-boom'].map(id=>document.getElementById(id));
    try{const saved=JSON.parse(localStorage.getItem('forest-touch-layout'));if(saved&&typeof saved==='object')this.positions=saved;}catch{}
    const panel=document.getElementById('game-panel');panel.appendChild(document.getElementById('touch-stick'));
    this.settings=document.createElement('div');this.settings.className='touch-layout-settings';
    this.settings.innerHTML='<button id="touch-layout-edit" aria-label="Position des boutons" title="Position des boutons">⚙</button><span id="touch-layout-help" hidden>Glissez les boutons.</span><button id="touch-layout-reset" hidden>PAR DÉFAUT</button><button id="touch-layout-done" hidden>TERMINÉ</button>';
    panel.appendChild(this.settings);
    const get=id=>document.getElementById(id);
    get('touch-layout-edit').onclick=()=>this.open();
    get('touch-layout-done').onclick=()=>this.finish();
    get('touch-layout-reset').onclick=()=>{delete this.positions[this.orientation()];this.save();this.apply();};
    for(const button of this.buttons){
      button.addEventListener('pointerdown',e=>{if(!this.editing||this.drag)return;e.preventDefault();e.stopPropagation();const r=button.getBoundingClientRect();this.drag={button,id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};button.setPointerCapture(e.pointerId);});
      button.addEventListener('pointermove',e=>{const d=this.drag;if(!d||d.id!==e.pointerId||d.button!==button)return;e.preventDefault();const r=button.getBoundingClientRect(),w=window.innerWidth,h=window.innerHeight;const x=Math.max(4,Math.min(w-r.width-4,e.clientX-d.dx)),y=Math.max(4,Math.min(h-r.height-4,e.clientY-d.dy));const key=this.orientation();this.positions[key]??={};this.positions[key][button.id]={x:(x+r.width/2)/w,y:(y+r.height/2)/h};this.apply();});
      const end=e=>{if(this.drag?.id===e.pointerId){this.drag=null;this.save();}};
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,end);
    }
    window.addEventListener('resize',()=>{this.drag=null;onReset();this.apply();});
    document.addEventListener('fullscreenchange',()=>{this.drag=null;this.apply();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.editing)this.finish();});
    this.apply();
  }
  orientation(){return window.innerWidth>window.innerHeight?'landscape':'portrait';}
  open(){if(this.editing||!this.onOpen())return;this.onReset();this.editing=true;document.getElementById('game-panel').classList.add('controls-editing');this.setTools(true);this.placeSettings();}
  placeSettings(){const full=document.fullscreenElement||document.body?.classList.contains('immersive-game'),r=document.getElementById('game-wrap').getBoundingClientRect();this.settings.style.visibility=this.editing||!full||window.innerWidth-r.right>=42||r.top>=38?'visible':'hidden';}
  setTools(editing){for(const id of ['touch-layout-help','touch-layout-reset','touch-layout-done'])document.getElementById(id).hidden=!editing;document.getElementById('touch-layout-edit').hidden=editing;}
  apply(){for(const b of this.buttons){const p=this.positions[this.orientation()]?.[b.id];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){const r=b.getBoundingClientRect(),x=Math.max(r.width/2+4,Math.min(window.innerWidth-r.width/2-4,p.x*window.innerWidth)),y=Math.max(r.height/2+4,Math.min(window.innerHeight-r.height/2-4,p.y*window.innerHeight));b.classList.add('custom-position');b.style.left=(x-r.width/2)+'px';b.style.top=(y-r.height/2)+'px';}else{b.classList.remove('custom-position');b.style.left='';b.style.top='';}}this.placeSettings();}
  save(){try{localStorage.setItem('forest-touch-layout',JSON.stringify(this.positions));}catch{}}
  finish(){if(!this.editing)return;this.drag=null;this.editing=false;this.save();document.getElementById('game-panel').classList.remove('controls-editing');this.setTools(false);this.placeSettings();this.onReset();this.onClose();}
}
