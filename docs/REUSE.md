# Reusing the scene API

Pink monkey and Amber robot have different proportions, drawings and actions. They share typed scenes, pure frame evaluation and the same Pixi/Remotion bridge.

| Shared contract | Authored in each example |
| --- | --- |
| `SceneDefinition` / `SceneSettings` | Drawing, dimensions, frame rate and action duration |
| `createPixiStage` / `createRemotionScene` | Pixi display objects and pose-to-drawing code |
| Time, contours, anchors and limb helpers | Anatomy, supports, bend directions and timing |
| Player and official MP4 export | Choice of scene and composition |

```ts
import {createPixiStage} from '../src/core/stage';
import {createRemotionScene} from '../src/remotion/create-scene';
import {amberRobotScene} from '../src/examples/amber-robot/scene';

const stage = await createPixiStage(host, amberRobotScene);
stage.draw(120);
stage.draw(0);
stage.destroy();

const RobotComposition = createRemotionScene(amberRobotScene);
```

The robot does not import monkey anatomy or motion. Geometry helpers do not infer a character from a reference and do not guarantee a convincing pose. Use [AUTHORING](AUTHORING.md) for control drawings, contacts and actual film review.

For a new scene, use `npm run create:example -- …` and follow its registration instructions. Prefer the shared factory over the monkey-specific legacy `createStage(host)` wrapper. [API](API.md) · [architecture](ARCHITECTURE.md) · [examples](EXAMPLES.md).
