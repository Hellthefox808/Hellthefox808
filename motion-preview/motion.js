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

    // Metrics State
    this.activeLinksCount = 0;
    this.particles = [];

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

    // Touch Event Handling for Mobile / Tablets
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
        this.mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }, { passive: true });

    this.populateParticles();
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

    this.lastFrameTime = performance.now();
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
 * 7. APPLICATION BOOTSTRAPPER
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

    // Instantiate Subsystems
    const engine = new ParticleEngine(canvas);
    const parallax = new ParallaxController(cardWrapper, cardGlare);
    const inspector = new AssetInspector();
    const telemetry = new HUDTelemetry();
    const controls = new ControlsManager(engine, parallax);

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
    console.info('[ANTIGRAVITY] 4D Motion Engine v4.2 initialized successfully.');
  }
}

// Auto-boot on DOM readiness
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MotionApp.start());
} else {
  MotionApp.start();
}
