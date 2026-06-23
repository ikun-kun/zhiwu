const CONFIG = {
  COLS: 9, ROWS: 5, CELL_W: 80, CELL_H: 100,
  GRID_X: 160, GRID_Y: 58,
  CANVAS_W: 900, CANVAS_H: 608,
  SUN_START: 150, SUN_VALUE: 25,
  ZOMBIE_SPEED: 18 / 1000, PEA_SPEED: 300 / 1000, SNOW_PEA_SPEED: 280 / 1000,
  PEA_DAMAGE: 20, SNOW_PEA_DAMAGE: 20, SLOW_DURATION: 3000,
  SUN_LIFETIME: 8000, SKY_SUN_INTERVAL: 7000,
};

const PLANT_DEFS = {
  sunflower: { name: '\u5411\u65e5\u8475', cost: 50, hp: 100, produceInterval: 8000 },
  peashooter: { name: '\u8c4c\u8c46\u5c04\u624b', cost: 100, hp: 100, shootInterval: 1500 },
  wallnut: { name: '\u575a\u679c\u5899', cost: 50, hp: 400 },
  snowpea: { name: '\u5bd2\u51b0\u5c04\u624b', cost: 175, hp: 100, shootInterval: 1800 },
};

const CLOUDS = [
  { x: 30, y: 10, w: 90, h: 22 }, { x: 180, y: 28, w: 110, h: 26 },
  { x: 380, y: 12, w: 80, h: 20 }, { x: 570, y: 32, w: 100, h: 22 },
  { x: 740, y: 8, w: 85, h: 18 },
];

// ========================================================================
// SOUND ENGINE — procedural audio via Web Audio API
// ========================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  ensureInit() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) { /* audio not supported */ }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(name) {
    if (!this.initialized || this.muted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);
    const playFn = soundDefs[name];
    if (playFn) playFn.call(this, now, gain);
  }
}

const soundDefs = {
  collectSun(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(800, now);
    o.frequency.exponentialRampToValueAtTime(1600, now + 0.06);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g); o.start(now); o.stop(now + 0.15);
  },
  shoot(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(900, now);
    o.frequency.exponentialRampToValueAtTime(300, now + 0.08);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.connect(g); o.start(now); o.stop(now + 0.1);
  },
  placePlant(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(350, now);
    o.frequency.exponentialRampToValueAtTime(600, now + 0.04);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.connect(g); o.start(now); o.stop(now + 0.12);
  },
  zombieHit(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g); o.start(now); o.stop(now + 0.15);
  },
  zombieDeath(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, now);
    o.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    o.connect(g); o.start(now); o.stop(now + 0.3);
  },
  mowerActivate(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(100, now);
    o.frequency.linearRampToValueAtTime(400, now + 0.2);
    o.frequency.linearRampToValueAtTime(300, now + 0.5);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    o.connect(g); o.start(now); o.stop(now + 0.5);
  },
  waveStart(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(80, now);
    o.frequency.exponentialRampToValueAtTime(160, now + 0.3);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    o.connect(g); o.start(now); o.stop(now + 0.5);
  },
  gameOver(now, g) {
    const { ctx } = this;
    [200, 250, 300].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.2);
      o.frequency.exponentialRampToValueAtTime(freq * 0.4, now + i * 0.2 + 0.5);
      gn.gain.setValueAtTime(0.08, now + i * 0.2);
      gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.6);
      o.connect(gn); gn.connect(ctx.destination);
      o.start(now + i * 0.2); o.stop(now + i * 0.2 + 0.6);
    });
  },
  gameWin(now, g) {
    const { ctx } = this;
    [261, 329, 392, 523].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + i * 0.12);
      gn.gain.setValueAtTime(0.12, now + i * 0.12);
      gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      o.connect(gn); gn.connect(ctx.destination);
      o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.4);
    });
  },
  hover(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1200, now);
    g.gain.setValueAtTime(0.03, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    o.connect(g); o.start(now); o.stop(now + 0.03);
  },
  selectPlant(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(1500, now);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.connect(g); o.start(now); o.stop(now + 0.05);
  },
  cantAfford(now, g) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, now);
    o.frequency.linearRampToValueAtTime(80, now + 0.2);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o.connect(g); o.start(now); o.stop(now + 0.2);
  },
};

// ========================================================================
// GAME
// ========================================================================

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS_W;
    this.canvas.height = CONFIG.CANVAS_H;
    this.state = 'playing';
    this.sun = CONFIG.SUN_START;
    this.selectedPlant = null;
    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.particles = [];
    this.mowers = [];
    this.wave = 0;
    this.waveTimer = 0;
    this.skySunTimer = 0;
    this.time = 0;
    this.lastTime = 0;
    this.waveActive = false;
    this.waveSpawnCount = 0;
    this.waveSpawnTimer = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.stats = { kills: 0, plantsPlanted: 0 };
    this.waveDisplayTimer = 0;
    this.waveDisplayText = '';
    this.soundEngine = new SoundEngine();
    this.blinkTimer = Math.random() * 3000;
    this.blinkDuration = 0;
    for (let r = 0; r < CONFIG.ROWS; r++) this.mowers.push(new LawnMower(r));
    this.setupResponsiveScaling();
    this.setupEvents();
    this.startWave(0);
    this.loop(0);
  }

  ensureAudio() {
    this.soundEngine.ensureInit();
  }

  setupResponsiveScaling() {
    this.wrapper = document.getElementById('game-wrapper');
    const nativeW = CONFIG.CANVAS_W + 16;
    const nativeH = CONFIG.CANVAS_H + 70 + 16;

    const scale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / nativeW;
      const scaleY = vh / nativeH;
      const s = Math.min(scaleX, scaleY, 1);
      this.wrapper.style.transform = `scale(${s})`;
      if (s < 1) {
        this.wrapper.classList.add('scaled');
        this.wrapper.style.left = `${(vw - nativeW * s) / 2}px`;
        this.wrapper.style.top = `${(vh - nativeH * s) / 2}px`;
      } else {
        this.wrapper.classList.remove('scaled');
        this.wrapper.style.left = '';
        this.wrapper.style.top = '';
      }
    };

    window.addEventListener('resize', scale);
    scale();
  }

  requestFullscreenAndLandscape() {
    if (this._fullscreenDone) return;
    this._fullscreenDone = true;

    const el = document.documentElement;
    const reqFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (reqFS) {
      reqFS.call(el).catch(() => {});
    }

    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }

  getCanvasCoords(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.CANVAS_W / r.width;
    const scaleY = CONFIG.CANVAS_H / r.height;
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top) * scaleY
    };
  }

  setupEvents() {
    const tryFullscreen = () => this.requestFullscreenAndLandscape();

    this.canvas.addEventListener('click', (e) => {
      tryFullscreen();
      this.ensureAudio();
      const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
      this.handleCanvasClick(x, y);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      this.ensureAudio();
      const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
      this.mouseX = x;
      this.mouseY = y;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      tryFullscreen();
      e.preventDefault();
      this.ensureAudio();
      const touch = e.touches[0];
      const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
      this.mouseX = x;
      this.mouseY = y;
      this.handleCanvasClick(x, y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
      this.mouseX = x;
      this.mouseY = y;
    }, { passive: false });

    document.querySelectorAll('.plant-card').forEach((c) => {
      c.addEventListener('click', () => { tryFullscreen(); this.selectPlant(c.dataset.plant); });
      c.addEventListener('mouseenter', () => { this.ensureAudio(); this.soundEngine.play('hover'); });
      c.addEventListener('mousedown', () => { this.ensureAudio(); });
      c.addEventListener('touchstart', (e) => {
        tryFullscreen();
        e.preventDefault();
        this.ensureAudio();
        this.soundEngine.play('hover');
        this.selectPlant(c.dataset.plant);
      }, { passive: false });
    });
    document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    document.getElementById('restart-btn').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.restart();
    }, { passive: false });
    document.getElementById('mute-btn').addEventListener('click', () => {
      this.ensureAudio();
      this.soundEngine.muted = !this.soundEngine.muted;
      document.getElementById('mute-btn').textContent = this.soundEngine.muted ? '🔇' : '🔊';
    });
  }

  selectPlant(type) {
    document.querySelectorAll('.plant-card').forEach((c) => c.classList.remove('selected'));
    if (this.selectedPlant === type) { this.selectedPlant = null; this.canvas.classList.remove('planting'); this.soundEngine.play('selectPlant'); return; }
    if (this.sun < PLANT_DEFS[type].cost) { this.soundEngine.play('cantAfford'); return; }
    this.soundEngine.play('selectPlant');
    this.selectedPlant = type;
    this.canvas.classList.add('planting');
    document.querySelector(`.plant-card[data-plant="${type}"]`).classList.add('selected');
  }

  handleCanvasClick(x, y) {
    for (let i = this.suns.length - 1; i >= 0; i--) {
      const s = this.suns[i];
      if ((x - s.x) ** 2 + (y - s.y) ** 2 < 900) { this.collectSun(s); return; }
    }
    if (!this.selectedPlant) return;
    const col = Math.floor((x - CONFIG.GRID_X) / CONFIG.CELL_W);
    const row = Math.floor((y - CONFIG.GRID_Y) / CONFIG.CELL_H);
    if (col < 0 || col >= CONFIG.COLS || row < 0 || row >= CONFIG.ROWS) return;
    if (this.getPlantAt(col, row)) return;
    const def = PLANT_DEFS[this.selectedPlant];
    if (this.sun < def.cost) return;
    this.sun -= def.cost;
    this.stats.plantsPlanted++;
    const px = CONFIG.GRID_X + col * CONFIG.CELL_W + CONFIG.CELL_W / 2;
    const py = CONFIG.GRID_Y + row * CONFIG.CELL_H + CONFIG.CELL_H / 2;
    let plant;
    switch (this.selectedPlant) {
      case 'sunflower': plant = new Sunflower(px, py, col, row); break;
      case 'peashooter': plant = new Peashooter(px, py, col, row); break;
      case 'wallnut': plant = new WallNut(px, py, col, row); break;
      case 'snowpea': plant = new SnowPea(px, py, col, row); break;
    }
    this.plants.push(plant);
    this.soundEngine.play('placePlant');
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      this.particles.push(new Particle(px, py, Math.cos(a) * (2 + Math.random() * 3), Math.sin(a) * (1 + Math.random() * 2), 500, '#8acc6c', 4));
    }
    this.updateCardStates();
    this.selectedPlant = null;
    this.canvas.classList.remove('planting');
    document.querySelectorAll('.plant-card').forEach((c) => c.classList.remove('selected'));
  }

  collectSun(s) { this.soundEngine.play('collectSun'); this.sun += s.value; s.collected = true; this.updateCardStates(); for (let i = 0; i < 8; i++) this.particles.push(new Particle(s.x, s.y, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 400, '#f5d742', 3)); }

  updateCardStates() {
    document.querySelectorAll('.plant-card').forEach((c) => c.classList.toggle('disabled', this.sun < parseInt(c.dataset.cost)));
  }

  getPlantAt(col, row) { return this.plants.find((p) => p.col === col && p.row === row && p.alive); }

  startWave(i) {
    this.wave = i;
    this.waveActive = true;
    this.waveSpawnCount = 0;
    this.waveSpawnTimer = 0;
    document.getElementById('wave-num').textContent = i + 1;
    let count, coneCount;
    if (i === 0) { count = 3; coneCount = 0; }
    else if (i === 1) { count = 4; coneCount = 1; }
    else if (i === 2) { count = 4; coneCount = 2; }
    else if (i === 3) { count = 5; coneCount = 3; }
    else { count = 4 + i; coneCount = 2 + Math.floor(i / 2); }
    this.waveTotal = count + coneCount;
    this.waveCones = coneCount;
    this.waveNormals = count;
    this.waveDisplayTimer = 1500;
    this.waveDisplayText = `\u7b2c ${i + 1} \u6ce2`;
    this.soundEngine.play('waveStart');
  }

  spawnZombie(cone) {
    const row = Math.floor(Math.random() * CONFIG.ROWS);
    this.zombies.push(new Zombie(CONFIG.CANVAS_W + 30 + Math.random() * 60, CONFIG.GRID_Y + row * CONFIG.CELL_H + CONFIG.CELL_H / 2, row, cone));
  }

  update(dt) {
    if (this.state !== 'playing') return;
    this.time += dt; this.waveTimer += dt; this.skySunTimer += dt; this.waveSpawnTimer += dt;
    this.blinkTimer += dt;
    if (this.waveDisplayTimer > 0) this.waveDisplayTimer -= dt;
    this.updateSunSpawning(dt);
    this.updateWaveSpawning(dt);
    this.updatePlants(dt);
    this.updateZombies(dt);
    this.updateProjectiles(dt);
    this.updateSuns(dt);
    this.updateParticles(dt);
    this.updateMowers(dt);
    this.updateWaveAdvancement(dt);
    this.checkGameOver();
  }

  updateSunSpawning(dt) {
    if (this.skySunTimer >= CONFIG.SKY_SUN_INTERVAL) {
      this.skySunTimer = 0;
      const x = CONFIG.GRID_X + 40 + Math.random() * (CONFIG.COLS * CONFIG.CELL_W - 80);
      this.suns.push(new Sun(x, -30, CONFIG.GRID_Y + Math.random() * (CONFIG.ROWS * CONFIG.CELL_H - 40) + 20, CONFIG.SUN_VALUE, true));
    }
  }
  updateWaveSpawning(dt) {
    if (!this.waveActive) return;
    if (this.waveSpawnCount >= this.waveTotal) { this.waveActive = false; this.waveTimer = 0; return; }
    if (this.waveSpawnTimer > 1500) { this.waveSpawnTimer = 0; this.spawnZombie(this.waveSpawnCount >= this.waveNormals); this.waveSpawnCount++; }
  }
  updatePlants(dt) { this.plants.forEach((p) => { if (p.alive) p.update(dt, this); }); }

  updateZombies(dt) {
    for (const z of this.zombies) {
      if (!z.alive) continue;
      z.anim += dt * 0.003;
      let target = null, best = Infinity;
      for (const p of this.plants) {
        if (!p.alive || p.row !== z.row) continue;
        const d = z.x - p.x;
        if (d > -10 && d < 35 && d < best) { target = p; best = d; }
      }
      if (target) {
        z.eating = true;
        z.x = Math.max(z.x, target.x + 20);
        target.hp -= z.damage * dt;
        if (target.hp <= 0) { target.alive = false; z.eating = false; }
      } else {
        z.eating = false;
        z.x -= z.speed * (z.slowTimer > 0 ? 0.4 : 1) * dt;
        if (z.slowTimer > 0) z.slowTimer -= dt;
      }
    }
    this.zombies = this.zombies.filter((z) => z.alive);
    this.plants = this.plants.filter((p) => p.alive);
  }

  updateProjectiles(dt) {
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      if (p.x > CONFIG.CANVAS_W + 20) { p.alive = false; continue; }
      for (const z of this.zombies) {
        if (!z.alive || z.row !== p.row) continue;
        if (p.x - z.x > -15 && p.x - z.x < 25 && p.y - z.y > -30 && p.y - z.y < 30) {
          z.hp -= p.damage;
          this.soundEngine.play('zombieHit');
          if (p.slow) z.slowTimer = CONFIG.SLOW_DURATION;
          p.alive = false;
          for (let i = 0; i < 4; i++) this.particles.push(new Particle(p.x, p.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 250, p.slow ? '#aaddff' : '#6ab04c', 3));
          if (z.hp <= 0) {
            z.alive = false; this.stats.kills++;
            this.soundEngine.play('zombieDeath');
            for (let i = 0; i < 14; i++) this.particles.push(new Particle(z.x, z.y, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, 600 + Math.random() * 200, '#6b5b4a', 4));
            for (let i = 0; i < 5; i++) this.particles.push(new Particle(z.x - 10, z.y - 10, (Math.random() - 0.5) * 3, -Math.random() * 4 - 1, 400, '#cc3333', 2));
          }
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  updateSuns(dt) {
    for (const s of this.suns) {
      if (s.collected) continue;
      if (s.y < s.targetY) { s.y += 30 * dt; if (s.y > s.targetY) s.y = s.targetY; }
      s.life -= dt; s.bobTimer += dt * 0.002; s.bobY = Math.sin(s.bobTimer) * 3;
    }
    this.suns = this.suns.filter((s) => s.life > 0 && !s.collected);
  }

  updateParticles(dt) {
    for (const p of this.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= dt; p.size *= 0.98; }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  updateMowers(dt) {
    for (const m of this.mowers) {
      if (m.used && !m.active) continue;
      if (!m.active) {
        for (const z of this.zombies) {
          if (!z.alive || z.row !== m.row) continue;
          if (z.x < CONFIG.GRID_X + 20) { m.active = true; m.used = true; this.soundEngine.play('mowerActivate'); break; }
        }
      }
      if (m.active) {
        m.x += m.speed * dt;
        for (const z of this.zombies) {
          if (!z.alive || z.row !== m.row) continue;
          if (Math.abs(z.x - m.x) < 30) { z.alive = false; this.stats.kills++; for (let i = 0; i < 10; i++) this.particles.push(new Particle(z.x, z.y, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, 600, '#8a7a5a', 5)); }
        }
        if (m.x > CONFIG.CANVAS_W + 50) m.active = false;
      }
    }
  }

  updateWaveAdvancement(dt) {
    if (this.waveActive) return;
    if (this.zombies.filter((z) => z.alive).length === 0 && this.waveTimer > 4000) {
      if (this.wave < 10) this.startWave(this.wave + 1);
    }
  }

  checkGameOver() {
    for (const z of this.zombies) {
      if (!z.alive) continue;
      if (z.x < CONFIG.GRID_X - 50) { this.gameOver(); return; }
      if (z.x < CONFIG.GRID_X) { const m = this.mowers[z.row]; if (!m || m.used) { this.gameOver(); return; } }
    }
  }

  gameOver() {
    this.soundEngine.play('gameOver');
    this.state = 'gameover';
    document.getElementById('result-title').textContent = '\u6e38\u620f\u7ed3\u675f';
    document.getElementById('result-subtitle').textContent = '\u50f5\u5c38\u7a81\u7834\u4e86\u4f60\u7684\u9632\u7ebf\uff01';
    document.getElementById('stat-time').textContent = `${Math.floor(this.time / 1000)}s`;
    document.getElementById('stat-kills').textContent = this.stats.kills;
    document.getElementById('stat-plants').textContent = this.stats.plantsPlanted;
    document.getElementById('game-over-overlay').classList.remove('hidden');
  }

  checkWin() {
    if (!this.waveActive && this.wave >= 10 && this.zombies.every((z) => !z.alive)) {
      this.state = 'win';
      this.soundEngine.play('gameWin');
      document.getElementById('result-title').textContent = '\u2764\u200d\ud83c\udf1f \u80dc\u5229\uff01';
      document.getElementById('result-subtitle').textContent = '\u4f60\u6210\u529f\u5b88\u62a4\u4e86\u8349\u576a\uff01';
      document.getElementById('stat-time').textContent = `${Math.floor(this.time / 1000)}s`;
      document.getElementById('stat-kills').textContent = this.stats.kills;
      document.getElementById('stat-plants').textContent = this.stats.plantsPlanted;
      document.getElementById('game-over-overlay').classList.remove('hidden');
    }
  }

  restart() {
    document.getElementById('game-over-overlay').classList.add('hidden');
    this.sun = CONFIG.SUN_START; this.selectedPlant = null;
    this.plants = []; this.zombies = []; this.projectiles = []; this.suns = []; this.particles = [];
    this.mowers = []; this.wave = 0; this.waveTimer = 0; this.skySunTimer = 0; this.time = 0;
    this.waveActive = false; this.state = 'playing'; this.stats = { kills: 0, plantsPlanted: 0 };
    this.canvas.classList.remove('planting');
    document.querySelectorAll('.plant-card').forEach((c) => c.classList.remove('selected', 'disabled'));
    for (let r = 0; r < CONFIG.ROWS; r++) this.mowers.push(new LawnMower(r));
    this.updateCardStates();
    this.startWave(0);
  }

  // ============ RENDERING ============

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
    this.drawSky(ctx);
    this.drawClouds(ctx);
    this.drawFence(ctx);
    this.drawLawn(ctx);
    this.drawLawnMowers(ctx);
    this.drawPlants(ctx);
    this.drawZombies(ctx);
    this.drawProjectiles(ctx);
    this.drawSuns(ctx);
    this.drawParticles(ctx);
    this.drawHoverPreview(ctx);
    this.drawUI(ctx);
    this.drawWaveBanner(ctx);
  }

  drawSky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, CONFIG.GRID_Y + 10);
    g.addColorStop(0, '#4a90d9'); g.addColorStop(0.6, '#7ab8e8'); g.addColorStop(1, '#a8d4f0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.GRID_Y);
    ctx.fillStyle = '#3a7a2a';
    ctx.fillRect(0, CONFIG.GRID_Y + CONFIG.ROWS * CONFIG.CELL_H, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  }

  drawClouds(ctx) {
    for (const c of CLOUDS) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.3, c.y - c.h * 0.2, c.w * 0.3, c.h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.25, c.y - c.h * 0.1, c.w * 0.25, c.h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      if (c.w > 85) { ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.1, c.y + c.h * 0.15, c.w * 0.2, c.h * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  drawFence(ctx) {
    const fx = CONFIG.GRID_X - 4, fy = CONFIG.GRID_Y - 6, fw = CONFIG.COLS * CONFIG.CELL_W + 8;
    const plankW = 18, gap = 3, totalW = plankW + gap, count = Math.floor(fw / totalW);
    for (let i = 0; i < count; i++) {
      const px = fx + i * totalW;
      ctx.fillStyle = '#f5f0e0';
      ctx.beginPath();
      ctx.moveTo(px, fy + 24); ctx.lineTo(px, fy + 6); ctx.lineTo(px + plankW / 2, fy);
      ctx.lineTo(px + plankW, fy + 6); ctx.lineTo(px + plankW, fy + 24); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d4c8a8'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.fillStyle = '#e0d4b8';
    ctx.fillRect(fx, fy + 8, count * totalW, 3);
    ctx.fillRect(fx, fy + 16, count * totalW, 3);
  }

  drawLawn(ctx) {
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const x = CONFIG.GRID_X + c * CONFIG.CELL_W, y = CONFIG.GRID_Y + r * CONFIG.CELL_H;
        const light = (r + c) % 2 === 0;
        ctx.fillStyle = light ? '#5a9e4a' : '#4a8e3a';
        ctx.fillRect(x, y, CONFIG.CELL_W, CONFIG.CELL_H);
        if (light) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x, y, CONFIG.CELL_W, 2); }
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
    for (let r = 0; r <= CONFIG.ROWS; r++) { ctx.beginPath(); ctx.moveTo(CONFIG.GRID_X, CONFIG.GRID_Y + r * CONFIG.CELL_H); ctx.lineTo(CONFIG.GRID_X + CONFIG.COLS * CONFIG.CELL_W, CONFIG.GRID_Y + r * CONFIG.CELL_H); ctx.stroke(); }
    for (let c = 0; c <= CONFIG.COLS; c++) { ctx.beginPath(); ctx.moveTo(CONFIG.GRID_X + c * CONFIG.CELL_W, CONFIG.GRID_Y); ctx.lineTo(CONFIG.GRID_X + c * CONFIG.CELL_W, CONFIG.GRID_Y + CONFIG.ROWS * CONFIG.CELL_H); ctx.stroke(); }
  }

  drawLawnMowers(ctx) { for (const m of this.mowers) { if (m.active || !m.used) m.draw(ctx); } }
  drawPlants(ctx) { for (const p of this.plants) { if (p.alive) p.draw(ctx, this); } }
  drawZombies(ctx) { for (const z of this.zombies) { if (z.alive) z.draw(ctx); } }
  drawProjectiles(ctx) { for (const p of this.projectiles) { if (p.alive) p.draw(ctx); } }
  drawSuns(ctx) { for (const s of this.suns) { if (!s.collected) s.draw(ctx); } }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, p.life / 150);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawHoverPreview(ctx) {
    if (!this.selectedPlant) return;
    const col = Math.floor((this.mouseX - CONFIG.GRID_X) / CONFIG.CELL_W);
    const row = Math.floor((this.mouseY - CONFIG.GRID_Y) / CONFIG.CELL_H);
    if (col < 0 || col >= CONFIG.COLS || row < 0 || row >= CONFIG.ROWS) return;
    if (this.getPlantAt(col, row)) return;
    const x = CONFIG.GRID_X + col * CONFIG.CELL_W, y = CONFIG.GRID_Y + row * CONFIG.CELL_H;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, CONFIG.CELL_W, CONFIG.CELL_H);
    ctx.strokeStyle = 'rgba(255,255,200,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, CONFIG.CELL_W, CONFIG.CELL_H);
    ctx.setLineDash([]);
  }

  drawUI(ctx) {
    const st = `\u2600 ${Math.floor(this.sun)}`;
    ctx.font = 'bold 15px Quicksand,Microsoft YaHei,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(6, 6, ctx.measureText(st).width + 16, 26);
    ctx.fillStyle = '#fff'; ctx.fillText(st, 14, 24);
    const alive = this.zombies.filter((z) => z.alive).length;
    const zt = `\ud83e\udddf ${alive}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(CONFIG.CANVAS_W - 8 - ctx.measureText(zt).width - 16, 6, ctx.measureText(zt).width + 16, 26);
    ctx.fillStyle = '#ff6b6b'; ctx.fillText(zt, CONFIG.CANVAS_W - 14, 24);
  }

  drawWaveBanner(ctx) {
    if (this.waveDisplayTimer <= 0) return;
    const alpha = Math.min(1, this.waveDisplayTimer / 500);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const tw = ctx.measureText(this.waveDisplayText).width;
    ctx.fillRect(CONFIG.CANVAS_W / 2 - tw / 2 - 30, CONFIG.GRID_Y + CONFIG.ROWS * CONFIG.CELL_H / 2 - 20, tw + 60, 40);
    ctx.fillStyle = '#f5d742'; ctx.font = 'bold 24px Quicksand,Microsoft YaHei,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(this.waveDisplayText, CONFIG.CANVAS_W / 2, CONFIG.GRID_Y + CONFIG.ROWS * CONFIG.CELL_H / 2 + 9);
    ctx.restore();
  }

  loop(timestamp) {
    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    this.checkWin();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// ========================================================================
// SUNFLOWER
// ========================================================================

class Sunflower {
  constructor(x, y, col, row) {
    this.x = x; this.y = y; this.col = col; this.row = row;
    this.hp = PLANT_DEFS.sunflower.hp; this.maxHp = this.hp;
    this.alive = true; this.timer = 0; this.bob = Math.random() * Math.PI * 2;
    this.blinkTimer = Math.random() * 3000;
  }

  update(dt, game) {
    this.bob += dt * 0.0010;
    this.blinkTimer += dt;
    this.timer += dt;
    if (this.timer >= PLANT_DEFS.sunflower.produceInterval) {
      this.timer = 0;
      game.suns.push(new Sun(this.x, this.y - 20, this.y - 50, CONFIG.SUN_VALUE, false));
    }
  }

  draw(ctx, game) {
    const x = this.x, by = Math.sin(this.bob) * 2.0, y = this.y + by;
    const blink = this.blinkTimer % 4000 < 150;
    const lookX = Math.sin(this.bob * 0.25) * 0.8;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x, y + 38, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

    // stem
    ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x - 4, y + 28, x - 2, y + 43); ctx.stroke();

    // leaves
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath(); ctx.ellipse(x - 14, y + 30, 11, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 12, y + 36, 11, 5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 14, y + 30); ctx.lineTo(x - 22, y + 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 12, y + 36); ctx.lineTo(x + 20, y + 34); ctx.stroke();

    // outer petals (darker)
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ctx.fillStyle = '#e0b020';
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 21, y + Math.sin(a) * 21, 11, 6, a, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c89818'; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // inner petals (brighter)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.18;
      ctx.fillStyle = '#f5d742';
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 17, y + Math.sin(a) * 17, 9, 5, a, 0, Math.PI * 2); ctx.fill();
    }

    // center gradient
    const cg = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 16);
    cg.addColorStop(0, '#8a4a1a'); cg.addColorStop(0.6, '#6b3a1f'); cg.addColorStop(1, '#4a2a10');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();

    // center texture
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, r = 5 + (i % 5) * 1.5;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // eyes
    const ey = y - 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 5, ey, 4.5, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, ey, 4.5, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();

    if (!blink) {
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath(); ctx.arc(x - 5 + lookX, ey + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5 + lookX, ey + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - 5.5 + lookX, ey - 1, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4.5 + lookX, ey - 1, 1, 0, Math.PI * 2); ctx.fill();
    }

    // smile
    ctx.strokeStyle = '#4a2a0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + 6, 6, 0.15, Math.PI - 0.15); ctx.stroke();

    // blush
    ctx.fillStyle = 'rgba(200,100,80,0.18)';
    ctx.beginPath(); ctx.ellipse(x - 10, y + 4, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 10, y + 4, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    this.drawHP(ctx, x, y);
  }

  drawHP(ctx, x, y) {
    if (this.hp >= this.maxHp) return;
    const bw = 28, bh = 3, bx = x - bw / 2, by = y - 34;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
  }
}

// ========================================================================
// PEASHOOTER
// ========================================================================

class Peashooter {
  constructor(x, y, col, row) {
    this.x = x; this.y = y; this.col = col; this.row = row;
    this.hp = PLANT_DEFS.peashooter.hp; this.maxHp = this.hp;
    this.alive = true; this.timer = 0; this.bob = Math.random() * Math.PI * 2;
    this.shootAnim = 0; this.blinkTimer = Math.random() * 3000;
  }

  update(dt, game) {
    this.bob += dt * 0.0016; this.blinkTimer += dt;
    this.timer += dt; this.shootAnim = Math.max(0, this.shootAnim - dt * 4);
    const target = game.zombies.some((z) => z.alive && z.row === this.row && z.x > this.x);
    if (this.timer >= PLANT_DEFS.peashooter.shootInterval && target) {
      this.timer = 0; this.shootAnim = 1;
      game.soundEngine.play('shoot');
      game.projectiles.push(new Projectile(this.x + 24, this.y, this.row, 1, CONFIG.PEA_DAMAGE));
    }
  }

  draw(ctx, game) {
    const x = this.x, by = Math.sin(this.bob) * 1.8, y = this.y + by;
    const recoil = this.shootAnim > 0 ? -4 : 0;
    const open = this.shootAnim > 0.5;
    const blink = this.blinkTimer % 3500 < 120;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(x, y + 36, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

    // stem
    ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.quadraticCurveTo(x - 3, y + 24, x - 1, y + 40); ctx.stroke();

    // leaves
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath(); ctx.ellipse(x - 13, y + 26, 10, 4.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 11, y + 32, 10, 4.5, 0.4, 0, Math.PI * 2); ctx.fill();

    // stalk connecting head to stem
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 8); ctx.lineTo(x - 6, y + 2); ctx.lineTo(x + 6, y + 2); ctx.lineTo(x + 8, y + 8);
    ctx.closePath(); ctx.fill();

    // main head
    const hg = ctx.createRadialGradient(x - 4, y - 8, 3, x, y, 20);
    hg.addColorStop(0, '#6aba4a'); hg.addColorStop(0.6, '#5aaa4a'); hg.addColorStop(1, '#4a9a3a');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 21, 0, 0, Math.PI * 2); ctx.fill();

    // head outline
    ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 21, 0, 0, Math.PI * 2); ctx.stroke();

    // mouth tube
    ctx.fillStyle = '#3a8a2a';
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 4);
    ctx.quadraticCurveTo(x + 20 + recoil, y - 6, x + 28 + recoil, y - 4);
    ctx.lineTo(x + 28 + recoil, y + 6);
    ctx.quadraticCurveTo(x + 20 + recoil, y + 8, x + 12, y + 6);
    ctx.closePath(); ctx.fill();

    // mouth opening
    if (open) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.ellipse(x + 20 + recoil, y + 1, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    }

    // head highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(x - 6, y - 12, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();

    // leaf ears
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath(); ctx.ellipse(x - 17, y - 6, 7, 4, -0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 17, y - 6, 7, 4, 0.8, 0, Math.PI * 2); ctx.fill();

    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 5, y - 9, 4, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, y - 9, 4, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();

    if (!blink) {
      ctx.fillStyle = '#1a3a0a';
      ctx.beginPath(); ctx.arc(x - 5, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - 5.5, y - 9.5, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4.5, y - 9.5, 0.9, 0, Math.PI * 2); ctx.fill();
    }

    this.drawHP(ctx, x, y);
  }

  drawHP(ctx, x, y) {
    if (this.hp >= this.maxHp) return;
    const bw = 28, bh = 3, bx = x - bw / 2, by = y - 34;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
  }
}

// ========================================================================
// SNOW PEA
// ========================================================================

class SnowPea {
  constructor(x, y, col, row) {
    this.x = x; this.y = y; this.col = col; this.row = row;
    this.hp = PLANT_DEFS.snowpea.hp; this.maxHp = this.hp;
    this.alive = true; this.timer = 0; this.bob = Math.random() * Math.PI * 2;
    this.shootAnim = 0; this.blinkTimer = Math.random() * 3000;
  }

  update(dt, game) {
    this.bob += dt * 0.0013; this.blinkTimer += dt;
    this.timer += dt; this.shootAnim = Math.max(0, this.shootAnim - dt * 4);
    const target = game.zombies.some((z) => z.alive && z.row === this.row && z.x > this.x);
    if (this.timer >= PLANT_DEFS.snowpea.shootInterval && target) {
      this.timer = 0; this.shootAnim = 1;
      game.soundEngine.play('shoot');
      const p = new Projectile(this.x + 24, this.y, this.row, 1, CONFIG.SNOW_PEA_DAMAGE, true);
      p.vx = CONFIG.SNOW_PEA_SPEED;
      game.projectiles.push(p);
    }
  }

  draw(ctx, game) {
    const x = this.x, by = Math.sin(this.bob) * 1.8, y = this.y + by;
    const recoil = this.shootAnim > 0 ? -4 : 0;
    const open = this.shootAnim > 0.5;
    const blink = this.blinkTimer % 3500 < 120;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.ellipse(x, y + 36, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

    // stem
    ctx.strokeStyle = '#3a7a7a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.quadraticCurveTo(x - 3, y + 24, x - 1, y + 40); ctx.stroke();

    // leaves
    ctx.fillStyle = '#4a8a8a';
    ctx.beginPath(); ctx.ellipse(x - 13, y + 26, 10, 4.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 11, y + 32, 10, 4.5, 0.4, 0, Math.PI * 2); ctx.fill();

    // frost aura
    ctx.fillStyle = 'rgba(200,230,255,0.08)';
    ctx.beginPath(); ctx.arc(x, y - 2, 28, 0, Math.PI * 2); ctx.fill();

    // main head
    const hg = ctx.createRadialGradient(x - 4, y - 8, 3, x, y, 20);
    hg.addColorStop(0, '#8ad0f0'); hg.addColorStop(0.6, '#6ab8d8'); hg.addColorStop(1, '#5aa0c0');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 21, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#4a90b0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y - 4, 18, 21, 0, 0, Math.PI * 2); ctx.stroke();

    // mouth tube
    ctx.fillStyle = '#4a90b0';
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 4);
    ctx.quadraticCurveTo(x + 20 + recoil, y - 6, x + 28 + recoil, y - 4);
    ctx.lineTo(x + 28 + recoil, y + 6);
    ctx.quadraticCurveTo(x + 20 + recoil, y + 8, x + 12, y + 6);
    ctx.closePath(); ctx.fill();

    if (open) {
      ctx.fillStyle = '#1a3a4a';
      ctx.beginPath(); ctx.ellipse(x + 20 + recoil, y + 1, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    }

    // frost crystals
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + this.bob * 0.1;
      const r = 14 + Math.sin(this.bob * 2 + i) * 3;
      const cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
      ctx.moveTo(cx - 2, cy - 1); ctx.lineTo(cx + 2, cy + 1);
      ctx.stroke();
    }

    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 5, y - 9, 4, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 5, y - 9, 4, blink ? 1 : 5, 0, 0, Math.PI * 2); ctx.fill();

    if (!blink) {
      ctx.fillStyle = '#1a3a4a';
      ctx.beginPath(); ctx.arc(x - 5, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, y - 8, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - 5.5, y - 9.5, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4.5, y - 9.5, 0.9, 0, Math.PI * 2); ctx.fill();
    }

    this.drawHP(ctx, x, y);
  }

  drawHP(ctx, x, y) {
    if (this.hp >= this.maxHp) return;
    const bw = 28, bh = 3, bx = x - bw / 2, by = y - 34;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
  }
}

// ========================================================================
// WALL-NUT
// ========================================================================

class WallNut {
  constructor(x, y, col, row) {
    this.x = x; this.y = y; this.col = col; this.row = row;
    this.hp = PLANT_DEFS.wallnut.hp; this.maxHp = this.hp;
    this.alive = true; this.bob = Math.random() * Math.PI * 2;
    this.blinkTimer = Math.random() * 3000;
  }

  update(dt, game) { this.bob += dt * 0.0006; this.blinkTimer += dt; }

  draw(ctx) {
    const x = this.x, y = this.y + Math.sin(this.bob) * 1.5;
    const hr = this.hp / this.maxHp;
    const blink = this.blinkTimer % 4000 < 120;
    const damaged = hr < 0.6;
    const critical = hr < 0.3;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x, y + 30, 24, 7, 0, 0, Math.PI * 2); ctx.fill();

    // body
    const bg = ctx.createRadialGradient(x - 6, y - 8, 4, x, y, 28);
    bg.addColorStop(0, '#e0b870'); bg.addColorStop(0.5, '#c4955a'); bg.addColorStop(1, '#a0753a');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(x, y, 25, 30, 0, 0, Math.PI * 2); ctx.fill();

    // outline
    ctx.strokeStyle = critical ? '#8a5a2a' : '#a0753a'; ctx.lineWidth = critical ? 3 : 2;
    ctx.beginPath(); ctx.ellipse(x, y, 25, 30, 0, 0, Math.PI * 2); ctx.stroke();

    // ridge lines (walnut texture)
    ctx.strokeStyle = 'rgba(160,100,50,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 8, y - 26); ctx.quadraticCurveTo(x - 12, y, x - 8, y + 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 8, y - 26); ctx.quadraticCurveTo(x + 12, y, x + 8, y + 26); ctx.stroke();

    // lighter center area
    ctx.fillStyle = '#d4a868';
    ctx.beginPath(); ctx.ellipse(x, y - 5, 16, 14, 0, 0.2, Math.PI * 2 - 0.2); ctx.fill();

    // eyes
    const ey = y - 7, ew = blink ? 0.5 : 4.5, eh = blink ? 0.5 : 5.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - 7, ey, ew, eh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 7, ey, ew, eh, 0, 0, Math.PI * 2); ctx.fill();

    if (!blink) {
      const px = damaged ? 0 : -0.5;
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath(); ctx.arc(x - 7 + px, ey + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 7 + px, ey + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x - 7.5 + px, ey - 1, 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6.5 + px, ey - 1, 0.9, 0, Math.PI * 2); ctx.fill();
    }

    // eyebrows (change with damage)
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    if (critical) {
      // angry worried
      ctx.beginPath(); ctx.moveTo(x - 11, ey - 9); ctx.lineTo(x - 5, ey - 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 11, ey - 9); ctx.lineTo(x + 5, ey - 7); ctx.stroke();
    } else if (damaged) {
      // worried
      ctx.beginPath(); ctx.moveTo(x - 11, ey - 7); ctx.lineTo(x - 5, ey - 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 11, ey - 7); ctx.lineTo(x + 5, ey - 9); ctx.stroke();
    } else {
      // normal
      ctx.beginPath(); ctx.moveTo(x - 11, ey - 8); ctx.lineTo(x - 5, ey - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 11, ey - 8); ctx.lineTo(x + 5, ey - 8); ctx.stroke();
    }

    // mouth
    if (critical) {
      // open mouth (scared)
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath(); ctx.ellipse(x + 1, y + 5, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2a0a';
      ctx.beginPath(); ctx.ellipse(x + 1, y + 4, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    } else if (damaged) {
      // wavy worried mouth
      ctx.strokeStyle = '#4a2a0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 5, y + 6); ctx.quadraticCurveTo(x - 2, y + 3, x + 1, y + 6); ctx.quadraticCurveTo(x + 4, y + 3, x + 7, y + 6); ctx.stroke();
    } else {
      // normal smile
      ctx.strokeStyle = '#4a2a0a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x + 1, y + 4, 5, 0.15, Math.PI - 0.15); ctx.stroke();
    }

    // cracks
    if (damaged) {
      ctx.strokeStyle = 'rgba(80,40,10,0.5)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 16, y - 20); ctx.lineTo(x - 10, y - 10); ctx.lineTo(x - 12, y - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 14, y - 22); ctx.lineTo(x - 8, y - 14); ctx.stroke();
    }
    if (critical) {
      ctx.beginPath(); ctx.moveTo(x + 12, y - 22); ctx.lineTo(x + 6, y - 12); ctx.lineTo(x + 8, y - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 14, y - 24); ctx.lineTo(x + 10, y - 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y + 18); ctx.lineTo(x, y + 22); ctx.stroke();
    }

    this.drawHP(ctx, x, y, hr);
  }

  drawHP(ctx, x, y, hr) {
    if (this.hp >= this.maxHp) return;
    const bw = 32, bh = 3, bx = x - bw / 2, by = y - 36;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = hr > 0.5 ? '#4caf50' : hr > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(bx, by, bw * hr, bh);
  }
}

// ========================================================================
// ZOMBIE
// ========================================================================

class Zombie {
  constructor(x, y, row, cone) {
    this.x = x; this.y = y; this.row = row;
    this.cone = cone;
    this.hp = cone ? 200 : 100; this.maxHp = this.hp;
    this.speed = CONFIG.ZOMBIE_SPEED * (0.8 + Math.random() * 0.4);
    this.alive = true; this.eating = false;
    this.damage = 30 / 1000;
    this.anim = Math.random() * Math.PI * 2;
    this.slowTimer = 0;
  }

  draw(ctx) {
    const x = this.x, bob = Math.sin(this.anim) * 2 + Math.sin(this.anim * 2) * 0.5, y = this.y + bob;
    const frozen = this.slowTimer > 0;
    const damaged = this.hp / this.maxHp < 0.5;
    const critical = this.hp / this.maxHp < 0.25;
    const walkCycle = Math.sin(this.anim * 0.8);
    const armSwing = this.eating ? 0.3 : Math.sin(this.anim * 0.6) * 0.3;
    const bodyShift = Math.sin(this.anim * 0.6) * 0.5;

    const skinTone = frozen ? '#8ab0c8' : '#6b7a5a';
    const skinLight = frozen ? '#9ac0d8' : '#7a8a6a';
    const skinDark = frozen ? '#6a90a8' : '#5a6a4a';

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(x + bodyShift, y + 36, 20, 6, 0, 0, Math.PI * 2); ctx.fill();

    // === BODY ===
    // shirt/torso
    ctx.fillStyle = critical ? skinTone : '#7a8a72';
    ctx.fillRect(x - 14 + bodyShift * 0.3, y + 6, 28, 26);

    // tie
    ctx.fillStyle = critical ? '#6a2a2a' : '#8a2a2a';
    ctx.beginPath();
    ctx.moveTo(x - 2 + bodyShift * 0.3, y + 6);
    ctx.lineTo(x + 2 + bodyShift * 0.3, y + 6);
    ctx.lineTo(x + 3 + bodyShift * 0.3, y + 22);
    ctx.lineTo(x + bodyShift * 0.3, y + 26);
    ctx.lineTo(x - 3 + bodyShift * 0.3, y + 22);
    ctx.closePath(); ctx.fill();

    // collar
    ctx.fillStyle = '#c8c8c0';
    ctx.beginPath();
    ctx.moveTo(x - 10 + bodyShift * 0.3, y + 6);
    ctx.lineTo(x - 5 + bodyShift * 0.3, y + 11);
    ctx.lineTo(x - 1 + bodyShift * 0.3, y + 8);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 10 + bodyShift * 0.3, y + 6);
    ctx.lineTo(x + 5 + bodyShift * 0.3, y + 11);
    ctx.lineTo(x + 1 + bodyShift * 0.3, y + 8);
    ctx.closePath(); ctx.fill();

    // shirt buttons
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(x + bodyShift * 0.3, y + 14, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + bodyShift * 0.3, y + 20, 1.5, 0, Math.PI * 2); ctx.fill();

    // jacket lapels
    ctx.strokeStyle = '#5a6a4a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 14 + bodyShift * 0.3, y + 6); ctx.lineTo(x - 6 + bodyShift * 0.3, y + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 14 + bodyShift * 0.3, y + 6); ctx.lineTo(x + 6 + bodyShift * 0.3, y + 12); ctx.stroke();

    // belt
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 14 + bodyShift * 0.3, y + 26, 28, 3);

    // pants
    ctx.fillStyle = '#5a6a5a';
    ctx.fillRect(x - 12 + bodyShift * 0.3, y + 29, 10, 8);
    ctx.fillRect(x + 2 + bodyShift * 0.3, y + 29, 10, 8);

    // shoes
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.ellipse(x - 7 + bodyShift * 0.3, y + 39, 8, 3.5, walkCycle * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 7 + bodyShift * 0.3, y + 39, 8, 3.5, -walkCycle * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // === ARMS ===
    ctx.strokeStyle = skinTone; ctx.lineWidth = 7; ctx.lineCap = 'round';

    // left arm (behind, swinging)
    const ls = Math.sin(this.anim * 0.5 + 1) * 0.4 + 0.2;
    ctx.beginPath();
    ctx.moveTo(x - 14 + bodyShift * 0.3, y + 12);
    ctx.quadraticCurveTo(x - 24 + ls * 5, y + 14 + ls * 6, x - 20 + armSwing * 4, y + 28);
    ctx.stroke();

    // right arm (forward, reaching)
    const rs = Math.sin(this.anim * 0.5) * 0.4 + 0.2;
    ctx.strokeStyle = this.eating ? skinDark : skinTone;
    ctx.beginPath();
    ctx.moveTo(x + 14 + bodyShift * 0.3, y + 10);
    ctx.quadraticCurveTo(x + 26 + rs * 3, y + 8 + rs * 4, x + 32 + armSwing * 6, y + 6 + armSwing * 4);
    ctx.stroke();

    // hand/fingers
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(x + 32 + armSwing * 6, y + 6 + armSwing * 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // === HEAD ===
    ctx.fillStyle = skinLight;
    ctx.beginPath();
    ctx.arc(x + bodyShift * 0.2, y - 5, 18, 0, Math.PI * 2);
    ctx.fill();

    // jaw / chin shadow
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.ellipse(x + bodyShift * 0.2, y + 5, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // hair stubble
    ctx.strokeStyle = skinDark; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const hx = x - 14 + i * 5.5 + bodyShift * 0.2;
      ctx.beginPath(); ctx.moveTo(hx, y - 20); ctx.lineTo(hx - 1 + (i % 3) * 0.5, y - 24); ctx.stroke();
    }

    // receding hairline
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.ellipse(x + bodyShift * 0.2, y - 17, 12, 5, 0, Math.PI, 0);
    ctx.fill();

    // === EYES ===
    const eyeY = y - 6;
    // eye sockets
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath(); ctx.ellipse(x - 6 + bodyShift * 0.2, eyeY, 4.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 6 + bodyShift * 0.2, eyeY, 4.5, 4, 0, 0, Math.PI * 2); ctx.fill();

    // glowing red pupils
    const glowSize = critical ? 4 : 3;
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.arc(x - 6 + bodyShift * 0.2, eyeY, glowSize, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6 + bodyShift * 0.2, eyeY, glowSize, 0, Math.PI * 2); ctx.fill();

    // pupil shine
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(x - 6.5 + bodyShift * 0.2, eyeY - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5.5 + bodyShift * 0.2, eyeY - 1, 1.2, 0, Math.PI * 2); ctx.fill();

    // eye glow effect
    if (critical) {
      ctx.fillStyle = 'rgba(200,30,30,0.1)';
      ctx.beginPath(); ctx.arc(x - 6 + bodyShift * 0.2, eyeY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6 + bodyShift * 0.2, eyeY, 8, 0, Math.PI * 2); ctx.fill();
    }

    // === MOUTH ===
    if (this.eating) {
      // open chomping mouth
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath(); ctx.ellipse(x + 1 + bodyShift * 0.2, y + 4, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
      // teeth
      ctx.fillStyle = '#d4c898';
      ctx.fillRect(x - 4 + bodyShift * 0.2, y - 1, 2.5, 4);
      ctx.fillRect(x + 2 + bodyShift * 0.2, y - 1, 2.5, 4);
      ctx.fillRect(x - 4 + bodyShift * 0.2, y + 5, 2.5, 3);
      ctx.fillRect(x + 2 + bodyShift * 0.2, y + 5, 2.5, 3);
    } else {
      // open mouth with visible teeth
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.moveTo(x - 6 + bodyShift * 0.2, y + 3);
      ctx.quadraticCurveTo(x + 1 + bodyShift * 0.2, y + 10, x + 8 + bodyShift * 0.2, y + 3);
      ctx.lineTo(x + 8 + bodyShift * 0.2, y + 5);
      ctx.quadraticCurveTo(x + 1 + bodyShift * 0.2, y + 12, x - 6 + bodyShift * 0.2, y + 5);
      ctx.closePath(); ctx.fill();
      // teeth
      ctx.fillStyle = '#d4c898';
      for (let t = 0; t < 4; t++) {
        ctx.fillRect(x - 4 + t * 3.5 + bodyShift * 0.2, y + 2, 2, 3);
        ctx.fillRect(x - 3 + t * 3.5 + bodyShift * 0.2, y + 6, 2, 3);
      }
    }

    // wrinkles
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 8 + bodyShift * 0.2, y - 12); ctx.lineTo(x - 4 + bodyShift * 0.2, y - 10); ctx.stroke();

    // === CONE ===
    if (this.cone) {
      ctx.fillStyle = '#e8a020';
      ctx.beginPath();
      ctx.moveTo(x - 12 + bodyShift * 0.2, y - 18);
      ctx.lineTo(x + bodyShift * 0.2, y - 44);
      ctx.lineTo(x + 12 + bodyShift * 0.2, y - 18);
      ctx.closePath(); ctx.fill();

      ctx.strokeStyle = '#c88010'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12 + bodyShift * 0.2, y - 18);
      ctx.lineTo(x + bodyShift * 0.2, y - 44);
      ctx.lineTo(x + 12 + bodyShift * 0.2, y - 18);
      ctx.closePath(); ctx.stroke();

      // cone stripes
      ctx.strokeStyle = '#d49018'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 8 + bodyShift * 0.2, y - 23); ctx.lineTo(x + 8 + bodyShift * 0.2, y - 23); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6 + bodyShift * 0.2, y - 29); ctx.lineTo(x + 6 + bodyShift * 0.2, y - 29); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 4 + bodyShift * 0.2, y - 35); ctx.lineTo(x + 4 + bodyShift * 0.2, y - 35); ctx.stroke();
    }

    // blood splatter (when damaged)
    if (damaged) {
      ctx.fillStyle = 'rgba(150,30,30,0.3)';
      ctx.beginPath(); ctx.ellipse(x - 10 + bodyShift * 0.2, y + 8, 4, 3, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 8 + bodyShift * 0.2, y + 12, 3, 3, -0.3, 0, Math.PI * 2); ctx.fill();
    }

    // === ICE EFFECT ===
    if (frozen) {
      ctx.fillStyle = 'rgba(200,230,255,0.1)';
      ctx.beginPath(); ctx.arc(x + bodyShift * 0.2, y, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(200,230,255,0.15)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 22 + bodyShift * 0.2, y + Math.sin(a) * 18);
        ctx.lineTo(x + Math.cos(a) * 26 + bodyShift * 0.2, y + Math.sin(a) * 22);
        ctx.stroke();
      }
    }

    this.drawHP(ctx, x, y, bodyShift);
  }

  drawHP(ctx, x, y, bs) {
    if (this.hp < this.maxHp) {
      const bw = 32, bh = 4, bx = x - bw / 2 + bs * 0.2, by = y - 36;
      const r = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = r > 0.5 ? '#4caf50' : r > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillRect(bx, by, bw * r, bh);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    }
  }
}

// ========================================================================
// PROJECTILE
// ========================================================================

class Projectile {
  constructor(x, y, row, dir, damage, slow) {
    this.x = x; this.y = y; this.row = row;
    this.dir = dir; this.damage = damage; this.slow = slow || false;
    this.alive = true;
    this.vx = CONFIG.PEA_SPEED * dir;
  }

  draw(ctx) {
    if (this.slow) {
      // frost aura
      ctx.fillStyle = 'rgba(200,230,255,0.2)';
      ctx.beginPath(); ctx.arc(this.x, this.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(200,230,255,0.35)';
      ctx.beginPath(); ctx.arc(this.x, this.y, 7, 0, Math.PI * 2); ctx.fill();
      // ice pea
      const g = ctx.createRadialGradient(this.x - 1.5, this.y - 1.5, 1, this.x, this.y, 5);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#bbddff'); g.addColorStop(1, '#88bbdd');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); ctx.fill();
      // frost sparkle
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(this.x - 2, this.y - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    } else {
      // green glow
      ctx.fillStyle = 'rgba(106,176,76,0.2)';
      ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); ctx.fill();
      // pea
      const g = ctx.createRadialGradient(this.x - 1.5, this.y - 1.5, 1, this.x, this.y, 5);
      g.addColorStop(0, '#8acc6c'); g.addColorStop(0.6, '#6ab04c'); g.addColorStop(1, '#4a9030');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); ctx.fill();
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(this.x - 1.5, this.y - 1.5, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(this.x - 2, this.y - 2, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ========================================================================
// SUN
// ========================================================================

class Sun {
  constructor(x, y, targetY, value, fromSky) {
    this.x = x; this.y = y; this.targetY = targetY;
    this.value = value; this.fromSky = fromSky;
    this.collected = false;
    this.life = CONFIG.SUN_LIFETIME;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.bobY = 0;
  }

  draw(ctx) {
    const y = this.y + this.bobY;
    const pulse = 1 + Math.sin(this.bobTimer * 0.002) * 0.06;
    const rot = this.bobTimer * 0.0005;

    ctx.save();
    ctx.translate(this.x, y);
    ctx.scale(pulse, pulse);
    ctx.rotate(rot);

    // outer glow
    const og = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
    og.addColorStop(0, 'rgba(255,220,50,0.35)');
    og.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = og;
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();

    // main body
    const sg = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
    sg.addColorStop(0, '#ffe870'); sg.addColorStop(0.5, '#f5d742'); sg.addColorStop(1, '#e0b020');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();

    // rays
    ctx.strokeStyle = '#e8c020'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.stroke();
    }

    // inner ring
    ctx.fillStyle = '#e8a010';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#d49008';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();

    // highlight
    ctx.fillStyle = 'rgba(255,255,200,0.35)';
    ctx.beginPath(); ctx.arc(-3, -3, 4, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

// ========================================================================
// PARTICLE
// ========================================================================

class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.color = color; this.size = size || 3;
  }
}

// ========================================================================
// LAWN MOWER
// ========================================================================

class LawnMower {
  constructor(row) {
    this.row = row;
    this.x = CONFIG.GRID_X - 40;
    this.y = CONFIG.GRID_Y + row * CONFIG.CELL_H + CONFIG.CELL_H / 2;
    this.active = false;
    this.used = false;
    this.speed = 400 / 1000;
  }

  draw(ctx) {
    const x = this.active ? this.x : CONFIG.GRID_X - 40;
    const y = this.y;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.ellipse(x, y + 18, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

    // body
    ctx.fillStyle = '#9a4a3a';
    ctx.fillRect(x - 16, y - 14, 32, 28);
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(x - 12, y - 10, 24, 20);

    // blades
    ctx.fillStyle = '#555';
    ctx.fillRect(x - 18, y - 4, 4, 12);
    ctx.fillRect(x + 14, y - 4, 4, 12);

    // wheels
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(x - 8, y + 16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y + 16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(x - 8, y + 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8, y + 16, 4, 0, Math.PI * 2); ctx.fill();

    // handle
    ctx.fillStyle = '#e8b820';
    ctx.fillRect(x - 3, y - 18, 6, 6);
  }
}

// ========================================================================
// START
// ========================================================================

const game = new Game();
setInterval(() => game.updateCardStates(), 500);
