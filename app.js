// app.js - versão com localStorage, animação de senha e corações na cartinha
/* ============================
   UTIL & CONFIG
   ============================ */
const app = document.getElementById("app");

const correctPassword = "bb";
let errorCount = 0;

const feedbacks = [
  "Quase amorr... vamos lá ❤️✨",
  "Não acertou a pergunta princesa... mas meu coração já faz tempo 💞",
  "Não foi dessa vez neném 😳🥺💕",
  "Você errou meu bem, mas ainda pode tentar 💘"
];

function randFeedback() {
  return feedbacks[Math.floor(Math.random() * feedbacks.length)];
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[m]); }

/* adiciona alguns corações flutuantes sutis (se já existirem, não duplicar demais) */
function ensureHearts() {
  if (document.querySelectorAll('.heart-floating').length > 4) return;
  for (let i=0;i<3;i++){
    const el = document.createElement('svg');
    el.className = 'heart-floating';
    el.style.setProperty('--x', `${i*120}px`);
    el.style.setProperty('--y', `${i*30}px`);
    el.innerHTML = `<use href="#heart"></use>`;
    document.body.appendChild(el);
  }
}

/* ============================
   LOCAL STORAGE HELPERS
   ============================ */

function loadQuizProgress() {
  return JSON.parse(localStorage.getItem("quizProgress") || "{}");
}
function saveQuizProgress(obj) {
  localStorage.setItem("quizProgress", JSON.stringify(obj));
}
function markQuizAnswer(questionId, correct) {
  let score = loadQuizProgress();
  score[questionId] = !!correct;
  saveQuizProgress(score);
}

function loadCrosswordProgress() {
  return JSON.parse(localStorage.getItem("crosswordProgress") || "{}");
}
function saveCrosswordProgress(obj) {
  localStorage.setItem("crosswordProgress", JSON.stringify(obj));
}
function saveCrosswordWord(key) {
  let progress = loadCrosswordProgress();
  progress[key] = true;
  saveCrosswordProgress(progress);
}

function loadDreams() {
  return JSON.parse(localStorage.getItem("savedDreams") || "[]");
}
function saveDream(d) {
  const arr = loadDreams();
  arr.push(d);
  localStorage.setItem("savedDreams", JSON.stringify(arr));
}

/* ============================
   RENDER: SENHA (sem assopro/pergunta)
   ============================ */

function renderPasswordScreen(){
  ensureHearts();
  app.innerHTML = `
    <div class="header">
      <div class="title">
        <h1>Nosso Cantinho 💗</h1>
        <div class="small-sub">Um espaço só nosso</div>
      </div>
      <div class="small-sub">Protegido por senha</div>
    </div>

    <div class="panel fade">
      <h2>Oi meu amor... qual é a palavrinha mágica? 💗</h2>
      <input id="passwordInput" placeholder="Digite aqui..." autocomplete="off" />
      <div class="row">
        <button id="enterBtn">Entrar</button>
        <button id="tryHintBtn" style="background:transparent; box-shadow:none; color:var(--soft); padding:8px 12px;">Quer uma ajudinha?</button>
      </div>
      <div id="feedback" style="margin-top:10px;"></div>
    </div>
  `;

  document.getElementById("enterBtn").addEventListener("click", checkPassword);
  document.getElementById("tryHintBtn").addEventListener("click", () => {
    const hintsShort = [
      "É do jeitinho que você me chama... e só eu deixo 😳💕",
      "Bem curtinha... bem nossa 💗",
      "Se você sorrir, você acerta 💞",
      "Duas letrinhas, amor."
    ];
    const h = hintsShort[Math.floor(Math.random() * hintsShort.length)];
    const hintsBox = document.getElementById("feedback");
    const hint = document.createElement("div");
    hint.classList.add("hint");
    hint.innerText = h;
    hintsBox.appendChild(hint);
  });
}
renderPasswordScreen();

function checkPassword(){
  const val = document.getElementById("passwordInput").value.trim().toLowerCase();
  const feedback = document.getElementById("feedback");
  if (val === correctPassword) {
    // animação suave antes de entrar no hub
    const container = document.getElementById("app");
    const anim = container.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(1.05)" }
      ],
      { duration: 420, easing: "ease" }
    );
    anim.onfinish = () => renderHub();
    return;
  }
  errorCount++;
  feedback.innerHTML = `<div class="feedback">${randFeedback()}</div>`;
  if (errorCount <= 3){
    const hint = document.createElement("div");
    hint.classList.add("hint");
    hint.innerText = ["Pista: duas letrinhas", "Dica: é carinhoso", "Quase lá... pensa no apelido"][errorCount-1] || "Tenta de novo, amor.";
    feedback.appendChild(hint);
  }
}

/* ============================
   HUB
   ============================ */
function renderHub(){
  ensureHearts();
  app.innerHTML = `
    <div class="header fade">
      <div class="title">
        <h1>Mini Hub — Nosso Cantinho 💗</h1>
        <div class="small-sub">Escolha uma aba e vem brincar comigo</div>
      </div>
      <div class="small-sub">Seja bem-vinda, meu amor</div>
    </div>

    <div class="hub fade">
      <div class="tabs">
        <div class="tab active" id="tab-quiz">Quiz Romântico</div>
        <div class="tab" id="tab-cross">Palavra Cruzada</div>
        <div class="tab" id="tab-card">Cartinha Animada</div>
      </div>
      <div id="panel" class="panel"></div>
    </div>
  `;

  document.getElementById("tab-quiz").addEventListener("click", ()=> switchTab("quiz"));
  document.getElementById("tab-cross").addEventListener("click", ()=> switchTab("cross"));
  document.getElementById("tab-card").addEventListener("click", ()=> switchTab("card"));

  // load saved progress so panels can honor it
  loadSavedProgress();

  switchTab("quiz");
}

function switchTab(tab){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  if (tab === "quiz") document.getElementById("tab-quiz").classList.add("active");
  if (tab === "cross") document.getElementById("tab-cross").classList.add("active");
  if (tab === "card") document.getElementById("tab-card").classList.add("active");

  if (tab === "quiz") showQuizIntro();
  if (tab === "cross") showCrossword();
  if (tab === "card") showCard();
}

/* ============================
   QUIZ
   ============================ */

const quizQuestions = [
  { id:1, question:"Qual o nome do nosso futuro filho?", options:["Renan","Bruno","Luís","Drogba"], correct:"Bruno" },
  { id:2, question:"Qual o primeiro lugar que vamos viajar juntos?", options:["México","Canadá","Japão","Itália"], correct:null, hiddenMsg:"Essa nem era quiz, era pra saber onde vc quer ir bb 😘😊" },
  { id:3, question:"Onde foi nossa primeira experiência sexual?", options:["Na sua casa","No cinema","Na praia","No carro"], correct:"Na sua casa" },
  { id:4, question:"Qual foi o primeiro filme que choramos juntos?", options:["Forrest Gump","Monster","Godzilla Minus One","A Freira 2"], correct:"Forrest Gump" },
  { id:5, question:"O que eu mais amo em você?", options:["sorriso","bunda","olhos","jeito","todas as alternativas"], correct:"todas as alternativas", hiddenMsg:"e muito mais meu bem 🥰💞✨" }
];

let quizIndex = 0;

function showQuizIntro(){
  const panel = document.getElementById("panel");
  panel.innerHTML = `
    <div class="center fade">
      <h2>Vamos ver o quanto você me conhece, neném? 💗</h2>
      <div class="small">São ${quizQuestions.length} perguntas cheias de amor e risadinhas.</div>
      <div style="margin-top:12px;">
        <button id="startQuizBtn">Começar Quiz</button>
      </div>
    </div>
  `;
  document.getElementById("startQuizBtn").addEventListener("click", ()=>{ quizIndex=0; renderQuizQuestion(); });
}

function renderQuizQuestion(){
  const q = quizQuestions[quizIndex];
  const panel = document.getElementById("panel");
  const stored = loadQuizProgress();
  const already = stored[q.id];

  panel.innerHTML = `
    <h3>${q.question}</h3>
    <div class="quiz-options">
      ${q.options.map(opt=>`<button class="optBtn">${opt}</button>`).join("")}
    </div>
    <div id="quizFeedback" class="quiz-feedback"></div>
    <div style="margin-top:12px;" class="small">Leia com calma — o botão "Próxima pergunta" aparece quando você acertar 💕</div>
  `;
  panel.querySelectorAll(".optBtn").forEach(btn=>btn.addEventListener("click", ()=> selectOption(q, btn.textContent.trim())));

  // if question already answered correctly, show feedback and next button
  if (already) {
    const fb = document.getElementById("quizFeedback");
    fb.innerHTML = `<div class="feedback">🎀 Você já tinha acertado essa pergunta, meu bb! 💗</div>`;
    showNextBtn();
  }
}

function selectOption(q, option){
  const fb = document.getElementById("quizFeedback");
  if (q.correct === null) {
    fb.innerHTML = `<div class="feedback">💌 ${q.hiddenMsg}</div>`;
    showNextBtn();
    return;
  }
  if (option.toLowerCase() === q.correct.toLowerCase()){
    const extra = q.hiddenMsg || (q.id===5 ? ` ${quizQuestions[4].hiddenMsg || ""}` : "");
    fb.innerHTML = `<div class="feedback">🎀 Você acertou, meu bb! ${["💗","😘","✨"][Math.floor(Math.random()*3)]} ${q.id===5 ? '<span class="small">- e muito mais meu bem 🥰💞✨</span>' : ''}</div>`;
    // save progress
    markQuizAnswer(q.id, true);
    showNextBtn();
  } else {
    fb.innerHTML = `<div class="feedback">❌ ${randFeedback()}</div>`;
    // small shake
    document.getElementById("panel").animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:300});
  }
}

function showNextBtn(){
  const panel = document.getElementById("panel");
  if (!panel.querySelector("#nextQuizBtn")){
    const btn = document.createElement("button");
    btn.id = "nextQuizBtn";
    btn.textContent = "Próxima pergunta";
    btn.addEventListener("click", ()=> {
      quizIndex++;
      if (quizIndex >= quizQuestions.length) {
        // fim
        panel.innerHTML = `
          <div class="center">
            <h2>Acabou o quiz, meu amor 💞</h2>
            <p class="small">Você sempre acerta meu coração. Quer fazer outra vez?</p>
            <div style="margin-top:10px;">
              <button id="restartQuizBtn">Refazer Quiz</button>
              <button id="toCardBtn" style="background:transparent; color:var(--soft); box-shadow:none;">Ir pra cartinha</button>
            </div>
          </div>`;
        document.getElementById("restartQuizBtn").addEventListener("click", ()=>{ quizIndex=0; renderQuizQuestion(); });
        document.getElementById("toCardBtn").addEventListener("click", ()=> switchTab("card"));
      } else {
        renderQuizQuestion();
      }
    });
    panel.appendChild(btn);
  }
}

/* ============================
   PALAVRA CRUZADA - lógica com apenas células necessárias
   ============================ */

const crosswordWords = [
  { key:"SAUDADE", word:"SAUDADE", row:4, col:3, dir:"H",
    hint:"Sentimento que aperta quando você não está por perto",
    question:"Qual palavra descreve o que bate em mim quando você viaja?"
  },

  { key:"VIAJAR", word:"VIAJAR", row:2, col:7, dir:"V",
    hint:"Verbo que usamos para nossos planos juntos",
    question:"Qual ação representa nossos próximos planos?"
  },

  { key:"DISTANCIA", word:"DISTANCIA", row:6, col:3, dir:"H",
    hint:"Espaço criado quando estamos longe",
    question:"O que a gente vence toda vez que se encontra de novo?"
  },

  { key:"KIKI", word:"KIKI", row:5, col:2, dir:"V",
    hint:"Rainha da sua casa",
    question:"Quem fica no colo e reclama quando não recebe atenção?"
  },

  { key:"FULLMETAL", word:"FULLMETAL", row:10, col:3, dir:"H",
    hint:"Vimos, demoramos, amamos",
    question:"Última série longa que vimos bb?"
  },

  { key:"ALIANCA", word:"ALIANCA", row:9, col:11, dir:"V",
    hint:"Vai estar no seu dedo logo menos...",
    question:"O que eu quero ver brilhando no seu dedo quando a gente estiver pronto?"
  },

  { key:"DESENHO", word:"DESENHO", row:12, col:3, dir:"H",
    hint:"O que a gente assiste para relaxar",
    question:"O que a gente coloca pra distrair a noite?"
  },

  { key:"LADRA", word:"LADRA", row:14, col:3, dir:"H",
    hint:"Você pegou meu coração a força",
    question:"Você pega minhas roupas sempre, isso faz de você uma?"
  }
];



// error counters by key
const wordErrorCounters = {};
crosswordWords.forEach(w => wordErrorCounters[w.key] = 0);

// We'll build a map of occupied coordinates to letters and which word(s) reference them
function buildCoordinateMap() {
  const map = {}; // key "r,c" => { letter, cells: [{wordKey, index}] }
  let minR=Infinity, maxR=-Infinity, minC=Infinity, maxC=-Infinity;
  crosswordWords.forEach(w=>{
    for (let i=0;i<w.word.length;i++){
      const r = w.row + (w.dir==="V"? i: 0);
      const c = w.col + (w.dir==="H"? i: 0);
      const pos = `${r},${c}`;
      if (!map[pos]) map[pos] = { letter: w.word[i], refs: [] };
      // If different words cross with different letters, prefer the specified letter (shouldn't happen)
      map[pos].refs.push({ key: w.key, idx:i });
      minR = Math.min(minR, r); maxR = Math.max(maxR, r);
      minC = Math.min(minC, c); maxC = Math.max(maxC, c);
    }
  });
  return { map, minR, maxR, minC, maxC };
}

let crosswordState = {
  coordMap: null,
  originR: 0,
  originC: 0,
  rows: 0,
  cols: 0
};

function showCrossword(){
  const panel = document.getElementById("panel");
  panel.innerHTML = `
    <h3>Palavra Cruzada — Enigma nosso 💌</h3>
    <div id="crossarea" style="margin-top:10px;"></div>
  `;
  renderCrosswordArea();
}

function renderCrosswordArea(){
  const crossarea = document.getElementById("crossarea");
  const built = buildCoordinateMap();
  crosswordState.coordMap = built.map;
  crosswordState.originR = built.minR;
  crosswordState.originC = built.minC;
  crosswordState.rows = built.maxR - built.minR + 1;
  crosswordState.cols = built.maxC - built.minC + 1;

  // build HTML: container + canvas-like grid (absolute positioning) + hints column
  crossarea.innerHTML = `
    <div style="display:flex; gap:16px; align-items:flex-start;">
      <div id="gridWrap" style="position:relative; background:transparent; border-radius:10px; padding:10px;"></div>
      <div id="hintsWrap" style="width:320px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0;">Dicas</h4>
          <button id="toggleAnswers" class="clear-btn">Mostrar respostas</button>
        </div>
        <div id="hintsList" style="margin-top:10px; max-height:420px; overflow:auto;"></div>
        <div id="crossResult" style="margin-top:10px;"></div>
      </div>
    </div>
  `;

  // cell size responsive
  const cellSize = Math.min(44, Math.max(30, Math.floor(360 / Math.max(crosswordState.cols, crosswordState.rows))));
  const gridWidth = crosswordState.cols * cellSize;
  const gridHeight = crosswordState.rows * cellSize;

  const gridWrap = document.getElementById("gridWrap");
  gridWrap.style.width = gridWidth + "px";
  gridWrap.style.height = gridHeight + "px";
  gridWrap.style.border = "none";
  gridWrap.style.position = "relative";

  // create only cells that exist in coordMap
  Object.keys(crosswordState.coordMap).forEach(pos=>{
    const [r,c] = pos.split(",").map(Number);
    const relativeR = r - crosswordState.originR;
    const relativeC = c - crosswordState.originC;
    const letterObj = crosswordState.coordMap[pos];

    const cell = document.createElement("div");
    cell.className = "cross-cell";
    cell.style.position = "absolute";
    cell.style.left = (relativeC * cellSize) + "px";
    cell.style.top = (relativeR * cellSize) + "px";
    cell.style.width = (cellSize - 4) + "px";
    cell.style.height = (cellSize - 4) + "px";
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.borderRadius = "6px";
    cell.style.background = "rgba(255,255,255,0.06)";
    cell.style.boxShadow = "inset 0 -2px 6px rgba(0,0,0,0.12)";
    cell.dataset.pos = pos;

    const input = document.createElement("input");
    input.maxLength = 1;
    input.style.width = "100%";
    input.style.height = "100%";
    input.style.border = "none";
    input.style.background = "transparent";
    input.style.color = "#fff";
    input.style.fontWeight = "700";
    input.style.textAlign = "center";
    input.style.fontSize = Math.max(12, Math.floor(cellSize/2.6)) + "px";
    input.autocomplete = "off";

    // store expected letter
    input.dataset.expected = letterObj.letter;

    // event: when input filled, uppercase and validate the whole word(s) that reference this cell
    input.addEventListener("input", (e)=>{
      e.target.value = (e.target.value || "").toUpperCase().slice(0,1);
      // small visual
      if (!e.target.value) e.target.parentElement.classList.remove('wrong');
      if (e.target.value && e.target.value !== e.target.dataset.expected) {
        e.target.parentElement.classList.add('wrong');
      } else if (e.target.value && e.target.value === e.target.dataset.expected) {
        e.target.parentElement.classList.remove('wrong');
        e.target.parentElement.classList.add('correct');
      }
      // check full words that reference this pos
      const refs = crosswordState.coordMap[pos].refs || [];
      refs.forEach(ref => {
        validateWordByKey(ref.key);
      });
    });

    // allow backspace & easy clearing
    input.addEventListener("keydown", (e)=>{
      if (e.key === "Backspace") {
        // allow user to clear easily
      }
    });

    cell.appendChild(input);
    gridWrap.appendChild(cell);
  });

  // render hints
  renderHintsList();

  // toggle button
  document.getElementById("toggleAnswers").addEventListener("click", toggleAnswersForCrossword);

  // small fade
  gridWrap.animate([{opacity:0},{opacity:1}], {duration:280, easing:'ease-out'});

  // apply saved crossword progress (if any)
  applySavedCrosswordProgress();
}

/* Helpers: find cells for a given word (returns array of input elements) */
function getInputsForWord(w) {
  const inputs = [];
  for (let i=0;i<w.word.length;i++){
    const r = w.row + (w.dir==="V"? i:0);
    const c = w.col + (w.dir==="H"? i:0);
    const pos = `${r},${c}`;
    const cell = document.querySelector(`.cross-cell[data-pos="${pos}"]`);
    if (cell) {
      const input = cell.querySelector("input");
      inputs.push({ input, expected: w.word[i] });
    } else {
      inputs.push({ input: null, expected: w.word[i] });
    }
  }
  return inputs;
}

/* Validate full word (called when last letter filled of word or any letter changed) */
function validateWordByKey(key) {
  const w = crosswordWords.find(x=>x.key===key);
  if (!w) return;
  const inputs = getInputsForWord(w);
  // if some inputs are missing (shouldn't) or empty -> not filled yet
  for (let it of inputs) {
    if (!it.input || (it.input.value || "").trim() === "") return; // not yet complete -> wait
  }
  // all filled -> check correctness
  let allOk = true;
  for (let i=0;i<inputs.length;i++){
    const it = inputs[i];
    if ((it.input.value||"").toUpperCase() !== it.expected.toUpperCase()) {
      allOk = false;
      it.input.parentElement.classList.add("wrong");
      it.input.parentElement.classList.remove("correct");
    } else {
      it.input.parentElement.classList.remove("wrong");
      it.input.parentElement.classList.add("correct");
    }
  }

  const crossResult = document.getElementById("crossResult");
  if (allOk) {
    // lock the word (make inputs readonly/disabled)
    inputs.forEach(it=>{
      it.input.disabled = true;
      it.input.style.pointerEvents = "none";
      // soft glow
      it.input.parentElement.style.transition = "box-shadow .35s, background .35s";
      it.input.parentElement.style.boxShadow = "0 6px 20px rgba(255,110,145,0.08)";
      it.input.parentElement.style.background = "rgba(120,255,160,0.06)";
    });
    crossResult.innerHTML = `<div class="success">Você acertou uma palavra 💞</div>`;
    // persist progress
    saveCrosswordWord(w.key);
  } else {
    // increment error counter for this word (but only once per full wrong submission)
    wordErrorCounters[w.key] = (wordErrorCounters[w.key] || 0) + 1;
    // update hints count
    const errSpan = document.getElementById(`err-${w.key}`);
    if (errSpan) errSpan.textContent = wordErrorCounters[w.key];
    // friendly messages (no spoilers)
    if (wordErrorCounters[w.key] === 1) {
      crossResult.innerHTML = `<div class="feedback">Você errou, meu amorzinho… tenta outra vez 💗</div>`;
    } else if (wordErrorCounters[w.key] === 2) {
      crossResult.innerHTML = `<div class="feedback">Quase lá princesa… vou te ajudar um pouquinho 💞</div>`;
      // reveal question in hint area
      revealQuestionInHints(w);
    } else {
      crossResult.innerHTML = `<div class="feedback">${randFeedback()}</div>`;
    }
    // small shake effect on the wrong letters
    inputs.forEach(it=>{
      if ((it.input.value||"").toUpperCase() !== it.expected.toUpperCase()) {
        it.input.parentElement.animate([{transform:'scale(1)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:260});
      }
    });
  }
}

/* render the hints list with assopro always visible and pergunta hidden until error >=2 */
function renderHintsList(){
  const hintsList = document.getElementById("hintsList");
  hintsList.innerHTML = "";
  crosswordWords.forEach((w, idx) => {
    const block = document.createElement("div");
    block.className = "hint-block";
    block.id = `hint-${w.key}`;
    block.style.marginBottom = "12px";
    block.innerHTML = `
      <strong>${idx+1} - ${w.dir === "V" ? "Vertical" : "Horizontal"} (${w.word.length} letras)</strong>
      <div style="margin-top:8px;"><em>assopro:</em> ${escapeHtml(w.hint)}</div>
      <div id="question-${w.key}" style="margin-top:8px; display:${wordErrorCounters[w.key]>=2 ? "block":"none"};"><em>pergunta:</em> ${escapeHtml(w.question)}</div>
      <div style="margin-top:6px; font-size:0.9rem; opacity:0.95;">Erros: <span id="err-${w.key}">${wordErrorCounters[w.key]}</span></div>
    `;
    hintsList.appendChild(block);
  });
}

function revealQuestionInHints(w) {
  const el = document.getElementById(`question-${w.key}`);
  if (el) el.style.display = "block";
}

/* Toggle behavior: show answers -> fill -> change text to limpar -> on limpar clear only letters (but keep counters) */
let answersShown = false;

function toggleAnswersForCrossword(){
  const btn = document.getElementById("toggleAnswers");
  if (!answersShown) {
    // fill
    crosswordWords.forEach(w=>{
      const inputs = getInputsForWord(w);
      inputs.forEach((it, idx)=>{
        if (it.input) {
          it.input.value = it.expected;
          it.input.parentElement.classList.add("correct");
        }
      });
    });
    btn.textContent = "Limpar cruzadinha";
    answersShown = true;
  } else {
    // clear only letter values and unlock all (but keep error counters)
    document.querySelectorAll('.cross-cell input').forEach(inp=>{
      inp.value = "";
      inp.disabled = false;
      inp.style.pointerEvents = "auto";
      inp.parentElement.classList.remove("correct","wrong");
    });
    btn.textContent = "Mostrar respostas";
    answersShown = false;
  }
}

/* Apply saved crossword progress: fill and lock completed words */
function applySavedCrosswordProgress(){
  const saved = loadCrosswordProgress();
  crosswordWords.forEach(w=>{
    if (saved[w.key]) {
      const inputs = getInputsForWord(w);
      inputs.forEach(it=>{
        if (it.input) {
          it.input.value = it.expected;
          it.input.disabled = true;
          it.input.style.pointerEvents = "none";
          it.input.parentElement.classList.add("correct");
          it.input.parentElement.style.boxShadow = "0 6px 20px rgba(255,110,145,0.08)";
          it.input.parentElement.style.background = "rgba(120,255,160,0.06)";
        }
      });
    }
  });
}

/* ============================
   CARTINHA / "Minha promessa, Sofia"
   ============================ */

function showCard() {
  const panel = document.getElementById("panel");
  panel.innerHTML = `
    <div class="card-wrap center fade">
      <div id="card" class="card closed">
        <div class="sparkles"></div>
        <div class="inner">
          <h3>Minha promessa, Sofia</h3>
          <div id="cardContent" class="small" style="margin-top:10px;">
            <div id="cardPreview">Toque para abrir a cartinha...</div>
            <div id="cardText" style="display:none; text-align:left;">
              <p><strong>Minha promessa, Sofia</strong></p>
              <p>Meu sonho se completa no dia que nós dividirmos um lar — as manhãs travessas, as noites de filme, as gírias que viram rotina, e quando a gente confundir as escovas sem nem ligar.</p>
              <p>Quero acordar com você, construir uma rotina que nos proteja e nos faça sorrir com as pequenas coisas. Quero planejar viagens, cozinhas improvisadas e o nosso futuro com calma, porque é contigo que eu quero tudo isso.</p>
              <p>Eu te amo com paixão e decisão — e quero transformar esse sonho em endereço. 💗</p>
              <div style="margin-top:10px;">
                <input id="finalFill" placeholder="Complete aqui..." style="width:100%; padding:8px; border-radius:8px; border:none; outline:none;" />
                <button id="saveFinal" style="margin-top:8px;">Guardar sonho</button>
              </div>
              <div id="savedDreams" style="margin-top:12px;"></div>
            </div>
          </div>
        </div>
      </div>
      <button id="openCardBtn">Abrir / Fechar Cartinha</button>
    </div>
  `;

  document.getElementById("openCardBtn").addEventListener("click", toggleCard);
  document.getElementById("cardPreview").addEventListener("click", toggleCard);

  document.getElementById("saveFinal").addEventListener("click", () => {
    const val = document.getElementById("finalFill").value.trim();
    if (!val) return;
    saveDream(val);
    renderDreams();
    document.getElementById("finalFill").value = "";
  });

  // render saved dreams when the card panel is created
  renderDreams();
}

let cardOpen = false;
function toggleCard() {
  const card = document.getElementById("card");
  const preview = document.getElementById("cardPreview");
  const cardText = document.getElementById("cardText");

  cardOpen = !cardOpen;

  if (cardOpen) {
    card.classList.add("open");
    card.classList.remove("closed");
    preview.style.display = "none";
    cardText.style.display = "block";

    // add pulsing hearts near title (avoid duplicates)
    const title = card.querySelector(".inner h3");
    if (title && !title.querySelector(".pulsing-heart")) {
      for (let i = 0; i < 2; i++) {
        const h = document.createElement("span");
        h.className = "pulsing-heart";
        h.style.marginLeft = (i===0? "8px":"6px");
        title.appendChild(h);
      }
    }
  } else {
    card.classList.add("closed");
    card.classList.remove("open");
    preview.style.display = "block";
    cardText.style.display = "none";
    card.querySelectorAll(".pulsing-heart").forEach(h => h.remove());
  }
}

/* render saved dreams list */
function renderDreams(){
  const box = document.getElementById("savedDreams");
  if (!box) return;
  box.innerHTML = "";
  let dreams = loadDreams() || [];
  if (dreams.length === 0) {
    box.innerHTML = `<div class="small">Nenhum sonho salvo ainda.</div>`;
    return;
  }
  dreams.forEach(d => {
    const div = document.createElement("div");
    div.className = "hint";
    div.textContent = "💗 Meu sonho se completa o dia que nós " + d;
    box.appendChild(div);
  });
}

/* ============================
   inicialização: render hub (keeps password screen until correct)
   ============================ */
// Note: password screen already shown on load; when correct, renderHub is called.

/* ============================
   UTIL: load saved progress when hub rendered
   ============================ */
function loadSavedProgress(){
  // load crossword progress counts (no errors stored, but we keep saved words)
  const cw = loadCrosswordProgress();
  if (cw) {
    // mark as completed in wordErrorCounters for UI count (optional)
    Object.keys(cw).forEach(k => {
      if (cw[k]) wordErrorCounters[k] = wordErrorCounters[k] || 0;
    });
  }
  // quiz progress is loaded per question when rendering
}

/* End of file */
