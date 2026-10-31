import{catPictureStoryV2Scene}from'./spatial-scene';
import{storyRunPose}from'./run-v3';
/** Same accepted paper drawing/environment; V3 supplies only the new floor travel pose. */
export const catPictureStoryV3Scene={...catPictureStoryV2Scene,pose:storyRunPose};
