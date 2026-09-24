class ForestMobileView {
  constructor({onMapOpen,onMapClose,onReset}) {
    const get=id=>document.getElementById(id);this.panel=get('game-panel');this.wrap=get('game-wrap');this.mapOpen=false;this.immersive=false;
    this.onMapClose=onMapClose;this.onReset=onReset;
    get('room-status').innerHTML='<button id="room-fullscreen" aria-label="Activer le plein écran">⛶ PLEIN ÉCRAN</button>';
    get('room-fullscreen').onclick=()=>this.toggleFullscreen();
    this.wrap.appendChild(get('touch-status'));this.wrap.appendChild(document.querySelector('.touch-controls'));
    const toolbar=document.createElement('div');toolbar.className='mobile-toolbar';
    toolbar.innerHTML='<button id="mobile-map-toggle" aria-label="Afficher la carte" aria-expanded="false">▦ <small>CARTE</small></button><button id="mobile-fullscreen" aria-label="Activer le plein écran">⛶ <small>PLEIN ÉCRAN</small></button><button id="mobile-pause" aria-label="Mettre en pause">Ⅱ</button>';
    this.wrap.appendChild(toolbar);
    this.mapPanel=document.createElement('div');this.mapPanel.className='mobile-map-panel';this.mapPanel.hidden=true;
    this.mapPanel.innerHTML='<h2>Carte du donjon</h2><p id="mobile-map-floor"></p><canvas id="mobile-map" width="260" height="155" aria-label="Carte des salles explorées"></canvas><p>● Vous · ◆ Trésor · ☠ Gardien</p><button id="mobile-map-close">REPRENDRE LE JEU</button>';
    this.wrap.appendChild(this.mapPanel);
    get('mobile-map-toggle').onclick=()=>{if(this.mapOpen){this.closeMap();return;}if(!onMapOpen())return;this.mapOpen=true;onReset();this.mapPanel.hidden=false;this.panel.classList.add('map-open');get('mobile-map-toggle').setAttribute('aria-expanded','true');get('mobile-map-floor').textContent=get('floor-label').textContent;
      const canvas=get('mobile-map'),context=canvas.getContext('2d');
      // Transparent source pixels must replace the previous floor, not overlay it.
      context.clearRect(0,0,canvas.width,canvas.height);
      context.drawImage(get('map'),0,0);
    };
    get('mobile-map-close').onclick=()=>this.closeMap();
    this.toggleMap=()=>get('mobile-map-toggle').onclick();
    get('mobile-fullscreen').onclick=()=>this.toggleFullscreen();get('fullscreen').onclick=()=>this.toggleFullscreen();get('mobile-pause').onclick=()=>{if(this.mapOpen)this.closeMap();get('pause').onclick();};
    document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&this.nativeFullscreen){this.nativeFullscreen=false;this.setImmersive(false);}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(this.mapOpen)this.closeMap();else if(this.immersive&&!document.fullscreenElement)this.setImmersive(false);}});
  }
  closeMap(resume=true){if(!this.mapOpen)return;this.mapOpen=false;this.mapPanel.hidden=true;this.panel.classList.remove('map-open');document.getElementById('mobile-map-toggle').setAttribute('aria-expanded','false');this.onReset();if(resume)this.onMapClose();}
  setImmersive(value){this.immersive=value;document.body.classList[value?'add':'remove']('immersive-game');this.onReset();const button=document.getElementById('mobile-fullscreen');button.innerHTML=value?'⤢ <small>QUITTER</small>':'⛶ <small>PLEIN ÉCRAN</small>';button.setAttribute('aria-label',value?'Quitter le plein écran':'Activer le plein écran');this.onViewport?.();}
  async toggleFullscreen(){
    if(this.immersive||document.fullscreenElement){if(document.fullscreenElement)try{await document.exitFullscreen();}catch{}this.setImmersive(false);return;}
    // Fixed viewport mode remains usable on mobile browsers without Fullscreen API.
    this.setImmersive(true);
    if(this.panel.requestFullscreen)try{await this.panel.requestFullscreen();this.nativeFullscreen=!!document.fullscreenElement;}catch{this.nativeFullscreen=false;}
  }
}
