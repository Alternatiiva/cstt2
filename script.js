/* script.js — общая логика для index.html и admin.html
   Хранение: localStorage ключ "cs2_tournament_v3"
   Авто-обновление для зрителей через событие storage
*/

const STORAGE_KEY = "cs2_tournament_v3";
const ADMIN_PASSWORD = "admin123"; // можно сменить перед деплоем

// Начальные данные (если в localStorage пусто)
const DEFAULT = {
  teams: [
    { name: "Team A", score: 0, time: "18:00" }, // матч 1: teams[0] vs teams[1]
    { name: "Team B", score: 0, time: "18:00" },
    { name: "Team C", score: 0, time: "19:00" }, // матч 2: teams[2] vs teams[3]
    { name: "Team D", score: 0, time: "19:00" }
  ],
  final: { t1: "", t2: "", score1: 0, score2: 0, time: "20:00" },
  champion: ""
};

// Утилиты
function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return JSON.parse(JSON.stringify(DEFAULT));
    return JSON.parse(raw);
  }catch(e){
    console.error("Ошибка чтения данных:", e);
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// вычислить победителей полуфиналов и финалиста
function compute(data){
  // полуфинал 1: teams[0] vs teams[1]
  const t0 = data.teams[0], t1 = data.teams[1], t2 = data.teams[2], t3 = data.teams[3];

  data.final.t1 = (t0.score > t1.score) ? t0.name : (t1.score > t0.score ? t1.name : "");
  data.final.t2 = (t2.score > t3.score) ? t2.name : (t3.score > t2.score ? t3.name : "");

  // чемпион (если финал have scores and finalists assigned)
  if(data.final.t1 && data.final.t2){
    if(data.final.score1 > data.final.score2) data.champion = data.final.t1;
    else if(data.final.score2 > data.final.score1) data.champion = data.final.t2;
    else data.champion = ""; // ничья — не определён
  } else {
    data.champion = "";
  }

  return data;
}

// Рендер/обновление: у обеих страниц одинаковые имена id, поэтому функции должны корректно отработать
function renderAll(){
  const data = loadData();

  // Ensure final/Champion are recomputed from current scores so spectator view always актуален
  compute(data);

  // --- зрительская страница (index.html)
  // Проверяем наличие элементов (если нет — страница admin)
  const el = id => document.getElementById(id);

  // полуфиналы на странице зрителя
  if(el("t1")){ // index.html присутствует
    // команда / счёт / время
    el("t1").innerText = data.teams[0].name;
    el("s1").innerText = data.teams[0].score;
    el("t2").innerText = data.teams[1].name;
    el("s2").innerText = data.teams[1].score;
    el("t3").innerText = data.teams[2].name;
    el("s3").innerText = data.teams[2].score;
    el("t4").innerText = data.teams[3].name;
    el("s4").innerText = data.teams[3].score;

    // times near matches: use teams[0].time for match1, teams[2].time for match2
    el("time1").innerText = data.teams[0].time || "";
    el("time2").innerText = data.teams[2].time || "";

    // финал
    el("ft1").innerText = data.final.t1 || "-";
    el("fs1").innerText = data.final.score1;
    el("ft2").innerText = data.final.t2 || "-";
    el("fs2").innerText = data.final.score2;
    el("ftime").innerText = data.final.time || "";

    // чемпион
    el("champ").innerText = data.champion ? "Champion: " + data.champion : "";
  }

  // --- админская страница
  if(el("team1")){
    // заполнить inputs значениями
    el("team1").value = data.teams[0].name;
    el("score1").value = data.teams[0].score;
    el("time1a").value = data.teams[0].time;

    el("team2").value = data.teams[1].name;
    el("score2").value = data.teams[1].score;
    // time for match1 already taken from team1 for simplicity (admin can edit both if desired)

    el("team3").value = data.teams[2].name;
    el("score3").value = data.teams[2].score;
    el("time2a").value = data.teams[2].time;

    el("team4").value = data.teams[3].name;
    el("score4").value = data.teams[3].score;

    el("fscore1").value = data.final.score1;
    el("fscore2").value = data.final.score2;
    el("ftimea").value = data.final.time || "";

    // отображаем финалистов (labels)
    const ft1label = el("finalist1");
    const ft2label = el("finalist2");
    if(ft1label) ft1label.innerText = data.final.t1 || "-";
    if(ft2label) ft2label.innerText = data.final.t2 || "-";
    // champion label
    if(el("championAdmin")) el("championAdmin").innerText = data.champion ? "Champion: " + data.champion : "";
  }
}

// Сохранить данные из админ-панели
function applyAdminChanges(){
  const el = id => document.getElementById(id);
  const data = loadData();

  // прочитать и валидировать (каждое поле)
  const safeStr = v => (v === null || v === undefined) ? "" : String(v).trim();

  data.teams[0].name = safeStr(el("team1").value) || "Team A";
  data.teams[1].name = safeStr(el("team2").value) || "Team B";
  data.teams[2].name = safeStr(el("team3").value) || "Team C";
  data.teams[3].name = safeStr(el("team4").value) || "Team D";

  data.teams[0].score = Number(el("score1").value) || 0;
  data.teams[1].score = Number(el("score2").value) || 0;
  data.teams[2].score = Number(el("score3").value) || 0;
  data.teams[3].score = Number(el("score4").value) || 0;

  data.teams[0].time = safeStr(el("time1a").value) || data.teams[0].time || "18:00";
  data.teams[2].time = safeStr(el("time2a").value) || data.teams[2].time || "19:00";

  data.final.score1 = Number(el("fscore1").value) || 0;
  data.final.score2 = Number(el("fscore2").value) || 0;
  data.final.time = safeStr(el("ftimea").value) || data.final.time || "20:00";

  // пересчитать финалистов и чемпиона
  compute(data);
  saveData(data);

  // уведомим другие вкладки (storage событие автоматически произойдёт при saveData)
  // и сразу отрендерим здесь
  renderAll();
}

// вход админа
function tryLogin(){
  const pw = document.getElementById("adminPw")?.value || "";
  const panel = document.getElementById("adminPanel");
  const bad = document.getElementById("badPw");
  if(pw === ADMIN_PASSWORD){
    if(panel) panel.style.display = "block";
    if(bad) bad.style.display = "none";
    // очистить поле пароля
    const inp = document.getElementById("adminPw");
    if(inp) inp.value = "";
  } else {
    if(bad) { bad.style.display = "block"; bad.innerText = "Неверный пароль"; }
    if(panel) panel.style.display = "none";
  }
}

// сброс данных в дефолт
function resetToDefault(){
  saveData(JSON.parse(JSON.stringify(DEFAULT)));
  renderAll();
}

// Экспорт/импорт (полезно)
function exportJSON(){
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tournament.json";
  a.click();
  URL.revokeObjectURL(url);
}
function importJSON(file){
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const parsed = JSON.parse(e.target.result);
      saveData(parsed);
      renderAll();
    }catch(err){
      alert("Ошибка при импорте: некорректный JSON");
    }
  };
  reader.readAsText(file);
}

// Обработчики storage: если другой таб изменил данные — обновляем
window.addEventListener("storage", (e)=>{
  if(e.key === STORAGE_KEY){
    renderAll(); // просто перерендерим из localStorage
  }
});

// DOMContentLoaded — навешиваем обработчики удобным образом
document.addEventListener("DOMContentLoaded", ()=>{
  renderAll();

  // Если admin.html — навесим кнопки
  const saveBtn = document.getElementById("saveBtn");
  if(saveBtn) saveBtn.addEventListener("click", applyAdminChanges);

  const loginBtn = document.getElementById("loginBtn");
  if(loginBtn) loginBtn.addEventListener("click", tryLogin);

  const resetBtn = document.getElementById("resetBtn");
  if(resetBtn) resetBtn.addEventListener("click", ()=>{
    if(confirm("Сбросить турнир к исходным значениям?")) resetToDefault();
  });

  const exportBtn = document.getElementById("exportBtn");
  if(exportBtn) exportBtn.addEventListener("click", exportJSON);

  const importInput = document.getElementById("importFile");
  if(importInput) importInput.addEventListener("change", (ev)=>{
    const f = ev.target.files[0];
    if(f) importJSON(f);
  });

  // ручной триггер сохранения финального счёта (если нужен)
  const saveFinalBtn = document.getElementById("saveFinalBtn");
  if(saveFinalBtn) saveFinalBtn.addEventListener("click", ()=>{
    // просто применим admin изменения (включая final)
    applyAdminChanges();
  });
});