import {raccoonCourierSettings} from './raccoon-courier/settings';
import {morningDeliverySettings} from './morning-delivery/settings';
import {deliveryInfographicSettings} from './delivery-infographic/settings';
import {catPictureStorySettings} from './cat-picture-story/settings';
import {actingSettings} from './human-chair-neon/settings';
import {humanChairInkSettings,humanChairPaperSettings} from './human-chair-art/settings';
import {humanChairSettings} from './human-chair/settings';
import {blackCatChairSettings} from './black-cat-chair/settings';
import {motionFoundationsSettings} from './motion-foundations/settings';
import {carrierVariants} from './ivory-carrier/variants';
import {ivoryCarrierSettings} from './ivory-carrier/settings';
import { pinkMonkeySettings } from './pink-monkey/settings';
import { amberRobotSettings } from './amber-robot/settings';
import { seriousBoarV2Settings } from './serious-boar-v2/settings';
import { seriousBoarSettings } from './serious-boar/settings';
// Demo navigation only. The reusable stage and Remotion bridge know no example IDs.
export const examples={
 'morning-delivery':{title:'Утренний маршрут · персонаж и инфографика',settings:morningDeliverySettings,reference:null,audio:true,film:'docs/assets/morning-delivery-accepted-v1.mp4',description:'36-секундная рабочая задача: живые исходники принятого енота, записанные контакты с затуханием ухода, учебная сводка 12/18/30 и новые векторные титры. Итоговый фильм принят владельцем и включён в 1.0.'},
 'raccoon-courier':{title:'Енот-почтальон · конверт и сумка',settings:raccoonCourierSettings,reference:null,audio:true,film:'docs/assets/raccoon-courier-anatomy-sound-v3.mp4',description:'Принятая владельцем 16-секундная авторская сцена: обычный бег, одноручный переворот, поддержанные перехваты и вкладка конверта в сумку. Новые записи обуви по дереву, бумаги и кожи. Фильм сохранён точно; изменения исходников требуют своей проверки.'},
 'delivery-infographic':{title:'Утренние доставки · учебная инфографика',settings:deliveryInfographicSettings,reference:null,audio:false,film:'docs/assets/delivery-infographic-first-pass.mp4',description:'12-секундная живая векторная инфографика на учебных данных трёх пунктов: общий ноль и масштаб 0–30, вычисляемые доли и итог. Последние три секунды неподвижны. Без звука.'},
 'cat-picture-story-v3':{title:"Paper cat V3 · ordinary run",settings:catPictureStorySettings,audio:true,reference:null,film:'docs/assets/cat-picture-story-v3.mp4',description:"Current owner-accepted 35-second authored story with upright running, rear heel recovery, shoulder-driven elbow backswing, spatial surfaces and recorded event sounds. Superseded V1/V2 exports are available in Git history."},
 'cat-picture-story-v2':{beta:true,hidden:true,title:"Paper cat V2 · historical spatial study",settings:catPictureStorySettings,audio:true,reference:null,film:'',description:"Historical beta study; its export is available in the v1.0.0 Git snapshot. The current example is cat-picture-story-v3."},
 'cat-picture-story':{beta:true,hidden:true,title:"Paper cat V1 · historical story",settings:catPictureStorySettings,audio:true,reference:null,film:'',description:"Historical beta version; its export is available in the v1.0.0 Git snapshot. The current example is cat-picture-story-v3."},
 'human-chair-neon-confident':{title:"Human · confident — neon",settings:actingSettings('confident'),reference:null,film:'docs/assets/human-chair-neon-confident-v1.mp4',audio:true,description:"An authored confident 8-second sitting scene with opaque cyan forms, colored neon glow and a subtle vector floor reflection. Recorded tile footsteps and wooden-chair creak follow contacts."},
 'human-chair-neon-cautious':{title:"Human · cautious — neon",settings:actingSettings('cautious'),reference:null,film:'docs/assets/human-chair-neon-cautious-v1.mp4',audio:true,description:"An authored cautious 9.5-second sitting scene: chair inspection, guarded hands, a deliberate pause and relaxation after seat contact. Colored glow, floor reflection and recorded contacts."},
 'human-chair-ink':{title:"Human · ink drawing",settings:humanChairInkSettings,reference:null,film:'docs/assets/human-chair-ink-v1.mp4',audio:true,description:"Ink and pencil linework with restrained hatching over the chair action and recorded soundtrack."},
 'human-chair-paper':{title:"Human · cut-paper drawing",settings:humanChairPaperSettings,reference:null,film:'docs/assets/human-chair-paper-v1.mp4',audio:true,description:"Cut-paper pieces with fibers, overlapping layers and soft shadows over the chair action and recorded soundtrack."},
 'human-chair':{beta:true,hidden:true,title:"Human · historical silent V3",settings:humanChairSettings,reference:null,film:'docs/assets/human-chair-v3.mp4',description:"Owner-accepted silent V3, preserved for comparison. The normal gallery uses the recorded-sound version."},
 'human-chair-sound':{beta:true,hidden:true,title:"Human · rejected synthesized sound V1",settings:humanChairSettings,reference:null,film:'',audio:true,description:"Owner-rejected V1: steps and seat sounded sand-like. Rejected export removed from the current checkout; use recorded sound V2. Source retained for regression; numerical passes did not approve sound identity."},
 'human-chair-sound-v2':{title:"Human · chair and recorded sound",settings:humanChairSettings,reference:null,film:'docs/assets/human-chair-sound-v2.mp4',audio:true,description:"Recorded hard-floor footsteps and wooden-chair creak over the accepted chair action. Sources, licenses and preparation are listed in the SFX catalog."},
 'black-cat-chair':{title:'Black cat · chair climb',settings:blackCatChairSettings,reference:null,film:'docs/assets/black-cat-chair-v3.mp4',description:'A whole-reference authored vector mascot walks, grips and climbs a red chair, sits, jumps down onto four paws and rises.'},
 'motion-foundations':{beta:true,title:'Motion foundations · mechanical study',settings:motionFoundationsSettings,reference:null,film:'docs/assets/motion-foundations.mp4',description:'Pre-1.0 beta mechanics study, not a finished character film: controlled transfer path, finitely damped pointer, strict locked contact/joint bounds and a separately marked rejected target.'},
 ...Object.fromEntries(carrierVariants.map(v=>[v.key,{hidden:true,title:v.title,settings:ivoryCarrierSettings,reference:null,film:'',description:'Owner-accepted finite size variant of the same box-transfer scene (29 October 2026). Preserved official movies are local QA artifacts; use live code preview here.'}])),
 'ivory-carrier':{title:'Ivory carrier · box transfer',settings:ivoryCarrierSettings,reference:null,film:'',description:'Owner-accepted box transfer and eight finite size variants (29 October 2026). Preserved official movies remain in local QA; use live Player or direct preview here.'},
  'serious-boar-v2':{beta:true,title:"Boar B · beta authoring study",settings:seriousBoarV2Settings,
    film:'docs/assets/serious-boar-v2.mp4',reference:null,
    description:"Pre-1.0 beta study: an independent authored implementation using shared ownership, contact and limb helpers. The whole video reference is private and excluded; runtime uses code."},
  'pink-monkey':{title:'Pink monkey · escalator',settings:pinkMonkeySettings,
    film:'docs/assets/demo-v5.mp4',reference:'reference/pink-monkey-reference.png',
    description:'Walk, turn, board, ride and scratch the nose. The preserved first film.'},
  'amber-robot':{title:'Amber robot · a little care',settings:amberRobotSettings,
    film:'docs/assets/amber-robot-v2.mp4',reference:'reference/amber-robot/design.svg',
    description:'Take the watering can, pour twice, return it, release and hold. A second authored example through the same API.'},
  'serious-boar':{beta:true,hidden:true,title:"Boar A · preserved original",settings:seriousBoarSettings,
    film:'',reference:null,
    description:"Historical beta trial; its export and A/B comparison are available in the v1.0.0 Git snapshot. The whole owner input is private and excluded."},
} as const;
