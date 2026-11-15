/** Approximate blockout traced from the supplied overhead reference. World x/z units. */
const point = (x:number,z:number): [number,number] => [(x-341)*.08,(z-386)*.08];
export const outline = [[171,15],[326,15],[326,139],[511,139],[511,232],[465,232],[465,262],[603,262],[603,602],[511,602],[511,757],[356,757],[356,633],[171,633],[171,539],[217,539],[217,510],[78,510],[78,169],[171,169]].map(([x,z])=>point(x,z));
export interface Wall { x:number; z:number; w:number; d:number; }
const rect=(x1:number,z1:number,x2:number,z2:number):Wall=>{const a=point(x1,z1),b=point(x2,z2);return {x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,w:b[0]-a[0],d:b[1]-a[1]};};
export const walls:Wall[]=[
 rect(234,110,263,247),rect(141,202,201,231),rect(172,294,325,324),rect(234,356,263,386),
 rect(388,202,418,354),rect(418,325,540,355),rect(480,354,510,415),rect(419,386,448,415),
 rect(141,418,294,447),rect(172,356,202,418),rect(265,447,294,570),rect(357,448,510,478),
 rect(419,525,448,663),rect(480,540,540,570)
];
export function inside(x:number,z:number):boolean {let hit=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const [xi,zi]=outline[i],[xj,zj]=outline[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)hit=!hit;}return hit;}
export function walkable(x:number,z:number,r=.32):boolean {
  if(!inside(x-r,z-r)||!inside(x+r,z-r)||!inside(x-r,z+r)||!inside(x+r,z+r))return false;
  return !walls.some(w=>Math.abs(x-w.x)<w.w/2+r&&Math.abs(z-w.z)<w.d/2+r);
}
/** Reverse breadth-first flow field so enemies can navigate around the blockout. */
export class Navigation {
  readonly step=.8; readonly minX=-22; readonly minZ=-31; readonly cols=55; readonly rows=78;
  private distance=new Int32Array(this.cols*this.rows).fill(-1);
  cell(x:number,z:number):number {const cx=Math.floor((x-this.minX)/this.step),cz=Math.floor((z-this.minZ)/this.step);return cx<0||cz<0||cx>=this.cols||cz>=this.rows?-1:cz*this.cols+cx;}
  position(i:number):[number,number] {return [this.minX+(i%this.cols+.5)*this.step,this.minZ+(Math.floor(i/this.cols)+.5)*this.step];}
  update(x:number,z:number){this.distance.fill(-1);const start=this.cell(x,z);if(start<0)return;const queue=new Int32Array(this.distance.length);let head=0,tail=0;queue[tail++]=start;this.distance[start]=0;while(head<tail){const i=queue[head++],cx=i%this.cols,cz=Math.floor(i/this.cols);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=this.cols||nz>=this.rows)continue;const n=nz*this.cols+nx;if(this.distance[n]!==-1)continue;const [px,pz]=this.position(n);if(!walkable(px,pz,.4))continue;this.distance[n]=this.distance[i]+1;queue[tail++]=n;}}}
  next(x:number,z:number):[number,number]|null {const i=this.cell(x,z);if(i<0||this.distance[i]<0)return null;const cx=i%this.cols,cz=Math.floor(i/this.cols);let best=i;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=this.cols||nz>=this.rows)continue;const n=nz*this.cols+nx;if(this.distance[n]>=0&&this.distance[n]<this.distance[best])best=n;}return best===i?null:this.position(best);}
}
