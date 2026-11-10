/**
 * ============================================================================
 * ANTIGRAVITY // 4D VISUAL & MOTION ENGINE
 * Interactive Motion Preview & Asset Inspector
 * 
 * Author: AG-0-04-1 [Interactive Motion & WebGL/Canvas Engineer]
 * Standards: Pure ES6+, Zero External Dependencies, High-DPI Canvas 2D/3D
 * ============================================================================
 */

'use strict';

/**
 * ----------------------------------------------------------------------------
 * 1. PARTICLE ENTITY
 * Represents an individual 3D-projected volumetric node in the cyber constellation
 * ----------------------------------------------------------------------------
 */
class Particle {
  constructor(width, height) {
    this.reset(width, height, true);
  }

  reset(width, height, randomizePosition = false) {
    // 3D coordinates: x, y in viewport space, z is depth factor (0.5 = far, 2.0 = near)
    this.z = 0.5 + Math.random() * 1.5;
    this.x = randomizePosition ? Math.random() * width : (Math.random() > 0.5 ? 0 : width);
    this.y = randomizePosition ? Math.random() * height : Math.random() * height;

    // Velocity components scaled by depth for parallax illusion
    const speed = (0.3 + Math.random() * 0.7) * (this.z * 0.6);
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // Radius scaled by z-depth
    this.baseRadius = 1.2 + Math.random() * 1.8;
    this.radius = this.baseRadius * (this.z * 0.75);

    // Color palette distribution adhering to cyber-engineering design tokens
    const rand = Math.random();
    if (rand < 0.45) {
      this.color = '#00FF88'; // Emerald Primary
    } else if (rand < 0.70) {
      this.color = '#00E5FF'; // Electric Cyan
    } else if (rand < 0.85) {
      this.color = '#8B5CF6'; // Accent Violet
    } else if (rand < 0.95) {
      this.color = '#10B981'; // Mint Green
    } else {
      this.color = '#FFFFFF'; // Pure White Core
    }

    // Luminance pulse phase for organic breathing effect
    this.pulseAngle = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.02 + Math.random() * 0.04;
    this.baseAlpha = 0.35 + (this.z / 2.0) * 0.55;
    this.alpha = this.baseAlpha;
  }

  setPalette(colors) {
    if (!colors || colors.length < 5) return;
    const rand = Math.random();
    if (rand < 0.45) {
      this.color = colors[0];
    } else if (rand < 0.70) {
      this.color = colors[1];
    } else if (rand < 0.85) {
      this.color = colors[2];
    } else if (rand < 0.95) {
      this.color = colors[3];
    } else {
      this.color = colors[4];
    }
  }

  update(width, height, mouse, repulsionRadius, speedMultiplier, enableRepulsion) {
    // Update breathing pulse
    this.pulseAngle += this.pulseSpeed;
    const pulseFactor = 0.85 + Math.sin(this.pulseAngle) * 0.15;
    this.alpha = Math.min(1.0, this.baseAlpha * pulseFactor);

    // Mouse Repulsion Physics
    if (enableRepulsion && mouse.active) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      const repRadiusSq = repulsionRadius * repulsionRadius;

      if (distSq < repRadiusSq && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        // Force scales inversely with distance, amplified by foreground depth
        const force = ((1 - dist / repulsionRadius) * 4.2 * (this.z / 1.5));
        const normalX = dx / dist;
        const normalY = dy / dist;

        this.vx += normalX * force * 0.35;
        this.vy += normalY * force * 0.35;
      }
    }

    // Velocity dampening to avoid runaway acceleration
    this.vx *= 0.96;
    this.vy *= 0.96;

    // Minimum ambient drift kick
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed < 0.2) {
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vy += (Math.random() - 0.5) * 0.1;
    }

    // Update position
    this.x += this.vx * speedMultiplier;
    this.y += this.vy * speedMultiplier;

    // Boundary wrapping with margin
    const margin = 20;
    if (this.x < -margin) this.x = width + margin;
    else if (this.x > width + margin) this.x = -margin;
    if (this.y < -margin) this.y = height + margin;
    else if (this.y > height + margin) this.y = -margin;
  }

  draw(ctx, enableGlow) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (enableGlow && this.z > 1.2) {
      // Soft energetic halo for foreground particles
      ctx.shadowBlur = 8 * (this.z / 1.5);
      ctx.shadowColor = this.color;
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * ----------------------------------------------------------------------------
 * 2. PARTICLE ENGINE
 * Manages 2D Canvas viewport, spatial constellation links, and physics loop
 * ----------------------------------------------------------------------------
 */
class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // Core Simulation Parameters
    this.particleCount = 160;
    this.linkDistance = 115;
    this.repulsionRadius = 120;
    this.speedMultiplier = 1.0;

    // Feature Toggles
    this.enableLinks = true;
    this.enableParticles = true;
    this.enableRepulsion = true;
    this.enableGlow = true;

    // Metrics State & Dynamic Shockwaves
    this.activeLinksCount = 0;
    this.particles = [];
    this.shockwaves = [];
    this.currentPalette = null;

    // Interactive Mouse Tracking
    this.mouse = {
      x: -1000,
      y: -1000,
      active: false
    };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Track mouse on entire window
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }, { passive: true });

    // Interactive Shockwave Emitter on Click
    window.addEventListener('click', (e) => {
      // Avoid triggering when clicking controls drawer
      if (!e.target.closest('#controlsDrawer') && !e.target.closest('#btnToggleDrawer')) {
        this.emitShockwave(e.clientX, e.clientY);
      }
    }, { passive: true });

    // Touch Event Handling for Mobile / Tablets
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }, { passive: true });

    this.populateParticles();
  }

  emitShockwave(x, y) {
    const color = this.currentPalette ? this.currentPalette[0] : '#00FF88';
    this.shockwaves.push({ x, y, radius: 0, maxRadius: 240, alpha: 0.88, color });
    if (window.cyberAudio) window.cyberAudio.playImpulse();
  }

  retheme(colors) {
    this.currentPalette = colors;
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].setPalette(colors);
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Scale drawing context for crisp retina rendering
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  populateParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(new Particle(this.width, this.height));
    }
  }

  setParticleCount(count) {
    count = Math.max(20, Math.min(400, count));
    this.particleCount = count;
    if (this.particles.length < count) {
      const diff = count - this.particles.length;
      for (let i = 0; i < diff; i++) {
        this.particles.push(new Particle(this.width, this.height));
      }
    } else if (this.particles.length > count) {
      this.particles.length = count;
    }
  }

  updateAndRender() {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    if (!this.enableParticles && !this.enableLinks) {
      this.activeLinksCount = 0;
      return;
    }

    // 1. Update all particle positions
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(
        width,
        height,
        this.mouse,
        this.repulsionRadius,
        this.speedMultiplier,
        this.enableRepulsion
      );
    }

    // 2. Draw Proximity Connection Conduits
    this.activeLinksCount = 0;
    if (this.enableLinks) {
      const maxDistSq = this.linkDistance * this.linkDistance;
      const count = this.particles.length;

      for (let i = 0; i < count; i++) {
        const p1 = this.particles[i];

        for (let j = i + 1; j < count; j++) {
          const p2 = this.particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            this.activeLinksCount++;
            const dist = Math.sqrt(distSq);
            const proximityRatio = 1 - (dist / this.linkDistance);

            // Distance & depth-weighted alpha
            const zAvg = (p1.z + p2.z) * 0.5;
            const lineAlpha = proximityRatio * 0.42 * (zAvg / 1.5);

            ctx.save();
            ctx.globalAlpha = Math.min(0.85, Math.max(0.04, lineAlpha));
            ctx.lineWidth = Math.max(0.5, 1.2 * (zAvg / 1.5) * proximityRatio);

            // Create dynamic linear gradient between the two connected nodes
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, p1.color);
            gradient.addColorStop(1, p2.color);
            ctx.strokeStyle = gradient;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    // 3. Draw Particle Nodes
    if (this.enableParticles) {
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].draw(ctx, this.enableGlow);
      }
    }

    // 4. Render Dynamic Quantum Impulse Shockwaves
    if (this.shockwaves.length > 0) {
      for (let s = this.shockwaves.length - 1; s >= 0; s--) {
        const sw = this.shockwaves[s];
        sw.radius += 5.5;
        sw.alpha *= 0.94;

        if (sw.radius >= sw.maxRadius || sw.alpha < 0.02) {
          this.shockwaves.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color || '#00FF88';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = sw.color || '#00FF88';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        // Push nearby particles with radial impulse
        for (let i = 0; i < this.particles.length; i++) {
          const p = this.particles[i];
          const dx = p.x - sw.x;
          const dy = p.y - sw.y;
          const dist = Math.hypot(dx, dy);
          if (Math.abs(dist - sw.radius) < 30 && dist > 0) {
            const impulse = (30 - Math.abs(dist - sw.radius)) * 0.15;
            p.x += (dx / dist) * impulse;
            p.y += (dy / dist) * impulse;
          }
        }
      }
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 3. PARALLAX CONTROLLER
 * 3D Stage perspective tilting with smooth linear interpolation (lerp)
 * ----------------------------------------------------------------------------
 */
class ParallaxController {
  constructor(cardWrapper, cardGlare) {
    this.cardWrapper = cardWrapper;
    this.cardGlare = cardGlare;

    // Transform State
    this.currentRotX = 0;
    this.currentRotY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.currentTranslateZ = 0;
    this.targetTranslateZ = 0;

    // Tuning Parameters
    this.sensitivity = 1.0;
    this.maxTilt = 13.0; // degrees
    this.lerpFactor = 0.08;
    this.zoom = 1.0;

    // Feature Toggles
    this.enableParallax = true;
    this.enableAutoOrbit = false;
    this.orbitTimer = 0;

    this.init();
  }

  init() {
    window.addEventListener('mousemove', (e) => {
      if (!this.enableParallax || this.enableAutoOrbit) return;

      const halfW = window.innerWidth * 0.5;
      const halfH = window.innerHeight * 0.5;

      // Normalized coordinates from screen center: [-1, +1]
      const nx = (e.clientX - halfW) / halfW;
      const ny = (e.clientY - halfH) / halfH;

      this.targetRotY = nx * this.maxTilt * this.sensitivity;
      this.targetRotX = -ny * this.maxTilt * this.sensitivity;
      this.targetTranslateZ = 18; // Lift forward toward camera
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      if (!this.enableAutoOrbit) {
        this.targetRotX = 0;
        this.targetRotY = 0;
        this.targetTranslateZ = 0;
      }
    }, { passive: true });

    // Gyroscope / DeviceOrientation on Mobile devices if supported
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (!this.enableParallax || this.enableAutoOrbit) return;
        if (e.gamma !== null && e.beta !== null) {
          // Gamma is left/right [-90, 90], Beta is front/back [-180, 180]
          const clampedGamma = Math.max(-30, Math.min(30, e.gamma));
          const clampedBeta = Math.max(10, Math.min(70, e.beta)) - 40; // centered at 40deg viewing angle

          this.targetRotY = (clampedGamma / 30) * this.maxTilt * this.sensitivity;
          this.targetRotX = -(clampedBeta / 30) * this.maxTilt * this.sensitivity;
        }
      }, { passive: true });
    }
  }

  update() {
    // Cinematic Idle Orbit Mode
    if (this.enableAutoOrbit) {
      this.orbitTimer += 0.016;
      this.targetRotY = Math.sin(this.orbitTimer) * (this.maxTilt * 0.75) * this.sensitivity;
      this.targetRotX = Math.cos(this.orbitTimer * 0.7) * (this.maxTilt * 0.5) * this.sensitivity;
      this.targetTranslateZ = 12;
    } else if (!this.enableParallax) {
      this.targetRotX = 0;
      this.targetRotY = 0;
      this.targetTranslateZ = 0;
    }

    // Smooth Linear Interpolation (lerp)
    this.currentRotX += (this.targetRotX - this.currentRotX) * this.lerpFactor;
    this.currentRotY += (this.targetRotY - this.currentRotY) * this.lerpFactor;
    this.currentTranslateZ += (this.targetTranslateZ - this.currentTranslateZ) * this.lerpFactor;

    // Apply 3D matrix transformation
    if (this.cardWrapper) {
      const rx = this.currentRotX.toFixed(2);
      const ry = this.currentRotY.toFixed(2);
      const tz = this.currentTranslateZ.toFixed(1);

      this.cardWrapper.style.transform = 
        `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px) scale(${this.zoom.toFixed(2)})`;
    }

    // Update Specular Glare position
    if (this.cardGlare) {
      const glareX = 50 + (this.currentRotY / this.maxTilt) * 45;
      const glareY = 50 - (this.currentRotX / this.maxTilt) * 45;
      this.cardGlare.style.background = 
        `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.16) 0%, transparent 65%)`;
    }

    return {
      rotX: this.currentRotX,
      rotY: this.currentRotY
    };
  }
}

/**
 * ----------------------------------------------------------------------------
 * 4. ASSET INSPECTOR
 * Manages switching between 5 flagship assets and 4 format tiers
 * ----------------------------------------------------------------------------
 */
class AssetInspector {
  constructor() {
    // Authoritative Asset Registry conforming to R2 and R3 specifications
    this.assets = {
      hero: {
        id: 'CARD_01 // HERO',
        name: 'Hero Banner',
        title: 'Distributed Agent Topology & Systems Architecture',
        dimensions: '1200 × 380',
        aspectRatio: '1200 / 380',
        paths: {
          'svg': '../assets/hero.svg',
          'motion-svg': '../assets/motion/hero-motion.svg',
          'gif': '../assets/animated/hero-motion.gif',
          'png': '../assets/static/hero.png'
        }
      },
      expertise: {
        id: 'CARD_02 // EXPERTISE',
        name: 'Expertise Taxonomy',
        title: 'Full-Stack & Systems Engineering Capability Matrix',
        dimensions: '1200 × 540',
        aspectRatio: '1200 / 540',
        paths: {
          'svg': '../assets/expertise.svg',
          'motion-svg': '../assets/motion/expertise-motion.svg',
          'gif': '../assets/animated/expertise-motion.gif',
          'png': '../assets/static/expertise.png'
        }
      },
      architecture: {
        id: 'CARD_03 // ARCHITECTURE',
        name: 'Architecture Flow',
        title: 'End-to-End Enterprise Data Flow & Pipeline Routing',
        dimensions: '1200 × 480',
        aspectRatio: '1200 / 480',
        paths: {
          'svg': '../assets/architecture.svg',
          'motion-svg': '../assets/motion/architecture-motion.svg',
          'gif': '../assets/animated/architecture-motion.gif',
          'png': '../assets/static/architecture.png'
        }
      },
      projects: {
        id: 'CARD_04 // PROJECTS',
        name: 'Featured Projects',
        title: 'Flagship Repositories, PravRaha & Enterprise CRM',
        dimensions: '1200 × 580',
        aspectRatio: '1200 / 580',
        paths: {
          'svg': '../assets/projects.svg',
          'motion-svg': '../assets/motion/projects-motion.svg',
          'gif': '../assets/animated/projects-motion.gif',
          'png': '../assets/static/projects.png'
        }
      },
      footer: {
        id: 'CARD_05 // FOOTER',
        name: 'Telemetry Footer',
        title: 'Cybernetic Telemetry Console & Verification Stamp',
        dimensions: '1200 × 220',
        aspectRatio: '1200 / 220',
        paths: {
          'svg': '../assets/footer.svg',
          'motion-svg': '../assets/motion/footer-motion.svg',
          'gif': '../assets/animated/footer-motion.gif',
          'png': '../assets/static/footer.png'
        }
      },
      storyline: {
        id: 'CARD_06 // STORYLINE',
        name: 'Mission Storyline',
        title: 'Cybernetic Mission Chronology & 5-Act Narrative Arc',
        dimensions: '1200 × 520',
        aspectRatio: '1200 / 520',
        paths: {
          'svg': '../assets/storyline.svg',
          'motion-svg': '../assets/motion/storyline-motion.svg',
          'gif': '../assets/animated/storyline-motion.gif',
          'png': '../assets/static/storyline.png'
        }
      }
    };

    this.formatLabels = {
      'svg': 'STANDALONE SVG',
      'motion-svg': 'MOTION SVG',
      'gif': 'ANIMATED GIF',
      'png': 'STATIC PNG'
    };

    this.currentAssetKey = 'hero';
    this.currentFormatKey = 'svg';

    this.dom = {
      img: document.getElementById('activeAssetImage'),
      fallback: document.getElementById('cardFallback'),
      fallbackTitle: document.getElementById('fallbackTitle'),
      fallbackMeta: document.getElementById('fallbackMeta'),
      fallbackPath: document.getElementById('fallbackPath'),
      headerId: document.getElementById('cardHeaderId'),
      headerTitle: document.getElementById('cardHeaderTitle'),
      headerDimensions: document.getElementById('cardHeaderDimensions'),
      headerFormat: document.getElementById('cardHeaderFormat'),
      footerPath: document.getElementById('cardFooterPath'),
      stageTarget: document.getElementById('stageCurrentTarget'),
      telemetryTarget: document.getElementById('telemetryTarget'),
      assetTabs: document.getElementById('assetTabs'),
      formatPills: document.getElementById('formatPills')
    };

    this.init();
  }

  init() {
    // Bind Tab Click Handlers
    if (this.dom.assetTabs) {
      this.dom.assetTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const assetKey = btn.dataset.asset;
        if (assetKey && this.assets[assetKey]) {
          this.setAsset(assetKey);
        }
      });
    }

    // Bind Format Pill Click Handlers
    if (this.dom.formatPills) {
      this.dom.formatPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (!btn) return;
        const formatKey = btn.dataset.format;
        if (formatKey && this.formatLabels[formatKey]) {
          this.setFormat(formatKey);
        }
      });
    }

    // Setup image error and load handlers
    if (this.dom.img) {
      this.dom.img.addEventListener('load', () => {
        this.dom.img.style.display = 'block';
        this.dom.img.style.opacity = '1';
        if (this.dom.fallback) this.dom.fallback.style.display = 'none';
      });

      this.dom.img.addEventListener('error', () => {
        const src = this.dom.img.getAttribute('src') || '';
        if (src.startsWith('assets/')) {
          this.dom.img.setAttribute('src', '../' + src);
          return;
        } else if (src.startsWith('../assets/')) {
          this.dom.img.setAttribute('src', src.substring(3));
          return;
        }
        this.dom.img.style.display = 'none';
        if (this.dom.fallback) {
          this.dom.fallback.style.display = 'flex';
          const asset = this.assets[this.currentAssetKey];
          const rawPath = asset.paths[this.currentFormatKey];
          const cleanPath = rawPath.replace(/^\.\.\//, '');
          if (this.dom.fallbackPath) this.dom.fallbackPath.textContent = cleanPath;
          if (this.dom.fallbackTitle) this.dom.fallbackTitle.textContent = `ASSET PENDING // ${asset.name.toUpperCase()}`;
          if (this.dom.fallbackMeta) {
            this.dom.fallbackMeta.innerHTML = `Format <strong>${this.formatLabels[this.currentFormatKey]}</strong> at <code>${cleanPath}</code> is being prepared or compiled.`;
          }
        }
      });
    }

    // Initial render
    this.syncUI();
  }

  setAsset(assetKey) {
    if (!this.assets[assetKey]) return;
    this.currentAssetKey = assetKey;

    // Update active tab styling
    const tabs = this.dom.assetTabs.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      const isActive = tab.dataset.asset === assetKey;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    this.syncUI();
  }

  setFormat(formatKey) {
    if (!this.formatLabels[formatKey]) return;
    this.currentFormatKey = formatKey;

    // Update active pill styling
    const pills = this.dom.formatPills.querySelectorAll('.pill-btn');
    pills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.format === formatKey);
    });

    this.syncUI();
  }

  syncUI() {
    const asset = this.assets[this.currentAssetKey];
    const formatLabel = this.formatLabels[this.currentFormatKey];
    const targetPath = asset.paths[this.currentFormatKey];
    const cleanPath = targetPath.replace(/^\.\.\//, '');

    // Header & Meta updates
    if (this.dom.headerId) this.dom.headerId.textContent = asset.id;
    if (this.dom.headerTitle) this.dom.headerTitle.textContent = asset.title;
    if (this.dom.headerDimensions) this.dom.headerDimensions.textContent = asset.dimensions;
    if (this.dom.headerFormat) this.dom.headerFormat.textContent = formatLabel;
    if (this.dom.footerPath) this.dom.footerPath.textContent = cleanPath;
    if (this.dom.stageTarget) this.dom.stageTarget.textContent = `${asset.name.toUpperCase()} (${asset.dimensions})`;
    if (this.dom.telemetryTarget) this.dom.telemetryTarget.textContent = `${asset.name.toUpperCase()} (${this.currentFormatKey.toUpperCase()})`;

    // Image Source Update with smooth opacity transition
    if (this.dom.img) {
      this.dom.img.style.opacity = '0';
      setTimeout(() => {
        this.dom.img.src = targetPath;
      }, 60);
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 5. HUD TELEMETRY MONITOR
 * Real-time performance diagnostics (FPS, Delta, Nodes, Tilt, Cursor, DPR)
 * ----------------------------------------------------------------------------
 */
class HUDTelemetry {
  constructor() {
    this.fpsEl = document.getElementById('telemetryFps');
    this.nodesEl = document.getElementById('telemetryParticles');
    this.linksEl = document.getElementById('telemetryLinks');
    this.deltaEl = document.getElementById('telemetryDelta');
    this.cursorEl = document.getElementById('telemetryCursor');
    this.tiltEl = document.getElementById('telemetryTilt');
    this.viewportEl = document.getElementById('telemetryViewport');
    this.clockEl = document.getElementById('telemetryClock');
    this.uptimeEl = document.getElementById('telemetryUptime');

    this.lastFrameTime = performance.now();
    this.sessionStart = performance.now();
    this.frameDeltas = [];
    this.maxSamples = 30;
    this.lastTelemetryUpdate = 0;

    // Mouse coordinates
    this.mouseX = 0;
    this.mouseY = 0;

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }, { passive: true });

    this.updateViewportReadout();
    window.addEventListener('resize', () => this.updateViewportReadout(), { passive: true });
  }

  updateViewportReadout() {
    if (this.viewportEl) {
      const dpr = (window.devicePixelRatio || 1).toFixed(1);
      this.viewportEl.textContent = `${window.innerWidth}×${window.innerHeight} @ ${dpr}x`;
    }
  }

  tick(currentTime, particleCount, linkCount, rotation) {
    const delta = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Rolling frame delta sample buffer
    this.frameDeltas.push(delta);
    if (this.frameDeltas.length > this.maxSamples) {
      this.frameDeltas.shift();
    }

    // Refresh UI readouts at ~10Hz for smooth readability without DOM thrashing
    if (currentTime - this.lastTelemetryUpdate > 95) {
      this.lastTelemetryUpdate = currentTime;

      const avgDelta = this.frameDeltas.reduce((a, b) => a + b, 0) / this.frameDeltas.length;
      const fps = Math.round(1000 / (avgDelta || 16.67));

      if (this.fpsEl) this.fpsEl.textContent = Math.min(120, fps);
      if (this.nodesEl) this.nodesEl.textContent = particleCount;
      if (this.linksEl) this.linksEl.textContent = linkCount;
      if (this.deltaEl) this.deltaEl.textContent = `${avgDelta.toFixed(1)}ms`;

      if (this.clockEl) {
        const now = new Date();
        this.clockEl.textContent = now.toTimeString().split(' ')[0];
      }
      if (this.uptimeEl) {
        const sec = Math.floor((currentTime - this.sessionStart) / 1000);
        this.uptimeEl.textContent = `${sec}s`;
      }

      if (this.cursorEl) {
        this.cursorEl.textContent = `X: ${this.mouseX}, Y: ${this.mouseY}`;
      }

      if (this.tiltEl && rotation) {
        const signX = rotation.rotX >= 0 ? '+' : '';
        const signY = rotation.rotY >= 0 ? '+' : '';
        this.tiltEl.textContent = `θx: ${signX}${rotation.rotX.toFixed(1)}°, θy: ${signY}${rotation.rotY.toFixed(1)}°`;
      }
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 6. CONTROLS & PALETTE MANAGER
 * Binds sliders, toggles, design token clipboard actions, and quick presets
 * ----------------------------------------------------------------------------
 */
class ControlsManager {
  constructor(engine, parallax) {
    this.engine = engine;
    this.parallax = parallax;

    this.drawer = document.getElementById('controlsDrawer');
    this.btnToggleDrawer = document.getElementById('btnToggleDrawer');
    this.btnCloseDrawer = document.getElementById('btnCloseDrawer');
    this.toast = document.getElementById('cyberToast');
    this.toastMessage = document.getElementById('toastMessage');

    this.init();
  }

  init() {
    // Drawer open / close triggers
    if (this.btnToggleDrawer && this.drawer) {
      this.btnToggleDrawer.addEventListener('click', () => {
        this.drawer.classList.toggle('open');
      });
    }

    if (this.btnCloseDrawer && this.drawer) {
      this.btnCloseDrawer.addEventListener('click', () => {
        this.drawer.classList.remove('open');
      });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawer && this.drawer.classList.contains('open')) {
        this.drawer.classList.remove('open');
      }
    });

    // Auto-detect OS prefers-reduced-motion setting
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTimeout(() => this.setReducedMotion(true), 100);
    }

    // 1. Particle Sliders
    this.bindSlider('sliderParticleCount', 'valParticleCount', '', (val) => {
      this.engine.setParticleCount(parseInt(val, 10));
    });

    this.bindSlider('sliderLinkDistance', 'valLinkDistance', 'px', (val) => {
      this.engine.linkDistance = parseInt(val, 10);
    });

    this.bindSlider('sliderRepulsion', 'valRepulsion', 'px', (val) => {
      this.engine.repulsionRadius = parseInt(val, 10);
    });

    this.bindSlider('sliderSpeed', 'valSpeed', 'x', (val) => {
      this.engine.speedMultiplier = parseFloat(val);
    });

    // 2. Camera Zoom & Parallax Sensitivity Sliders
    this.bindSlider('sliderCameraZoom', 'valCameraZoom', 'x', (val) => {
      this.parallax.zoom = parseFloat(val);
    });

    this.bindSlider('sliderParallax', 'valParallax', 'x', (val) => {
      this.parallax.sensitivity = parseFloat(val);
    });

    // 3. Feature Checkbox Toggles
    this.bindCheckbox('chkEnableLinks', (checked) => {
      this.engine.enableLinks = checked;
    });

    this.bindCheckbox('chkEnableParticles', (checked) => {
      this.engine.enableParticles = checked;
    });

    this.bindCheckbox('chkEnableParallax', (checked) => {
      this.parallax.enableParallax = checked;
    });

    this.bindCheckbox('chkEnableRepulsion', (checked) => {
      this.engine.enableRepulsion = checked;
    });

    this.bindCheckbox('chkEnableAutoOrbit', (checked) => {
      this.parallax.enableAutoOrbit = checked;
    });

    this.bindCheckbox('chkEnableGlow', (checked) => {
      this.engine.enableGlow = checked;
    });

    this.bindCheckbox('chkReducedMotion', (checked) => {
      this.setReducedMotion(checked);
    });

    // 4. Design Token Palette Swatches (Click to copy)
    const paletteGrid = document.getElementById('paletteGrid');
    if (paletteGrid) {
      paletteGrid.addEventListener('click', (e) => {
        const swatch = e.target.closest('.token-swatch');
        if (!swatch) return;
        const hex = swatch.dataset.token;
        const name = swatch.dataset.name;
        if (hex) {
          this.copyToClipboard(hex, `Copied ${name} (${hex}) to clipboard`);
        }
      });
    }

    // 5. Preset Configurations
    const presetsContainer = document.querySelector('.presets-row');
    if (presetsContainer) {
      presetsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-preset');
        if (!btn) return;
        this.applyPreset(btn.dataset.preset);
      });
    }

    // 6. Reset to Defaults
    const btnReset = document.getElementById('btnResetDefaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.applyPreset('balanced'));
    }
  }

  bindSlider(sliderId, labelId, suffix, callback) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (!slider) return;

    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      if (label) label.textContent = `${val}${suffix}`;
      callback(val);
    });
  }

  bindCheckbox(checkboxId, callback) {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;

    checkbox.addEventListener('change', (e) => {
      callback(e.target.checked);
    });
  }

  applyPreset(presetName) {
    const presets = {
      balanced: {
        count: 160,
        link: 115,
        repulsion: 120,
        speed: 1.0,
        parallax: 1.0,
        links: true,
        particles: true,
        repulsionEnabled: true,
        autoOrbit: false,
        glow: true
      },
      neural: {
        count: 240,
        link: 140,
        repulsion: 160,
        speed: 0.8,
        parallax: 1.2,
        links: true,
        particles: true,
        repulsionEnabled: true,
        autoOrbit: false,
        glow: true
      },
      nebula: {
        count: 90,
        link: 160,
        repulsion: 90,
        speed: 0.4,
        parallax: 1.5,
        links: true,
        particles: true,
        repulsionEnabled: true,
        autoOrbit: true,
        glow: true
      },
      performance: {
        count: 70,
        link: 85,
        repulsion: 80,
        speed: 1.0,
        parallax: 0.8,
        links: true,
        particles: true,
        repulsionEnabled: true,
        autoOrbit: false,
        glow: false
      }
    };

    const cfg = presets[presetName] || presets.balanced;

    // Apply values to Engine and Parallax
    this.engine.setParticleCount(cfg.count);
    this.engine.linkDistance = cfg.link;
    this.engine.repulsionRadius = cfg.repulsion;
    this.engine.speedMultiplier = cfg.speed;
    this.engine.enableLinks = cfg.links;
    this.engine.enableParticles = cfg.particles;
    this.engine.enableRepulsion = cfg.repulsionEnabled;
    this.engine.enableGlow = cfg.glow;

    this.parallax.sensitivity = cfg.parallax;
    this.parallax.enableAutoOrbit = cfg.autoOrbit;

    // Sync input sliders & labels
    this.updateInput('sliderParticleCount', 'valParticleCount', cfg.count, '');
    this.updateInput('sliderLinkDistance', 'valLinkDistance', cfg.link, 'px');
    this.updateInput('sliderRepulsion', 'valRepulsion', cfg.repulsion, 'px');
    this.updateInput('sliderSpeed', 'valSpeed', cfg.speed.toFixed(1), 'x');
    this.updateInput('sliderParallax', 'valParallax', cfg.parallax.toFixed(1), 'x');

    this.updateCheck('chkEnableLinks', cfg.links);
    this.updateCheck('chkEnableParticles', cfg.particles);
    this.updateCheck('chkEnableRepulsion', cfg.repulsionEnabled);
    this.updateCheck('chkEnableAutoOrbit', cfg.autoOrbit);
    this.updateCheck('chkEnableGlow', cfg.glow);

    this.showToast(`Applied preset: ${presetName.toUpperCase()}`);
  }

  updateInput(sliderId, labelId, value, suffix) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (slider) slider.value = value;
    if (label) label.textContent = `${value}${suffix}`;
  }

  updateCheck(checkId, checked) {
    const el = document.getElementById(checkId);
    if (el) el.checked = checked;
  }

  copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMsg);
      }).catch(() => {
        this.fallbackCopy(text, successMsg);
      });
    } else {
      this.fallbackCopy(text, successMsg);
    }
  }

  fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast(successMsg);
    } catch (err) {
      this.showToast(`Selected ${text}`);
    }
    document.body.removeChild(ta);
  }

  setReducedMotion(enabled) {
    if (enabled) {
      this.parallax.enableParallax = false;
      this.parallax.enableAutoOrbit = false;
      this.parallax.targetRotX = 0;
      this.parallax.targetRotY = 0;
      this.engine.speedMultiplier = 0.05;
      this.engine.enableGlow = false;
      const statusLabel = document.querySelector('.status-label');
      if (statusLabel) {
        statusLabel.innerHTML = 'SYS_STATE: <strong class="text-cyan">REDUCED_MOTION</strong>';
      }
      this.showToast('Reduced Motion Mode Activated');
    } else {
      this.parallax.enableParallax = true;
      this.engine.speedMultiplier = 1.0;
      this.engine.enableGlow = true;
      const statusLabel = document.querySelector('.status-label');
      if (statusLabel) {
        statusLabel.innerHTML = 'SYS_STATE: <strong class="text-emerald">ACTIVE_SIMULATION</strong>';
      }
      this.showToast('Standard 4D Motion Mode Restored');
    }
    this.updateCheck('chkReducedMotion', enabled);
  }

  showToast(message) {
    if (!this.toast) return;
    if (this.toastMessage) this.toastMessage.textContent = message;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2400);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 7. PROCEDURAL CYBERNETIC SYNTHESIZER
 * Zero-dependency Web Audio API procedural audio generator
 * ----------------------------------------------------------------------------
 */
class CyberAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.init();
      this.startDrone();
    } else {
      this.stopDrone();
    }
    return this.enabled;
  }

  startDrone() {
    if (!this.enabled || !this.ctx) return;
    if (this._droneOsc) return;
    try {
      this._droneOsc = this.ctx.createOscillator();
      this._droneGain = this.ctx.createGain();
      this._droneFilter = this.ctx.createBiquadFilter();

      this._droneOsc.type = 'sawtooth';
      this._droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this._droneFilter.type = 'lowpass';
      this._droneFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this._droneFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this._droneGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this._droneGain.gain.exponentialRampToValueAtTime(0.012, this.ctx.currentTime + 1.5);

      this._droneOsc.connect(this._droneFilter);
      this._droneFilter.connect(this._droneGain);
      this._droneGain.connect(this.ctx.destination);
      this._droneOsc.start();
    } catch (e) {}
  }

  stopDrone() {
    if (this._droneGain && this.ctx) {
      try {
        this._droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          if (this._droneOsc) {
            try {
              this._droneOsc.stop();
              this._droneOsc.disconnect();
            } catch (err) {}
            this._droneOsc = null;
          }
        }, 850);
      } catch (e) {
        this._droneOsc = null;
      }
    }
  }

  playArchLayerChord(layerIndex) {
    if (!this.enabled || !this.ctx) return;
    const chords = [
      [261.63, 329.63, 392.00],
      [293.66, 369.99, 440.00],
      [329.63, 415.30, 493.88],
      [349.23, 440.00, 523.25],
      [392.00, 493.88, 587.33],
      [440.00, 554.37, 659.25]
    ];
    const freqs = chords[layerIndex % chords.length] || chords[0];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.22, 0.035), i * 40);
    });
  }

  playTone(freq = 440, type = 'sine', duration = 0.12, gainVal = 0.04) {
    if (!this.enabled || !this.ctx) return;
    try {
      this.triggerSpectrum(Math.round(duration * 1000) + 60);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // AudioContext policy suppression safe-catch
    }
  }

  triggerSpectrum(duration = 200) {
    const el = document.getElementById('audioSpectrum');
    if (!el) return;
    el.classList.add('playing');
    if (this._spectrumTimer) clearTimeout(this._spectrumTimer);
    this._spectrumTimer = setTimeout(() => {
      el.classList.remove('playing');
    }, duration);
  }

  playImpulse() {
    this.playTone(660, 'sine', 0.18, 0.05);
    setTimeout(() => this.playTone(880, 'sine', 0.12, 0.03), 40);
  }

  playShockwave() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.30);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.30);
    } catch (e) {}
  }

  playKeyClick() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    } catch (e) {}
  }

  playChime() {
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.16, 0.035), i * 55);
    });
  }

  playStoryActChord(actIndex) {
    if (!this.enabled || !this.ctx) return;
    const chords = [
      [220, 440, 554.37],     // Act 1: A major military clarion
      [293.66, 440, 587.33],   // Act 2: D carrier frequency
      [329.63, 493.88, 659.25],// Act 3: E hackathon crucible
      [349.23, 523.25, 698.46],// Act 4: F neural swarm
      [392, 587.33, 783.99]    // Act 5: G sovereign horizons
    ];
    const freqs = chords[actIndex % chords.length] || chords[0];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.20, 0.035), i * 45);
    });
  }

  playExecute() {
    this.playTone(587.33, 'triangle', 0.10, 0.04);
    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.04), 45);
  }

  playAlert() {
    this.playTone(320, 'sawtooth', 0.12, 0.04);
    setTimeout(() => this.playTone(240, 'sawtooth', 0.15, 0.04), 80);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 8. DYNAMIC CYBER THEME MANAGER
 * Switches live CSS tokens, particle distribution palettes, and UI accents
 * ----------------------------------------------------------------------------
 */
class CyberThemeManager {
  static THEMES = {
    matrix: {
      key: 'matrix',
      name: 'MATRIX CYBER',
      primary: '#00FF88',
      secondary: '#00E5FF',
      accent: '#8B5CF6',
      colors: ['#00FF88', '#00E5FF', '#8B5CF6', '#10B981', '#FFFFFF']
    },
    synthwave: {
      key: 'synthwave',
      name: 'SYNTHWAVE SUNSET',
      primary: '#FF007F',
      secondary: '#00F0FF',
      accent: '#FFE600',
      colors: ['#FF007F', '#00F0FF', '#FFE600', '#FF52B0', '#FFFFFF']
    },
    cyberpunk: {
      key: 'cyberpunk',
      name: 'CYBERPUNK GOLD',
      primary: '#FFE600',
      secondary: '#00E5FF',
      accent: '#FF2A55',
      colors: ['#FFE600', '#00E5FF', '#FF2A55', '#FACC15', '#FFFFFF']
    },
    abyssal: {
      key: 'abyssal',
      name: 'DEEP ABYSSAL',
      primary: '#00FFA3',
      secondary: '#38BDF8',
      accent: '#6366F1',
      colors: ['#00FFA3', '#38BDF8', '#6366F1', '#6EE7B7', '#FFFFFF']
    }
  };

  constructor(engine, audio) {
    this.engine = engine;
    this.audio = audio;
    this.themeKeys = Object.keys(CyberThemeManager.THEMES);
    this.currentIndex = 0;
    this.lblTheme = document.getElementById('lblThemeName');
    this.btnToggle = document.getElementById('btnToggleTheme');

    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.cycle());
    }
  }

  getCurrentTheme() {
    return CyberThemeManager.THEMES[this.themeKeys[this.currentIndex]];
  }

  cycle() {
    this.currentIndex = (this.currentIndex + 1) % this.themeKeys.length;
    this.apply(this.themeKeys[this.currentIndex]);
  }

  apply(key) {
    const theme = CyberThemeManager.THEMES[key];
    if (!theme) return;
    this.currentIndex = this.themeKeys.indexOf(key);

    if (key === 'matrix') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = key;
    }

    if (this.lblTheme) {
      this.lblTheme.textContent = theme.name.split(' ')[0];
    }

    if (this.engine) {
      this.engine.retheme(theme.colors);
    }

    if (this.audio) {
      this.audio.playChime();
    }

    HUDTelemetry.showToast(`Theme switched: ${theme.name}`);
  }
}

/**
 * ----------------------------------------------------------------------------
 * 8.5 INTERACTIVE CYBERNETIC MISSION STORYLINE THEATER
 * 5-Act Narrative Odyssey: Military Discipline -> Carrier Telephony -> 
 * National Crucible -> Multi-Agent Swarms -> Sovereign Horizons
 * ----------------------------------------------------------------------------
 */
class StorylineTheaterManager {
  constructor(engine, audio, inspector) {
    this.engine = engine;
    this.audio = audio;
    this.inspector = inspector;
    this.modal = document.getElementById('storylineModal');
    this.btnToggle = document.getElementById('btnToggleStoryline');
    this.btnClose = document.getElementById('btnCloseStoryline');
    this.btnPrev = document.getElementById('btnStoryPrev');
    this.btnPlay = document.getElementById('btnStoryPlay');
    this.btnNext = document.getElementById('btnStoryNext');
    this.progressFill = document.getElementById('storylineProgressFill');
    this.progressBar = document.getElementById('storylineProgressBar');
    this.actBadge = document.getElementById('storylineActBadge');
    this.actIndexLabel = document.getElementById('storylineActIndex');
    this.actCountLabel = document.getElementById('storylineActCount');
    this.actTitle = document.getElementById('storylineActTitle');
    this.actSubtitle = document.getElementById('storylineActSubtitle');
    this.actText = document.getElementById('storylineActText');
    this.actMetrics = document.getElementById('storylineActMetrics');
    this.theaterCard = document.getElementById('storylineTheaterCard');

    this.actTabs = [
      document.getElementById('actTab1'),
      document.getElementById('actTab2'),
      document.getElementById('actTab3'),
      document.getElementById('actTab4'),
      document.getElementById('actTab5')
    ];

    this.isOpen = false;
    this.currentAct = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.typewriterTimer = null;

    this.acts = [
      {
        badge: 'ACT 01 // DISCIPLINE',
        phase: 'PHASE 1 OF 5',
        title: 'The Military Forge: Cadet to Sergeant',
        subtitle: '19 Jharkhand Bn NCC · Best Cadet 2019 · Black Belt 1st Dan',
        narrative: 'Before writing a single line of distributed software, I forged operational discipline under the cadence of the National Cadet Corps (19 Jharkhand Bn). Rising from Cadet to Sergeant rank, and earning Best Cadet in 2019 alongside a Taekwondo 1st Dan Black Belt, this crucible forged unbreakable physical stamina, mental poise under stress, and relentless execution standards.',
        color: '#00FF88',
        metrics: [
          'Best Cadet 2019',
          'Sergeant (SGT)',
          'Black Belt 1st Dan',
          'Mental Composure',
          'Zero-Compromise Rigor'
        ]
      },
      {
        badge: 'ACT 02 // CARRIER',
        phase: 'PHASE 2 OF 5',
        title: 'Physical Carrier Systems: Telecom Exchange',
        subtitle: 'BSNL Telecom Exchange Immersion · Optical Fiber & Routing',
        narrative: 'At BSNL regional telecom exchanges, I ventured beneath software abstractions directly into physical layer telecommunications. Handled GPON optical distribution, main distribution frame (MDF) wiring, and OTDR signal attenuation diagnostics. Understanding signal propagation, physical packet collisions, and hardware topologies established an instinct for real-world reliability.',
        color: '#00D9FF',
        metrics: [
          'GPON FTTH Networks',
          'OTDR Waveform Diagnostics',
          'MDF Wire Topologies',
          'Carrier-Grade Reliability',
          'Hardware-Level Protocols'
        ]
      },
      {
        badge: 'ACT 03 // CRUCIBLE',
        phase: 'PHASE 3 OF 5',
        title: 'The National Crucible: Build with Bharat @ NIT Delhi',
        subtitle: 'National Semi-Finalist · Team Lead: Team SHIVI@808 (Top 471 / 5,000)',
        narrative: 'Leading Team SHIVI@808 at NIT Delhi in a high-velocity 36-hour hackathon crucible, we competed against 5,000 national engineering teams. Architected dynamic emergency vehicle priority dispatching with sub-second Dijkstra corridor routing and real-time geofencing. Placing in the top 471 nationwide proved our ability to execute complex architectures under high pressure.',
        color: '#FFB84D',
        metrics: [
          'Top 471 / 5,000 Teams',
          'Lead: Team SHIVI@808',
          'Sub-Second Geo-Routing',
          'Dynamic Signal Priority',
          '36-Hour Hackathon Sprint'
        ]
      },
      {
        badge: 'ACT 04 // SWARMS',
        phase: 'PHASE 4 OF 5',
        title: 'Distributed Agent Swarms: PravRaha / ShiVi Control Plane',
        subtitle: '38 Specialized Micro-Agents · 100 Domain Engines · 471 Passing Tests',
        narrative: 'Transformed engineering focus into autonomous multi-agent systems. Architected the PravRaha / ShiVi RevOps control plane: 38 specialized micro-agents coordinating across 100 domain engines, pgvector semantic embeddings, and Model Context Protocol (MCP) integrations. Backed by 471 passing Vitest assertions across 167 suites, proving that AI systems must be governed by deterministic engineering contracts.',
        color: '#8B5CF6',
        metrics: [
          '38 Specialized Agents',
          '471 Passing Assertions',
          '167 Test Suites',
          'pgvector Retrieval',
          'Zero-Hallucination Guardrails'
        ]
      },
      {
        badge: 'ACT 05 // HORIZONS',
        phase: 'PHASE 5 OF 5',
        title: 'Sovereign Horizons: Offline Tribal RAG & ANTARES Swarms',
        subtitle: 'BhashaSetu Offline RAG · High-Assurance Rust · Sovereign Edge',
        narrative: 'Pushing systems engineering to sovereign and air-gapped frontiers. Architected BhashaSetu: offline-first RAG for indigenous tribal languages (Santhali, Ho, Mundari) with edge bidirectional synchronization. Pioneering high-throughput Rust control planes, zero-trust cryptographic verification, and ANTARES-10K swarm orchestration for the next era of high-assurance computing.',
        color: '#00DFA5',
        metrics: [
          'Offline Tribal RAG',
          'Santhali / Ho / Mundari',
          'High-Assurance Rust',
          'Bidirectional Sync',
          'ANTARES Swarm Orchestration'
        ]
      }
    ];

    this.init();
  }

  init() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.prev());
    }
    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.next());
    }
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.toggleAutoPlay());
    }

    this.actTabs.forEach((tab, idx) => {
      if (tab) {
        tab.addEventListener('click', () => this.goToAct(idx));
      }
    });

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }

    this.renderAct(0, false);
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    if (this.btnToggle) this.btnToggle.classList.add('active');
    if (this.audio) this.audio.playChime();
    this.renderAct(this.currentAct, true);
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    if (this.btnToggle) this.btnToggle.classList.remove('active');
    this.stopAutoPlay();
  }

  next() {
    const nextIdx = (this.currentAct + 1) % this.acts.length;
    this.goToAct(nextIdx);
  }

  prev() {
    const prevIdx = (this.currentAct - 1 + this.acts.length) % this.acts.length;
    this.goToAct(prevIdx);
  }

  goToAct(index) {
    if (index < 0 || index >= this.acts.length) return;
    this.currentAct = index;
    this.renderAct(index, true);
  }

  toggleAutoPlay() {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    this.isPlaying = true;
    if (this.btnPlay) {
      this.btnPlay.textContent = '⏸ PAUSE';
      this.btnPlay.classList.add('active');
    }
    this.playTimer = setInterval(() => {
      this.next();
    }, 6000);
  }

  stopAutoPlay() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (this.btnPlay) {
      this.btnPlay.textContent = '▶ AUTO';
      this.btnPlay.classList.remove('active');
    }
  }

  renderAct(index, playFeedback = true) {
    const act = this.acts[index];
    if (!act) return;

    if (this.actBadge) {
      this.actBadge.textContent = act.badge;
      this.actBadge.style.borderColor = act.color;
      this.actBadge.style.color = act.color;
      this.actBadge.style.background = `${act.color}18`;
    }
    if (this.actIndexLabel) this.actIndexLabel.textContent = act.phase;
    if (this.actTitle) this.actTitle.textContent = act.title;
    if (this.actSubtitle) {
      this.actSubtitle.textContent = act.subtitle;
      this.actSubtitle.style.color = act.color;
    }

    // Typewriter narrative effect
    if (this.actText) {
      if (this.typewriterTimer) clearInterval(this.typewriterTimer);
      this.actText.style.borderLeftColor = act.color;
      const fullText = act.narrative;
      if (playFeedback) {
        this.actText.textContent = '';
        let charIdx = 0;
        this.typewriterTimer = setInterval(() => {
          if (charIdx < fullText.length) {
            this.actText.textContent += fullText[charIdx];
            charIdx++;
          } else {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
          }
        }, 12);
      } else {
        this.actText.textContent = fullText;
      }
    }

    // Metrics pills
    if (this.actMetrics) {
      this.actMetrics.innerHTML = '';
      act.metrics.forEach((m) => {
        const pill = document.createElement('span');
        pill.className = 'story-metric-pill';
        pill.style.borderColor = `${act.color}55`;
        pill.style.color = act.color;
        pill.innerHTML = `<span class="dot" style="background: ${act.color}"></span>${m}`;
        this.actMetrics.appendChild(pill);
      });
    }

    // Progress bar fill
    if (this.progressFill) {
      const pct = ((index + 1) / this.acts.length) * 100;
      this.progressFill.style.width = `${pct}%`;
      this.progressFill.style.background = `linear-gradient(90deg, #00FF88, ${act.color})`;
      this.progressFill.style.boxShadow = `0 0 10px ${act.color}`;
    }

    // Update active tab buttons
    this.actTabs.forEach((tab, i) => {
      if (tab) {
        tab.classList.toggle('active', i === index);
        if (i === index) {
          tab.style.borderColor = act.color;
          tab.style.background = `${act.color}22`;
        } else {
          tab.style.borderColor = '';
          tab.style.background = '';
        }
      }
    });

    if (playFeedback) {
      if (this.audio) {
        this.audio.playStoryActChord(index);
      }
      if (this.engine) {
        this.engine.retheme([act.color, '#00D9FF', '#8B5CF6']);
        this.engine.emitShockwave(window.innerWidth / 2, window.innerHeight / 2);
      }
      HUDTelemetry.showToast(`Storyline: ${act.badge}`);
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 8.6 INTERACTIVE SYSTEMS ARCHITECTURE EXPLORER MODAL
 * 6-layer distributed control plane explorer with real-time specs & audio feedback
 * ----------------------------------------------------------------------------
 */
class ArchitectureExplorerManager {
  constructor(engine, audio) {
    this.engine = engine;
    this.audio = audio;
    this.modal = document.getElementById('architectureModal');
    this.theaterCard = document.getElementById('architectureTheaterCard');
    this.btnToggle = document.getElementById('btnToggleArchitecture');
    this.btnClose = document.getElementById('btnCloseArchitecture');
    this.btnPrev = document.getElementById('btnArchPrev');
    this.btnNext = document.getElementById('btnArchNext');

    this.layerBadge = document.getElementById('archLayerBadge');
    this.latencyPill = document.getElementById('archLatencyPill');
    this.protocolPill = document.getElementById('archProtocolPill');
    this.layerTitle = document.getElementById('archLayerTitle');
    this.layerDesc = document.getElementById('archLayerDesc');
    this.specTech = document.getElementById('archSpecTech');
    this.specSec = document.getElementById('archSpecSec');
    this.specGuar = document.getElementById('archSpecGuar');

    this.layerButtons = [
      document.getElementById('archLayer0'),
      document.getElementById('archLayer1'),
      document.getElementById('archLayer2'),
      document.getElementById('archLayer3'),
      document.getElementById('archLayer4'),
      document.getElementById('archLayer5')
    ];

    this.isOpen = false;
    this.currentLayer = 0;

    this.layers = [
      {
        badge: 'LAYER 01 // EXPERIENCE & PRESENTATION',
        latency: 'RENDER: <50ms EDGE',
        protocol: 'PROTOCOL: HTTP/3 · SSE · RSC',
        title: 'Next.js 15 App Router & React 19 Concurrent Streaming',
        desc: 'Zero-drift typed presentation layer utilizing Next.js 15 App Router, React 19 concurrent streams, and client-side web workers. High-frequency telemetry displays and interactive cybernetic controls render at 60 FPS with deterministic component boundary isolation.',
        tech: 'React 19, Next.js 15, TypeScript 5, Tailwind CSS, Zod',
        security: 'Strict Boundary Schema Validation & CSP Nonces',
        guarantee: 'Zero-Drift End-to-End Type Safety Across Network',
        color: '#00FF88'
      },
      {
        badge: 'LAYER 02 // GATEWAY & PERIMETER GUARD',
        latency: 'INGRESS: <12ms EDGE',
        protocol: 'PROTOCOL: QUIC · TLS 1.3 · mTLS',
        title: 'Cloudflare Edge Mesh & Cryptographic Reverse Proxy',
        desc: 'Distributed ingress gateway enforcing edge rate-limiting, geo-distributed IP reputation scoring, HMAC request verification, and sub-second DDoS mitigation. Acts as the zero-trust perimeter isolating public clients from internal service topologies.',
        tech: 'Cloudflare Workers, NGINX Reverse Proxy, Rust Ingress, JWT / JWKS',
        security: 'Token Bucket Rate Limiting, OWASP Top 10 Ingress Rules, WAF Inspection',
        guarantee: 'Zero-Trust Boundary with Cryptographic Ingress Attestation',
        color: '#00D9FF'
      },
      {
        badge: 'LAYER 03 // SERVICE CONTROL PLANE CORE',
        latency: 'LATENCY: <25ms p99',
        protocol: 'PROTOCOL: gRPC · Protobuf · REST',
        title: 'Asynchronous FastAPI Microservices & SQLAlchemy Async Engine',
        desc: 'Modular backend microservices managing asynchronous business workflows, lead enrichment pipelines, CRM synchronization, and multi-tenant telemetry. Powered by strict Pydantic v2 schemas and SQLAlchemy 2.0 async session pools.',
        tech: 'FastAPI, Pydantic v2, Python 3.12+, SQLAlchemy 2.0 Async, Celery',
        security: 'Role-Based Access Control (RBAC), Row-Level Tenant Security, Audit Logs',
        guarantee: '100% Deterministic Schema Validation & Idempotent API Contracts',
        color: '#FFB84D'
      },
      {
        badge: 'LAYER 04 // AUTONOMOUS AGENT SWARM MESH',
        latency: 'SWARM: <350ms TURN',
        protocol: 'PROTOCOL: MCP · JSON-RPC 2.0 · WebSocket',
        title: '38-Agent Autonomous Swarm Coordination & MCP Mesh',
        desc: 'Hierarchical multi-agent network (PravRaha / ShiVi) featuring 38 specialized micro-agents coordinating across 100 domain engines. Equipped with Model Context Protocol (MCP) tool execution, pgvector semantic context retrieval, and reverse LIFO rollback state machines.',
        tech: 'LangChain / LangGraph, Model Context Protocol (MCP), pgvector, Ollama / Groq',
        security: 'Self-Reflective Guardrails, Tool Execution Whitelisting, Anti-Hallucination Asserts',
        guarantee: 'Formal Contract Enforcement via 471 Passing Vitest Assertions',
        color: '#8B5CF6'
      },
      {
        badge: 'LAYER 05 // PERSISTENT STATE & VECTOR STORAGE',
        latency: 'CACHE: <2ms / VECTOR: <15ms',
        protocol: 'PROTOCOL: TCP Native · RESP · libpq',
        title: 'Dual-Engine PostgreSQL 16 (pgvector) & Redis 7 Cluster',
        desc: 'High-assurance persistence layer combining PostgreSQL 16 with pgvector for high-dimensional semantic search and Redis 7 cluster for sub-millisecond session caching and distributed lock arbitration. Zero data loss guaranteed by write-ahead logging (WAL).',
        tech: 'PostgreSQL 16, pgvector (HNSW Indexing), Redis 7, Prisma / Alembic',
        security: 'Transparent Data Encryption (TDE), Automated Point-in-Time Recovery (PITR)',
        guarantee: 'ACID Compliance with <2ms Hot Cache Hit & Zero Vector Drift',
        color: '#EC4899'
      },
      {
        badge: 'LAYER 06 // DEVOPS & CONTINUOUS INTEGRITY',
        latency: 'CI LOOP: <4min E2E',
        protocol: 'PROTOCOL: SSH · Git HTTPS · OCI',
        title: 'GitOps Pipeline, Multi-Stage Docker & 4-Tier Automated Verification',
        desc: 'Autonomous deployment mesh featuring Docker multi-stage builds, GitHub Actions matrix CI, and the custom 4-Tier Automated Verification Engine. Enforces 100% test pass rate across syntactic, boundary, integration, and rendering tiers prior to production rollout.',
        tech: 'GitHub Actions, Docker, Linux / Alpine, Shell, Python 3.14 Harness',
        security: 'Signed Commits, Minimal Distroless Containers, Secretless OIDC Auth',
        guarantee: 'Zero-Pollution Clean Root Contract & 100% Regression-Free Deployments',
        color: '#00DFA5'
      }
    ];

    this.init();
  }

  init() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.prev());
    }
    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.next());
    }

    this.layerButtons.forEach((btn, idx) => {
      if (btn) {
        btn.addEventListener('click', () => this.goToLayer(idx));
      }
    });

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }

    this.renderLayer(0, false);
  }

  open() {
    if (!this.modal) return;
    this.isOpen = true;
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    if (this.btnToggle) this.btnToggle.classList.add('active');
    if (this.audio) {
      this.audio.playChime();
      this.audio.playArchLayerChord(this.currentLayer);
    }
  }

  close() {
    if (!this.modal) return;
    this.isOpen = false;
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    if (this.btnToggle) this.btnToggle.classList.remove('active');
    if (this.audio) this.audio.playKeyClick();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  prev() {
    const nextIdx = (this.currentLayer - 1 + this.layers.length) % this.layers.length;
    this.goToLayer(nextIdx);
  }

  next() {
    const nextIdx = (this.currentLayer + 1) % this.layers.length;
    this.goToLayer(nextIdx);
  }

  goToLayer(index) {
    if (index < 0 || index >= this.layers.length) return;
    this.currentLayer = index;
    this.renderLayer(index, true);
  }

  renderLayer(index, playFeedback = false) {
    const layer = this.layers[index];
    if (!layer) return;

    this.layerButtons.forEach((btn, idx) => {
      if (!btn) return;
      btn.classList.toggle('active', idx === index);
      if (idx === index) {
        btn.style.borderColor = layer.color;
        btn.style.background = `${layer.color}22`;
      } else {
        btn.style.borderColor = '';
        btn.style.background = '';
      }
    });

    if (this.layerBadge) {
      this.layerBadge.textContent = layer.badge;
      this.layerBadge.style.color = layer.color;
      this.layerBadge.style.borderColor = layer.color;
    }
    if (this.latencyPill) this.latencyPill.textContent = layer.latency;
    if (this.protocolPill) this.protocolPill.textContent = layer.protocol;
    if (this.layerTitle) this.layerTitle.textContent = layer.title;
    if (this.layerDesc) {
      this.layerDesc.textContent = layer.desc;
      this.layerDesc.style.borderLeftColor = layer.color;
    }
    if (this.specTech) this.specTech.textContent = layer.tech;
    if (this.specSec) this.specSec.textContent = layer.security;
    if (this.specGuar) this.specGuar.textContent = layer.guarantee;

    if (playFeedback) {
      if (this.audio) {
        this.audio.playKeyClick();
        this.audio.playArchLayerChord(index);
      }
      if (this.engine) {
        this.engine.retheme([layer.color, '#00D9FF', '#8B5CF6']);
        this.engine.emitShockwave(window.innerWidth / 2, window.innerHeight / 2);
      }
      HUDTelemetry.showToast(`Architecture: ${layer.badge}`);
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 9. INTERACTIVE CYBER TELEMETRY TERMINAL CONSOLE
 * Standalone client-side command interpreter with tactile sound & quick pills
 * ----------------------------------------------------------------------------
 */
class CyberTerminal {
  constructor(engine, themeManager, audio, inspector, storylineTheater, architectureExplorer) {
    this.engine = engine;
    this.themeManager = themeManager;
    this.audio = audio;
    this.inspector = inspector;
    this.storylineTheater = storylineTheater;
    this.architectureExplorer = architectureExplorer;

    this.drawer = document.getElementById('terminalDrawer');
    this.output = document.getElementById('terminalOutput');
    this.input = document.getElementById('terminalInput');
    this.btnToggle = document.getElementById('btnToggleTerminal');
    this.btnClose = document.getElementById('btnCloseTerminal');
    this.btnClear = document.getElementById('btnTermClear');
    this.pills = document.querySelectorAll('.term-pill');

    this.isOpen = false;
    this.history = [];
    this.historyIdx = -1;

    this.init();
  }

  init() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }
    if (this.btnClear) {
      this.btnClear.addEventListener('click', () => this.clear());
    }

    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (this.audio) this.audio.playKeyClick();
        if (e.key === 'Enter') {
          const cmd = this.input.value.trim();
          this.input.value = '';
          if (cmd) {
            this.history.push(cmd);
            this.historyIdx = this.history.length;
            this.execute(cmd);
          }
        } else if (e.key === 'ArrowUp') {
          if (this.history.length > 0 && this.historyIdx > 0) {
            this.historyIdx--;
            this.input.value = this.history[this.historyIdx];
          }
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (this.historyIdx < this.history.length - 1) {
            this.historyIdx++;
            this.input.value = this.history[this.historyIdx];
          } else {
            this.historyIdx = this.history.length;
            this.input.value = '';
          }
          e.preventDefault();
        } else if (e.key === 'Escape') {
          this.close();
        }
      });
    }

    if (this.pills) {
      this.pills.forEach((pill) => {
        pill.addEventListener('click', () => {
          const cmd = pill.dataset.cmd;
          if (cmd) {
            this.execute(cmd);
            if (this.input) this.input.focus();
          }
        });
      });
    }

    this.printBanner();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('open');
    this.isOpen = true;
    if (this.btnToggle) this.btnToggle.classList.add('active');
    if (this.input) setTimeout(() => this.input.focus(), 150);
    if (this.audio) this.audio.playChime();
  }

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('open');
    this.isOpen = false;
    if (this.btnToggle) this.btnToggle.classList.remove('active');
  }

  clear() {
    if (this.output) this.output.innerHTML = '';
  }

  printBanner() {
    const banner = [
      '<span class="term-line-system">====================================================================</span>',
      '<span class="term-line-success">  ANTIGRAVITY // CYBER COMMAND TELEMETRY CONSOLE [v4.2 PRO]</span>',
      '<span class="term-line-accent">  Operator: Ravi Ranjan Singh // Node: RR-0808 // Sarala Birla Univ.</span>',
      '<span class="term-line-system">====================================================================</span>',
      'Type <span class="term-line-success">\'help\'</span> for system directives or click quick pills below.'
    ].join('\n');
    this.print(banner);
  }

  print(html) {
    if (!this.output) return;
    const div = document.createElement('div');
    div.innerHTML = html;
    this.output.appendChild(div);
    this.output.scrollTop = this.output.scrollHeight;
  }

  execute(rawCmd) {
    this.print(`<span class="term-line-prompt">guest@antigravity:~$ ${rawCmd}</span>`);
    const parts = rawCmd.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1] ? parts[1].toLowerCase() : '';

    if (this.audio) this.audio.playExecute();

    switch (cmd) {
      case 'help':
        this.print([
          '<span class="term-line-accent">DIRECTIVES &amp; SYSTEM COMMANDS:</span>',
          '  <span class="term-line-success">status</span>      - Display live runtime telemetry, FPS, and node topology',
          '  <span class="term-line-success">projects</span>    - Query 6 featured AI/Agent systems and live telemetry',
          '  <span class="term-line-success">experience</span>  - Display professional engineering apprenticeships',
          '  <span class="term-line-success">skills</span>      - Print enterprise technology stack and capability matrix',
          '  <span class="term-line-success">storyline</span>   - Launch 5-act interactive mission narrative theater',
          '  <span class="term-line-success">act [1-5]</span>    - Jump directly to specific mission chronology act',
          '  <span class="term-line-success">architecture</span>- Launch 6-layer distributed systems architecture explorer',
          '  <span class="term-line-success">layer [1-6]</span>  - Jump directly to specific architectural control plane layer',
          '  <span class="term-line-success">theme [key]</span> - Set/cycle theme (matrix, synthwave, cyberpunk, abyssal)',
          '  <span class="term-line-success">audio [cmd]</span> - Synthesizer audio control (on, off, toggle)',
          '  <span class="term-line-success">shockwave</span>   - Trigger kinetic quantum impulse particle blast',
          '  <span class="term-line-success">whoami</span>      - Display operator dossier, credentials &amp; honors',
          '  <span class="term-line-success">clear</span>       - Clear console buffer',
          '  <span class="term-line-success">exit</span>        - Close terminal interface'
        ].join('\n'));
        break;

      case 'status':
        const fps = document.getElementById('telemetryFps')?.textContent || '60';
        const uptime = document.getElementById('telemetryUptime')?.textContent || '0s';
        const theme = this.themeManager?.getCurrentTheme()?.name || 'MATRIX CYBER';
        const audioState = this.audio?.enabled ? 'ACTIVE (Online)' : 'MUTED (Offline)';
        this.print([
          '<span class="term-line-accent">[LIVE TELEMETRY SNAPSHOT]</span>',
          `  Framerate:       <span class="term-line-success">${fps} FPS</span>`,
          `  Active Nodes:    <span class="term-line-success">${this.engine?.particles?.length || 160}</span>`,
          `  Active Conduits: <span class="term-line-success">${this.engine?.activeLinksCount || 0}</span>`,
          `  Active Theme:    <span class="term-line-success">${theme}</span>`,
          `  Procedural Synth:<span class="term-line-success">${audioState}</span>`,
          `  System Uptime:   <span class="term-line-success">${uptime}</span>`,
          `  Screen Res:      <span class="term-line-success">${window.innerWidth}x${window.innerHeight} @ ${window.devicePixelRatio || 1}x DPR</span>`
        ].join('\n'));
        break;

      case 'projects':
        this.print([
          '<span class="term-line-accent">[FEATURED PRODUCTION ARTIFACTS]</span>',
          '  1. <span class="term-line-success">Automated-ad-campaign-copywriter</span>: Multi-agent Gemini marketing pipeline',
          '  2. <span class="term-line-success">AI-SALE-PITCH--Customizer</span>: Persona-conditioned RAG pitch generation',
          '  3. <span class="term-line-success">AI-Powered-Sales-Funnel-Analyzer</span>: Predictive churn &amp; conversion scoring',
          '  4. <span class="term-line-success">RAG-Evaluation-Engine</span>: Multi-agent RAG hallucination audit bench',
          '  5. <span class="term-line-success">Autonomous-Code-Agent-Bench</span>: Self-healing Python/TypeScript test runner',
          '  6. <span class="term-line-success">Expense-tracker</span>: Production financial ledger with Chart.js analytics',
          '  Target repo: <a href="https://github.com/Hellthefox808" target="_blank" style="color: #00E5FF">https://github.com/Hellthefox808</a>'
        ].join('\n'));
        break;

      case 'experience':
        this.print([
          '<span class="term-line-accent">[PROFESSIONAL EXPERIENCE]</span>',
          '  • <span class="term-line-success">PravRaha</span> (Full Stack AI B2B SaaS Developer Intern | Jun–Aug 2026)',
          '    Next.js 15 App Router · TypeScript · pgvector · Multi-agent swarms',
          '  • <span class="term-line-success">BSNL LTD</span> (Enterprise Telecom &amp; Network Engineering Intern | Jun–Jul 2025)',
          '    Carrier-grade MPLS · BGP/OSPF · Fiber FTTH optical infrastructure',
          '  • <span class="term-line-success">Cognifyz Technologies</span> (Full Stack Web Developer Apprentice | Feb–Apr 2025)',
          '    Microservices · Async event-driven APIs · Responsive interfaces'
        ].join('\n'));
        break;

      case 'skills':
        this.print([
          '<span class="term-line-accent">[TECHNICAL CAPABILITY SPECTRUM]</span>',
          '  • <span class="term-line-success">AI &amp; Agents:</span> Multi-Agent Swarms, RAG, pgvector, LangChain, LlamaIndex, MCP',
          '  • <span class="term-line-success">Languages:</span> TypeScript, JavaScript (ES6+), Python 3.11+, SQL, HTML5/CSS3',
          '  • <span class="term-line-success">Full-Stack:</span> React 19, Next.js 15, Node.js, Express, FastAPI, Tailwind CSS',
          '  • <span class="term-line-success">Data/Infra:</span> PostgreSQL, MongoDB, Redis, AWS (ECS, S3, IAM), Docker, Linux SysAdmin',
          '  • <span class="term-line-success">Testing/QA:</span> Vitest, Jest, Playwright, CI/CD GitHub Actions'
        ].join('\n'));
        break;

      case 'theme':
        if (arg && CyberThemeManager.THEMES[arg]) {
          this.themeManager.apply(arg);
          this.print(`<span class="term-line-success">Visual theme switched to: ${arg.toUpperCase()}</span>`);
        } else {
          this.themeManager.cycle();
          const cur = this.themeManager.getCurrentTheme();
          this.print(`<span class="term-line-success">Visual theme cycled to: ${cur.name}</span>`);
        }
        break;

      case 'audio':
        if (arg === 'on') {
          if (!this.audio.enabled) this.audio.toggle();
          this.print('<span class="term-line-success">Cybernetic audio synthesizer ACTIVATED.</span>');
        } else if (arg === 'off') {
          if (this.audio.enabled) this.audio.toggle();
          this.print('<span class="term-line-warning">Cybernetic audio synthesizer MUTED.</span>');
        } else {
          const state = this.audio.toggle();
          this.print(`<span class="term-line-success">Audio toggled: ${state ? 'ON' : 'OFF'}</span>`);
        }
        const audioBtn = document.getElementById('btnToggleAudio');
        if (audioBtn) {
          audioBtn.classList.toggle('active', this.audio.enabled);
          const icon = audioBtn.querySelector('.btn-icon');
          const text = audioBtn.querySelector('.btn-text');
          if (icon) icon.textContent = this.audio.enabled ? '🔊' : '🔇';
          if (text) text.textContent = this.audio.enabled ? 'AUDIO: ON' : 'AUDIO';
        }
        break;

      case 'shockwave':
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        if (this.engine) this.engine.emitShockwave(cx, cy);
        if (this.audio) this.audio.playShockwave();
        this.print('<span class="term-line-success">Quantum impulse shockwave deployed at coordinates (center).</span>');
        break;

      case 'whoami':
        this.print([
          '<span class="term-line-accent">[OPERATOR DOSSIER]</span>',
          '  Name:       Ravi Ranjan Singh',
          '  Handle:     Hellthefox808',
          '  Identity:   Full-Stack AI Systems Architect &amp; Software Engineer',
          '  Institution:Sarala Birla University, Ranchi (B.Tech CSE)',
          '  Leadership: NCC Sergeant (19 Jharkhand Bn) · Best Cadet Award (2019)',
          '  Martial:    Taekwondo Black Belt (1st Dan) · Competitive Judo',
          '  Honors:     National Semi-Finalist (Build with Bharat 2.0 @ NIT Delhi)',
          '  Motto:      "Think deeply. Architect deliberately. Ship with evidence."'
        ].join('\n'));
        break;

      case 'storyline':
        if (this.storylineTheater) {
          this.storylineTheater.open();
          this.print('<span class="term-line-success">Launching Cybernetic Mission Storyline Theater...</span>');
        } else {
          this.print('<span class="term-line-warning">Storyline subsystem initializing...</span>');
        }
        break;

      case 'act':
        if (this.storylineTheater) {
          const actNum = parseInt(arg, 10);
          if (actNum >= 1 && actNum <= 5) {
            this.storylineTheater.open();
            this.storylineTheater.goToAct(actNum - 1);
            this.print(`<span class="term-line-success">Navigated to Act ${actNum} in Storyline Theater.</span>`);
          } else {
            this.print('<span class="term-line-warning">Usage: act [1-5] (e.g. "act 3")</span>');
          }
        }
        break;

      case 'architecture':
      case 'arch':
        if (this.architectureExplorer) {
          this.architectureExplorer.open();
          this.print('<span class="term-line-success">Launching Distributed Control Plane Architecture Explorer...</span>');
        } else {
          this.print('<span class="term-line-warning">Architecture subsystem initializing...</span>');
        }
        break;

      case 'layer':
        if (this.architectureExplorer) {
          const layerNum = parseInt(arg, 10);
          if (layerNum >= 1 && layerNum <= 6) {
            this.architectureExplorer.open();
            this.architectureExplorer.goToLayer(layerNum - 1);
            this.print(`<span class="term-line-success">Navigated to Layer ${layerNum} in Architecture Explorer.</span>`);
          } else {
            this.print('<span class="term-line-warning">Usage: layer [1-6] (e.g. "layer 4")</span>');
          }
        }
        break;

      case 'clear':
        this.clear();
        break;

      case 'exit':
      case 'quit':
        this.close();
        break;

      default:
        if (this.audio) this.audio.playAlert();
        this.print(`<span class="term-line-warning">Command not recognized: '${rawCmd}'. Type 'help' for command manual.</span>`);
        break;
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * 10. KEYBOARD SHORTCUTS CHEATSHEET MODAL
 * ----------------------------------------------------------------------------
 */
class ShortcutsModalManager {
  constructor() {
    this.modal = document.getElementById('shortcutsModal');
    this.btnToggle = document.getElementById('btnToggleShortcuts');
    this.btnClose = document.getElementById('btnCloseShortcuts');
    this.isOpen = false;
    this.init();
  }

  init() {
    if (this.btnToggle) {
      this.btnToggle.addEventListener('click', () => this.toggle());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    if (window.cyberAudio) window.cyberAudio.playChime();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
  }
}

/**
 * ----------------------------------------------------------------------------
 * 11. GLOBAL SHORTCUTS & HOTKEY DISPATCHER
 * ----------------------------------------------------------------------------
 */
class GlobalKeyboardManager {
  constructor(engine, themeManager, audio, terminal, shortcutsModal, controls, inspector, storylineTheater, architectureExplorer) {
    this.engine = engine;
    this.themeManager = themeManager;
    this.audio = audio;
    this.terminal = terminal;
    this.shortcutsModal = shortcutsModal;
    this.controls = controls;
    this.inspector = inspector;
    this.storylineTheater = storylineTheater;
    this.architectureExplorer = architectureExplorer;

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if (isInput && activeEl.id === 'terminalInput') {
        if (e.key === 'Escape') {
          this.terminal.close();
          e.preventDefault();
        }
        return;
      }

      if (isInput) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          if (this.engine) this.engine.emitShockwave(cx, cy);
          if (this.audio) this.audio.playShockwave();
          HUDTelemetry.showToast('Kinetic Shockwave Deployed [Space]');
          break;

        case 't':
        case 'T':
          e.preventDefault();
          if (this.themeManager) this.themeManager.cycle();
          break;

        case 's':
        case 'S':
          e.preventDefault();
          if (this.storylineTheater) this.storylineTheater.toggle();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          if (this.architectureExplorer) this.architectureExplorer.toggle();
          break;

        case 'ArrowLeft':
          if (this.storylineTheater && this.storylineTheater.isOpen) {
            e.preventDefault();
            this.storylineTheater.prev();
          } else if (this.architectureExplorer && this.architectureExplorer.isOpen) {
            e.preventDefault();
            this.architectureExplorer.prev();
          }
          break;

        case 'ArrowRight':
          if (this.storylineTheater && this.storylineTheater.isOpen) {
            e.preventDefault();
            this.storylineTheater.next();
          } else if (this.architectureExplorer && this.architectureExplorer.isOpen) {
            e.preventDefault();
            this.architectureExplorer.next();
          }
          break;

        case 'a':
        case 'A':
          e.preventDefault();
          if (this.audio) {
            const state = this.audio.toggle();
            const btn = document.getElementById('btnToggleAudio');
            if (btn) {
              btn.classList.toggle('active', state);
              const icon = btn.querySelector('.btn-icon');
              const text = btn.querySelector('.btn-text');
              if (icon) icon.textContent = state ? '🔊' : '🔇';
              if (text) text.textContent = state ? 'AUDIO: ON' : 'AUDIO';
            }
            HUDTelemetry.showToast(`Procedural Synth: ${state ? 'ENABLED' : 'MUTED'} [A]`);
          }
          break;

        case '`':
        case '~':
          e.preventDefault();
          if (this.terminal) this.terminal.toggle();
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          const drawer = document.getElementById('controlsDrawer');
          if (drawer) drawer.classList.toggle('open');
          break;

        case '?':
          e.preventDefault();
          if (this.shortcutsModal) this.shortcutsModal.toggle();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            HUDTelemetry.showToast('Fullscreen Mode Activated [F]');
          } else {
            document.exitFullscreen().catch(() => {});
            HUDTelemetry.showToast('Fullscreen Mode Exited [F]');
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          e.preventDefault();
          const assetKeys = ['hero', 'expertise', 'architecture', 'projects', 'footer', 'storyline'];
          const idx = parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < assetKeys.length && this.inspector) {
            this.inspector.setAsset(assetKeys[idx]);
            if (this.audio) this.audio.playChime();
          }
          break;

        case 'Escape':
          if (this.storylineTheater && this.storylineTheater.isOpen) this.storylineTheater.close();
          if (this.architectureExplorer && this.architectureExplorer.isOpen) this.architectureExplorer.close();
          if (this.terminal && this.terminal.isOpen) this.terminal.close();
          if (this.shortcutsModal && this.shortcutsModal.isOpen) this.shortcutsModal.close();
          const ctrlDrawer = document.getElementById('controlsDrawer');
          if (ctrlDrawer) ctrlDrawer.classList.remove('open');
          break;
      }
    });
  }
}

/**
 * ----------------------------------------------------------------------------
 * 12. APPLICATION BOOTSTRAPPER
 * Orchestrates unified animation frame loop and lifecycle initialization
 * ----------------------------------------------------------------------------
 */
class MotionApp {
  static start() {
    const canvas = document.getElementById('particleCanvas');
    const cardWrapper = document.getElementById('cardWrapper');
    const cardGlare = document.getElementById('cardGlare');

    if (!canvas) {
      console.error('[ANTIGRAVITY] Critical: #particleCanvas element not found.');
      return;
    }

    // Instantiate Core Subsystems
    const engine = new ParticleEngine(canvas);
    const parallax = new ParallaxController(cardWrapper, cardGlare);
    const inspector = new AssetInspector();
    const telemetry = new HUDTelemetry();
    const controls = new ControlsManager(engine, parallax);

    // Audio Synthesizer Integration
    const audio = new CyberAudio();
    window.cyberAudio = audio;
    const audioBtn = document.getElementById('btnToggleAudio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isOn = audio.toggle();
        audioBtn.classList.toggle('active', isOn);
        const icon = audioBtn.querySelector('.btn-icon');
        const text = audioBtn.querySelector('.btn-text');
        if (icon) icon.textContent = isOn ? '🔊' : '🔇';
        if (text) text.textContent = isOn ? 'AUDIO: ON' : 'AUDIO';
      });
    }

    // Cyber Theme Manager
    const themeManager = new CyberThemeManager(engine, audio);

    // Storyline Theater Integration
    const storylineTheater = new StorylineTheaterManager(engine, audio, inspector);

    // Systems Architecture Explorer Integration
    const architectureExplorer = new ArchitectureExplorerManager(engine, audio);

    // Cyber CLI Terminal Console
    const terminal = new CyberTerminal(engine, themeManager, audio, inspector, storylineTheater, architectureExplorer);

    // Shortcuts Cheatsheet Modal
    const shortcutsModal = new ShortcutsModalManager();

    // Global Keyboard Hotkey Dispatcher
    const keyboard = new GlobalKeyboardManager(
      engine,
      themeManager,
      audio,
      terminal,
      shortcutsModal,
      controls,
      inspector,
      storylineTheater,
      architectureExplorer
    );

    // Master Animation Loop with Tab Visibility Optimization
    let animId = null;
    function frame(time) {
      if (document.hidden) {
        animId = null;
        return;
      }
      // 1. Update and draw canvas particles
      engine.updateAndRender();

      // 2. Compute 3D parallax transformation
      const rotation = parallax.update();

      // 3. Update real-time HUD telemetry
      telemetry.tick(time, engine.particles.length, engine.activeLinksCount, rotation);

      animId = requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && animId === null) {
        animId = requestAnimationFrame(frame);
      }
    });

    animId = requestAnimationFrame(frame);
    console.info('[ANTIGRAVITY] 4D Motion Engine v4.2 PRO initialized successfully with Terminal, Theme Switcher & Shortcuts.');
  }
}

// Auto-boot on DOM readiness
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MotionApp.start());
} else {
  MotionApp.start();
}
