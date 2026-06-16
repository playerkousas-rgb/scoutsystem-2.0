'use client';
import { Role } from './model';

export type Patrol = { id:string; branchId:string; name:string; short:string; leaderMemberId?:string; deputyLeaderMemberId?:string; memberIds?:string[]; enabled:boolean; order:number };
export type User = { id:string; name:string; email:string; role:Role; branchId?:string; memberId?:string; childMemberIds?:string[]; approved:boolean; techTest?:boolean };
export type Member = { id:string; ymNumber:string; name:string; branchId:string; patrolId?:string; patrolRole?:''|'leader'|'deputy'|'member'; age:number; dateOfBirth?:string; parentUserId?:string; emergencyContactName?:string; emergencyContactPhone?:string; active:boolean };
export type Application = { id:string; type:'parent'|'leader'|'member'; name:string; email:string; role:Role; branchId?:string; ymNumbers?:string; status:'pending'|'approved'|'rejected'; createdAt:string; decidedAt?:string };
export type EventItem = { id:string; title:string; date:string; location:string; scope:'troop'|'branch'; branchId?:string; kind:'activity'|'notice_troop_participation'; status:'draft'|'published'; source?:string; targetMemberIds:string[]; fee?:string };
export type Reply = { id:string; eventId:string; memberId:string; parentUserId?:string; type:'interested'|'registered'|'declined'; operatedBy:'member'|'parent'|'leader'|'admin'; paid?:boolean; updatedAt:string };
export type Bookmark = { id:string; title:string; source:string; officialDeadline?:string; internalDeadline?:string; mode:'informational'|'troop_participation'; branchTags:string[]; status:'published'|'converted'; convertedEventId?:string };
export type AnnouncementPdf = { id:string; name:string; url:string; updatedAt?:string; size?:string };
export type RegularMeeting = { id:string; branchId:string; title:string; weekday:0|1|2|3|4|5|6; startTime:string; endTime:string; location:string; enabled:boolean };
export type CancelledMeeting = { id:string; branchId:string; date:string; reason?:string; markedBy:string; markedAt:string };
export type Announcement = { id:string; title:string; source?:string; month?:string; publishDate?:string; branchTags:string[]; folderUrl?:string; documentUrl?:string; rawText?:string; createdAt:string; status:'published'|'archived' };
export type PluginCard = { id:string; title:string; icon:string; tier:2|3; url:string; embed:boolean; minRole:Role; enabled:boolean; order:number };
export type Audit = { id:string; userId:string; action:string; entity:string; entityId:string; createdAt:string; detail:string };
export type AppState = { patrols:Patrol[]; users:User[]; members:Member[]; applications:Application[]; events:EventItem[]; replies:Reply[]; bookmarks:Bookmark[]; announcements:Announcement[]; announcementPdfs:AnnouncementPdf[]; regularMeetings:RegularMeeting[]; cancelledMeetings:CancelledMeeting[]; plugins:PluginCard[]; audits:Audit[]; config:Record<string,string> };

const KEY='scoutsystem2_app_state_v1';
const now=()=>new Date().toISOString();

export const seedState:AppState={
  patrols:[
    {id:'p1',branchId:'b2',name:'紅色六',short:'紅',enabled:true,order:1},
    {id:'p2',branchId:'b2',name:'黃色六',short:'黃',enabled:true,order:2},
    {id:'p3',branchId:'b2',name:'藍色六',short:'藍',enabled:true,order:3},
    {id:'p4',branchId:'b2',name:'綠色六',short:'綠',enabled:true,order:4},
    {id:'p5',branchId:'b3',name:'猛虎小隊',short:'虎',leaderMemberId:'m1',enabled:true,order:1},
    {id:'p6',branchId:'b3',name:'雄鷹小隊',short:'鷹',enabled:true,order:2},
    {id:'p7',branchId:'b3',name:'灰狼小隊',short:'狼',enabled:true,order:3},
  ],
  config:{ TROOP_CODE:'0082', TROOP_NAME:'第82旅', ANNOUNCEMENT_FOLDER_URL:'', ANNOUNCEMENT_FOLDER_ID:'', REGISTRY_URL:'https://troop-router.vercel.app/api/registry.json', TECH_TEST_ACCOUNTS:'sheep,0728' },
  users:[
    {id:'sheep',name:'Sheep / 0728 技術測試',email:'sheep@example.com',role:'super_admin',approved:true,techTest:true},
    {id:'u1',name:'陳管理員',email:'admin@example.com',role:'admin',approved:true},
    {id:'u2',name:'李團長',email:'gsl@example.com',role:'group_leader',branchId:'b3',approved:true},
    {id:'u3',name:'黃支部領袖',email:'leader@example.com',role:'branch_leader',branchId:'b3',approved:true},
    {id:'u4',name:'何教練員',email:'coach@example.com',role:'coach',branchId:'b3',approved:true},
    {id:'u5',name:'王家長',email:'parent@example.com',role:'parent',childMemberIds:['m1','m2'],approved:true},
    {id:'u6',name:'王小明',email:'member@example.com',role:'member',branchId:'b3',memberId:'m1',approved:true},
  ],
  members:[
    {id:'m1',ymNumber:'YM001',name:'王小明',branchId:'b3',patrolId:'p5',patrolRole:'leader',age:13,parentUserId:'u5',emergencyContactName:'王家長',emergencyContactPhone:'9123 4567',active:true},
    {id:'m2',ymNumber:'YM002',name:'王小美',branchId:'b2',patrolId:'p1',patrolRole:'member',age:10,parentUserId:'u5',emergencyContactName:'王家長',emergencyContactPhone:'9123 4567',active:true},
    {id:'m3',ymNumber:'YM003',name:'陳志豪',branchId:'b3',patrolId:'p6',patrolRole:'member',age:14,emergencyContactName:'陳太',emergencyContactPhone:'9234 5678',active:true},
    {id:'m4',ymNumber:'YM004',name:'林雅晴',branchId:'b4',age:16,emergencyContactName:'林先生',emergencyContactPhone:'9345 6789',active:true},
  ],
  applications:[
    {id:'a1',type:'parent',name:'陳太',email:'chan-parent@example.com',role:'parent',branchId:'b3',ymNumbers:'YM003',status:'pending',createdAt:now()},
    {id:'a2',type:'leader',name:'張教練',email:'newcoach@example.com',role:'coach',branchId:'b2',status:'pending',createdAt:now()},
    {id:'a3',type:'member',name:'新成員',email:'',role:'member',branchId:'b3',ymNumbers:'YM099',status:'pending',createdAt:now()},
  ],
  events:[
    {id:'e1',title:'童軍露營技能訓練日',date:'2026-07-04',location:'大潭童軍中心',scope:'branch',branchId:'b3',kind:'activity',status:'published',targetMemberIds:['m1','m3'],fee:'$80',source:'旅團自辦'},
    {id:'e2',title:'地域領袖訓練班',date:'2026-07-04',location:'地域總部',scope:'branch',branchId:'b4',kind:'notice_troop_participation',status:'published',targetMemberIds:['m4'],fee:'$160',source:'圖書館轉入'},
    {id:'e3',title:'幼童軍社區服務探訪',date:'2026-07-11',location:'社區中心',scope:'branch',branchId:'b2',kind:'activity',status:'published',targetMemberIds:['m2'],source:'支部活動'},
    {id:'e4',title:'全旅周年大會操',date:'2026-08-01',location:'操場',scope:'troop',kind:'activity',status:'published',targetMemberIds:['m1','m2','m3','m4'],source:'全旅活動'},
  ],
  replies:[
    {id:'r1',eventId:'e1',memberId:'m1',parentUserId:'u5',type:'registered',operatedBy:'parent',paid:false,updatedAt:now()},
    {id:'r2',eventId:'e2',memberId:'m4',type:'interested',operatedBy:'member',updatedAt:now()},
    {id:'r3',eventId:'e3',memberId:'m2',parentUserId:'u5',type:'declined',operatedBy:'parent',updatedAt:now()},
  ],
  bookmarks:[
    {id:'bkm1',title:'皮藝坊 - 貓頭鷹及小提琴皮革製造',source:'總會',officialDeadline:'2026-06-25',internalDeadline:'2026-06-18',mode:'informational',branchTags:['童軍','深資'],status:'published'},
    {id:'bkm2',title:'地域領袖訓練班',source:'地域',officialDeadline:'2026-07-10',internalDeadline:'2026-07-01',mode:'troop_participation',branchTags:['深資'],status:'converted',convertedEventId:'e2'},
  ],
  announcements:[],
  announcementPdfs:[{id:'pdf1',name:'2025年11月份集會安排.pdf',url:'#',updatedAt:'2025-10-18',size:'410 KB'},{id:'pdf2',name:'2025年12月份集會安排.pdf',url:'#',updatedAt:'2025-11-20',size:'398 KB'}],
  regularMeetings:[{id:'rm1',branchId:'b3',title:'童軍恆常集會',weekday:6,startTime:'14:00',endTime:'16:00',location:'本中心',enabled:true},{id:'rm2',branchId:'b2',title:'幼童軍恆常集會',weekday:6,startTime:'14:00',endTime:'16:00',location:'本中心',enabled:true}],
  cancelledMeetings:[],
  plugins:[],
  audits:[{id:'log1',userId:'system',action:'seed',entity:'system',entityId:'seed',createdAt:now(),detail:'初始化示範資料'}],
};

export function loadState():AppState{ if(typeof window==='undefined') return seedState; try{const raw=localStorage.getItem(KEY); if(raw)return JSON.parse(raw)}catch{} saveState(seedState); return JSON.parse(JSON.stringify(seedState)); }
export function saveState(s:AppState){ if(typeof window!=='undefined') localStorage.setItem(KEY,JSON.stringify(s)); }
export function resetState(){ saveState(JSON.parse(JSON.stringify(seedState))); }
export function mutate(fn:(s:AppState)=>void){ const s=loadState(); fn(s); saveState(s); return s; }
export function addAudit(s:AppState,userId:string,action:string,entity:string,entityId:string,detail:string){ s.audits.unshift({id:'log_'+Date.now(),userId,action,entity,entityId,createdAt:now(),detail}); }
export function replyStatus(s:AppState,eventId:string,memberId:string){ return s.replies.find(r=>r.eventId===eventId&&r.memberId===memberId); }
export function visibleEventsForMember(s:AppState, member:Member){ return s.events.filter(e=>e.status==='published'&&(e.scope==='troop'||e.branchId===member.branchId)).filter(e=>replyStatus(s,e.id,member.id)?.type!=='declined'); }
export function setReply(eventId:string, memberId:string, type:'interested'|'registered'|'declined', operator:{userId:string;role:Role}){
  return mutate(s=>{ const member=s.members.find(m=>m.id===memberId); if(!member) return; const existing=s.replies.find(r=>r.eventId===eventId&&r.memberId===memberId); if(existing){ existing.type=type; existing.updatedAt=now(); existing.operatedBy=operator.role==='parent'?'parent':operator.role==='member'?'member':'leader'; if(operator.role==='parent') existing.parentUserId=operator.userId; }
    else s.replies.push({id:'r_'+Date.now(),eventId,memberId,type,updatedAt:now(),operatedBy:operator.role==='parent'?'parent':operator.role==='member'?'member':'leader',parentUserId:operator.role==='parent'?operator.userId:undefined});
    addAudit(s,operator.userId,'setReply','EventReplies',eventId,`${member.name} → ${type}`);
  });
}


export function isMeetingCancelled(s:AppState, branchId:string, date:string){ return !!s.cancelledMeetings.find(c=>c.branchId===branchId&&c.date===date); }
export function toggleMeetingCancel(branchId:string,date:string,userId:string,reason=''){ return mutate(s=>{ const i=s.cancelledMeetings.findIndex(c=>c.branchId===branchId&&c.date===date); if(i>=0){ const old=s.cancelledMeetings.splice(i,1)[0]; addAudit(s,userId,'uncancelMeeting','CancelledMeetings',old.id,`${branchId} ${date}`); } else { const id='cm_'+Date.now(); s.cancelledMeetings.push({id,branchId,date,reason,markedBy:userId,markedAt:now()}); addAudit(s,userId,'cancelMeeting','CancelledMeetings',id,`${branchId} ${date} ${reason}`); } }); }
export function nextRegularMeetingDates(count=6){ const today=new Date(); const out:string[]=[]; for(let i=0;i<90&&out.length<count;i++){ const d=new Date(today); d.setDate(today.getDate()+i); out.push(d.toISOString().slice(0,10)); } return out; }
