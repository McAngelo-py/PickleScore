(function(){
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    names: { A: "Team A", B: "Team B" },
    scores: { A: 0, B: 0 },
    gamesWon: { A: 0, B: 0 },
    servingTeam: "A",
    serverNumber: 1,
    firstServerOfGame: true,
    mode: "doubles",            // singles | doubles
    scoringStyle: "official",   // official | simple
    pointTarget: 11,
    winBy: 2,
    bestOf: 3,
    soundOn: true,
    flipped: false,
    matchOver: false,
    matchWinner: null
  };

  let history = [];
  const MAX_HISTORY = 60;

  function snapshot(){
    return JSON.parse(JSON.stringify({
      names: state.names, scores: state.scores, gamesWon: state.gamesWon,
      servingTeam: state.servingTeam, serverNumber: state.serverNumber,
      firstServerOfGame: state.firstServerOfGame, matchOver: state.matchOver,
      matchWinner: state.matchWinner
    }));
  }
  function pushHistory(){
    history.push(snapshot());
    if(history.length > MAX_HISTORY) history.shift();
    $("undoBtn").disabled = false;
  }
  function undo(){
    if(!history.length) return;
    const prev = history.pop();
    Object.assign(state.names, prev.names);
    Object.assign(state.scores, prev.scores);
    Object.assign(state.gamesWon, prev.gamesWon);
    state.servingTeam = prev.servingTeam;
    state.serverNumber = prev.serverNumber;
    state.firstServerOfGame = prev.firstServerOfGame;
    state.matchOver = prev.matchOver;
    state.matchWinner = prev.matchWinner;
    $("undoBtn").disabled = history.length === 0;
    closeWinOverlay();
    render();
  }

  // ---------- SOUND ----------
  let audioCtx = null;
  function beep(freq, dur){
    if(!state.soundOn) return;
    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    }catch(e){ /* audio unavailable, ignore */ }
  }

  // ---------- SCORING LOGIC ----------
  function other(team){ return team === "A" ? "B" : "A"; }

  function pointWonBy(team){
    if(state.matchOver) return;
    pushHistory();

    if(state.scoringStyle === "simple"){
      state.scores[team] += 1;
      beep(team === "A" ? 660 : 520, 0.12);
    } else {
      if(team === state.servingTeam){
        state.scores[team] += 1;
        beep(team === "A" ? 660 : 520, 0.12);
      } else {
        // side out logic
        beep(300, 0.09);
        if(state.mode === "doubles"){
          if(state.firstServerOfGame){
            state.servingTeam = other(state.servingTeam);
            state.serverNumber = 1;
            state.firstServerOfGame = false;
          } else if(state.serverNumber === 1){
            state.serverNumber = 2;
          } else {
            state.servingTeam = other(state.servingTeam);
            state.serverNumber = 1;
          }
        } else {
          state.servingTeam = other(state.servingTeam);
          state.serverNumber = 1;
        }
      }
    }

    checkGameWin();
    render();
  }

  function manualAdjust(team, delta){
    pushHistory();
    state.scores[team] = Math.max(0, state.scores[team] + delta);
    render();
  }

  function checkGameWin(){
    const a = state.scores.A, b = state.scores.B;
    const leader = a > b ? "A" : (b > a ? "B" : null);
    if(!leader) return;
    const leadScore = Math.max(a,b), trailScore = Math.min(a,b);
    if(leadScore >= state.pointTarget && (leadScore - trailScore) >= state.winBy){
      state.gamesWon[leader] += 1;
      const majority = Math.ceil(state.bestOf / 2);
      const isMatchOver = state.gamesWon[leader] >= majority;

      showWinOverlay(leader, a, b, isMatchOver);

      if(isMatchOver){
        state.matchOver = true;
        state.matchWinner = leader;
      } else {
        state.scores.A = 0; state.scores.B = 0;
        state.servingTeam = leader;
        state.serverNumber = 1;
        state.firstServerOfGame = true;
      }
    }
  }

  function isOnePointFromGame(team){
    const otherTeam = other(team);
    return !state.matchOver && state.scores[team] >= state.pointTarget - 1 && state.scores[team] > state.scores[otherTeam];
  }

  function isMatchPointFor(team){
    const majority = Math.ceil(state.bestOf / 2);
    return isOnePointFromGame(team) && state.gamesWon[team] >= majority - 1;
  }

  // ---------- RENDER ----------
  function render(){
    $("nameA").value = state.names.A;
    $("nameB").value = state.names.B;
    $("scoreA").textContent = state.scores.A;
    $("scoreB").textContent = state.scores.B;
    $("gamesA").textContent = "Games " + state.gamesWon.A;
    $("gamesB").textContent = "Games " + state.gamesWon.B;

    const panelA = document.querySelector(".panel-a");
    const panelB = document.querySelector(".panel-b");
    const teamAIsOneAway = isOnePointFromGame("A");
    const teamBIsOneAway = isOnePointFromGame("B");
    const teamAMatchPoint = isMatchPointFor("A");
    const teamBMatchPoint = isMatchPointFor("B");

    panelA.classList.toggle("game-point", teamAIsOneAway);
    panelA.classList.toggle("match-point", teamAMatchPoint);
    panelB.classList.toggle("game-point", teamBIsOneAway);
    panelB.classList.toggle("match-point", teamBMatchPoint);

    const officialMode = state.scoringStyle === "official";
    $("serveDotA").classList.toggle("active", officialMode && state.servingTeam === "A");
    $("serveDotB").classList.toggle("active", officialMode && state.servingTeam === "B");

    if(officialMode && state.mode === "doubles"){
      $("serverBadgeA").textContent = state.servingTeam === "A" ? ("Server " + state.serverNumber) : "";
      $("serverBadgeB").textContent = state.servingTeam === "B" ? ("Server " + state.serverNumber) : "";
    } else {
      $("serverBadgeA").textContent = "";
      $("serverBadgeB").textContent = "";
    }

    $("matchInfo").textContent =
      (state.bestOf === 1 ? "Single game" : "Best of " + state.bestOf) +
      " · to " + state.pointTarget + ", win by " + state.winBy +
      (state.scoringStyle === "simple" ? " · rally point" : "");

    $("court").classList.toggle("locked", state.matchOver);
    $("undoBtn").disabled = history.length === 0;
  }

  // ---------- TOAST ----------
  let toastTimer = null;
  function showToast(text, team){
    const toast = $("toast");
    $("toastText").textContent = text;
    $("toastSwatch").style.background = team === "A" ? "var(--team-a)" : "var(--team-b)";
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // ---------- WIN OVERLAY ----------
  function showWinOverlay(winner, a, b, isMatch){
    const label = state.names[winner];
    $("winEyebrow").textContent = isMatch ? "Match point" : ("Game " + (state.gamesWon.A + state.gamesWon.B));
    $("winTitle").textContent = label + (isMatch ? " wins the match" : " wins the game");
    $("winScoreLine").textContent = Math.max(a,b) + "–" + Math.min(a,b) +
      (isMatch ? "  ·  Games " + state.gamesWon.A + "–" + state.gamesWon.B : "");
    $("winOverlayBtn").textContent = isMatch ? "New match" : "Continue";
    $("winOverlay").classList.add("open");
    $("winOverlay").dataset.wasMatch = isMatch ? "1" : "0";
  }
  function closeWinOverlay(){ $("winOverlay").classList.remove("open"); }

  $("winOverlayBtn").addEventListener("click", () => {
    const wasMatch = $("winOverlay").dataset.wasMatch === "1";
    closeWinOverlay();
    if(wasMatch) newMatch(false);
    render();
  });

  // ---------- ACTIONS ----------
  function newMatch(confirmFirst){
    if(confirmFirst && !confirm("Start a new match? This resets scores and games won.")) return;
    history = [];
    state.scores.A = 0; state.scores.B = 0;
    state.gamesWon.A = 0; state.gamesWon.B = 0;
    state.servingTeam = "A"; state.serverNumber = 1; state.firstServerOfGame = true;
    state.matchOver = false; state.matchWinner = null;
    closeWinOverlay();
    render();
  }

  function resetGame(){
    if(!confirm("Reset the current game score to 0–0?")) return;
    pushHistory();
    state.scores.A = 0; state.scores.B = 0;
    render();
  }

  function swapServe(){
    pushHistory();
    state.servingTeam = other(state.servingTeam);
    state.serverNumber = 1;
    render();
  }

  function toggleFlip(){
    state.flipped = !state.flipped;
    document.querySelector(".panel-b").classList.toggle("flipped", state.flipped);
  }

  function toggleFullscreen(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(()=>{});
    } else {
      document.exitFullscreen().catch(()=>{});
    }
  }

  // ---------- EVENTS ----------
  $("tapA").addEventListener("click", () => pointWonBy("A"));
  $("tapB").addEventListener("click", () => pointWonBy("B"));
  $("minusA").addEventListener("click", (e) => { e.stopPropagation(); manualAdjust("A", -1); });
  $("minusB").addEventListener("click", (e) => { e.stopPropagation(); manualAdjust("B", -1); });

  $("nameA").addEventListener("input", (e) => { state.names.A = e.target.value || "Team A"; });
  $("nameB").addEventListener("input", (e) => { state.names.B = e.target.value || "Team B"; });
  $("nameA").addEventListener("click", (e) => e.stopPropagation());
  $("nameB").addEventListener("click", (e) => e.stopPropagation());

  $("undoBtn").addEventListener("click", undo);
  $("swapServeBtn").addEventListener("click", swapServe);
  $("resetGameBtn").addEventListener("click", resetGame);
  $("flipBtn").addEventListener("click", toggleFlip);
  $("fullscreenBtn").addEventListener("click", toggleFullscreen);

  $("settingsBtn").addEventListener("click", () => $("settingsOverlay").classList.add("open"));
  $("closeSettings").addEventListener("click", () => $("settingsOverlay").classList.remove("open"));
  $("settingsOverlay").addEventListener("click", (e) => { if(e.target.id === "settingsOverlay") $("settingsOverlay").classList.remove("open"); });

  $("newMatchBtn").addEventListener("click", () => newMatch(true));

  $("soundToggle").addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    $("soundToggle").classList.toggle("on", state.soundOn);
  });

  function wireSegmented(groupId, onSelect){
    const group = $(groupId);
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if(!btn) return;
      [...group.children].forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.value);
    });
  }
  wireSegmented("pointTargetGroup", (v) => { state.pointTarget = parseInt(v,10); render(); });
  wireSegmented("winByGroup", (v) => { state.winBy = parseInt(v,10); render(); });
  wireSegmented("bestOfGroup", (v) => { state.bestOf = parseInt(v,10); render(); });
  wireSegmented("modeGroup", (v) => { state.mode = v; render(); });
  wireSegmented("scoringStyleGroup", (v) => { state.scoringStyle = v; render(); });

  document.addEventListener("keydown", (e) => {
    if(document.activeElement && (document.activeElement.tagName === "INPUT")) return;
    if(e.key === "ArrowLeft"){ pointWonBy("A"); }
    else if(e.key === "ArrowRight"){ pointWonBy("B"); }
    else if(e.key.toLowerCase() === "z"){ undo(); }
    else if(e.key.toLowerCase() === "f"){ toggleFullscreen(); }
  });

  render();
})();
