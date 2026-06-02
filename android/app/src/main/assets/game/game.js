function showToast(msg) {
  var el = document.getElementById('system-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'system-toast';
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:12px 24px;border-radius:14px;font-size:15px;z-index:9999;text-align:center;opacity:0;transition:opacity 0.3s;pointer-events:none;max-width:80%;border:1px solid rgba(255,255,255,0.1);';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(function() { el.style.opacity = '0'; }, 3000);
}

/* ===== Bubble Shooter — Complete Game Engine =====
   Aim-and-shoot bubble matching arcade
*/
const CANVAS_W = 400;
const CANVAS_H = 520;
const BUBBLE_R = 18;
const GRID_COLS = 11;
const GRID_TOP = 40;
const GRID_LEFT = 20;
const ROW_H = 31;
const SPEED = 8;

const COLORS = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#1dd1a1'];

// ─── Canvas, State ───────────────────────────────
let canvas, ctx;
let grid = {};
let currentBubble = null;
let nextColor = null;
let aimAngle = -Math.PI / 2;
let aiming = false;
let score = 0;
let level = 1;
let totalPops = 0;
let chainCount = 0;
let bestChain = 0;
let gameActive = false;
let gameOver = false;
let gameStarted = false;
let particles = null;

// ─── Grid Geometry ────────────────────────────────
function getCellCenter(row, col) {
  const offset = row % 2 === 0 ? 0 : BUBBLE_R + 2;
  return {
    x: GRID_LEFT + col * (BUBBLE_R * 2 + 2) + BUBBLE_R + offset,
    y: GRID_TOP + row * ROW_H + BUBBLE_R
  };
}

function getCell(row, col) {
  return grid[`${row},${col}`];
}

function setCell(row, col, val) {
  if (val === null) delete grid[`${row},${col}`];
  else grid[`${row},${col}`] = val;
}

function coordsToGrid(x, y) {
  let bestDist = Infinity, best = null;
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const c = getCellCenter(row, col);
      const dist = Math.hypot(x - c.x, y - c.y);
      if (dist < BUBBLE_R + 8 && dist < bestDist) {
        bestDist = dist;
        best = { row, col };
      }
    }
  }
  return best;
}

// ─── Initialize Grid ──────────────────────────────
function initGrid() {
  grid = {};
  const rows = 4 + Math.min(level - 1, 5);
  for (let row = 0; row < rows; row++) {
    const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
    for (let col = 0; col < cols; col++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      setCell(row, col, { color, row, col });
    }
  }
}

// ─── Bubble Creation ──────────────────────────────
function createBubble(x, y, color) {
  return { x, y, color, vx: 0, vy: 0, moving: false, row: -1, col: -1 };
}

function spawnBubble() {
  const color = nextColor || COLORS[Math.floor(Math.random() * COLORS.length)];
  nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const bx = CANVAS_W / 2;
  const by = CANVAS_H - 40;
  currentBubble = createBubble(bx, by, color);
  aimAngle = -Math.PI / 2;

  // Update next bubble preview
  const neb = document.getElementById('next-bubble');
  if (neb) {
    neb.style.background = nextColor;
    neb.style.boxShadow = `0 0 10px ${nextColor}80`;
    neb.textContent = '';
  }
}

// ─── Shooting ─────────────────────────────────────
function shoot() {
  if (!gameActive || gameOver || !currentBubble || currentBubble.moving) return;
  const vx = Math.cos(aimAngle) * SPEED;
  const vy = Math.sin(aimAngle) * SPEED;
  currentBubble.moving = true;
  currentBubble.vx = vx;
  currentBubble.vy = vy;
  aiming = false;
}

// ─── Collision & Grid Snap ────────────────────────
function snapBubble(bubble) {
  if (!bubble) return;
  const pos = coordsToGrid(bubble.x, bubble.y);
  if (pos) {
    setCell(pos.row, pos.col, { color: bubble.color, row: pos.row, col: pos.col });
    currentBubble = null;
    chainCount = 0;
    // Check matches
    const matches = findMatches();
    if (matches.length >= 3) {
      popBubbles(matches);
      // Check floating
      const floating = findFloating();
      if (floating.length > 0) popBubbles(floating);
      levelUp();
    } else {
      checkGameOver();
    }
    setTimeout(() => { if (gameActive) spawnBubble(); }, 300);
  } else {
    // Snap to nearest valid position
    let bestDist = Infinity, bestRow = -1, bestCol = -1;
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (getCell(row, col)) continue;
        const offset = row % 2 === 0 ? 0 : BUBBLE_R + 2;
        const cx = GRID_LEFT + col * (BUBBLE_R * 2 + 2) + BUBBLE_R + offset;
        const cy = GRID_TOP + row * ROW_H + BUBBLE_R;
        const dist = Math.hypot(bubble.x - cx, bubble.y - cy);
        if (dist < bestDist) { bestDist = dist; bestRow = row; bestCol = col; }
      }
    }
    if (bestRow >= 0) {
      setCell(bestRow, bestCol, { color: bubble.color, row: bestRow, col: bestCol });
      currentBubble = null;
      const matches = findMatches();
      if (matches.length >= 3) {
        popBubbles(matches);
        const floating = findFloating();
        if (floating.length > 0) popBubbles(floating);
        levelUp();
      } else {
        checkGameOver();
      }
      setTimeout(() => { if (gameActive) spawnBubble(); }, 300);
    }
  }
}

function findMatches() {
  const visited = new Set();
  const matches = [];

  // For each cell, BFS for same color groups
  const allCells = Object.entries(grid);
  for (const [key, cell] of allCells) {
    if (visited.has(key)) continue;
    const group = [];
    const queue = [key];
    while (queue.length > 0) {
      const k = queue.shift();
      if (visited.has(k)) continue;
      visited.add(k);
      const c = grid[k];
      if (!c) continue;
      group.push(k);
      const neighbors = getNeighbors(c.row, c.col);
      for (const n of neighbors) {
        const nk = `${n.row},${n.col}`;
        const nc = grid[nk];
        if (!visited.has(nk) && nc && nc.color === c.color) {
          queue.push(nk);
        }
      }
    }
    if (group.length >= 3) matches.push(...group);
  }
  return matches;
}

function getNeighbors(row, col) {
  const off = row % 2 === 0 ? 0 : 1;
  const dirs = [
    [-1, off], [-1, off-1], [0, -1], [0, 1], [1, off], [1, off-1]
  ];
  const result = [];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nc >= 0 && nc < (nr % 2 === 0 ? GRID_COLS : GRID_COLS - 1)) {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}

function findFloating() {
  const connected = new Set();
  const queue = [];
  // Find all top-row cells
  for (let col = 0; col < GRID_COLS; col++) {
    const key = `0,${col}`;
    if (grid[key]) {
      queue.push(key);
      connected.add(key);
    }
  }
  // BFS
  while (queue.length > 0) {
    const key = queue.shift();
    const [row, col] = key.split(',').map(Number);
    for (const n of getNeighbors(row, col)) {
      const nk = `${n.row},${n.col}`;
      if (!connected.has(nk) && grid[nk]) {
        connected.add(nk);
        queue.push(nk);
      }
    }
  }
  const all = Object.keys(grid);
  return all.filter(k => !connected.has(k));
}

function popBubbles(keys) {
  const bonuses = ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
  const popBonus = bonuses.popBonus || 0;
  const scoreMult = bonuses.scoreMult || 1;
  const chainBonus = bonuses.chainBonus || 0;

  chainCount += Math.max(keys.length, 1);
  if (chainCount > bestChain) bestChain = chainCount;

  const pts = Math.floor((keys.length * 10 + popBonus) * scoreMult + chainBonus);
  score += pts;
  totalPops += keys.length;

  if (particles) {
    for (const k of keys) {
      const [r, c] = k.split(',').map(Number);
      const pos = getCellCenter(r, c);
      const cell = grid[k];
      if (cell) {
        particles.emit(pos.x, pos.y, cell.color, 8, 'confetti');
        particles.emit(pos.x, pos.y, '#fff', 5);
      }
    }
    if (keys.length >= 10) particles.emitLevelUp();
  }

  for (const k of keys) delete grid[k];

  updateScoreDisplay();

  // Show chain notification
  if (chainCount >= 3) {
    showNotification(`⛓️ Chain x${chainCount}! +${pts}`);
  }
}

function levelUp() {
  level++;
  document.getElementById('lvl-num').textContent = level;
  if (gameActive) {
    showNotification(`🎉 Level ${level}!`);
  }
}

function checkGameOver() {
  // Check if any bubble is near the bottom
  const maxRow = Math.max(...Object.keys(grid).map(k => parseInt(k.split(',')[0])), -1);
  if (maxRow >= 14) {
    endGame();
  }
}

// ─── Aiming ───────────────────────────────────────
function updateAim(x, y) {
  if (!currentBubble || currentBubble.moving) return;
  const dx = x - currentBubble.x;
  const dy = y - currentBubble.y;
  const angle = Math.atan2(dy, dx);
  // Clamp angle
  aimAngle = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, angle));
  aiming = true;
}

// ─── Render ───────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#001520');
  grad.addColorStop(0.5, '#0a2a40');
  grad.addColorStop(1, '#001015');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid bubbles
  for (const [key, cell] of Object.entries(grid)) {
    const [row, col] = key.split(',').map(Number);
    const pos = getCellCenter(row, col);
    drawBubble(pos.x, pos.y, cell.color, row);
  }

  // Aim line
  if (aiming && currentBubble && !currentBubble.moving) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentBubble.x, currentBubble.y);
    const endX = currentBubble.x + Math.cos(aimAngle) * 500;
    const endY = currentBubble.y + Math.sin(aimAngle) * 500;
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }

  // Current bubble
  if (currentBubble) {
    drawBubble(currentBubble.x, currentBubble.y, currentBubble.color, -1, true);
  }

  // Particles
  if (particles) { particles.update(); particles.draw(ctx); }

  // Next bubble preview
  const neb = document.getElementById('next-bubble');
  if (neb && nextColor) {
    neb.style.background = nextColor;
    neb.style.boxShadow = `0 0 12px ${nextColor}80`;
  }
}

function drawBubble(x, y, color, row, glow = false) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
  } else {
    ctx.shadowColor = 'rgba(255,255,255,0.1)';
    ctx.shadowBlur = 5;
  }

  // Main bubble
  const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, BUBBLE_R);
  grad.addColorStop(0, lightenColor(color, 40));
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, darkenColor(color, 30));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, BUBBLE_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(x - 6, y - 6, BUBBLE_R * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(x + 4, y + 4, BUBBLE_R * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function lightenColor(color, amt) {
  const r = parseInt(color.slice(1,3), 16);
  const g = parseInt(color.slice(3,5), 16);
  const b = parseInt(color.slice(5,7), 16);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}

function darkenColor(color, amt) {
  const r = parseInt(color.slice(1,3), 16);
  const g = parseInt(color.slice(3,5), 16);
  const b = parseInt(color.slice(5,7), 16);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ─── Game Loop ────────────────────────────────────
function gameLoop() {
  if (!gameActive) return;

  // Move current bubble
  if (currentBubble && currentBubble.moving) {
    currentBubble.x += currentBubble.vx;
    currentBubble.y += currentBubble.vy;

    // Wall bounce
    if (currentBubble.x < BUBBLE_R || currentBubble.x > CANVAS_W - BUBBLE_R) {
      currentBubble.vx *= -1;
      currentBubble.x = Math.max(BUBBLE_R, Math.min(CANVAS_W - BUBBLE_R, currentBubble.x));
    }

    // Top wall snap
    if (currentBubble.y < GRID_TOP + BUBBLE_R) {
      currentBubble.y = GRID_TOP + BUBBLE_R;
      snapBubble(currentBubble);
      return;
    }

    // Check collision with grid bubbles
    for (const [key, cell] of Object.entries(grid)) {
      const [row, col] = key.split(',').map(Number);
      const pos = getCellCenter(row, col);
      const dist = Math.hypot(currentBubble.x - pos.x, currentBubble.y - pos.y);
      if (dist < BUBBLE_R * 2 - 2) {
        snapBubble(currentBubble);
        return;
      }
    }

    // Miss bottom
    if (currentBubble.y > CANVAS_H + 30) {
      currentBubble = null;
      spawnBubble();
      return;
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ─── Controls ─────────────────────────────────────
function initControls() {
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    updateAim(x, y);
  });

  canvas.addEventListener('click', (e) => {
    shoot();
  });

  // Touch aiming
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;
    updateAim(x, y);
    if (!currentBubble || !currentBubble.moving) {
      shoot();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;
    updateAim(x, y);
  }, { passive: false });
}

// ─── UI Updates ───────────────────────────────────
function updateScoreDisplay() {
  const el = document.getElementById('score-value');
  if (el) el.textContent = score;
}

// ─── Start / End ──────────────────────────────────
function startGame() {
  score = 0;
  level = 1;
  totalPops = 0;
  bestChain = 0;
  chainCount = 0;
  gameActive = true;
  gameOver = false;
  gameStarted = true;
  particles = new ParticleSystem();
  initGrid();
  spawnBubble();
  updateScoreDisplay();
  document.getElementById('game-over-overlay')?.classList.remove('visible');
  document.getElementById('lvl-num').textContent = '1';
  document.getElementById('start-btn').textContent = '▶ Restart';
}

function endGame() {
  gameActive = false;
  gameOver = true;
  currentBubble = null;
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    document.getElementById('final-score').textContent = score;
    document.getElementById('go-pops').textContent = totalPops;
    document.getElementById('go-chain').textContent = bestChain;
    document.getElementById('go-level').textContent = level;
  }

  if (window.ProgressionSystem) {
    ProgressionSystem.endOfGame({
      score,
      pops: totalPops,
      bestChain,
      levelCompleted: true,
    });
    const unlocked = ProgressionSystem.checkAchievements();
    if (unlocked.length > 0) setTimeout(() => showAchievementPopup(unlocked), 1000);
    setTimeout(() => checkDailyBonus(), 1500);
  }

  // ─── Framework Game-Over Hooks ─────────────────
  if (window.RetentionSystem) RetentionSystem.onGameEnd(score);
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', score);
    ChallengesSystem.reportProgress('games', 1);
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.incrementTracker('totalGames', 1);
    CollectiblesSystem.setTracker('highestScore', score);
  }
  if (window.AdsManager) AdsManager.tryShowInterstitial();

  if (particles) setTimeout(() => particles.emitLevelUp(), 500);
}

// ─── Power-Up: Bomb ──────────────────────────────
function usePowerup(type) {
  if (!gameActive || gameOver) return;
  const state = ProgressionSystem?.getState();
  if (!state || !state.powerups[type] || state.powerups[type] <= 0) {
    showNotification('No power-ups left! Buy in shop.');
    return;
  }
  state.powerups[type]--;
  ProgressionSystem.save();

  if (type === 'bomb') {
    // Clear bottom 2 rows
    const clear = Object.keys(grid).filter(k => parseInt(k.split(',')[0]) >= 12);
    for (const k of clear) delete grid[k];
    showNotification('💥 Bomb cleared bottom rows!');
    if (particles) particles.emitLevelUp();
  } else if (type === 'rainbow') {
    // Clear one random color
    const colors = new Set(Object.values(grid).map(c => c.color));
    if (colors.size > 0) {
      const target = [...colors][Math.floor(Math.random() * colors.size)];
      const clear = Object.entries(grid).filter(([,c]) => c.color === target).map(([k]) => k);
      for (const k of clear) delete grid[k];
      showNotification('🌈 Rainbow cleared a color!');
      if (particles) particles.emit(CANVAS_W / 2, CANVAS_H / 2, '#ffd700', 30, 'confetti');
    }
  }
}

// ─── Achievement / Daily / HUD ───────────────────
function showAchievementPopup(a) {
  const e = document.querySelector('.achievement-popup'); if (e) e.remove();
  a.forEach((ach, i) => setTimeout(() => {
    const d = document.createElement('div'); d.className = 'achievement-popup show';
    d.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-title">🏅 Achievement!</div><div>${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-reward">+${ach.reward.coins} 🪙 ${ach.reward.gems ? `+${ach.reward.gems} 💎` : ''}</div>`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
  }, i * 700));
}

function checkDailyBonus() {
  if (!window.ProgressionSystem) return; const r = ProgressionSystem.claimDailyBonus(); if (!r) return;
  const e = document.querySelector('.daily-bonus-popup'); if (e) e.remove();
  const d = document.createElement('div'); d.className = 'daily-bonus-popup show';
  d.innerHTML = `<h3>📅 Daily Bonus!</h3><div>${'🔥'.repeat(Math.min(r.streak, 7))}</div><div>🪙 +${r.coins} coins</div>${r.gems ? `<div>💎 +${r.gems} gems</div>` : ''}<div style="font-size:13px;color:#888;margin-top:6px;">Day ${r.streak} streak!</div><button class="game-btn btn-primary" style="margin-top:10px;display:inline-flex;" onclick="this.closest('.daily-bonus-popup').remove()">Awesome!</button>`;
  document.body.appendChild(d); setTimeout(() => d.remove(), 5000);
}

function updateHUD() {
  if (!window.ProgressionSystem) return;
  const s = ProgressionSystem.getState();
  const c = document.getElementById('hud-coins'); const g = document.getElementById('hud-gems'); const l = document.getElementById('hud-level');
  if (c) c.textContent = s.coins; if (g) g.textContent = s.gems; if (l) l.textContent = s.level;
}

function showAchievementsList() {
  if (!window.ProgressionSystem) return;
  const s = ProgressionSystem.getState(); const a = ProgressionSystem.getAchievements(); const u = Object.keys(s.achievements).length;
  const m = document.createElement('div'); m.className = 'modal-overlay';
  m.innerHTML = `<div class="modal-box" style="min-width:300px;"><h3 style="text-align:center;margin-bottom:8px;color:var(--accent-gold);">🏆 Achievements</h3><div style="text-align:center;margin-bottom:12px;font-size:14px;color:var(--text-secondary);">${u}/${a.length} unlocked</div><div style="max-height:400px;overflow-y:auto;">${a.map(ach => { const done = !!s.achievements[ach.id]; return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${done ? 'rgba(76,209,55,0.05)' : 'transparent'};border-radius:8px;margin-bottom:4px;${done ? 'opacity:0.8;' : ''}"><span style="font-size:20px;">${done ? ach.icon : '🔒'}</span><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${ach.name}</div><div style="font-size:11px;color:var(--text-secondary);">${ach.desc}</div></div>${done ? '✅' : `<span style="font-size:11px;color:var(--accent-gold);">🪙${ach.reward.coins}${ach.reward.gems ? ' 💎'+ach.reward.gems : ''}</span>`}</div>`; }).join('')}</div><button class="game-btn btn-primary" style="margin:10px auto 0;display:block;" onclick="this.closest('.modal-overlay').remove()">Close</button></div>`;
  document.body.appendChild(m); m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
}

function showNotification(msg) {
  const el = document.getElementById('notification') || (() => { const n = document.createElement('div'); n.id = 'notification'; document.body.appendChild(n); return n; })();
  el.textContent = msg; el.className = 'show';
  clearTimeout(el._timeout); el._timeout = setTimeout(() => el.className = '', 2500);
}

// ─── Init ─────────────────────────────────────────
function init() {
  canvas = document.getElementById('game-canvas');
  if (!canvas) { console.error('Canvas not found'); return; }
  ctx = canvas.getContext('2d');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  initControls();

  if (window.ProgressionSystem) {
    ProgressionSystem.load();
    updateHUD();
    setInterval(updateHUD, 3000);
  }

  // ─── Framework Module Init ──────────────────────
  if (window.AdsManager) AdsManager.init();
  if (window.ChallengesSystem) ChallengesSystem.init();
  if (window.StoreRotator) StoreRotator.init();
  if (window.RetentionSystem) RetentionSystem.init();
  if (window.CollectiblesSystem) CollectiblesSystem.init();
  if (window.TutorialSystem) {
    TutorialSystem.init();
    if (TutorialSystem.shouldShow()) TutorialSystem.start();
  }

  document.getElementById('start-btn')?.addEventListener('click', startGame);
  document.getElementById('button-shop')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
  document.getElementById('button-ach')?.addEventListener('click', showAchievementsList);
  document.getElementById('button-powerup')?.addEventListener('click', () => usePowerup('bomb'));

  // Draw welcome
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🫧 Bubble Shooter', CANVAS_W / 2, CANVAS_H / 2 - 20);
  ctx.font = '14px sans-serif';
  ctx.fillText('Aim and tap to shoot bubbles!', CANVAS_W / 2, CANVAS_H / 2 + 20);
  ctx.fillText('Match 3+ same color to pop', CANVAS_W / 2, CANVAS_H / 2 + 45);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
