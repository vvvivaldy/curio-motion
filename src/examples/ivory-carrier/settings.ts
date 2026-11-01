import type {SceneSettings} from '../../core/stage';
import {retimeTimeline} from '../../core/time';
export const carrierTiming=retimeTimeline({fps:24,durationInFrames:360});
export const ivoryCarrierSettings={width:1280,height:720,...carrierTiming.timeline,background:0x080a0d} as const satisfies SceneSettings;
