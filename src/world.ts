import * as THREE from 'three';
import { outline, walls } from "./layout";

// Repeatable canvas textures keep the world self-contained and avoid external assets.
function texture(base: string, speckle: string, seed: number, repeat: [number, number]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  let state = seed; const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  for (let i = 0; i < 6500; i++) { ctx.fillStyle = speckle; ctx.globalAlpha = random() * .2; const size = random() * 2 + .3; ctx.fillRect(random()*256, random()*256, size, size); }
  ctx.globalAlpha = .15; ctx.strokeStyle = '#1a211c';
  for (let i = 0; i < 14; i++) { let x=random()*256,y=random()*256; ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<4;j++){x+=(random()-.5)*25;y+=random()*17;ctx.lineTo(x,y);}ctx.stroke(); }
  const result = new THREE.CanvasTexture(canvas); result.wrapS = result.wrapT = THREE.RepeatWrapping; result.repeat.set(...repeat); result.colorSpace = THREE.SRGBColorSpace; result.anisotropy = 4; return result;
}
export function makeGroundMaterial(): THREE.MeshStandardMaterial { return new THREE.MeshStandardMaterial({map:texture('#62685e','#d1d0b4',7,[18,18]),roughness:1}); }
export function addStreetDetails(scene: THREE.Scene, obstacles: {x:number,z:number,r:number,height:number}[]) {
  const asphalt = new THREE.MeshStandardMaterial({map:texture('#343c39','#a2a59a',15,[3,20]),roughness:1});
  const concrete = new THREE.MeshStandardMaterial({map:texture('#777b6e','#e1dbbe',19,[2,18]),roughness:1});
  const road = new THREE.Mesh(new THREE.PlaneGeometry(17,100),asphalt); road.rotation.x=-Math.PI/2;road.position.y=.02;road.receiveShadow=true;scene.add(road);
  const box=(w:number,h:number,d:number,color:number,x:number,y:number,z:number, material?:THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material || new THREE.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};
  for(const side of [-1,1]) {box(2,.18,100,0x777b70,side*9.5,.09,0,concrete);for(let z=-45;z<=45;z+=3){box(1.9,.015,.025,0x414940,side*9.5,.19,z);}}
  // Weathered road lines sit above the asphalt, rather than underneath it.
  for(let z=-45;z<=45;z+=6) box(.14,.015,3,0xb9ac81,0,.033,z);
  const wheelMat = new THREE.MeshStandardMaterial({color:0x171c1a,roughness:.9});
  for(const [x,z,angle,color] of [[-4,-14,.13,0x4a544a],[5,-31,-.2,0x655448],[-5,26,-.12,0x414c4a]] as number[][]){
    const car=new THREE.Group();car.position.set(x,0,z);car.rotation.y=angle;scene.add(car);
    const part=(w:number,h:number,d:number,c:number,px:number,py:number,pz:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.8,metalness:.25}));m.position.set(px,py,pz);m.castShadow=true;car.add(m);};
    part(2,.65,4,color,0,.65,0);part(1.7,.6,2.1,color,0,1.25,.1);part(1.56,.4,.03,0x293b3b,0,1.28,-.97);part(1.56,.4,.03,0x293b3b,0,1.28,1.17);
    for(const sx of [-1,1])for(const sz of [-1,1]) {const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.25,12),wheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(sx*1,.38,sz*1.3);car.add(wheel);}
    obstacles.push({x,z,r:2,height:Infinity});
  }
  // Pools, scattered rubble, and warning barricades break up the repeated street.
  const puddleMat=new THREE.MeshStandardMaterial({color:0x414e4b,roughness:.22,metalness:.35});
  for(let i=0;i<24;i++){const x=Math.sin(i*47)*7,z=Math.cos(i*83)*40;const p=new THREE.Mesh(new THREE.CircleGeometry(.3+(i%4)*.15,9),puddleMat);p.rotation.x=-Math.PI/2;p.position.set(x,.035,z);p.scale.y=.4;scene.add(p);}
  for(let i=0;i<32;i++){let x=Math.sin(i*23)*7.5,z=Math.cos(i*41)*40;box(.15+(i%3)*.12,.1,.2+(i%4)*.13, i%2?0x77766a:0x504c42,x,.09,z).rotation.y=i;}
  for(const z of [-38,38]) {for(const x of [-2,2]){box(.12,1.1,.15,0x594b37,x,.55,z); }box(5,.25,.15,0xaa7449,0,.9,z);box(5,.25,.15,0xb3a387,0,.6,z);}
  // A few dim amber streetlights add visual landmarks in the haze.
  for (const z of [-24,0,24]) {box(.15,5,.15,0x323a34,7.8,2.5,z);box(1.5,.12,.12,0x323a34,7.1,4.9,z);const lamp=new THREE.PointLight(0xe5b978,15,12,2);lamp.position.set(6.4,4.7,z);scene.add(lamp);const glow=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xffd792}));glow.position.copy(lamp.position);scene.add(glow);}
}

export function makeZombie(): {group: THREE.Group; limbs: THREE.Group[]} {
  const group=new THREE.Group();
  const shirts=[0x4e5c4d,0x68574d,0x52605b,0x5b5750];const shirt=shirts[Math.floor(Math.random()*shirts.length)];
  const skin=new THREE.MeshStandardMaterial({color:0x879078,roughness:1});const clothes=new THREE.MeshStandardMaterial({color:shirt,roughness:1});const pants=new THREE.MeshStandardMaterial({color:0x343c38,roughness:1});const dark=new THREE.MeshStandardMaterial({color:0x282c27,roughness:1});
  const mesh=(geometry:THREE.BufferGeometry, material:THREE.Material, parent:THREE.Object3D,x:number,y:number,z:number)=>{let m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
  mesh(new THREE.CylinderGeometry(.29,.23,.72,8),clothes,group,0,1.22,0);
  const head=mesh(new THREE.SphereGeometry(.25,10,8),skin,group,0,1.83,0);head.scale.set(.85,1.15,.86);
  mesh(new THREE.BoxGeometry(.35,.14,.34),dark,group,0,1.98,-.04);
  const eyes=new THREE.MeshStandardMaterial({color:0xa4432c,emissive:0x6b2010,emissiveIntensity:.7});for(const x of [-.095,.095])mesh(new THREE.SphereGeometry(.035,6,4),eyes,group,x,1.85,.205);
  // Facial volume, sunken eyes, exposed teeth and uneven skin marks.
  const nose=mesh(new THREE.SphereGeometry(.065,8,6),skin,group,0,1.77,.22);nose.scale.set(.7,1.1,.8);
  mesh(new THREE.BoxGeometry(.15,.045,.025),dark,group,0,1.69,.205);
  const teeth=new THREE.MeshStandardMaterial({color:0xb9b3a0,roughness:1});
  for(let i=-2;i<=2;i++) mesh(new THREE.BoxGeometry(.022,.025,.01),teeth,group,i*.026,1.695,.22);
  const wound=new THREE.MeshStandardMaterial({color:0x68392f,roughness:1});
  const gash=mesh(new THREE.BoxGeometry(.12,.025,.015),wound,group,-.1,1.91,.19);gash.rotation.z=.35;
  const neck=mesh(new THREE.CylinderGeometry(.12,.15,.18,9),skin,group,0,1.56,0);neck.rotation.z=.08;
  mesh(new THREE.BoxGeometry(.12,.18,.03),wound,group,-.09,1.36,.285);
  mesh(new THREE.BoxGeometry(.08,.12,.03),skin,group,.12,1.07,.25);

  const limbs:THREE.Group[]=[];
  for(const side of [-1,1]) {const arm=new THREE.Group();arm.position.set(side*.32,1.5,0);group.add(arm);mesh(new THREE.CylinderGeometry(.11,.09,.52,7),clothes,arm,0,-.26,0);mesh(new THREE.SphereGeometry(.1,7,6),skin,arm,0,-.55,0);for(let f=-1;f<=1;f++)mesh(new THREE.CylinderGeometry(.018,.013,.13,5),skin,arm,f*.05,-.64,.04);limbs.push(arm);}
  for(const side of [-1,1]) {const leg=new THREE.Group();leg.position.set(side*.15,.88,0);group.add(leg);mesh(new THREE.CylinderGeometry(.13,.1,.72,7),pants,leg,0,-.36,0);mesh(new THREE.BoxGeometry(.23,.12,.32),dark,leg,0,-.72,.06);limbs.push(leg);}
  // Stains and torn clothing make each silhouette read as infected.
  mesh(new THREE.BoxGeometry(.14,.24,.015),new THREE.MeshStandardMaterial({color:0x57342c}),group,.09,1.25,.272);
  return {group,limbs};
}

/** Original coastal market arena, inspired by the broad three-lane concept, not a replica. */
export function addCoastalArena(scene: THREE.Scene, obstacles: {x:number,z:number,r:number,height:number}[]) {
  const box=(w:number,h:number,d:number,c:number,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.9}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};
  const plane=(w:number,d:number,c:number,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:c,roughness:.92}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);};
  // Three navigable lanes connected by open plazas, with a canal beyond the dock.
  plane(56,84,0xb2a38a,0,.01,0);
  for(const x of [-15,0,15]) {plane(9,80,x===0?0x9c927c:0xa99b84,x,.025,0);for(let z=-36;z<40;z+=4)box(8.8,.015,.035,0x807c6c,x,.04,z);}
  for(const x of [-34,34]){plane(14,100,0x477d7c,x,.02,0);for(let z=-45;z<50;z+=5)box(12,.01,.04,0x8bada4,x,.035,z);}
  // Small dockside buildings and stalls create cover while retaining routes between lanes.
  for(const side of [-1,1])for(const z of [-28,-9,12,31]){
    const x=side*23;const wall=[0xd6c1a2,0xb9aaa0,0xc4b5a0,0xd5ba95][Math.floor((z+28)/19)%4]||0xc5b39c;
    box(6,3.5,5,wall,x,1.75,z);box(6.6,.25,5.6,0x806a59,x,3.6,z);box(1.8,1.7,.05,0x354b46,x,1.8,z-2.53);box(.06,1.8,1.7,0x354b46,x-side*3.03,1.8,z);
    obstacles.push({x,z,r:3.5,height:Infinity});
    // Awning facing the central lanes.
    const awning=box(2.4,.13,4,0xc07457,x-side*4,2.7,z);awning.rotation.z=side*.12;
    box(.1,2.5,.1,0x6d5844,x-side*5,1.25,z-1.8);box(.1,2.5,.1,0x6d5844,x-side*5,1.25,z+1.8);
  }
  // Central market stalls break sightlines without closing the three routes.
  for(const [x,z] of [[-7,-21],[7,-10],[-7,9],[7,23]]) {
    box(2.2,1.15,2.2,0x826a4d,x,.58,z);obstacles.push({x,z,r:1.25,height:Infinity});
    for(const dx of [-1,1]) for(const dz of [-1,1])box(.09,2.5,.09,0x695842,x+dx,1.4,z+dz);
    box(2.8,.13,2.8,z%2?0xc88067:0x758f82,x,2.7,z);
    for(const dx of [-.55,0,.55]){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshStandardMaterial({color:dx===0?0xdfa35d:0x77905a}));fruit.position.set(x+dx,1.32,z);scene.add(fruit);}
  }
  // Jumpable packing crates and substantial barriers, all represented in collision data.
  for(const [x,z,h] of [[-13,-17,.7],[3,-23,.8],[14,-3,.65],[-2,12,.85],[13,27,.7],[-15,22,.65],[4,4,1.4]]){
    box(1.3,h,1.3,0x826a4c,x,h/2,z);box(1.32,.035,.08,0x514635,x,h*.7,z+.66);obstacles.push({x,z,r:.9,height:h<=1.05?h:Infinity});
  }
  // Palm silhouettes, rope, and maritime props give the sector its own identity.
  for(const [x,z] of [[-26,-35],[26,-20],[-26,4],[26,27]]){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.17,.28,5,8),new THREE.MeshStandardMaterial({color:0x756249,roughness:1}));trunk.position.set(x,2.5,z);trunk.rotation.z=.08;trunk.castShadow=true;scene.add(trunk);
    for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.45,3.2,5),new THREE.MeshStandardMaterial({color:i%2?0x527454:0x64805b,side:THREE.DoubleSide}));leaf.position.set(x+Math.sin(i*Math.PI*2/7)*1.1,5,z+Math.cos(i*Math.PI*2/7)*1.1);leaf.rotation.set(Math.cos(i*Math.PI*2/7)*1.1,0,-Math.sin(i*Math.PI*2/7)*1.1);scene.add(leaf);}
  }
  for(let z=-36;z<40;z+=8){box(.12,1.1,.12,0x605746,-27,.55,z);box(.12,1.1,.12,0x605746,27,.55,z);}
  for(const x of [-27,27]){const rope=box(.06,.06,79,0xc6b597,x,.9,0);rope.castShadow=false;}
  for(const x of [-4,4])box(.08,5,.08,0x665c50,x,2.5,0);
  box(8,.08,.08,0x665c50,0,4.8,0);
  // hanging lanterns over the central plaza
  for(const x of [-3,-1,1,3]){box(.04,.7,.04,0x746656,x,4.4,0);const lantern=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),new THREE.MeshStandardMaterial({color:0xe6ac6c,emissive:0x8e4b26,emissiveIntensity:.35}));lantern.position.set(x,4,0);scene.add(lantern);}
}

/** A playable architectural blockout based on the supplied top-down plan and screenshots. */
export function addReferenceArena(scene:THREE.Scene) {
  const material=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.88});
  const box=(w:number,h:number,d:number,c:number,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};
  const plane=(w:number,d:number,c:number,y:number)=>{let m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material(c));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;scene.add(m);};
  plane(120,120,0x3d9d9c,-.12);plane(53,74,0xc3b5a1,-.02);
  // Paved tiles emphasize the courtyard and routes.
  for(let x=-21;x<=21;x+=2)box(.018,.012,60,0xa99a85,x,.005,0);
  for(let z=-30;z<=30;z+=2)box(42,.012,.018,0xa99a85,0,.006,z);
  // The outline and interior blocks are also the single source of truth for collision and minimap.
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,w=Math.abs(a[0]-b[0])+.18,d=Math.abs(a[1]-b[1])+.18;box(w,2.4,d,0x9a8c78,x,1.2,z);box(w+.08,.15,d+.08,0x6d5a48,x,2.45,z);}
  walls.forEach((wall,index)=>{
    const {x,z,w,d}=wall;const color=index%3===0?0x9c9c8c:index%3===1?0x9d7c62:0xa88d71;
    box(w,3.7,d,color,x,1.85,z);box(w+.14,.17,d+.14,0x594938,x,.45,z);box(w+.2,.18,d+.2,0x5e4939,x,3.65,z);
    // Layered pitched roofs with warm timber eaves.
    const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.57,1.3,4),material(index%2?0x765344:0x605852));roof.rotation.y=Math.PI/4;roof.scale.set(w/Math.max(w,d),1,d/Math.max(w,d));roof.position.set(x,4.4,z);roof.castShadow=true;scene.add(roof);
    if(w>d){for(let px=x-w/2+.8;px<x+w/2;px+=1.3)box(.07,2.9,.08,0x70563f,px,2,z+d/2+.05);}else{for(let pz=z-d/2+.8;pz<z+d/2;pz+=1.3)box(.08,2.9,.07,0x70563f,x+w/2+.05,2,pz);}
  });
  // Fountain in the central courtyard.
  const cyl=(r1:number,r2:number,h:number,c:number,y:number)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,20),material(c));m.position.set(0,y,0);m.castShadow=true;m.receiveShadow=true;scene.add(m);};
  cyl(1.55,1.65,.22,0x5f8580,.13);cyl(1.05,1.1,.45,0x999a8b,.43);cyl(.7,.8,.38,0xb6ad9b,.84);
  for(const [x,z] of [[-19,-22],[18,-14],[-18,7],[18,17],[-7,32]]){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.25,5,8),material(0x806c50));trunk.position.set(x,2.5,z);scene.add(trunk);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.4,2.5,5),material(i%2?0x4e7951:0x759461));leaf.position.set(x+Math.sin(a)*.9,5,z+Math.cos(a)*.9);leaf.rotation.set(Math.cos(a)*1.15,0,-Math.sin(a)*1.15);scene.add(leaf);}}
  // Warm hanging lanterns and a bright overhead cable frame the middle.
  for(const x of [-2,2]){box(.05,4,.05,0x624f3b,x,2,3);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),new THREE.MeshStandardMaterial({color:0xffd398,emissive:0xa86d32,emissiveIntensity:.55}));lamp.position.set(x,3.5,3);scene.add(lamp);}
  const cable=box(12,.035,.035,0xe0bf51,0,5,0);cable.rotation.y=.25;
}
