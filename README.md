# Dead End — Zombie Survival

A desktop first-person survival game built with Angular and Three.js. Survive escalating waves in a reference-inspired coastal arena. The buildings and characters are procedural approximations, not photorealistic assets.

## Run locally

```bash
npm install
npm start
```

Open the printed URL in a desktop browser with WebGL, keyboard, mouse, and audio enabled. Click **Enter the Dead Zone** to start and capture the mouse. Audio is synthesized in the browser after interaction.

## Controls

- **WASD / mouse:** move and aim; hold left click to fire
- **Shift / Space:** sprint / jump (steer in the air)
- **R:** reload from finite reserve ammunition
- **1 / 2 / 3:** select rifle / shotgun / sniper (unlock the latter two in supply drops); hold right click to scope with the sniper
- **E:** open a nearby supply drop or activate the generator
- **G:** detonate a grenade ahead of you; walls stop the throw
- **Escape:** pause and release the mouse

## Survive the outbreak

Runners move faster, tanks absorb more damage, and screamers call reinforcements when close. Glowing rings identify runners (red), tanks (orange), screamers (purple), and bosses (gold); bosses also show a health bar. Every fifth wave includes a tougher boss worth bonus points. At medium range the boss telegraphs a charge, locks its direction, and rushes forward until it hits cover or runs out of time; dodge sideways or jump. It also has a close-range melee attack. Every third wave brings fog and additional enemies. Every second wave, a supply drop appears as a gold dot on the minimap; get close and press E within 60 seconds to collect health, ammo, grenades, weapon unlocks and a score bonus. The supply timer pauses while you are defending the generator. Bosses also drop supplies if one isn't already present.

The cyan square on the minimap is a generator. Activate it with E for points and shield, but its noise attracts a swarm. Stay within seven units of it for 20 seconds to earn an additional score and shield reward; the timer pauses if you move out of range and the defense fails if you lose a life. It powers the blue puddle across the map for 18 seconds, damaging infected within it. Red barrels can be shot to damage nearby infected. Grenades and barrels affect enemies in a radius and do not damage the player. Ammo and grenades are limited; resupply them from drops. The shotgun fires a spread of seven pellets, while sniper rounds can pierce up to three infected but stop at cover. Hit numbers show total damage per shot, critical hits are highlighted, and the red directional indicator points toward an attacker.

You start with three lives and a shield. Damage depletes shield before health; losing a life redeploys you and clears active infected. Every five kills pauses the game for an upgrade: damage, shield, health/life, reload speed, critical hits, or a temporary damage boost. Upgrades last for the run except the timed boost.

The minimap, collision and zombie navigation share the same approximate map layout. Sound effects are synthesized; growls use simple stereo direction rather than recorded spatial audio.

Run `npm run build` for a production build.

At the end of a run, the debrief shows score, wave, kills by type, damage, objectives, survival time and accuracy (the percentage of shots that hit at least one infected). The personal best score is stored locally in your browser when storage is available. Timers stop while the game is paused.

Weapons use original low-poly procedural models with distinct rifle, shotgun and scoped-sniper silhouettes, not photorealistic licensed assets.
