import type {SceneSettings} from '../../core/stage';
export type Performance='confident'|'cautious';
export const actingTimeline={
 confident:{turnStart:3.8,turnEnd:4.74,prepareEnd:4.95,lowerStart:4.95,seatContact:6.10,relaxed:6.8,duration:8},
 cautious:{turnStart:4.35,turnEnd:5.29,prepareEnd:5.82,lowerStart:6.10,seatContact:7.70,relaxed:8.40,duration:9.5},
} as const;
export function actingSettings(performance:Performance):SceneSettings{return{width:1280,height:720,fps:24,durationInFrames:Math.round(actingTimeline[performance].duration*24),background:0x05080d};}
