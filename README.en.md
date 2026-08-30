# Hoshi no Kiroku

[日本語](README.md) | **English**

An orbital defense action shooter.

Hoshi no Kiroku is an original orbital defense action shooter created for learning HTML, CSS, and JavaScript. The program, characters, screen layouts, and visual effects were created specifically for this game. It does not use images, logos, programs, or characters from games owned by third parties. Audio used in the title-screen intro video is provided under the Pixabay Content License.

## Japanese / English Display

Use the “日本語 / English” buttons below the “Hoshi no Kiroku” title to switch between Japanese and English. The selected language applies to both the title screen and in-game text—including the HUD, mission information, weapons, status messages, and upgrades—and is saved for your next visit.

## Story

In the year 2xxx, the mining station Shin continues extracting rare minerals from Earth orbit. One day, an unknown crystal discovered deep beneath Earth's surface resonates with the station's energy core.

![Resonance](assets/images/star_1.jpg)

The core emits a powerful signal. Nearby mining drones interpret it as a “return signal” from an ancient device. The flying objects are not attacking out of malice; they are trying to crash into the core as though something is calling them home.

![Resonance](assets/images/star_2.jpg)

The player's mission is to operate a defense fighter, prevent the drones from reaching the core, and buy time until signal analysis is complete. Each successfully defended wave advances the analysis, eventually revealing an enormous artificial structure hidden inside Earth.

![Resonance](assets/images/star_3.jpg)

Success means more than protecting the station. It also establishes humanity's first contact and opens a door to an unknown civilization.

![Resonance](assets/images/star_4.jpg)

## How to Run

Run the game using any of the following methods:

- Open `index.html` directly in a browser
- Launch it with the VS Code Live Server or Five Server extension
- Publish it with GitHub Pages

![Game screen](assets/images/2026-07-03-175205.jpg)

Supported browsers: the latest versions of Google Chrome, Microsoft Edge, and Firefox.

## Controls

| Action                 | Key                              | Energy Cost                  |
| ---------------------- | -------------------------------- | ---------------------------- |
| Move in all directions | WASD or Arrow keys               | -                            |
| Fire (hold to repeat)  | Space                            | Normal 2 / Spread 8 / EMP 30 |
| Dash                   | Shift                            | 15                           |
| Switch weapons         | 1 (Normal), 2 (Spread), 3 (EMP)  | -                            |
| Deploy gravity field   | E                                | - (10-second cooldown)       |
| Pause / Resume         | Esc or P                         | -                            |
| Start mission          | Enter (title screen)             | -                            |
| Retry                  | R (game over or paused)          | -                            |

## Gameplay Overview

- Defend the core at the center of the screen from formations of mining drones arriving from multiple directions.
- Neutralize every enemy to clear the wave. Choose one of three upgrades to strengthen your fighter before starting the next wave.
- The game ends if the core's HP reaches zero or the fighter runs out of lives.
- Firing and dashing consume the same energy reserve. Careful energy management is essential for survival.
- Shots automatically target the nearest enemy. If no enemy is present, they fire in the direction the fighter is facing.
- The gravity field lasts five seconds and bends the trajectories of enemy shots within its range outward.
- EMP damages nearby enemies, removes enemy shots, and briefly stuns spawned enemies.
- Defeating enemies in quick succession increases the combo multiplier.
- Clearing a wave awards bonus points based on the core's remaining HP.
- High score, difficulty, and operator name are saved in `localStorage`.

## Enemy Types

| Enemy    | Shape                          | Behavior                                                    |
| -------- | ------------------------------ | ----------------------------------------------------------- |
| Scout    | Orange triangle                | Approaches along a curved path and fires at the player      |
| Shielder | Purple hexagon with armor ring | Slow and durable; moves directly toward the core            |
| Driller  | Long red diamond               | Rushes the core at high speed and deals the most core damage |
| Splitter | Purple sphere with three arms  | Weaves forward and splits into two mini drones when destroyed |
| Mini     | Small triangle                 | Fast, small drone created by a destroyed Splitter           |

Enemy speed, durability, and numbers increase with each wave. They also vary with the selected difficulty: Easy, Normal, or Hard.

## File Structure

```text
record_of_the_stars/
├─ LICENSE.md
├─ LICENSE.en.md
├─ THIRD_PARTY_NOTICES.md
├─ THIRD_PARTY_NOTICES.en.md
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ i18n.js
│  ├─ main.js
│  ├─ game.js
│  ├─ player.js
│  ├─ enemy.js
│  ├─ stage.js
│  ├─ projectile.js
│  ├─ collision.js
│  ├─ audio.js
│  └─ config.js
├─ assets/
│  ├─ images/
│  └─ move/
│     ├─ 星のきろく_フル.mp4
│     ├─ watermello-sport-techno-477131.mp3
│     └─ *.txt
├─ README.md
├─ README.en.md
└─ UPDATE_LOG.md
```

## Running the Tests

```bash
node tests/logic-test.js
```

The automated tests mock browser APIs such as Canvas and `localStorage` and verify energy consumption, combo multipliers, Splitters, the gravity field, core HP, wave progression, and other game logic.

## Assets

- The game itself does not use image assets. The fighter, enemies, projectiles, and background are all drawn with Canvas API shapes.
- In-game sound effects are synthesized in real time with Web Audio API oscillators.
- The title-screen intro video, `assets/move/星のきろく_フル.mp4`, uses audio provided under the Pixabay Content License. License certificates are stored in `assets/move/*.txt`.
- `assets/move/watermello-sport-techno-477131.mp3` is provided under the Pixabay Content License. It is managed as a project asset and may not be redistributed or sold as a standalone asset.
- No external libraries are used. The game is implemented in Vanilla JavaScript.

## Rights Review

- The current game name, on-screen text, and documentation consistently use `Hoshi no Kiroku` / `星のきろく`.
- The story is an original setting centered on Earth and the orbital station Shin.
- The enemies, fighter, and core use an original drone and orbital-defense setting. No character images, logos, audio, or source code from existing games are used.
- Names and settings from earlier drafts are not used in the current version.

## License

Copyright (c) 2026 Shinsuke Oouchi. All rights reserved.

The copyright in this work has not been waived. This work is not open-source software.

The following uses are permitted:

- Personal, non-commercial use
- Private personal modifications that are not published or distributed to third parties
- Publication of gameplay screenshots for non-commercial purposes
- Running, projecting, and using the game as teaching material in regular school classes, including modifications for programming education

Commercial use and public distribution or redistribution of the original or modified work are prohibited. Game streaming, gameplay videos, and redistribution of music or video require separate permission from the copyright holder.

For the complete terms, see the [Japanese License](LICENSE.md) or [English License](LICENSE.en.md). You can switch languages using the links at the top of either file.

Third-party materials—including Pixabay music and Google Fonts—are governed by their respective owners' licenses rather than this project's license. See the [Japanese Third-Party Notices](THIRD_PARTY_NOTICES.md), [English Third-Party Notices](THIRD_PARTY_NOTICES.en.md), and `assets/move/*.txt` for details.
