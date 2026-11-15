import * as THREE from 'three';

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
  mesh(new THREE.BoxGeometry(.15,.035,.02),dark,group,0,1.71,.21);
  const limbs:THREE.Group[]=[];
  for(const side of [-1,1]) {const arm=new THREE.Group();arm.position.set(side*.32,1.5,0);group.add(arm);mesh(new THREE.CylinderGeometry(.11,.09,.52,7),clothes,arm,0,-.26,0);mesh(new THREE.SphereGeometry(.1,7,6),skin,arm,0,-.55,0);limbs.push(arm);}
  for(const side of [-1,1]) {const leg=new THREE.Group();leg.position.set(side*.15,.88,0);group.add(leg);mesh(new THREE.CylinderGeometry(.13,.1,.72,7),pants,leg,0,-.36,0);mesh(new THREE.BoxGeometry(.23,.12,.32),dark,leg,0,-.72,.06);limbs.push(leg);}
  // Stains and torn clothing make each silhouette read as infected.
  mesh(new THREE.BoxGeometry(.14,.24,.015),new THREE.MeshStandardMaterial({color:0x57342c}),group,.09,1.25,.272);
  return {group,limbs};
}
