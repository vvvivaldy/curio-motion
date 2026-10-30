# Run and edit the black cat scene

This is the editable TypeScript scene behind the [cat film](assets/black-cat-chair-v3.mp4). PixiJS draws the character and chair; Remotion owns the frame, live Player and MP4 export. The scene files preserve the owner-accepted v3 drawing and motion, including the repaired continuous torso during landing.

## Start from a clean clone

Requires Node >=22.12, npm and a WebGL-capable browser.

```sh
git clone https://github.com/vvvivaldy/curio-motion.git
cd curio-motion
npm ci
npm run demo:cat
```

The command starts Vite and opens `/player.html?example=black-cat-chair`, normally at `http://127.0.0.1:4176`. Play, pause or seek the live 20-second scene. Vite prints another port if that one is occupied.

Open `/viewer.html?example=black-cat-chair` for the preserved film and actual motion, drawing and chair source panels. `/index.html?example=black-cat-chair` draws directly with Pixi. These use the same scene definition.

The original mascot photograph is private authoring material. It is not included in Git or the static build and is not requested by the public cat viewer. No reference photograph, old QA folder or generated output is needed to run the scene.

## Export an MP4

Use an existing Chrome/Chromium browser. The project does not download a browser. With a POSIX shell:

```sh
COMPOSITION_ID=BlackCatChair npm run render
```

If browser detection needs help, set `CHROME_PATH` to its installed executable. For example, on a Mac with Brave:

```sh
CHROME_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" COMPOSITION_ID=BlackCatChair npm run render
```

The result is `outputs/black-cat-chair-remotion.mp4`: 1280 x 720, 24 fps, 480 frames, 20 seconds, silent. The renderer creates its output and QA receipt folders itself. See [development instructions](DEVELOPMENT.md) for platform-specific environment syntax.

## Where to edit

| File | Responsibility |
| --- | --- |
| [motion.ts](../src/examples/black-cat-chair/motion.ts) | Approach, hand grips, pull-up, climb, sitting, supported turn, jump and recovery |
| [design.ts](../src/examples/black-cat-chair/design.ts) | Head, ears, hands, feet and the continuous torso contour |
| [layout.ts](../src/examples/black-cat-chair/layout.ts) | Floor, chair polygons and contact geometry |
| [scene.ts](../src/examples/black-cat-chair/scene.ts) | Pixi drawing, eyes and layer order |
| [settings.ts](../src/examples/black-cat-chair/settings.ts) | Dimensions, frame rate and duration |
| [diagnostics.ts](../src/examples/black-cat-chair/diagnostics.ts) | Geometry observations from the actual pose and contours |

The action and its contact targets are authored together. Changing proportions or chair dimensions requires revisiting those targets and reviewing the resulting movement; this is not an automatic animation planner.

## Check a change

```sh
npm run check
npm run check:port
```

The checks include the cat's joint/contact contracts and the torso-fold regression. The browser comparison exercises direct Pixi and Remotion Player, including backward and random seeks. Set `CHROME_PATH` if needed. Numerical checks do not replace inspecting the changed poses and the exported film.
