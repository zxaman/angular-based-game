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
- **Hold left click:** automatic fire
- **R:** reload (unlimited reserve ammunition)
- **Shift:** sprint
- **Space:** jump over or onto low obstacles (tall obstacles remain solid)
- **Escape:** pause and release the mouse; click Resume to continue

Run `npm run build` for a production build.

## World and NPCs

The current game is an original, bounded coastal-market arena inspired by the broad three-lane idea of VALORANT Drift; it is not an exact recreation of the map. Market stalls, buildings, docks and palm trees provide landmarks and cover. Infected are procedural stylized characters, with articulated walk cycles and basic obstacle steering. Cover blocks shots. You can steer in the air with WASD.

You start with three lives and a shield; damage depletes the shield before health. When a life is lost, you redeploy with full health and shield and active enemies are cleared. Every five zombie kills fills your ult charge and pauses the game for a choice: increase weapon damage, increase and restore shield, or restore health and gain a life (up to three). Upgrades last until the run ends.

Possible next steps for a more realistic game:

- Replace procedural characters, weapons and buildings with licensed, optimized 3D assets and skeletal animation; add varied infected types and death animations.
- Add positional audio, ambient soundscapes, weapon sounds and reactive music.
- Build connected districts with streaming, interiors, a map, quests and loot; use navigation meshes for more reliable NPC pathfinding.
- Add survivor NPCs, scavenging, limited ammunition, inventory and save progression.
- Add lighting and graphics quality settings, accessibility options and mobile controls.
