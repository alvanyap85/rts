# Cold Front (冷锋)

A landscape real-time strategy game for phones by **Alvan's Studio**: deploy your base vehicle, mine ore, build a base, mass an army and flatten the enemy base. One match takes about ten minutes against the AI.

It is the game the "classic RTS" mobile ads promise. Everything (factions, units, buildings, art and sound) is original and drawn or synthesized in code. Don't use any name, unit, art or music from existing RTS games, and don't name other games in the store listing.

`Cold Front` is a working title. Check it for clashes before the first upload.

| | |
|---|---|
| App ID (never change after publishing) | `com.alvansstudio.coldfront`, still a placeholder: settle it before the first upload |
| Platform | Android, via [Capacitor](https://capacitorjs.com), landscape only |

## Project layout

| Path | What it is |
|---|---|
| `src/game.html` | The whole game: HTML, CSS and JavaScript in one file. Edit this. It is also the browser preview page. |
| `scripts/build.mjs` | Wraps the game into a full page and bundles the font so the app works offline. Output goes to `www/`. |
| `test/` | Headless checks with Playwright (see Tests). |
| `www/` | Built app files (generated, not committed). |
| `android/` | The Android Studio project that Capacitor generated. Locked to landscape (`sensorLandscape` in `AndroidManifest.xml`). |

## Build the Android app

You need [Node.js](https://nodejs.org) 22 or newer and [Android Studio](https://developer.android.com/studio).

```bash
npm install
```

```bash
npm run android
```

This builds `www/`, copies it into the Android project and opens Android Studio. Press **Run** with a phone plugged in (USB debugging on) or an emulator.

## Tests

```bash
node test/sim.cjs 1,2,3
```

Plays AI-vs-AI games at full speed for the given map seeds (optional second argument: difficulty 0-2) and prints each side's buildings, units and income per minute, how the game ended and the slowest simulation step. It also writes `test/page.html`, which the other two scripts load.

```bash
node test/touch.cjs
```

Plays the start of a game by touch: deploy the base vehicle, build and place a power plant, select the tank and move it, try to train infantry without a barracks.

```bash
node test/shot.cjs
```

Saves screenshots of the start, the base after a few minutes and a fight (`test/*.png`).

```bash
node test/controls.cjs
```

Checks the touch gestures (long-press drag to box-select, drag and fling to pan), repair and sell.

```bash
node test/zoom.cjs
```

Saves a close-up of the base at high zoom (`test/zoom.png`) for checking the voxel art.

## How the game works

- **View:** isometric 2:1. The simulation runs on a flat 72×48 grid of 32 px tiles; everything is drawn through the projection `screen = (x − y, (x + y) / 2 − z)`. Ground layers (terrain, fog, decals) use that projection as a canvas transform.
- **Voxel art:** vehicles and buildings are voxel models built in code (`MODEL_FN`: boxes, cylinders and paint passes with materials from `M`, 1 voxel = 1 world px). `renderVox` turns a model into a sprite at 2 px per voxel, with light from the upper left, specular highlights, ambient occlusion, edge shading and a baked ground shadow. Team colours are materials, so each team gets its own sprites. Vehicles and turrets are rendered for 32 facings, buildings once. Sprites are made the first time they're needed and cached (`unitSpr`, `bldSpr`). Moving parts (crane arm, doors, flags) and infantry are still drawn with plain canvas shapes on top.
- **Map:** generated per match and point-symmetric, so both sides get the same ground. A river runs between the bases with three fords. There are ore fields near each base and richer ones toward the middle, and blocking rock and tree clusters. Ore regrows slowly.
- **Start:** each side gets a base vehicle (MCV), a tank and three riflemen. Deploy the MCV (the 展开 button, or tap it again while it's selected) to get the construction yard. More MCVs come from the war factory. A side loses when it has no buildings and no MCV left.
- **Buildings:** construction yard, power plant (+100 power), refinery (comes with a harvester), barracks, war factory, sentry gun. A new building must be within 4 tiles of one of your buildings. Low power halves production speed and slows sentry guns.
- **Units:** rifleman (good vs infantry), rocket soldier (good vs vehicles), tank (all-round, fires on the move), harvester, MCV. Damage multipliers per armour class are in `WDEF`.
- **Production:** the cost is paid as progress is made, and progress stalls when money runs out. One building at a time; infantry and vehicles each have a queue of up to 9. Long-press an icon to cancel and get the money back.
- **Pathing:** flow fields (Dijkstra from the target, cached), plus straight-line moves when the way is clear, plus unit separation.
- **AI:** fixed opening build order, then power, turrets and refineries as needed. It keeps its harvesters topped up and defends its base. It attacks in waves that grow each time (`DIFF` sets the first attack, wave size and timing per difficulty).
- **Shroud:** unexplored ground is black. Once explored it stays fully visible, enemy units included, as in the classic games. The minimap works from the start.
- **Repair and sell:** select one of your buildings to get 维修 / 出售 buttons. Repair restores 5% of the building's health per second, and a full repair costs half its price; it pauses when money runs out. Selling takes two taps (the second shows the amount) and refunds half the price, scaled by health. The building packs up and 1-3 riflemen walk out. The AI repairs buildings below 70% health when it has the money.
- **Controls (touch):**
  - Selecting: tap a unit to select it; double-tap, or long-press it, to select all units of that type on screen. To box-select, press and hold the ground until the ring fills (300 ms), then drag. A long press on empty ground clears the selection.
  - Commands: tap the ground to move, an enemy to attack, ore to send harvesters.
  - Camera: a quick one-finger drag pans, and a fling keeps the camera gliding; two fingers zoom; tapping the minimap jumps the camera.
  - The action bar at the bottom changes with the selection: 展开 (MCV), 停止 (units), 维修 / 出售 (your building), 取消选择. 全军 selects every combat unit.
  - Select a barracks or factory and tap the ground to set its rally point.
- **Controls (mouse):** left-drag to box-select; right- or middle-drag to pan; the wheel zooms; right-click clears the selection or cancels placing.

## Still to do

1. Try it on real phones (frame rate on cheap phones, button sizes).
2. A compact layout for regular phones: a collapsible sidebar, the minimap behind a button, a closer default zoom. The current layout suits tablets and foldables.
3. More effects: multi-frame explosions, debris, smoke columns, screen shake, building collapse.
4. Balance: in AI-vs-AI games the left side wins noticeably more often.
5. Campaign missions, superweapons, engineers, more unit types per side.
6. App icon, splash screen, store listing, privacy policy, then ads and "Remove ads" as in Block Crumble.
