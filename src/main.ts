import "zone.js";
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { addStreetDetails, makeGroundMaterial, makeZombie } from './world';

type Zombie = { group: THREE.Group; hp: number; speed: number; attack: number; phase: number; limbs: THREE.Group[] };
@Component({selector:'app-root', standalone:true, imports:[CommonModule], template:`
<div class="game-shell">
  <div #scene class="scene"></div>
  <div class="grain"></div><div class="vignette"></div>
  <header class="topbar"><div class="brand"><span class="brand-icon">✳</span><span>DEAD<span class="brand-accent">END</span><small>SURVIVAL PROTOCOL</small></span></div><div class="top-center"><span class="live-dot"></span> OUTBREAK IN PROGRESS <i></i> <span>SECTOR 07</span></div><button class="help-button" (click)="showHelp = !showHelp">? <span>HOW TO PLAY</span></button></header>
  <div class="hud-top"><div class="wave-block"><div class="eyebrow"><span class="red-dot"></span> CURRENT WAVE</div><div class="wave-number">{{wave < 10 ? '0' + wave : wave}} <span>/ ∞</span></div><div class="wave-caption">{{started ? (paused ? 'GAME PAUSED' : 'THEY KEEP COMING') : 'THE NIGHT IS YOUNG'}}</div></div><div class="score-block"><div class="eyebrow">YOUR SCORE</div><div class="score">{{score.toString().padStart(5,'0')}}</div><div class="score-caption">☠ &nbsp; {{kills}} KILLS CONFIRMED</div></div></div>
  <div class="situation" *ngIf="started && !gameOver"><span class="situation-dot"></span> SECTOR 07 <i></i> {{zombieCount}} HOSTILES NEARBY <i></i> {{waveMessage}}</div>
  <div class="crosshair" [class.confirmed]="hitConfirmed" *ngIf="started && !gameOver && !paused"><span></span></div>
  <div class="hit-flash" [class.active]="hurt"></div>
  <div class="intro" *ngIf="!started && !gameOver"><div class="intro-content"><div class="tag"><span></span> SINGLE PLAYER SURVIVAL</div><h1>THE DEAD<br><em>DON’T STOP.</em></h1><p>Neither should you. Survive the outbreak, hold your ground, and make every bullet count.</p><button class="deploy" (click)="start()"><span>ENTER THE DEAD ZONE</span><b>↗</b></button><div class="intro-note"><span>✳</span> YOUR OBJECTIVE <strong>SURVIVE AS LONG AS YOU CAN</strong></div></div><div class="intro-side"><span>01 — THE OUTBREAK</span><div></div><span>NO ONE IS COMING TO SAVE YOU.</span></div></div>
  <div class="modal" *ngIf="gameOver"><div class="modal-box"><div class="tag"><span></span> TRANSMISSION ENDED</div><h2>YOU ARE <em>DEAD.</em></h2><p>The dead finally caught up. But there’s always another run.</p><div class="results"><div><small>WAVES REACHED</small><b>{{wave}}</b></div><div><small>KILLS CONFIRMED</small><b>{{kills}}</b></div><div><small>FINAL SCORE</small><b>{{score}}</b></div></div><button class="deploy" (click)="start()"><span>TRY AGAIN</span><b>↗</b></button></div></div>
  <div class="modal" *ngIf="showHelp"><div class="modal-box help"><button class="close" (click)="showHelp=false">✕</button><div class="tag"><span></span> SURVIVAL GUIDE</div><h2>STAY <em>ALIVE.</em></h2><p>Keep moving and take down the infected before they reach you. Every wave brings more of them.</p><div class="help-grid"><div><b>W A S D</b><span>MOVE AROUND</span></div><div><b>MOUSE</b><span>LOOK & AIM</span></div><div><b>CLICK</b><span>FIRE WEAPON</span></div><div><b>R</b><span>RELOAD</span></div><div><b>SHIFT</b><span>SPRINT</span></div><div><b>SPACE</b><span>JUMP OVER LOW OBSTACLES</span></div><div><b>ESC</b><span>PAUSE / RELEASE MOUSE</span></div></div><button class="deploy" (click)="showHelp=false"><span>GOT IT</span><b>↗</b></button></div></div>
  <div class="pause" *ngIf="started && paused && !gameOver && !showHelp"><div>GAME PAUSED</div><p>Click below to get back in the fight.</p><button (click)="resume()">RESUME GAME ↗</button></div>
  <footer class="bottom-hud"><div class="health"><div class="hud-label"><span>✚</span> HEALTH <b>{{health}}<small> / 100</small></b></div><div class="health-track"><div [style.width.%]="health"></div></div><div class="under-label">VITALS {{health > 40 ? 'STABLE' : 'CRITICAL'}} <span>+</span></div></div><div class="controls"><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>MOVE</span></div><div><kbd class="mouse-icon">◉</kbd><span>LOOK / SHOOT</span></div><div><kbd>R</kbd><span>RELOAD</span></div><div><kbd>SPACE</kbd><span>JUMP</span></div></div><div class="ammo"><div class="hud-label">AMMUNITION <span class="ammo-icon">▥</span></div><div class="ammo-count">{{ammo.toString().padStart(2,'0')}}<small> / {{reserve === -1 ? '∞' : reserve}}</small></div><div class="under-label">{{reloading ? 'RELOADING...' : 'STANDARD ISSUE · AR-04'}}</div></div></footer>
  <div class="bottom-strip"><span>✳ &nbsp; DEAD END <i>©</i> 2026</span><span>BUILT FOR THE BRAVE <i>◆</i></span><span>GOOD LUCK OUT THERE, SURVIVOR.</span></div>
</div>`})
export class App implements AfterViewInit, OnDestroy {
 @ViewChild('scene',{static:true}) host!:ElementRef<HTMLDivElement>;
 wave=1; score=0; kills=0; health=100; ammo=30; reserve=-1; started=false; gameOver=false; paused=false; showHelp=false; reloading=false; hurt=false; hitConfirmed=false; zombieCount=0; waveMessage='SURVIVE THE WAVE';
 private scene=new THREE.Scene(); private camera=new THREE.PerspectiveCamera(70,1,.1,100); private renderer!:THREE.WebGLRenderer; private clock=new THREE.Clock(); private frame=0; private keys=new Set<string>(); private zombies:Zombie[]=[]; private spawnLeft=0; private spawnTimer=0; private waveDelay=0; private yaw=0; private pitch=0; private lastShot=0; private reloadUntil=0; private gun!:THREE.Group; private muzzle!:THREE.PointLight; private flash!:THREE.Mesh; private props: {x:number,z:number,r:number,height:number}[]=[]; private footHeight=0; private verticalSpeed=0; private grounded=true; private tracers: {line:THREE.Line; born:number}[]=[]; private listeners: (()=>void)[]=[];
 constructor(private zone:NgZone){}
 ngAfterViewInit(){this.zone.runOutsideAngular(()=>this.init());}
 private on(target:EventTarget,event:string,fn:EventListener){target.addEventListener(event,fn);this.listeners.push(()=>target.removeEventListener(event,fn));}
 private init(){
  this.scene.background=new THREE.Color(0x89918a); this.scene.fog=new THREE.FogExp2(0x89918a,.034);
  this.renderer=new THREE.WebGLRenderer({antialias:true}); this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); this.renderer.setSize(this.host.nativeElement.clientWidth,this.host.nativeElement.clientHeight); this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap; this.renderer.outputColorSpace=THREE.SRGBColorSpace; this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.1; this.host.nativeElement.appendChild(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0xb4c4b3,0x34382e,2)); const sun=new THREE.DirectionalLight(0xffe8c5,2.1); sun.position.set(-12,25,-10); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;this.scene.add(sun);
  const mat=(c:number)=>new THREE.MeshStandardMaterial({color:c,roughness:.9}); const box=(w:number,h:number,d:number,c:number,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;this.scene.add(m);return m};
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),makeGroundMaterial());ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);
  // Broken road markings and gritty ground patches.
  for(let i=-5;i<6;i++){box(.16,.012,3.5,0xa8a28a,0,.01,i*6);}
  const rand=(n:number)=>{let x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x)};
  for(let i=0;i<150;i++){let x=(rand(i+10)-.5)*70,z=(rand(i+301)-.5)*70;let m=new THREE.Mesh(new THREE.CircleGeometry(.1+rand(i+90)*.7,5),mat(i%3?0x595f52:0x77776a));m.rotation.x=-Math.PI/2;m.position.set(x,.015,z);this.scene.add(m)}
  // Ruined buildings frame a long abandoned street.
  for(let side of [-1,1]) for(let i=0;i<9;i++){let z=-35+i*9, x=side*(12+rand(i+side*17)*3), w=5+rand(i+6)*3,h=4+rand(i+25)*7,d=6+rand(i+43)*3;box(w,h,d,[0x555d55,0x697069,0x777b6f,0x484f49][i%4],x,h/2,z);this.props.push({x,z,r:3.8,height:Infinity});for(let floor=1;floor<Math.floor(h/2);floor++)for(let j=-1;j<=1;j++){box(.7,1.1,.06,0x252e2a,x+j*1.5,floor*2,z+d/2+.04);box(.7,1.1,.06,0x252e2a,x+j*1.5,floor*2,z-d/2-.04)}}
  for(let i=0;i<16;i++){let x=(rand(i+400)-.5)*18,z=(rand(i+500)-.5)*60;if(Math.abs(x)<2&&Math.abs(z)<8)continue;const h=.5+rand(i+600)*1.4;box(1.3,h,1.3,i%2?0x5c5143:0x464e42,x,h/2,z);this.props.push({x,z,r:1,height:h<=1.05?h:Infinity})}
  // utility poles and overhead wires
  for(let i=-2;i<4;i++){let z=i*12;box(.22,6,.22,0x373c35,-8,3,z);box(2,.13,.15,0x373c35,-8,5.5,z);}
  for(let x of [-8.7,-7.3]){let wire=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,72,4),mat(0x30342d));wire.rotation.x=Math.PI/2;wire.position.set(x,5.5,0);this.scene.add(wire)}
  addStreetDetails(this.scene, this.props);
  this.camera.position.set(0,1.7,7);this.scene.add(this.camera);this.makeGun();
  this.on(window,'resize',()=>this.resize());this.on(window,'keydown',((e:KeyboardEvent)=>{this.keys.add(e.code);if(e.code==='KeyR')this.reload();if(e.code==='Space'){e.preventDefault();if(!e.repeat&&this.started&&!this.paused&&this.grounded){this.verticalSpeed=6.5;this.grounded=false;}}}) as EventListener);this.on(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.code);}) as EventListener);
  this.on(document,'mousemove',((e:MouseEvent)=>{if(document.pointerLockElement===this.renderer.domElement&&this.started&&!this.paused){this.yaw-=e.movementX*.0022;this.pitch=Math.max(-1.15,Math.min(1.15,this.pitch-e.movementY*.0022));}}) as EventListener);
  this.on(document,'mousedown',((e:MouseEvent)=>{if(e.button===0&&document.pointerLockElement===this.renderer.domElement)this.shoot();}) as EventListener);
  this.on(document,'pointerlockchange',()=>{if(this.started&&!this.gameOver){this.zone.run(()=>this.paused=document.pointerLockElement!==this.renderer.domElement)}});
  this.animate();
 }
 private makeGun(){this.gun=new THREE.Group();const piece=(w:number,h:number,d:number,c:number,x:number,y:number,z:number)=>{let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,metalness:.45,roughness:.65}));m.position.set(x,y,z);this.gun.add(m)};piece(.22,.22,.85,0x202722,.35,-.38,-.8);piece(.14,.13,.55,0x111714,.35,-.33,-1.4);piece(.25,.13,.32,0x394138,.35,-.28,-.65);piece(.1,.3,.17,0x272b26,.35,-.58,-.63);piece(.13,.07,.35,0x151a16,.35,-.22,-.88);this.muzzle=new THREE.PointLight(0xffbf54,0,5);this.muzzle.position.set(.35,-.3,-1.7);this.gun.add(this.muzzle);this.flash=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshBasicMaterial({color:0xffd17a,transparent:true,opacity:.95,depthWrite:false}));this.flash.position.copy(this.muzzle.position);this.flash.scale.set(1,1,2.4);this.flash.visible=false;this.gun.add(this.flash);this.camera.add(this.gun)}
 start(){this.zombies.forEach(z=>this.scene.remove(z.group));this.zombies=[];this.wave=1;this.score=0;this.kills=0;this.health=100;this.ammo=30;this.started=true;this.gameOver=false;this.paused=false;this.reloading=false;this.camera.position.set(0,1.7,7);this.footHeight=0;this.verticalSpeed=0;this.grounded=true;this.keys.clear();this.clearTracers();this.flash.visible=false;this.yaw=0;this.pitch=0;this.spawnLeft=5;this.spawnTimer=1;this.waveDelay=0;this.zombieCount=0;this.waveMessage='SURVIVE THE WAVE';this.renderer.domElement.requestPointerLock();}
 resume(){this.renderer.domElement.requestPointerLock();}
 private reload(){if(!this.started||this.paused||this.reloading||this.ammo===30)return;this.reloading=true;this.reloadUntil=performance.now()+1500;}
 private clearTracers(){for(const tracer of this.tracers){this.scene.remove(tracer.line);tracer.line.geometry.dispose();(tracer.line.material as THREE.Material).dispose();}this.tracers=[];}
 private shoot(){
  if(!this.started||this.paused||this.gameOver||this.reloading)return;
  const now=performance.now();if(now-this.lastShot<160)return;if(this.ammo<=0){this.reload();return;}
  this.lastShot=now;this.ammo--;this.muzzle.intensity=8;this.flash.visible=true;this.gun.position.z=.12;
  this.camera.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),this.camera);
  const hits=ray.intersectObjects(this.zombies.map(z=>z.group),true);
  const cover=ray.intersectObjects(this.scene.children.filter(o=>o!==this.camera&&o.name!=='bullet-tracer'&&!this.zombies.some(z=>z.group===o)),true);
  const zombieHit=hits.length>0&&(!cover.length||hits[0].distance<cover[0].distance);
  const distance=Math.min(45,zombieHit?hits[0].distance:(cover[0]?.distance ?? 45));
  const end=ray.ray.at(distance,new THREE.Vector3());const muzzlePosition=this.muzzle.getWorldPosition(new THREE.Vector3());
  const tracer=new THREE.Line(new THREE.BufferGeometry().setFromPoints([muzzlePosition,end]),new THREE.LineBasicMaterial({color:0xffd795,transparent:true,opacity:.95,depthWrite:false}));tracer.name='bullet-tracer';this.scene.add(tracer);this.tracers.push({line:tracer,born:now});
  if(zombieHit){const target=this.zombies.find(z=>{let o:THREE.Object3D|null=hits[0].object;while(o){if(o===z.group)return true;o=o.parent;}return false;});if(target){this.hitConfirmed=true;setTimeout(()=>this.zone.run(()=>this.hitConfirmed=false),120);target.hp--;if(target.hp<=0){this.scene.remove(target.group);this.zombies.splice(this.zombies.indexOf(target),1);this.kills++;this.score+=100;}}}
 }
 private spawn(){
  // Spawn on traversable street within the play boundary, never inside a vehicle or building.
  let x=0,z=0; let found=false;
  for(let i=0;i<50;i++){const a=Math.random()*Math.PI*2,dist=16+Math.random()*10;x=THREE.MathUtils.clamp(this.camera.position.x+Math.sin(a)*dist,-8,8);z=THREE.MathUtils.clamp(this.camera.position.z+Math.cos(a)*dist,-39,39);if(Math.hypot(x-this.camera.position.x,z-this.camera.position.z)>10&&!this.props.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+1)){found=true;break;}}
  if(!found)return;
  const {group,limbs}=makeZombie();group.position.set(x,0,z);this.scene.add(group);this.zombies.push({group,limbs,hp:2+Math.floor((this.wave-1)/3),speed:1.05+Math.random()*.4+this.wave*.08,attack:0,phase:Math.random()*10});
 }
 private animate=()=>{this.frame=requestAnimationFrame(this.animate);const dt=Math.min(this.clock.getDelta(),.05);if(this.started&&!this.paused&&!this.gameOver){const now=performance.now();if(this.reloading&&now>=this.reloadUntil){this.ammo=30;this.reloading=false}this.camera.rotation.order='YXZ';this.camera.rotation.y=this.yaw;this.camera.rotation.x=this.pitch;let forward=new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw)),right=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)),move=new THREE.Vector3();if(this.keys.has('KeyW'))move.add(forward);if(this.keys.has('KeyS'))move.sub(forward);if(this.keys.has('KeyD'))move.add(right);if(this.keys.has('KeyA'))move.sub(right);// Vertical movement uses feet height; only low obstacles can be jumped onto or over.
  if(!this.grounded){this.verticalSpeed-=15*dt;this.footHeight+=this.verticalSpeed*dt;}
  if(move.lengthSq()){move.normalize().multiplyScalar(dt*(this.keys.has('ShiftLeft')?6.5:4));const blocked=(x:number,z:number)=>this.props.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+.4&&this.footHeight+0.02<p.height);const nx=THREE.MathUtils.clamp(this.camera.position.x+move.x,-30,30),nz=THREE.MathUtils.clamp(this.camera.position.z+move.z,-42,42);if(!blocked(nx,this.camera.position.z))this.camera.position.x=nx;if(!blocked(this.camera.position.x,nz))this.camera.position.z=nz;this.gun.position.y=Math.sin(now*.01)*.012}else this.gun.position.y=0;
  const floor=this.props.reduce((height,p)=>p.height<=1.05&&Math.hypot(this.camera.position.x-p.x,this.camera.position.z-p.z)<p.r+.35&&this.footHeight>=p.height-.15?Math.max(height,p.height):height,0);
  if(this.verticalSpeed<=0&&this.footHeight<=floor){this.footHeight=floor;this.verticalSpeed=0;this.grounded=true;}else if(this.grounded&&this.footHeight>floor){this.grounded=false;}
  this.camera.position.y=1.7+this.footHeight;
  this.spawnTimer-=dt;if(this.spawnLeft>0&&this.spawnTimer<=0){this.spawn();this.spawnLeft--;this.spawnTimer=.8}if(this.spawnLeft===0&&this.zombies.length===0){this.waveMessage='AREA CLEAR · NEXT WAVE INCOMING';this.waveDelay+=dt;if(this.waveDelay>3){this.wave++;this.waveMessage='SURVIVE THE WAVE';this.spawnLeft=5+this.wave*2;this.spawnTimer=.5;this.waveDelay=0;this.health=Math.min(100,this.health+15)}}
  for(const z of this.zombies){let dx=this.camera.position.x-z.group.position.x,dz=this.camera.position.z-z.group.position.z,dist=Math.hypot(dx,dz);z.group.rotation.y=Math.atan2(dx,dz);if(dist>1.25){let vx=dx/dist,vz=dz/dist;for(const p of this.props){const ox=z.group.position.x-p.x,oz=z.group.position.z-p.z,od=Math.hypot(ox,oz);if(od<p.r+1.5&&od>0){const force=(p.r+1.5-od)*1.5;vx+=ox/od*force;vz+=oz/od*force;}}const length=Math.hypot(vx,vz)||1;z.group.position.x+=vx/length*z.speed*dt;z.group.position.z+=vz/length*z.speed*dt;const stride=Math.sin(now*.006+z.phase);z.group.position.y=Math.abs(stride)*.04;z.group.rotation.z=stride*.035;z.limbs[0].rotation.x=-.65+stride*.25;z.limbs[1].rotation.x=-.65-stride*.25;z.limbs[2].rotation.x=stride*.45;z.limbs[3].rotation.x=-stride*.45}else if(now-z.attack>900){z.attack=now;this.health=Math.max(0,this.health-10);this.hurt=true;setTimeout(()=>this.zone.run(()=>this.hurt=false),180);if(this.health<=0){this.gameOver=true;this.started=false;document.exitPointerLock();}}}
  this.zombieCount=this.zombies.length;
  this.muzzle.intensity*=.7;this.flash.visible=now-this.lastShot<70;this.gun.position.z*=.8;
  for(let i=this.tracers.length-1;i>=0;i--){const t=this.tracers[i],age=now-t.born;(t.line.material as THREE.LineBasicMaterial).opacity=Math.max(0,1-age/140);if(age>=140){this.scene.remove(t.line);t.line.geometry.dispose();(t.line.material as THREE.Material).dispose();this.tracers.splice(i,1);}}
  this.zone.run(()=>{});
 }else if(!this.started&&!this.gameOver){this.camera.rotation.y=Math.sin(performance.now()*.00015)*.12;}
 this.renderer.render(this.scene,this.camera)};
 private resize(){let w=this.host.nativeElement.clientWidth,h=this.host.nativeElement.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h)}
 ngOnDestroy(){cancelAnimationFrame(this.frame);this.listeners.forEach(f=>f());this.clearTracers();this.renderer?.dispose()}
}
bootstrapApplication(App).catch(console.error);
