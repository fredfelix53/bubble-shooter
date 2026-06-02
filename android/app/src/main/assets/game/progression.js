/* ===== Bubble Shooter — Full Progression System ===== */
(function() {
  'use strict';
  const SAVE_KEY = 'bshooter_progress';
  const DAILY_KEY = 'bshooter_daily_bonus';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Cannon', icon: '🔫', maxLevel: 5, baseCost: 1000, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Pop Gun',         bonus: { shootSpeed: 1, scoreMult: 1.0 },    gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Water Blaster',   bonus: { shootSpeed: 1, scoreMult: 1.1 },    gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Air Cannon',      bonus: { shootSpeed: 2, scoreMult: 1.2 },    gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Bubble Blaster',  bonus: { shootSpeed: 2, scoreMult: 1.35 },   gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Neon Cannon',     bonus: { shootSpeed: 3, scoreMult: 1.5 },    gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '⚡ Void Cannon',  bonus: { shootSpeed: 4, scoreMult: 2.0 },    gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Goggles', icon: '🥽', maxLevel: 5, baseCost: 800, costMultiplier: 2, gemCost: 50,
      levels: [
        { level: 0, name: 'Bare Eyes',       bonus: { aimLine: 0, popBonus: 0 },          gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Sunglasses',       bonus: { aimLine: 1, popBonus: 5 },          gemReq: 50,  coinsReq: 800 },
        { level: 2, name: 'Scope Goggles',   bonus: { aimLine: 1, popBonus: 15 },         gemReq: 80,  coinsReq: 1600 },
        { level: 3, name: 'X-Ray Specs',     bonus: { aimLine: 2, popBonus: 30 },         gemReq: 120, coinsReq: 3200 },
        { level: 4, name: 'Thermal Vision',  bonus: { aimLine: 2, popBonus: 50 },         gemReq: 200, coinsReq: 6400 },
        { level: 5, name: '💎 Omni Goggles',bonus: { aimLine: 3, popBonus: 100 },         gemReq: 500, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Cape', icon: '🧣', maxLevel: 5, baseCost: 600, costMultiplier: 2, gemCost: 40,
      levels: [
        { level: 0, name: 'Rag Cloak',       bonus: { chainBonus: 0, extraBubble: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Travel Cape',     bonus: { chainBonus: 5, extraBubble: 0 },   gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Wind Cloak',      bonus: { chainBonus: 10, extraBubble: 0 },  gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Phantom Cape',    bonus: { chainBonus: 15, extraBubble: 1 },  gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Crystal Cloak',   bonus: { chainBonus: 25, extraBubble: 1 },  gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Cape', bonus: { chainBonus: 40, extraBubble: 2 },  gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Cannon',   desc: 'Dark matter cannon skin',          price: 4.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_cosmic',     name: 'Cosmic Blaster',desc: 'Galaxy-themed bubbles',             price: 6.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_flame',      name: 'Inferno Cannon',desc: 'Flame-effect bubble trail',         price: 8.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',     desc: '7 days: 2x coins + 50 gems/day',  price: 4.99,  gemPrice: 0,    type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',     desc: '30 days: 3x coins + 100 gems/day',price: 12.99, gemPrice: 0,    type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 3 bombs + 3 rainbows',          price: 2.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Power Pack',  desc: '500 gems + 10 bombs + space theme',        price: 7.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + all themes + legendary cannon',price: 19.99, gemPrice: 0,    type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',         gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack',      gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',         gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',          gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',          gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Deep Ocean',  price: 0,    desc: 'Underwater bubble world',        colors: { bg: '#001520', accent: '#0a2a40' } },
      { id: 'space',     name: 'Outer Space',  price: 500,  desc: 'Starry cosmic bubbles',          colors: { bg: '#0a0015', accent: '#1a002a' } },
      { id: 'candy',     name: 'Candy Land',   price: 800,  desc: 'Sweet candy bubbles',            colors: { bg: '#2a0a1a', accent: '#3a1525' } },
      { id: 'magic',     name: 'Magic Realm',  price: 1000, desc: 'Magical bubble dimension',       colors: { bg: '#0a0a2a', accent: '#1a1a4a' } },
      { id: 'ocean',     name: 'Tropical',     price: 1500, desc: 'Tropical ocean paradise',        colors: { bg: '#002a20', accent: '#0a3a30' } },
      { id: 'neon',      name: 'Neon World',   price: 2000, desc: 'Bright neon bubbles',            colors: { bg: '#1a0030', accent: '#2a0050' } },
      { id: 'sunset',    name: 'Sunset Beach', price: 3000, desc: 'Warm sunset over the ocean',     colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'royal',     name: 'Royal Court',  price: 5000, desc: 'Gold & royal purple bubbles',    colors: { bg: '#1a0030', accent: '#3a1050' } },
    ],
    pieceStyles: [
      { id: 'classic',    name: 'Classic Bubbles', price: 0,    desc: 'Original bubble style',        borderRadius: 0, glow: false },
      { id: 'glossy',     name: 'Glossy Bubbles',  price: 600,  desc: 'Shiny glossy bubbles',         borderRadius: 8, glow: false },
      { id: 'glow',       name: 'Glow Bubbles',    price: 1200, desc: 'Bubbles with glow',           borderRadius: 4, glow: true },
      { id: 'glass',      name: 'Glass Orbs',      price: 2000, desc: 'Semi-transparent glass',       borderRadius: 5, glow: true },
      { id: 'neon_edge',  name: 'Neon Bubbles',    price: 3500, desc: 'Neon-outlined bubbles',        borderRadius: 3, glow: true },
    ],
    powerupPacks: [
      { id: 'starter',   name: 'Starter Pack',   price: 200,  items: { bomb: 3, rainbow: 3 },            desc: '3 of each' },
      { id: 'bomb',      name: 'Bomb Pack',      price: 300,  items: { bomb: 8 },                        desc: '8 bombs' },
      { id: 'rainbow',   name: 'Rainbow Pack',   price: 400,  items: { rainbow: 8 },                     desc: '8 rainbows' },
      { id: 'mega',      name: 'Mega Bundle',    price: 1000, items: { bomb: 10, rainbow: 10 },           desc: '10 of each' },
    ],
    boosters: [
      { id: 'score_x2',   name: 'Score Booster',   price: 500,  desc: '2x score for next game',       effect: 'scoreMultiplier:2' },
      { id: 'bubble_rain',name: 'Bubble Rain',     price: 800,  desc: 'Floating bubbles sink',         effect: 'sinkRows:1' },
      { id: 'wide_cannon',name: 'Wide Cannon',     price: 600,  desc: 'Wider aiming angle',            effect: 'wideAim:1' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_play',      name: 'First Pop',         desc: 'Pop your first bubble',                reward: { coins: 50, gems: 0 },    icon: '🎮',  check: p => p.totalPlays >= 1 },
    { id: 'pop_10',          name: 'Bubble Popper',     desc: 'Pop 10 bubbles',                       reward: { coins: 100, gems: 0 },   icon: '🫧',  check: p => p.totalPops >= 10 },
    { id: 'pop_100',         name: 'Bubble Blaster',    desc: 'Pop 100 bubbles',                      reward: { coins: 250, gems: 5 },   icon: '💯',  check: p => p.totalPops >= 100 },
    { id: 'pop_500',         name: 'Serious Popper',    desc: 'Pop 500 bubbles',                      reward: { coins: 500, gems: 10 },  icon: '🏆',  check: p => p.totalPops >= 500 },
    { id: 'pop_1000',        name: 'Bubble Legend',     desc: 'Pop 1000 bubbles',                     reward: { coins: 1000, gems: 15 }, icon: '👑',  check: p => p.totalPops >= 1000 },
    { id: 'pop_5000',        name: 'Ultimate Popper',   desc: 'Pop 5000 bubbles',                     reward: { coins: 2000, gems: 30 }, icon: '🌟',  check: p => p.totalPops >= 5000 },
    { id: 'score_100',       name: 'Century',           desc: 'Score 100 in one game',                reward: { coins: 100, gems: 0 },   icon: '💯',  check: p => p.bestScore >= 100 },
    { id: 'score_500',       name: 'High Roller',       desc: 'Score 500 in one game',                reward: { coins: 250, gems: 5 },   icon: '🎯',  check: p => p.bestScore >= 500 },
    { id: 'score_1000',      name: 'Four Digits',       desc: 'Score 1000 in one game',               reward: { coins: 500, gems: 10 },  icon: '🏆',  check: p => p.bestScore >= 1000 },
    { id: 'score_5000',      name: 'Grandmaster',       desc: 'Score 5000 in one game',               reward: { coins: 2000, gems: 25 }, icon: '🌟',  check: p => p.bestScore >= 5000 },
    { id: 'chain_3',         name: 'Chain Reaction',    desc: 'Pop 3+ bubbles in chain',             reward: { coins: 100, gems: 0 },   icon: '⛓️',  check: p => p.bestChain >= 3 },
    { id: 'chain_5',         name: 'Bubble Storm',      desc: 'Pop 5+ bubbles in chain',             reward: { coins: 200, gems: 5 },   icon: '💥',  check: p => p.bestChain >= 5 },
    { id: 'chain_10',        name: 'Massive Chain',     desc: 'Pop 10+ bubbles in chain',            reward: { coins: 500, gems: 10 },  icon: '🌀',  check: p => p.bestChain >= 10 },
    { id: 'chain_20',        name: 'Chain Legend',      desc: 'Pop 20+ bubbles in chain',            reward: { coins: 1500, gems: 25 }, icon: '⚡',  check: p => p.bestChain >= 20 },
    { id: 'clear_level',     name: 'First Clear',       desc: 'Clear a level',                       reward: { coins: 100, gems: 0 },   icon: '1️⃣',  check: p => p.levelsCompleted >= 1 },
    { id: 'clear_10',        name: 'Level Runner',      desc: 'Clear 10 levels',                      reward: { coins: 300, gems: 5 },   icon: '🔟',  check: p => p.levelsCompleted >= 10 },
    { id: 'clear_25',        name: 'Pro Popper',        desc: 'Clear 25 levels',                      reward: { coins: 800, gems: 15 },  icon: '🏅',  check: p => p.levelsCompleted >= 25 },
    { id: 'clear_50',        name: 'Bubble Master',     desc: 'Clear 50 levels',                      reward: { coins: 2000, gems: 30 }, icon: '👑',  check: p => p.levelsCompleted >= 50 },
    { id: 'streak_3',        name: '3-Day Streak',      desc: 'Play 3 days in a row',                reward: { coins: 200, gems: 0 },   icon: '🔥',  check: p => p.bestStreak >= 3 },
    { id: 'streak_7',        name: 'Week Warrior',      desc: 'Play 7 days in a row',                reward: { coins: 500, gems: 10 },  icon: '📅',  check: p => p.bestStreak >= 7 },
    { id: 'streak_14',       name: 'Fortnight Champion',desc: 'Play 14 days in a row',               reward: { coins: 1500, gems: 25 }, icon: '⏰',  check: p => p.bestStreak >= 14 },
    { id: 'streak_30',       name: 'Month Master',      desc: 'Play 30 days in a row',               reward: { coins: 5000, gems: 100 },icon: '👑',  check: p => p.bestStreak >= 30 },
    { id: 'cannon_1',        name: 'Cannon Up',         desc: 'Upgrade cannon to level 1',           reward: { coins: 200, gems: 0 },   icon: '🔫',  check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'cannon_3',        name: 'Heavy Cannon',      desc: 'Upgrade cannon to level 3',           reward: { coins: 500, gems: 10 },  icon: '⚒️',  check: p => (p.upgrades?.weapon || 0) >= 3 },
    { id: 'cannon_5',        name: 'Cannon Legend',     desc: 'Reach max cannon level',              reward: { coins: 2000, gems: 50 }, icon: '🗡️',  check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'goggles_1',       name: 'Goggle Up',         desc: 'Upgrade goggles to level 1',          reward: { coins: 200, gems: 0 },   icon: '🥽',  check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'goggles_3',       name: 'See Clearly',       desc: 'Upgrade goggles to level 3',          reward: { coins: 500, gems: 10 },  icon: '🔭',  check: p => (p.upgrades?.case || 0) >= 3 },
    { id: 'goggles_5',       name: 'All Seeing',        desc: 'Reach max goggles level',             reward: { coins: 2000, gems: 50 }, icon: '💎',  check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'cape_1',          name: 'Cape Up',           desc: 'Upgrade cape to level 1',             reward: { coins: 200, gems: 0 },   icon: '🧣',  check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'cape_3',          name: 'Elegant Cape',      desc: 'Upgrade cape to level 3',             reward: { coins: 500, gems: 10 },  icon: '👗',  check: p => (p.upgrades?.outfit || 0) >= 3 },
    { id: 'cape_5',          name: 'Cape Legend',       desc: 'Reach max cape level',                reward: { coins: 2000, gems: 50 }, icon: '👘',  check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',        name: 'Gem Collector',     desc: 'Earn 100 total gems',                 reward: { coins: 500, gems: 20 },  icon: '💎',  check: p => p.totalGems >= 100 },
    { id: 'gems_500',        name: 'Gem Hoarder',       desc: 'Earn 500 total gems',                 reward: { coins: 1000, gems: 50 }, icon: '💠',  check: p => p.totalGems >= 500 },
    { id: 'all_achievements',name: 'Completionist',     desc: 'Unlock all other achievements',       reward: { coins: 10000, gems: 200 }, icon: '🏅', check: p => false },
  ];

  function defaultState() {
    return {
      coins: 100, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestScore: 0, bestChain: 0, totalPops: 0, levelsCompleted: 0, totalPlays: 0, bestStreak: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'], ownedPieceStyles: ['classic'],
      activeTheme: 'default', activePieceStyle: 'classic',
      powerups: { bomb: 3, rainbow: 3 },
      activeBoosters: {}, inventory: {}, achievements: {}, lastSaveDate: null,
      adFree: false, subscriptions: {},
    };
  }

  let state = null;
  function save() { state.lastSaveDate = new Date().toISOString(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }
  function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { state = { ...defaultState(), ...JSON.parse(raw) }; if (!state.upgrades) state.upgrades = { weapon: 0, case: 0, outfit: 0 }; if (!state.gems && state.gems !== 0) state.gems = 0; if (!state.totalGems) state.totalGems = 0; if (!state.inventory) state.inventory = {}; if (!state.subscriptions) state.subscriptions = {}; if (!state.adFree) state.adFree = false; } } catch(e) {} reset(); return false; }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl - 1)); }
  function addXp(amount) { if (!state) return; state.xp += amount; let leveled = false; while (state.xp >= xpForLevel(state.level)) { state.xp -= xpForLevel(state.level); state.level++; leveled = true; } save(); return leveled; }
  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }
  function getUpgradeCost(category, currentLevel) { const tier = UPGRADE_TIERS[category]; if (!tier) return null; const nextLevel = currentLevel + 1; const levelData = tier.levels.find(l => l.level === nextLevel); if (!levelData) return null; return { coins: levelData.coinsReq, gems: levelData.gemReq }; }
  function upgradeItem(category, useGems = false) { if (!state) return { success: false, reason: 'no_state' }; const tier = UPGRADE_TIERS[category]; if (!tier) return { success: false, reason: 'invalid_category' }; const current = state.upgrades[category] || 0; if (current >= tier.maxLevel) return { success: false, reason: 'max_level' }; const costs = getUpgradeCost(category, current); if (!costs) return { success: false, reason: 'no_level_data' }; if (useGems) { if (state.gems < costs.gems) return { success: false, reason: 'not_enough_gems' }; spendGems(costs.gems); } else { if (state.coins < costs.coins) return { success: false, reason: 'not_enough_coins' }; spendCoins(costs.coins); } state.upgrades[category]++; save(); return { success: true, newLevel: state.upgrades[category] }; }
  function getActiveBonuses() { if (!state) return { shootSpeed: 1, scoreMult: 1, aimLine: 0, popBonus: 0, chainBonus: 0, extraBubble: 0 }; const b = { shootSpeed: 1, scoreMult: 1, aimLine: 0, popBonus: 0, chainBonus: 0, extraBubble: 0 }; const wL = state.upgrades.weapon || 0; const wD = UPGRADE_TIERS.weapon.levels[wL]; if (wD) { b.shootSpeed = wD.bonus.shootSpeed; b.scoreMult += (wD.bonus.scoreMult - 1); } const cL = state.upgrades.case || 0; const cD = UPGRADE_TIERS.case.levels[cL]; if (cD) { b.aimLine = cD.bonus.aimLine; b.popBonus = cD.bonus.popBonus; } const oL = state.upgrades.outfit || 0; const oD = UPGRADE_TIERS.outfit.levels[oL]; if (oD) { b.chainBonus = oD.bonus.chainBonus; b.extraBubble = oD.bonus.extraBubble; } return b; }
  function ownsPremiumItem(itemId) { return state && state.inventory && state.inventory[itemId] === true; }
  function purchasePremiumItem(itemId) { if (!state) return false; state.inventory[itemId] = true;     if (itemId === 'remove_ads') {
      state.adFree = true;
      if (window.AdsManager) AdsManager.onAdsRemoved();
    } const bundleGems = { bundle_starter: 200, bundle_mega: 500, bundle_ultimate: 2000 }; if (bundleGems[itemId]) addGems(bundleGems[itemId]); save(); return true; }
  function checkAchievements() { if (!state) return []; const unlocked = []; for (const ach of ACHIEVEMENTS) { if (state.achievements[ach.id]) continue; if (ach.check(state)) { state.achievements[ach.id] = true; addCoins(ach.reward.coins); if (ach.reward.gems) addGems(ach.reward.gems); unlocked.push(ach); } } if (unlocked.length > 0) save(); return unlocked; }
  function claimDailyBonus() { if (!state) return null; const now = new Date(); const today = now.toDateString(); try { const lastClaim = localStorage.getItem(DAILY_KEY); if (lastClaim === today) return null; const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); const yStr = yesterday.toDateString(); let streak = 0; if (lastClaim === yStr) streak = (state.dailyStreak || 0) + 1; else streak = 1; state.dailyStreak = streak; if (streak > state.bestStreak) state.bestStreak = streak; const coins = Math.min(100 + (streak - 1) * 20, 1000); const gems = streak >= 7 ? 5 : streak >= 3 ? 2 : 0; addCoins(coins); if (gems) addGems(gems); localStorage.setItem(DAILY_KEY, today); save(); return { streak, coins, gems }; } catch(e) { return null; } }
  function endOfGame(result) { if (!state) return; state.totalPlays++; if (result.score > state.bestScore) state.bestScore = result.score; if (result.bestChain > state.bestChain) state.bestChain = result.bestChain; if (result.pops) state.totalPops += result.pops; if (result.levelCompleted) state.levelsCompleted++; const xpGain = Math.floor(result.score / 10) + (result.pops || 0) * 2 + 20; addXp(xpGain); const coinGain = Math.floor(result.score / 20) + (result.pops || 0) + 5; addCoins(coinGain); save(); }
  function getState() { return state; }
  function getUpgradeTiers() { return UPGRADE_TIERS; }
  function getPremiumItems() { return PREMIUM_ITEMS; }
  function getGemPacks() { return GEM_PACKS; }
  function getCatalog() { return CATALOG; }
  function getAchievements() { return ACHIEVEMENTS; }
  function getCoinBalance() { return state ? state.coins : 0; }
  function getGemBalance() { return state ? state.gems : 0; }

  window.ProgressionSystem = {
    load, save, reset, addCoins, spendCoins, getCoinBalance, addGems, spendGems, getGemBalance,
    addXp, xpForLevel, upgradeItem, getUpgradeCost, getActiveBonuses, getUpgradeTiers, UPGRADE_TIERS,
    getPremiumItems, PREMIUM_ITEMS, getGemPacks, GEM_PACKS, ownsPremiumItem, purchasePremiumItem,
    getCatalog, CATALOG, getAchievements, ACHIEVEMENTS, checkAchievements, endOfGame, claimDailyBonus,
    getState, defaultState,
  };
})();
