// i18n.js — 星のきろく 日本語・英語表示の切り替え

// Copyright (c) 2026 Shinsuke Oouchi. See ../LICENSE.md.

const I18n = (function () {
  const STORAGE_KEY = "hoshiNoKirokuLanguage";
  const DEFAULT_LANGUAGE = "ja";
  const SUPPORTED_LANGUAGES = new Set(["ja", "en"]);

  const translations = {
    ja: {
      "page.title": "星のきろく — 軌道防衛型アクションシューティング",
      "title.name": "星のきろく",
      "title.copy":
        "未知のクリスタルが軌道ステーションのコアと共鳴して、採掘ドローン群を呼び寄せている<br />戦闘機を操作して、信号解析の完了までコアを守り抜け",
      "title.highScore": "最高スコア",
      "title.operatorName": "オペレーター名",
      "title.operatorPlaceholder": "例：NOVA-07",
      "title.difficulty": "レベル",
      "difficulty.easy": "イージー",
      "difficulty.normal": "ノーマル",
      "difficulty.hard": "ハード",
      "action.start": "スタート",
      "action.pause": "一時停止",
      "action.resume": "再開",
      "action.toTitle": "タイトルへ戻る",
      "action.retry": "もう一度",
      "instructions.title": "操作方法",
      "instructions.move": "WASD／矢印キー：移動（上下左右）",
      "instructions.fire": "Space：攻撃（長押し可）",
      "instructions.dash": "Shift：ダッシュ（エネルギー15消費）",
      "instructions.weapon": "1／2／3：武器切替（通常弾・拡散弾・EMP）",
      "instructions.gravity": "E：重力フィールド展開（敵弾の軌道を曲げる）",
      "instructions.pause": "Esc／P：一時停止・再開",
      "instructions.startRetry": "Enter：任務開始　R：やり直し",
      "story.heading": "コアから出ているのは、攻撃命令ではなく帰還信号だった",
      "story.body1":
        "西暦2187年<br />地球の奥深くで採掘で発見されたクリスタルが、軌道ステーション 星のきろく のエネルギーコアと共鳴した",
      "story.body2":
        "周辺の採掘ドローンは信号を古代装置への帰還命令として受信し、軌道ステーションへの突入を始める<br />防衛任務の目的は破壊ではない。クリスタル解析完了までの時間を稼ぎ、未知文明への扉を開くことだ",
      "story.objective1": "・軌道ステーションを守れ",
      "story.objective2": "・信号解析時間を稼げ",
      "story.objective3": "・古代のクリスタルを起動しよう",
      "intro.title": "イントロ",
      "intro.copy":
        "クリスタルに呼び寄せられるドローンと軌道ステーションの防衛",
      "intro.unsupported": "お使いのブラウザは動画再生に対応していません。",
      "hud.lives": "残機",
      "hud.bgm": "BGM",
      "hud.volume": "効果音",
      "pause.heading": "PAUSE（一時停止中）",
      "waveClear.coreBonus": "コア残存ボーナス：",
      "waveClear.currentScore": "現在の得点：",
      "waveClear.caption": "強化を1つ選択して次のウェーブへ",
      "gameOver.wave": "到達ウェーブ：",
      "gameOver.finalScore": "最終得点：",
      "gameOver.highScore": "ハイスコア：",
      "mission.title": "ミッション情報",
      "mission.operator": "オペレーター：",
      "mission.coreHp": "防衛コア耐久",
      "mission.enemiesLeft": "残りの敵の数",
      "mission.enemyUnit": "機",
      "mission.combo": "コンボ",
      "mission.gravity": "重力フィールド",
      "mission.enemyTypes": "敵の種類",
      "enemy.scout": "スカウト：曲線移動・射撃",
      "enemy.shielder": "シールド機：高耐久・低速",
      "enemy.driller": "ドリル機：コアへ直進",
      "enemy.splitter": "分裂機：撃破時に分裂",
      "weapon.label": "武器切替",
      "weapon.normal": "[1] 通常弾",
      "weapon.spread": "[2] 拡散弾",
      "weapon.emp": "[3] EMP",
      "weapon.cost2": "消費2",
      "weapon.cost8": "消費8",
      "weapon.cost30": "消費30",
      "weapon.hint": "[Shift] ダッシュ 消費15　[E] 重力フィールド",
      "status.combo": "{count}連続 ×{multiplier}",
      "status.gravityCooldown": "再充填中 {seconds}秒",
      "status.gravityReady": "展開可能 [E]",
      "upgrades.bulletSpeed.name": "弾速強化",
      "upgrades.bulletSpeed.desc": "通常弾・拡散弾の速度 +20%",
      "upgrades.energyMax.name": "エネルギー拡張",
      "upgrades.energyMax.desc": "エネルギー最大値 +25",
      "upgrades.energyRegen.name": "回復効率強化",
      "upgrades.energyRegen.desc": "エネルギー回復速度 +30%",
      "upgrades.dashCost.name": "推進系最適化",
      "upgrades.dashCost.desc": "ダッシュ消費 -5（最低5）",
      "upgrades.gravityCooldown.name": "フィールド再充填",
      "upgrades.gravityCooldown.desc":
        "重力フィールド再使用時間 -2秒（最低4秒）",
      "upgrades.fireRate.name": "連射制御強化",
      "upgrades.fireRate.desc": "発射間隔 -15%",
    },
    en: {
      "page.title": "Hoshi no Kiroku — Orbital Defense Action Shooter",
      "title.name": "Hoshi no Kiroku",
      "title.copy":
        "An unknown crystal resonates with the orbital station's core, drawing mining drones toward it.<br />Pilot the fighter and defend the core until signal analysis is complete.",
      "title.highScore": "HIGH SCORE",
      "title.operatorName": "OPERATOR NAME",
      "title.operatorPlaceholder": "Example: NOVA-07",
      "title.difficulty": "DIFFICULTY",
      "difficulty.easy": "EASY",
      "difficulty.normal": "NORMAL",
      "difficulty.hard": "HARD",
      "action.start": "START",
      "action.pause": "PAUSE",
      "action.resume": "RESUME",
      "action.toTitle": "BACK TO TITLE",
      "action.retry": "TRY AGAIN",
      "instructions.title": "CONTROLS",
      "instructions.move": "WASD / Arrow Keys: Move in all directions",
      "instructions.fire": "Space: Fire (hold to repeat)",
      "instructions.dash": "Shift: Dash (costs 15 energy)",
      "instructions.weapon":
        "1 / 2 / 3: Switch weapons (Normal / Spread / EMP)",
      "instructions.gravity": "E: Deploy gravity field (deflects enemy fire)",
      "instructions.pause": "Esc / P: Pause or resume",
      "instructions.startRetry": "Enter: Start mission　R: Retry",
      "story.heading":
        "The core was sending not an attack order, but a return signal",
      "story.body1":
        "Year 2187<br />A crystal discovered deep beneath Earth resonated with the energy core of the orbital station Hoshi no Kiroku.",
      "story.body2":
        "Nearby mining drones interpreted the signal as a command to return to an ancient device and began crashing toward the station.<br />The defense mission is not about destruction. Buy time until crystal analysis is complete and open the door to an unknown civilization.",
      "story.objective1": "DEFEND THE ORBITAL STATION",
      "story.objective2": "BUY TIME FOR SIGNAL ANALYSIS",
      "story.objective3": "ACTIVATE THE ANCIENT CRYSTAL",
      "intro.title": "INTRO",
      "intro.copy":
        "Defend the orbital station from drones drawn in by the crystal",
      "intro.unsupported": "Your browser does not support video playback.",
      "hud.lives": "LIVES",
      "hud.bgm": "BGM",
      "hud.volume": "SFX",
      "pause.heading": "PAUSED",
      "waveClear.coreBonus": "CORE HP BONUS: ",
      "waveClear.currentScore": "CURRENT SCORE: ",
      "waveClear.caption": "Choose one upgrade to begin the next wave",
      "gameOver.wave": "WAVE REACHED: ",
      "gameOver.finalScore": "FINAL SCORE: ",
      "gameOver.highScore": "HIGH SCORE: ",
      "mission.title": "MISSION STATUS",
      "mission.operator": "OPERATOR: ",
      "mission.coreHp": "DEFENSE CORE HP",
      "mission.enemiesLeft": "ENEMIES REMAINING",
      "mission.enemyUnit": "units",
      "mission.combo": "COMBO",
      "mission.gravity": "GRAVITY FIELD",
      "mission.enemyTypes": "ENEMY TYPES",
      "enemy.scout": "Scout: Curved movement and fire",
      "enemy.shielder": "Shielder: Durable and slow",
      "enemy.driller": "Driller: Rushes the core",
      "enemy.splitter": "Splitter: Splits when destroyed",
      "weapon.label": "WEAPONS",
      "weapon.normal": "[1] NORMAL",
      "weapon.spread": "[2] SPREAD",
      "weapon.emp": "[3] EMP",
      "weapon.cost2": "COST 2",
      "weapon.cost8": "COST 8",
      "weapon.cost30": "COST 30",
      "weapon.hint": "[Shift] DASH COST 15　[E] GRAVITY FIELD",
      "status.combo": "{count} HITS ×{multiplier}",
      "status.gravityCooldown": "RECHARGING {seconds}s",
      "status.gravityReady": "READY [E]",
      "upgrades.bulletSpeed.name": "HIGH-VELOCITY ROUNDS",
      "upgrades.bulletSpeed.desc": "Normal and spread shot speed +20%",
      "upgrades.energyMax.name": "ENERGY EXPANSION",
      "upgrades.energyMax.desc": "Maximum energy +25",
      "upgrades.energyRegen.name": "RECOVERY BOOST",
      "upgrades.energyRegen.desc": "Energy regeneration +30%",
      "upgrades.dashCost.name": "THRUSTER OPTIMIZATION",
      "upgrades.dashCost.desc": "Dash cost -5 (minimum 5)",
      "upgrades.gravityCooldown.name": "FIELD RECHARGE",
      "upgrades.gravityCooldown.desc":
        "Gravity field cooldown -2s (minimum 4s)",
      "upgrades.fireRate.name": "FIRE CONTROL BOOST",
      "upgrades.fireRate.desc": "Fire interval -15%",
    },
  };

  function loadLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LANGUAGES.has(saved)) return saved;
    } catch (_error) {
      // 保存領域が使えない場合は日本語を使用する
    }
    return DEFAULT_LANGUAGE;
  }

  let currentLanguage = loadLanguage();

  function interpolate(text, params) {
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match,
    );
  }

  function t(key, params) {
    const selected =
      translations[currentLanguage] || translations[DEFAULT_LANGUAGE];
    const text = selected[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
    return interpolate(text, params);
  }

  function applyDocument() {
    if (typeof document === "undefined") return;

    document.documentElement.lang = currentLanguage;
    document.title = t("page.title");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      element.innerHTML = t(element.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      const isActive = button.dataset.language === currentLanguage;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.has(language)) return false;
    const changed = currentLanguage !== language;
    currentLanguage = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (_error) {
      // 保存できなくても現在のページでは切り替えを続行する
    }
    applyDocument();
    if (changed && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hoshiLanguageChange", { detail: { language } }),
      );
    }
    return true;
  }

  function initialize() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("[data-language]").forEach((button) => {
      if (button.dataset.languageReady === "true") return;
      button.dataset.languageReady = "true";
      button.addEventListener("click", () =>
        setLanguage(button.dataset.language),
      );
    });
    applyDocument();
  }

  return {
    get language() {
      return currentLanguage;
    },
    initialize,
    setLanguage,
    t,
  };
})();
