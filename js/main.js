// main.js — 初期化、キー入力、HUD更新、画面切り替え

(function () {
  const canvas = document.getElementById("gameCanvas");
  const game = new Game(canvas);

  AudioFX.setVolume(loadVolume());

  const screens = {
    title: document.getElementById("titleScreen"),
    game: document.getElementById("gameScreen"),
    paused: document.getElementById("pauseScreen"),
    waveClear: document.getElementById("waveClearScreen"),
    gameOver: document.getElementById("gameOverScreen")
  };

  // HUD要素
  const waveEl = document.getElementById("waveDisplay");
  const scoreEl = document.getElementById("scoreDisplay");
  const highScoreEl = document.getElementById("highScoreDisplay");
  const livesEl = document.getElementById("livesDisplay");
  const energyFillEl = document.getElementById("energyFill");
  const energyTextEl = document.getElementById("energyText");
  const coreHpFillEl = document.getElementById("coreHpFill");
  const coreHpTextEl = document.getElementById("coreHpText");
  const enemiesLeftEl = document.getElementById("enemiesLeft");
  const comboEl = document.getElementById("comboText");
  const gravityStatusEl = document.getElementById("gravityStatus");
  const weaponButtons = Array.from(document.querySelectorAll(".weapon-btn"));

  const titleHighScoreEl = document.getElementById("titleHighScore");
  const waveClearBonusEl = document.getElementById("waveClearBonus");
  const waveClearScoreEl = document.getElementById("waveClearScore");
  const upgradeChoicesEl = document.getElementById("upgradeChoices");
  const gameOverScoreEl = document.getElementById("gameOverScore");
  const gameOverWaveEl = document.getElementById("gameOverWave");
  const gameOverHighScoreEl = document.getElementById("gameOverHighScore");
  const difficultySelect = document.getElementById("difficultySelect");
  const operatorNameInput = document.getElementById("operatorNameInput");
  const operatorNameDisplay = document.getElementById("operatorNameDisplay");

  function showScreen(state) {
    for (const key in screens) screens[key].classList.remove("active");
    switch (state) {
      case GameState.TITLE:
        screens.title.classList.add("active");
        titleHighScoreEl.textContent = game.highScore;
        break;
      case GameState.PLAYING:
        screens.game.classList.add("active");
        break;
      case GameState.PAUSED:
        screens.game.classList.add("active");
        screens.paused.classList.add("active");
        break;
      case GameState.WAVE_CLEAR:
        screens.game.classList.add("active");
        screens.waveClear.classList.add("active");
        waveClearBonusEl.textContent = game.lastWaveBonus;
        waveClearScoreEl.textContent = game.score;
        renderUpgradeChoices();
        break;
      case GameState.GAME_OVER:
        screens.game.classList.add("active");
        screens.gameOver.classList.add("active");
        gameOverScoreEl.textContent = game.score;
        gameOverWaveEl.textContent = game.wave;
        gameOverHighScoreEl.textContent = game.highScore;
        break;
      default:
        break;
    }
  }

  game.onStateChange = showScreen;

  function renderUpgradeChoices() {
    upgradeChoicesEl.innerHTML = "";
    game.upgradeChoices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "btn upgrade-btn";
      button.innerHTML =
        "<strong>" + choice.name + "</strong><span>" + choice.desc + "</span>";
      button.addEventListener("click", () => {
        AudioFX.unlock();
        game.chooseUpgrade(index);
      });
      upgradeChoicesEl.appendChild(button);
    });
  }

  // 毎フレームのHUD更新
  function syncHud() {
    waveEl.textContent = String(game.wave).padStart(2, "0");
    scoreEl.textContent = game.score;
    highScoreEl.textContent = game.highScore;
    livesEl.textContent = game.player.lives;

    const energyRatio = game.player.energy / game.player.energyMax;
    energyFillEl.style.width = Math.round(energyRatio * 100) + "%";
    energyFillEl.classList.toggle("low", energyRatio < 0.2);
    energyTextEl.textContent =
      Math.round(game.player.energy) + " / " + Math.round(game.player.energyMax);

    const coreRatio = game.coreHp / CORE_CONFIG.maxHp;
    coreHpFillEl.style.width = Math.round(coreRatio * 100) + "%";
    coreHpFillEl.classList.toggle("low", coreRatio < 0.3);
    coreHpTextEl.textContent = game.coreHp + " / " + CORE_CONFIG.maxHp;

    enemiesLeftEl.textContent = game.enemyManager.remainingCount;

    if (game.combo >= 2) {
      comboEl.textContent = game.combo + "連続 ×" + game.getComboMultiplier().toFixed(1);
    } else {
      comboEl.textContent = "—";
    }

    if (game.gravityCooldown > 0) {
      gravityStatusEl.textContent = "再充填中 " + game.gravityCooldown.toFixed(1) + "秒";
      gravityStatusEl.classList.add("cooldown");
    } else {
      gravityStatusEl.textContent = "展開可能 [E]";
      gravityStatusEl.classList.remove("cooldown");
    }

    for (const button of weaponButtons) {
      button.classList.toggle("active", button.dataset.weapon === game.player.weapon);
    }
  }

  // 初期表示
  titleHighScoreEl.textContent = game.highScore;
  difficultySelect.value = game.difficulty;
  operatorNameInput.value = localStorage.getItem(OPERATOR_NAME_KEY) || "";
  operatorNameDisplay.textContent = operatorNameInput.value.trim() || "GUEST";
  showScreen(GameState.TITLE);

  function startWithOperatorName() {
    const name = operatorNameInput.value.trim() || "GUEST";
    localStorage.setItem(OPERATOR_NAME_KEY, name);
    operatorNameDisplay.textContent = name;
    AudioFX.unlock();
    game.startNewGame();
  }

  // --- キーボード操作 ---
  const preventScrollKeys = new Set([
    "Space",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown"
  ]);

  window.addEventListener("keydown", (event) => {
    if (preventScrollKeys.has(event.code) && game.state !== GameState.TITLE) {
      event.preventDefault();
    }

    // 移動：WASD＋矢印キー
    if (event.code === "ArrowLeft" || event.code === "KeyA") game.input.left = true;
    if (event.code === "ArrowRight" || event.code === "KeyD") game.input.right = true;
    if (event.code === "ArrowUp" || event.code === "KeyW") game.input.up = true;
    if (event.code === "ArrowDown" || event.code === "KeyS") game.input.down = true;

    if (game.state === GameState.PLAYING) {
      // 通常攻撃（長押し可）
      if (event.code === "Space") game.input.fire = true;
      // ダッシュ
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") game.tryDash();
      // 武器切替
      if (event.code === "Digit1") game.setWeapon(Weapon.NORMAL);
      if (event.code === "Digit2") game.setWeapon(Weapon.SPREAD);
      if (event.code === "Digit3") game.setWeapon(Weapon.EMP);
      // 重力フィールド
      if (event.code === "KeyE") game.deployGravityField();
    }

    // 一時停止：Esc または P
    if (event.code === "Escape" || event.code === "KeyP") {
      if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
        game.togglePause();
      }
    }

    if (event.code === "Enter") {
      if (game.state === GameState.TITLE) startWithOperatorName();
    }

    if (event.code === "KeyR") {
      if (game.state === GameState.GAME_OVER || game.state === GameState.PAUSED) {
        game.restart();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") game.input.left = false;
    if (event.code === "ArrowRight" || event.code === "KeyD") game.input.right = false;
    if (event.code === "ArrowUp" || event.code === "KeyW") game.input.up = false;
    if (event.code === "ArrowDown" || event.code === "KeyS") game.input.down = false;
    if (event.code === "Space") game.input.fire = false;
  });

  // --- ボタン操作 ---
  document.getElementById("startButton").addEventListener("click", startWithOperatorName);
  document.getElementById("pauseButton").addEventListener("click", () => game.togglePause());
  document.getElementById("resumeButton").addEventListener("click", () => game.togglePause());
  document.getElementById("pauseToTitleButton").addEventListener("click", () => game.goToTitle());
  document.getElementById("retryButton").addEventListener("click", () => game.restart());
  document
    .getElementById("gameOverToTitleButton")
    .addEventListener("click", () => game.goToTitle());
  difficultySelect.addEventListener("change", (event) => {
    game.setDifficulty(event.target.value);
  });
  for (const button of weaponButtons) {
    button.addEventListener("click", () => {
      game.setWeapon(button.dataset.weapon);
    });
  }

  // --- ゲームループ ---
  let previousTime = 0;

  function gameLoop(timestamp) {
    const deltaTime = Math.min((timestamp - previousTime) / 1000, 0.05);
    previousTime = timestamp;

    game.update(deltaTime, timestamp);
    game.draw();
    syncHud();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame((timestamp) => {
    previousTime = timestamp;
    requestAnimationFrame(gameLoop);
  });
})();
