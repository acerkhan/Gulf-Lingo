(()=>{'use strict';
const el=document.getElementById('audioCourseArea'),tab=document.getElementById('audioCourseTab');if(!el||!tab)return;
const KEY='gulf-lingo-audio-course-v1';let data=[],selected=0,positions={},completed={},speed=1,playing=false,loaded=false,saveTimer=0;
try{let s=JSON.parse(localStorage.getItem(KEY)||'{}');positions=s.positions||{};completed=s.completed||{};selected=Math.min(29,Math.max(0,Number(s.selected)||0));speed=[.75,1,1.25,1.5].includes(s.speed)?s.speed:1}catch{}
const player=new Audio();player.preload='metadata';player.playbackRate=speed;
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=t=>{t=Number.isFinite(t)?Math.max(0,Math.floor(t)):0;return `${Math.floor(t/3600)?Math.floor(t/3600)+':':''}${String(Math.floor(t/60)%60).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`};
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({positions,completed,selected,speed}))}catch{}};
function snapshot(){if(player.src&&Number.isFinite(player.currentTime)){positions[data[selected]?.id]=Math.floor(player.currentTime);persist()}}
function pause(){player.pause();playing=false;updatePlayer()}
window.addEventListener('gulf:leave-audio-course',()=>{snapshot();pause()});
window.addEventListener('pagehide',snapshot);
function choose(i){if(i<0||i>=data.length)return;snapshot();player.pause();selected=i;playing=false;loaded=false;player.removeAttribute('src');player.load();persist();render();loadTrack()}
function loadTrack(){acLoadClassroom();const l=data[selected];if(!l)return;player.src=l.audio;player.playbackRate=speed;player.load();loaded=true;updatePlayer()}
function play(){if(!loaded)loadTrack();if(!player.src)return;player.play().then(()=>{playing=true;updatePlayer()}).catch(()=>{playing=false;showMessage('Audio unavailable. Copy the finished MP3 into audio/course/ using the filename shown below.');updatePlayer()})}
function showMessage(msg){const node=el.querySelector('#acMessage');if(node)node.textContent=msg}

let acTimeline = [];
let acTimelineLesson = null;
let acTimelineRequest = 0;
let acLastSegment = -1;

const acTranslations = {
  'السلام عليكم': ['As-salaam alaykum', 'Peace be upon you'],
  'وعليكم السلام': ['Wa alaykum as-salaam', 'And peace be upon you'],
  'هلا': ['Hala', 'Hello'],
  'هلا والله': ['Hala wallah', 'A warm, friendly hello'],
  'شحالك؟': ['Shhalak?', 'How are you?'],
  'شحالك': ['Shhalak', 'How are you?'],
  'زين': ['Zain', 'Good / fine'],
  'الحمد لله': ['Alhamdulillah', 'Praise be to God']
};

function acLoadClassroom() {
  const lessonId = Number(data[selected]?.id);
  const request = ++acTimelineRequest;

  acTimeline = [];
  acTimelineLesson = null;
  acLastSegment = -1;

  if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 20) {
    acSyncClassroom();
    return;
  }

  fetch(`modules/audio-course/timelines/lesson_${String(lessonId).padStart(2, '0')}.json`)
    .then(r => {
      if (!r.ok) throw Error('Timeline HTTP ' + r.status);
      return r.json();
    })
    .then(json => {
      if (request !== acTimelineRequest) return;
      acTimeline = json.events || [];
      acTimelineLesson = lessonId;
      acSyncClassroom();
    })
    .catch(err => {
      if (request !== acTimelineRequest) return;
      const board = el.querySelector('#acClassroom');
      if (board) board.textContent = 'Classroom unavailable: ' + err.message;
    });
}

function acSyncClassroom() {
  const board = el.querySelector('#acClassroom');
  if (!board) return;
  if (!Number.isInteger(Number(data[selected]?.id)) || Number(data[selected]?.id) < 1 || Number(data[selected]?.id) > 20) {
    board.hidden = true;
    return;
  }
  board.hidden = false;
  if (acTimelineLesson !== Number(data[selected]?.id) || !acTimeline.length) {
    if (board.dataset.card !== 'loading') {
      board.dataset.card = 'loading';
      board.innerHTML = '<p class="ac-board-muted">Preparing your classroom…</p>';
    }
    return;
  }

  // A curated display schedule: keep a teaching card until the next useful
  // phrase, rather than changing on every short clip and silence.
  const cards = [];
  let lastAt = -Infinity;
  let lastArabic = '';
  let previousArabic = '';
  for (let i = 0; i < acTimeline.length; i++) {
    const e = acTimeline[i];
    const phrase = String(e.text || '').trim();
    const arabic = e.speaker === 'arabic' || e.speaker === 'arabic_female';
    const instructorCue = !arabic && (i === 0 || /^(now repeat|now say|how do you say|try to say|say |remember|first, just listen|welcome to your first lesson|listen carefully)/i.test(phrase));
    if (!arabic && !instructorCue) continue;
    if (arabic && phrase === lastArabic) continue;
    if (e.start - lastAt < 4.5) continue;
    if (arabic) {
      cards.push({index:i, event:e, previous:previousArabic, arabic:true});
      previousArabic = phrase;
      lastArabic = phrase;
    } else {
      cards.push({index:i, event:e, previous:previousArabic, arabic:false});
    }
    lastAt = e.start;
  }
  if (!cards.length) {
    if (board.dataset.card !== 'empty') {
      board.dataset.card = 'empty';
      board.textContent = 'Listen carefully and repeat the Arabic aloud.';
    }
    return;
  }

  const t = player.currentTime || 0;
  let low = 0, high = cards.length - 1, chosen = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cards[mid].event.start <= t) { chosen = mid; low = mid + 1; }
    else high = mid - 1;
  }
  const card = cards[chosen];
  const key = String(card.index);
  if (board.dataset.card === key) return;
  board.dataset.card = key;
  const phrase = String(card.event.text || '').trim();
  const translation = acTranslations[phrase];
  board.innerHTML = card.arabic ? `
    <div class="ac-board-label">LISTEN · LEARN · SPEAK</div>
    <div class="ac-board-arabic" dir="rtl">${safe(phrase)}</div>
    ${translation ? `<div class="ac-board-pronunciation">${safe(translation[0])}</div><div class="ac-board-meaning">${safe(translation[1])}</div>` : '<div class="ac-board-muted">Listen and repeat aloud</div>'}
    ${card.previous && card.previous !== phrase ? `<div class="ac-board-previous"><span>Previously</span><b dir="rtl">${safe(card.previous)}</b></div>` : ''}
  ` : `
    <div class="ac-board-label">YOUR INSTRUCTOR</div>
    <div class="ac-board-prompt">${safe(phrase)}</div>
    ${card.previous ? `<div class="ac-board-previous"><span>Last phrase</span><b dir="rtl">${safe(card.previous)}</b></div>` : ''}
  `;
  board.classList.remove('ac-board-enter');
  void board.offsetWidth;
  board.classList.add('ac-board-enter');
}

function updatePlayer(){let l=data[selected];if(!l)return;let b=el.querySelector('#acPlay');if(b)b.textContent=playing?'Ⅱ':'▶';let time=el.querySelector('#acTime');if(time)time.textContent=`${fmt(player.currentTime)} / ${fmt(player.duration)}`;let seek=el.querySelector('#acSeek');if(seek){seek.max=Number.isFinite(player.duration)&&player.duration>0?Math.floor(player.duration):100;seek.value=Math.min(+seek.max,Math.floor(player.currentTime||0))}let state=el.querySelector('#acState');if(state)state.textContent=playing?'Now playing':'Ready to listen';let completedBtn=el.querySelector('#acMark');if(completedBtn)completedBtn.textContent=completed[l.id]?'✓ Completed':'✓ Mark complete'}
player.addEventListener('seeked',acSyncClassroom);
player.addEventListener('loadedmetadata',()=>{const t=Number(positions[data[selected]?.id]||0);if(Number.isFinite(player.duration)&&t>0&&t<player.duration-3)player.currentTime=t;updatePlayer()});
player.addEventListener('timeupdate',()=>{updatePlayer();acSyncClassroom();if(Date.now()-saveTimer>3500){snapshot();saveTimer=Date.now()}});
player.addEventListener('ended',()=>{playing=false;completed[data[selected].id]=true;positions[data[selected].id]=0;persist();render()});
player.addEventListener('pause',()=>{playing=false;updatePlayer()});
player.addEventListener('error',()=>{playing=false;showMessage('MP3 not found: '+data[selected].audio);updatePlayer()});
tab.addEventListener('click',()=>{nav('audio-course');render();if(!loaded)loadTrack()});
function render(){if(!data.length){el.innerHTML='<p>Loading audio lessons…</p>';return}let l=data[selected],done=data.filter(x=>completed[x.id]).length;
el.innerHTML=`<div class="ac-content"><section class="ac-listening"><div class="ac-kicker">YOUR AUDIO CLASSROOM</div><h2>${safe(l.title)}</h2><p class="ac-sub">Listen · Learn · Speak</p>
<div class="ac-player"><div class="ac-player-controls"><div id="acClassroom" class="ac-classroom" aria-live="off"></div><span id="acState" class="ac-state">Ready to listen</span><input id="acSeek" aria-label="Seek within lesson" type="range" min="0" max="100" value="0" step="1"><div class="ac-time" id="acTime">00:00 / 00:00</div><div class="ac-transport"><button id="acBack" aria-label="Back 15 seconds">↶ <small>15</small></button><button id="acPlay" class="ac-play" aria-label="Play or pause">▶</button><button id="acForward" aria-label="Forward 15 seconds">↷ <small>15</small></button></div><div class="ac-speed"><span>Playback speed</span><select id="acSpeed" aria-label="Playback speed">${[.75,1,1.25,1.5].map(x=>`<option value="${x}" ${x===speed?'selected':''}>${x}×</option>`).join('')}</select></div></div></div>
<div id="acMessage" class="ac-message" aria-live="polite"></div><div class="ac-footer"><button id="acMark">${completed[l.id]?'✓ Completed':'✓ Mark complete'}</button><button id="acNext" ${selected===data.length-1?'disabled':''}>Next lesson →</button></div></section>
<section class="ac-library"><div class="ac-library-heading"><div><span class="ac-kicker">THE COMPLETE SERIES</span><h2>Lesson library</h2></div><span class="ac-count">${done} / ${data.length}</span></div><div class="ac-progress"><span style="width:${done/data.length*100}%"></span></div><div class="ac-grid">${data.map((x,i)=>`<button class="ac-lesson ${i===selected?'active':''}" data-ac-lesson="${i}"><span class="ac-number">${completed[x.id]?'✓':String(x.id).padStart(2,'0')}</span><span class="ac-lesson-label"><strong>${safe(x.title)}</strong><small>${completed[x.id]?'Completed · Replay':positions[x.id]?'Continue · '+fmt(positions[x.id]):'Ready to start'}</small></span><span class="ac-arrow">↗</span></button>`).join('')}</div></section></div>`;
el.querySelectorAll('[data-ac-lesson]').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.acLesson)));
el.querySelector('#acPlay').addEventListener('click',()=>playing?pause():play());el.querySelector('#acBack').addEventListener('click',()=>{player.currentTime=Math.max(0,(player.currentTime||0)-15);snapshot()});el.querySelector('#acForward').addEventListener('click',()=>{player.currentTime=Math.min(Number.isFinite(player.duration)?player.duration:Infinity,(player.currentTime||0)+15);snapshot()});
el.querySelector('#acSeek').addEventListener('input',e=>{if(Number.isFinite(player.duration)){player.currentTime=+e.target.value;snapshot()}});
el.querySelector('#acSpeed').addEventListener('change',e=>{speed=+e.target.value;player.playbackRate=speed;persist()});
el.querySelector('#acMark').addEventListener('click',()=>{completed[l.id]=!completed[l.id];persist();render();updatePlayer()});el.querySelector('#acNext').addEventListener('click',()=>choose(selected+1));updatePlayer();acSyncClassroom()}
fetch('modules/audio-course/lessons.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(j=>{data=j.lessons||[];selected=Math.min(Math.max(0,selected),Math.max(0,data.length-1));persist();render()}).catch(e=>{el.innerHTML='<p>Unable to load audio lessons: '+safe(e.message)+'</p>'});
})();
