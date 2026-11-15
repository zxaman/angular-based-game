# Dead End — Zombie Survival

A first-person 3D survival game built with Angular and Three.js. Survive escalating waves, earn points for kills, and recover a little health between waves.

## Run locally

```bash
npm install
npm start
```

Open the URL printed by the development server. The game requires a desktop browser with WebGL, keyboard, and mouse. Click **Enter the Dead Zone** to capture the mouse.

- **WASD:** move
- **Mouse:** look and aim
- **Left click:** fire
- **R:** reload (unlimited reserve ammunition)
- **Shift:** sprint
- **Space:** jump over or onto low obstacles (tall obstacles remain solid)
- **Escape:** pause and release the mouse; click Resume to continue

Run `npm run build` for a production build.

## World and NPCs

The current game is a bounded survival sector, not a full open world. It includes procedurally textured streets, abandoned cars, barricades, streetlights, puddles and rubble. Infected have articulated walk cycles and steer around nearby obstacles; cover can block shots. The HUD shows the number of active hostiles and confirms hits.

Possible next steps for a more realistic game:

- Replace procedural characters, weapons and buildings with licensed, optimized 3D assets and skeletal animation; add varied infected types and death animations.
- Add positional audio, ambient soundscapes, weapon sounds and reactive music.
- Build connected districts with streaming, interiors, a map, quests and loot; use navigation meshes for more reliable NPC pathfinding.
- Add survivor NPCs, scavenging, limited ammunition, inventory and save progression.
- Add lighting and graphics quality settings, accessibility options and mobile controls.
