/** Small synthesized soundscape; starts only after the player's interaction. */
export class GameSound {
 private context?:AudioContext; private lastStep=0; private lastGrowl=0;
 start(){if(!this.context)this.context=new AudioContext();if(this.context.state==='suspended')void this.context.resume();}
 private tone(frequency:number,duration:number,volume:number,type:OscillatorType='sine',pan=0){const c=this.context;if(!c||c.state!=='running')return;const oscillator=c.createOscillator(),gain=c.createGain(),panner=c.createStereoPanner();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,c.currentTime);oscillator.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*.45),c.currentTime+duration);gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);panner.pan.value=Math.max(-1,Math.min(1,pan));oscillator.connect(gain).connect(panner).connect(c.destination);oscillator.start();oscillator.stop(c.currentTime+duration);}
 shot(heavy=false){this.tone(heavy?110:180,.12,.06,'sawtooth');}
 hit(){this.tone(420,.07,.025,'square');}
 explosion(){this.tone(75,.42,.1,'sawtooth');}
 pickup(){this.tone(540,.22,.035,'sine');}
 step(now:number){if(now-this.lastStep>380){this.lastStep=now;this.tone(90,.08,.015,'triangle');}}
 growl(now:number,pan:number){if(now-this.lastGrowl>2300){this.lastGrowl=now;this.tone(85,.5,.025,'sawtooth',pan);}}
 close(){if(this.context)void this.context.close();}
}
