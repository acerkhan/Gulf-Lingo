(()=>{'use strict';
const area=document.getElementById('conversationsArea');
const tab=document.getElementById('conversationsTab');
if(!area||!tab)return;
let lessons=[],current=0,active=-1,sequence=false,token=0,speed=1,translations=true;
const audio=new Audio();audio.preload='none';audio.volume=.75;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='gulf-lingo-conversations-v1';
let progress={completed:{},positions:{}};
try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&typeof saved==='object')progress={...progress,...saved}}catch{}
function save(){try{localStorage.setItem(key,JSON.stringify(progress))}catch{}}
function stop(){token++;sequence=false;audio.pause();audio.removeAttribute('src');active=-1;}
window.addEventListener('gulf:leave-conversations',stop);
tab.addEventListener('click',()=>{nav('conversations');render()});
function select(i){stop();current=i;render();area.scrollIntoView({block:'start',behavior:'smooth'})}
function play(i,all=false){
 const l=lessons[current];if(!l||!l.lines[i])return;
 stop();const t=token;sequence=all;active=i;
 audio.src=l.lines[i].audio;audio.playbackRate=speed;
 audio.onended=()=>{if(t!==token)return;if(sequence&&i+1<l.lines.length){play(i+1,true)}else{stop();if(all){progress.completed[l.id]=true;save()}render()}};
 audio.onerror=()=>{stop();render();alert('This recording could not be loaded. Check the conversation audio files.')};
 audio.play().catch(()=>{stop();render();});
 render();
}
function render(){
 if(!lessons.length){area.innerHTML='<div class="conv-empty">Loading conversations…</div>';return}
 const l=lessons[current],done=Object.keys(progress.completed).filter(k=>progress.completed[k]).length;
 const palette=['#1e8a68','#6a6ec4','#c27858','#287d9e','#a87535','#8862a4','#428b80','#ad6680','#5c86aa','#648347'];
 const scenes=['👋','🗣️','☕','🏙️','🛍️','🍽️','🚕','🤝','💬','🌴'];
 const unitIndex=Math.min(9,Math.floor(current/2));
 const pct=Math.round(done/lessons.length*100);
 area.innerHTML=`<div class="conv-hero">
   <div class="conv-hero-copy"><span class="conv-kicker">GULF LINGO · CONVERSATIONS</span><h1>Speak with<br><em>confidence.</em></h1><p>20 real-life Emirati conversations. Listen, understand, and speak naturally.</p>
   <div class="conv-stats"><span>✦ ${done} of ${lessons.length} completed</span><span>♫ 101 authentic recordings</span></div>
   <div class="conv-hero-progress"><span style="width:${pct}%"></span></div></div>
   <div class="conv-hero-art" aria-hidden="true"><div class="conv-orbit"></div><div class="conv-person conv-person-one">👨🏽</div><div class="conv-person conv-person-two">👩🏽</div><span class="conv-bubble">هلا والله!</span></div>
 </div>
 <div class="conv-section-head"><div><span class="conv-kicker">YOUR LEARNING JOURNEY</span><h2>Explore conversations</h2></div><span class="conv-journey-count">${String(current+1).padStart(2,'0')} / ${lessons.length}</span></div>
 <div class="conv-journey" aria-label="Choose a conversation">${lessons.map((x,i)=>{const c=palette[Math.min(9,Math.floor(i/2))],icon=scenes[Math.min(9,Math.floor(i/2))];return `<button class="conv-journey-item ${i===current?'current':''} ${progress.completed[x.id]?'complete':''}" style="--conv-accent:${c}" data-lesson="${i}" aria-pressed="${i===current}">
 <span class="conv-journey-art">${icon}</span><span class="conv-journey-info"><small>CONVERSATION ${String(x.id).padStart(2,'0')}</small><strong>${esc(x.title)}</strong><span>${x.lines.length} audio lines · ${progress.completed[x.id]?'Completed ✓':'Tap to explore'}</span></span><span class="conv-journey-arrow">${i===current?'●':'↗'}</span></button>`}).join('')}</div>
 <div class="conv-study">
 <div class="conv-study-head"><div><span class="conv-kicker">NOW LEARNING · ${String(l.id).padStart(2,'0')}</span><h2>${esc(l.title)}</h2><p>Listen to the conversation, then practice each line at your own pace.</p></div><div class="conv-study-art" aria-hidden="true">${scenes[unitIndex]}</div></div>
 <div class="conv-player-card"><div class="conv-player-icon">♫</div><div class="conv-player-body"><strong>Conversation audio</strong><span>${l.lines.length} dialogue lines · ${active>=0?'Now playing line '+(active+1):'Ready when you are'}</span><div class="conv-play-track"><span style="width:${active>=0?(active+1)/l.lines.length*100:0}%"></span></div></div><button class="conv-play-all" id="convAll" aria-label="Play full conversation">${sequence?'↻':'▶'}</button></div>
 <div class="conv-tools"><button id="convStop" class="conv-tool">■ Stop</button><button id="convTranslations" class="conv-tool" aria-pressed="${translations}">${translations?'◉ Hide':'◎ Show'} translations</button><label class="conv-speed">Speed <select id="convSpeed"><option value=".75" ${speed===.75?'selected':''}>0.75×</option><option value="1" ${speed===1?'selected':''}>1×</option><option value="1.15" ${speed===1.15?'selected':''}>1.15×</option></select></label></div>
 <div class="conv-dialogue-heading"><h3>Dialogue</h3><span>Tap a line to listen</span></div>
 <div class="conv-lines">${l.lines.map((line,i)=>`<article class="conv-dialogue ${active===i?'speaking':''} ${i%2?'from-right':'from-left'}"><div class="conv-dialogue-avatar">${line.speakerId==='speaker-1'?'👨🏽':'👩🏽'}</div><div class="conv-dialogue-content"><span class="conv-speaker-name">${esc(line.speaker)}</span><div class="conv-speech"><div lang="ar" dir="rtl" class="conv-ar">${esc(line.ar)}</div>${translations?`<p>${esc(line.trans)}</p>`:''}<button class="conv-listen" data-play="${i}" aria-label="Listen to line ${i+1}">🔊 <span>Listen</span></button></div></div></article>`).join('')}</div>
 <div class="conv-footer"><button id="convComplete" class="conv-mark">${progress.completed[l.id]?'✓ Conversation completed':'✓ Mark complete'}</button><button id="convNext" class="conv-next" ${current===lessons.length-1?'disabled':''}>Next conversation →</button></div>
 </div>`;
 area.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>select(+b.dataset.lesson));
 area.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>play(+b.dataset.play));
 area.querySelector('#convTranslations').onclick=()=>{translations=!translations;render()};
 area.querySelector('#convAll').onclick=()=>play(0,true);
 area.querySelector('#convStop').onclick=()=>{stop();render()};
 area.querySelector('#convComplete').onclick=()=>{progress.completed[l.id]=true;save();render()};
 area.querySelector('#convNext').onclick=()=>select(Math.min(current+1,lessons.length-1));
 area.querySelector('#convSpeed').onchange=e=>{speed=+e.target.value;audio.playbackRate=speed};
}
fetch('modules/conversations/conversations.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{lessons=d.lessons;render()}).catch(e=>{area.innerHTML='<div class="conv-empty">Unable to load conversations. Run Gulf Lingo using a local web server (not file://).<br>'+esc(e.message)+'</div>'});
})();
