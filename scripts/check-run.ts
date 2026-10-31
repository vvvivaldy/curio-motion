import assert from 'node:assert/strict';
import{createRunPlan,ordinaryRunDefaults}from'../src/core/run';
import{sampleStep}from'../src/core/contacts';
import{runningUpperArm}from'../src/core/arm-motion';
for(const dimensions of[{upper:30,lower:27,soleToAnkle:8},{upper:40,lower:24,soleToAnkle:10}]){
 const p=createRunPlan(dimensions),contact=p.contacts[5],u=dimensions.upper,l=dimensions.lower;
 const flexion=(t:number)=>{const q=p.sample(t),foot=q.feet[contact.side],d2=(foot.station-q.station)**2+(foot.height+dimensions.soleToAnkle-q.height)**2;return Math.acos(Math.max(-1,Math.min(1,(d2-u*u-l*l)/(2*u*l))));};
 assert.ok(Math.abs(flexion(contact.time)-ordinaryRunDefaults.stanceEndFlexion)<1e-7,'Contact leg extension derives from the declared preset, not a lowered pelvis');
 assert.ok(Math.abs(flexion(contact.time+p.stance/2)-ordinaryRunDefaults.midStanceFlexion)<1e-7,'Mid-stance briefly compresses, rather than sustaining crouch');
 const a=p.sample(contact.time+p.stance*.2),b=p.sample(contact.time+p.stance*.8);assert.equal(a.feet[contact.side].station,b.feet[contact.side].station,'Loaded sole holds its world station');assert.ok(b.station>a.station,'Body advances independently of planted sole');
 const flight=p.sample(contact.time+p.stance+p.flight/2);assert.equal(flight.phase,'flight');assert.ok(flight.feet.every(f=>!f.planted&&f.height>0),'Actual target soles are above ground during recurring flight');
 assert.ok(p.stance< p.interval&&p.stance/(2*p.interval)<.5,'Each leg has less than half-cycle support');
 for(const t of[-1,p.start,p.end,p.end+1]){const q=p.sample(t);assert.equal(q.phase,'hold');assert.equal(q.velocity,0);assert.ok(q.feet.every(f=>f.planted&&f.height===0));}
 assert.ok(Math.abs(p.sample(1).pitch-ordinaryRunDefaults.forwardLean)<1e-9,'Actual default controls steady body lean');
 assert.ok(Math.abs(p.sample((p.brakingStart+p.end)/2).pitch-ordinaryRunDefaults.forwardLean/2)<1e-9,'Two terminal steps halve then remove lean, without a double speed fade');
 assert.equal(p.sample(p.end).pitch,0,'Body is upright in final hold');
 const custom=createRunPlan({...dimensions,forwardLean:Math.PI/8});assert.ok(Math.abs(custom.sample(1).pitch-Math.PI/8)<1e-9);assert.deepEqual(custom.sample(1).feet,p.sample(1).feet,'Choosing lean does not retime/reposition soles');assert.equal(custom.sample(1).height,p.sample(1).height,'Choosing lean does not lower the pelvis');
 const swing=p.tracks[contact.side].find(step=>step.start>1&&step.end<3)!;
 const recoveryTime=swing.start+.25*(swing.end-swing.start),recovery=p.sample(recoveryTime),foot=recovery.feet[contact.side],before=sampleStep(recoveryTime,swing);
 assert.ok(foot.station<recovery.station,'Early recovery remains behind the moving pelvis');
 assert.ok(foot.height>-before.position[1]*1.5,'Heel lifts early after toe-off instead of a uniform low transfer');
 const knee=(soleHeight:number)=>Math.acos(Math.max(-1,Math.min(1,((foot.station-recovery.station)**2+(soleHeight+dimensions.soleToAnkle-recovery.height)**2-u*u-l*l)/(2*u*l))));
 assert.ok(knee(foot.height)>knee(-before.position[1])+.2,'The actual fixed-length leg bends more during early recovery');
 for(const fraction of[.65,.8,1]){const time=swing.start+fraction*(swing.end-swing.start),now=p.sample(time).feet[contact.side],old=sampleStep(time,swing);assert.equal(now.station,old.position[0],'Recovery leaves horizontal transfer unchanged');assert.ok(Math.abs(now.height+old.position[1])<1e-10,'Late extension/touchdown retain the proven original target height');assert.equal(now.planted,old.planted);}
 const samples=[.1,.7,1.4,2.6,4.1].map(t=>p.sample(t));for(let i=samples.length-1;i>=0;i--)assert.deepEqual(p.sample(samples[i].time),samples[i],'Independent reverse seeks give the same plan sample');
}
for(const delta of[{upper:0},{lower:-1},{soleToAnkle:-1},{duration:0},{ramp:0},{ramp:3},{to:-1},{from:NaN},{forwardLean:-1},{forwardLean:NaN}])assert.throws(()=>createRunPlan({upper:30,lower:27,soleToAnkle:8,...delta}),RangeError);
console.log('PASS opt-in ordinary run: declared stance extension/compression, fixed soles, real flight targets, finite holds, different proportions and reverse seek; appearance needs actual video review');

// Dimension-aware shoulder excursion: actual elbow reaches the authored back depth.
for(const [upper,back]of[[32,21],[45,15],[28,10]]){const centre=Math.PI/8,drive=.405,rear=runningUpperArm(centre,-drive,upper,back,drive);assert.ok(upper*Math.sin(rear)<=-back-.019999*upper,'Rear elbow reaches the back line in drawing units');assert.equal(runningUpperArm(centre,drive,upper,back,drive),centre+drive,'Forward arm remains unchanged');assert.equal(runningUpperArm(centre,0,upper,back,drive),centre,'Neutral shoulder is unchanged');}
for(const args of[[0,0,0,1,.405],[0,0,32,33,.405],[0,0,32,-1,.405],[NaN,0,32,10,.405],[0,0,32,10,0]])assert.throws(()=>runningUpperArm(...args as[number,number,number,number,number]),RangeError);
