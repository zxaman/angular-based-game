import * as THREE from 'three';
export type WeaponType='rifle'|'shotgun'|'sniper';
/** Original low-poly weapon models; coordinates are local to the first-person camera. */
export function buildWeapon(type:WeaponType){
 const group=new THREE.Group();
 const metal=new THREE.MeshStandardMaterial({color:0x252b29,metalness:.7,roughness:.42});
 const dark=new THREE.MeshStandardMaterial({color:0x131917,metalness:.6,roughness:.45});
 const polymer=new THREE.MeshStandardMaterial({color:0x42483c,metalness:.15,roughness:.86});
 const wood=new THREE.MeshStandardMaterial({color:0x71523a,roughness:.84});
 const glass=new THREE.MeshStandardMaterial({color:0x456e69,metalness:.35,roughness:.2});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material=metal,rz=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.z=rz;group.add(m);return m;};
 const tube=(r:number,len:number,x:number,y:number,z:number,mat:THREE.Material=dark)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,12),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);group.add(m);return m;};
 // All variants have a receiver, trigger guard, pistol grip and rear stock.
 box(.22,.2,.72,.35,-.37,-.78);box(.18,.15,.37,.35,-.39,-.26,type==='shotgun'?wood:polymer);
 box(.13,.23,.22,.35,-.36,-.12,type==='shotgun'?wood:polymer);box(.11,.29,.15,.35,-.58,-.62,polymer,-.15);
 box(.13,.035,.18,.35,-.51,-.78,dark);box(.035,.1,.025,.35,-.47,-.85,dark);
 let end=-1.7;
 if(type==='rifle'){
   box(.18,.16,.52,.35,-.38,-1.35,polymer);tube(.052,.67,.35,-.34,-1.76);tube(.066,.08,.35,-.34,-2.1);end=-2.14;
   const mag=box(.14,.27,.22,.35,-.57,-.93,dark);mag.rotation.x=-.16;
   box(.12,.045,.52,.35,-.245,-.93,dark);for(let i=0;i<7;i++)box(.13,.02,.025,.35,-.215,-.72-i*.07,metal);
   box(.03,.12,.035,.35,-.20,-1.48,dark);box(.12,.045,.12,.35,-.19,-.72,dark);
 }else if(type==='shotgun'){
   box(.2,.16,.43,.35,-.38,-1.25,wood);tube(.062,1.05,.35,-.32,-1.68);tube(.045,.87,.35,-.43,-1.59);end=-2.21;
   for(let i=0;i<5;i++)box(.21,.015,.03,.35,-.29,-1.08-i*.065,polymer);
   box(.09,.05,.12,.35,-.23,-.72,dark);
 }else{
   box(.18,.15,.67,.35,-.38,-1.39,polymer);tube(.045,1.05,.35,-.34,-1.87);tube(.07,.11,.35,-.34,-2.42);end=-2.48;
   box(.14,.22,.18,.35,-.55,-.91,dark);tube(.09,.43,.35,-.18,-.89,metal);tube(.105,.07,.35,-.18,-1.13,dark);tube(.102,.06,.35,-.18,-.65,dark);tube(.073,.008,.35,-.18,-1.171,glass);
 }
 const muzzle=new THREE.PointLight(0xffbf54,0,5);muzzle.position.set(.35,-.33,end);group.add(muzzle);
 const flash=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshBasicMaterial({color:0xffd17a,transparent:true,opacity:.95,depthWrite:false}));flash.position.copy(muzzle.position);flash.scale.set(1,1,2.4);flash.visible=false;group.add(flash);
 return {group,muzzle,flash};
}
export function disposeWeapon(group:THREE.Group){const materials=new Set<THREE.Material>();group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const list=Array.isArray(o.material)?o.material:[o.material];list.forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());}
