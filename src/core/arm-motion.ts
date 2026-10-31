/** Optional dimension-aware rear shoulder excursion; no rig or screen-position offsets.
 * Core run timing and elbow bend are unchanged; callers provide their drawn dimensions.
 * Positive drive is the forward arm. Negative drive gains a smooth rear reach.
 * referenceSwing is an explicit angular motion calibration, not an anatomical norm.
 */
export function runningUpperArm(centre:number,drive:number,upperLength:number,backDepth:number,referenceSwing:number){
 const ratio=(backDepth+.02*upperLength)/upperLength;
 if(![centre,drive,upperLength,backDepth,referenceSwing].every(Number.isFinite)||upperLength<=0||backDepth<0||ratio>=1||referenceSwing<=0)throw RangeError('Back line needs an authored reachable shoulder excursion');
 const rearTarget=-Math.asin(ratio),rear=Math.max(0,-drive)/referenceSwing;
 return centre+drive-Math.max(0,centre-referenceSwing-rearTarget)*rear**3;
}
