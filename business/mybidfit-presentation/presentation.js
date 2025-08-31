/**
 * MyBidFit Presentation Engine
 * Karaoke_Noir-inspired interactive presentation system
 */

class MyBidFitPresentation {
  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 0;
    this.slides = [];
    this.isAnimating = false;
    this.presentationData = null;
    this.startTime = null;
    this.timerInterval = null;
    this.isPresenterMode = false;
    this.isFullscreen = false;
    
    this.init();
  }

  async init() {
    try {
      // Show loading screen
      this.showLoading();
      
      // Load presentation data
      this.presentationData = presentationContent;
      
      // Generate slides
      await this.generateSlides();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize presentation state
      this.updateUI();
      
      // Hide loading screen
      this.hideLoading();
      
      // Start timer
      this.startTimer();
      
      console.log('MyBidFit Presentation initialized successfully');
    } catch (error) {
      console.error('Failed to initialize presentation:', error);
      this.showError('Failed to load presentation. Please check content.js file.');
    }
  }

  showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
    }
  }

  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 1000);
    }
  }

  showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="loading-content">
          <h2 style="color: #ef4444; margin-bottom: 1rem;">Error</h2>
          <p>${message}</p>
        </div>
      `;
    }
  }

  async generateSlides() {
    const slideContainer = document.getElementById('slide-container');
    const slides = this.presentationData.slides;
    
    this.totalSlides = slides.length;
    
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideElement = this.createSlideElement(slide, i);
      slideContainer.appendChild(slideElement);
      this.slides.push(slideElement);
    }
    
    // Update slide counter
    document.getElementById('total-slides').textContent = this.totalSlides;
  }

  createSlideElement(slideData, index) {
    const slide = document.createElement('div');
    slide.className = `slide slide-${slideData.type}`;
    slide.setAttribute('data-slide-id', slideData.id);
    slide.setAttribute('data-slide-index', index);
    
    const slideContent = document.createElement('div');
    slideContent.className = 'slide-content';
    
    // Generate content based on slide type
    switch (slideData.type) {
      case 'hero':
        slideContent.innerHTML = this.generateHeroSlide(slideData);
        break;
      case 'statement':
        slideContent.innerHTML = this.generateStatementSlide(slideData);
        break;
      case 'pain-points':
        slideContent.innerHTML = this.generatePainPointsSlide(slideData);
        break;
      case 'why-now':
        slideContent.innerHTML = this.generateWhyNowSlide(slideData);
        break;
      case 'audience':
        slideContent.innerHTML = this.generateAudienceSlide(slideData);
        break;
      case 'product-demo':
        slideContent.innerHTML = this.generateProductDemoSlide(slideData);
        break;
      case 'impact':
        slideContent.innerHTML = this.generateImpactSlide(slideData);
        break;
      case 'metrics':
        slideContent.innerHTML = this.generateMetricsSlide(slideData);
        break;
      case 'flow-diagram':
        slideContent.innerHTML = this.generateFlowDiagramSlide(slideData);
        break;
      case 'journey-map':
        slideContent.innerHTML = this.generateJourneyMapSlide(slideData);
        break;
      case 'strategy':
        slideContent.innerHTML = this.generateStrategySlide(slideData);
        break;
      case 'timeline':
        slideContent.innerHTML = this.generateTimelineSlide(slideData);
        break;
      case 'investment-ask':
        slideContent.innerHTML = this.generateInvestmentAskSlide(slideData);
        break;
      case 'contact':
        slideContent.innerHTML = this.generateContactSlide(slideData);
        break;
      default:
        slideContent.innerHTML = this.generateDefaultSlide(slideData);
    }
    
    slide.appendChild(slideContent);
    return slide;
  }

  generateHeroSlide(data) {
    return `
      <div class="mybidfit-logo">MyBidFit</div>
      <h1 class="hero-title">${data.title}</h1>
      <p class="hero-subtitle">${data.subtitle}</p>
      <p class="hero-author">${data.author}</p>
    `;
  }

  generateStatementSlide(data) {
    const bullets = data.content.map(item => `<li>${item}</li>`).join('');
    return `
      <h2 class="statement-title">${data.title}</h2>
      <div class="statement-content">
        <ul>${bullets}</ul>
      </div>
    `;
  }

  generatePainPointsSlide(data) {
    const painPoints = data.painPoints.map((point, index) => {
      const quote = point.quote ? `<p class="pain-point-quote">"${point.quote}"</p>` : '';
      const source = point.source ? `<p class="pain-point-source">- ${point.source}</p>` : '';
      
      return `
        <div class="pain-point" data-category="${point.category}">
          <h3 class="pain-point-category">${point.category}</h3>
          ${quote}
          ${source}
        </div>
      `;
    }).join('');
    
    return `
      <h2 class="pain-points-title">${data.title}</h2>
      <div class="pain-points-diagram">
        ${painPoints}
      </div>
    `;
  }

  generateWhyNowSlide(data) {
    const reasons = data.reasons.map(reason => `<li>${reason}</li>`).join('');
    return `
      <h2 class="statement-title">${data.title}</h2>
      <div class="statement-content">
        <ul>${reasons}</ul>
      </div>
    `;
  }

  generateAudienceSlide(data) {
    const segments = data.segments.map(segment => `<li>${segment}</li>`).join('');
    return `
      <h2 class="statement-title">${data.title}</h2>
      <div class="statement-content">
        <ul>${segments}</ul>
      </div>
    `;
  }

  generateProductDemoSlide(data) {
    const features = data.features.map(feature => 
      `<div class="demo-feature">${feature}</div>`
    ).join('');
    
    return `
      <h2 class="demo-title">${data.title}</h2>
      <div class="demo-content">
        <div class="demo-features">
          ${features}
        </div>
        <div class="demo-screenshot">
          <div style="height: 300px; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 1.125rem;">
            Platform Screenshot Preview
          </div>
        </div>
      </div>
    `;
  }

  generateImpactSlide(data) {
    return `
      <div class="impact-message">
        <div class="impact-where">${data.message.where}</div>
        <div class="impact-when">${data.message.when}</div>
      </div>
    `;
  }

  generateMetricsSlide(data) {
    const metrics = data.metrics.map(metric => `
      <div class="metric-card">
        <span class="metric-value" data-value="${metric.value}">${metric.value}</span>
        <div class="metric-label">${metric.label}</div>
        <div class="metric-description">${metric.description}</div>
      </div>
    `).join('');
    
    return `
      <h2 class="metrics-title">${data.title}</h2>
      <div class="metrics-grid">
        ${metrics}
      </div>
    `;
  }

  generateFlowDiagramSlide(data) {
    const channels = data.channels.map((channel, index) => {
      const arrow = index < data.channels.length - 1 ? '<span class="flow-arrow">→</span>' : '';
      const revenue = channel.revenue ? `<div class="flow-step-revenue">${channel.revenue}</div>` : '';
      
      return `
        <div class="flow-step">
          <div class="flow-step-name">${channel.name}</div>
          ${revenue}
        </div>
        ${arrow}
      `;
    }).join('');
    
    return `
      <h2 class="flow-title">${data.title}</h2>
      <p class="flow-description">${data.description}</p>
      <div class="flow-diagram">
        ${channels}
      </div>
    `;
  }

  generateJourneyMapSlide(data) {
    const journeySteps = data.journey.map((step, index) => {
      const arrow = index < data.journey.length - 1 ? '<span class="flow-arrow">→</span>' : '';
      return `
        <div class="flow-step">
          <div class="flow-step-name">${step}</div>
        </div>
        ${arrow}
      `;
    }).join('');
    
    return `
      <h2 class="flow-title">${data.title}</h2>
      <p class="flow-description">${data.description}</p>
      <div class="flow-diagram">
        ${journeySteps}
      </div>
      <div style="margin-top: 2rem; display: flex; justify-content: center; gap: 2rem; color: #6b7280;">
        <div>Sales cycle: ${data.metrics.salesCycle}</div>
        <div>LTV: ${data.metrics.ltv}</div>
      </div>
    `;
  }

  generateStrategySlide(data) {
    const phases = data.strategy.phases.map(phase => `<li>${phase}</li>`).join('');
    const keyNeeds = data.strategy.keyNeeds.map(need => `<li style="font-size: 0.9rem; margin-bottom: 0.5rem;">${need}</li>`).join('');
    
    return `
      <h2 class="flow-title">${data.title}</h2>
      <p class="flow-description">${data.description}</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1100px; width: 100%; margin-top: 2rem; text-align: left;">
        <div>
          <h3 style="color: #3b82f6; margin-bottom: 1rem;">Phases</h3>
          <ul style="font-size: 1rem;">${phases}</ul>
          
          <h3 style="color: #10b981; margin: 2rem 0 1rem 0;">Key Metrics</h3>
          <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px;">
            <div>LTV:CAC Ratio: <strong>${data.strategy.metrics.ltvCacRatio}</strong></div>
            <div>LTV: <strong>${data.strategy.metrics.ltv}</strong></div>
            <div>CAC: <strong>${data.strategy.metrics.cac}</strong></div>
            <div>Payback: <strong>${data.strategy.metrics.paybackPeriod}</strong></div>
          </div>
        </div>
        
        <div>
          <h3 style="color: #ef4444; margin-bottom: 1rem;">Key Success Factors</h3>
          <ul style="font-size: 0.9rem;">${keyNeeds}</ul>
        </div>
      </div>
    `;
  }

  generateTimelineSlide(data) {
    const milestones = data.milestones.map(milestone => `
      <div class="metric-card" style="text-align: left;">
        <div class="metric-value" style="font-size: 2rem;">${milestone.period}</div>
        <div class="metric-description">${milestone.targets}</div>
      </div>
    `).join('');
    
    return `
      <h2 class="metrics-title">${data.title}</h2>
      <div class="metrics-grid">
        ${milestones}
      </div>
      <div style="margin-top: 2rem; background: rgba(16, 185, 129, 0.1); padding: 1.5rem; border-radius: 12px; max-width: 600px;">
        <h3 style="color: #10b981; margin-bottom: 1rem;">Revenue Target</h3>
        <div style="font-size: 1.125rem;">
          <strong>${data.revenue.product}</strong> in product revenue + 
          <strong>${data.revenue.services}</strong> in services revenue
        </div>
        <div style="font-size: 1rem; color: #6b7280; margin-top: 0.5rem;">
          Over the ${data.revenue.timeframe} in ${data.revenue.location}
        </div>
      </div>
    `;
  }

  generateInvestmentAskSlide(data) {
    const asks = data.asks.map(ask => `
      <div class="ask-card">
        <h3 class="ask-card-category">${ask.category}</h3>
        <p class="ask-card-description">${ask.description}</p>
      </div>
    `).join('');
    
    return `
      <h2 class="ask-title">${data.title}</h2>
      <div class="ask-cards">
        ${asks}
      </div>
    `;
  }

  generateContactSlide(data) {
    return `
      <h1 class="contact-title">${data.title}</h1>
      <div class="contact-info">
        <div class="contact-name">${data.contact.name}</div>
        <div class="contact-email">${data.contact.email}</div>
        <div class="contact-phone">${data.contact.phone}</div>
      </div>
    `;
  }

  generateDefaultSlide(data) {
    return `
      <h2>${data.title || 'Slide Title'}</h2>
      <p>${data.content || 'Slide content goes here'}</p>
    `;
  }

  setupEventListeners() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeypress(e));
    
    // Mouse/touch navigation
    document.getElementById('prev-btn').addEventListener('click', () => this.previousSlide());
    document.getElementById('next-btn').addEventListener('click', () => this.nextSlide());
    
    // Control buttons
    document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('presenter-mode-btn').addEventListener('click', () => this.togglePresenterMode());
    document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportToPDF());
    
    // Help modal
    document.addEventListener('keydown', (e) => {
      if (e.key === '?') {
        e.preventDefault();
        this.showHelp();
      }
    });
    
    // Close help modal
    const closeHelpBtn = document.getElementById('close-help-btn');
    if (closeHelpBtn) {
      closeHelpBtn.addEventListener('click', () => this.hideHelp());
    }
    
    // Click to advance slides
    document.addEventListener('click', (e) => {
      // Only advance if click is on slide content, not on controls
      if (e.target.closest('.slide') && !e.target.closest('.presentation-nav') && !e.target.closest('.presentation-controls')) {
        this.nextSlide();
      }
    });
    
    // Touch/swipe support
    this.setupTouchNavigation();
    
    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
    
    // Escape key handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.exitFullscreen();
        this.hideHelp();
      }
    });
  }

  setupTouchNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
    
    const handleSwipe = () => {
      if (touchEndX < touchStartX - 50) {
        this.nextSlide(); // Swipe left - next slide
      }
      if (touchEndX > touchStartX + 50) {
        this.previousSlide(); // Swipe right - previous slide
      }
    };
    
    this.handleSwipe = handleSwipe;
  }

  handleKeypress(e) {
    if (this.isAnimating) return;
    
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        this.nextSlide();
        break;
      case 'ArrowLeft':
      case 'Backspace':
        e.preventDefault();
        this.previousSlide();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.totalSlides - 1);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        this.toggleFullscreen();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        this.togglePresenterMode();
        break;
      case 'o':
      case 'O':
        e.preventDefault();
        this.showOverview();
        break;
    }
  }

  nextSlide() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    }
  }

  goToSlide(index) {
    if (index === this.currentSlide || this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentSlide = Math.max(0, Math.min(index, this.totalSlides - 1));
    
    const slideContainer = document.getElementById('slide-container');
    const translateX = -this.currentSlide * 100;
    slideContainer.style.transform = `translateX(${translateX}%)`;
    
    // Add slide-in animations to current slide content
    setTimeout(() => {
      const currentSlideEl = this.slides[this.currentSlide];
      const animatableElements = currentSlideEl.querySelectorAll('h1, h2, h3, p, li, .metric-card, .ask-card, .pain-point');
      
      animatableElements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('slide-in-up');
        }, index * 100);
      });
    }, 150);
    
    this.updateUI();
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 500);
  }

  updateUI() {
    // Update slide counter
    document.getElementById('current-slide').textContent = this.currentSlide + 1;
    
    // Update progress bar
    const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = this.currentSlide === 0;
    nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
    
    // Hide navigation on first and last slides temporarily
    const nav = document.querySelector('.presentation-nav');
    if (this.currentSlide === 0) {
      setTimeout(() => nav.style.opacity = '1', 2000);
    } else {
      nav.style.opacity = '1';
    }
  }

  toggleFullscreen() {
    if (!this.isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      this.exitFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    this.isFullscreen = false;
  }

  togglePresenterMode() {
    this.isPresenterMode = !this.isPresenterMode;
    const presenterNotes = document.getElementById('presenter-notes');
    
    if (this.isPresenterMode) {
      presenterNotes.classList.remove('hidden');
      this.updatePresenterNotes();
    } else {
      presenterNotes.classList.add('hidden');
    }
  }

  updatePresenterNotes() {
    const notesContent = document.getElementById('notes-content');
    const currentSlideData = this.presentationData.slides[this.currentSlide];
    
    let notes = `<h4>Slide ${this.currentSlide + 1}: ${currentSlideData.title}</h4>`;
    
    // Add slide-specific presenter notes based on content
    switch (currentSlideData.type) {
      case 'hero':
        notes += `<p>Welcome and introduction. Set the tone for the presentation.</p>`;
        break;
      case 'pain-points':
        notes += `<p>Emphasize customer pain points. Use quotes to build credibility.</p>`;
        break;
      case 'investment-ask':
        notes += `<p>Be clear about what you're asking for. Emphasize mutual benefit.</p>`;
        break;
      default:
        notes += `<p>Key points for this slide...</p>`;
    }
    
    notesContent.innerHTML = notes;
  }

  showHelp() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.remove('hidden');
  }

  hideHelp() {
    const helpModal = document.getElementById('help-modal');
    helpModal.classList.add('hidden');
  }

  showOverview() {
    // TODO: Implement slide overview functionality
    console.log('Slide overview not yet implemented');
  }

  exportToPDF() {
    // Trigger browser's print dialog which can save as PDF
    window.print();
  }

  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  updateTimer() {
    if (!this.startTime) return;
    
    const elapsed = Date.now() - this.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timerDisplay = document.getElementById('presentation-timer');
    if (timerDisplay) {
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  resetTimer() {
    this.startTime = Date.now();
    this.updateTimer();
  }

  handleResize() {
    // Handle responsive behavior if needed
    console.log('Window resized');
  }

  // Utility methods
  animateCounter(element, targetValue, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const end = parseInt(targetValue.replace(/[^\d]/g, '')) || 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = Math.floor(start + (end - start) * progress);
      element.textContent = targetValue.replace(/\d+/, current.toString());
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.presentation = new MyBidFitPresentation();
});

// Expose global functions for debugging
window.goToSlide = (index) => {
  if (window.presentation) {
    window.presentation.goToSlide(index);
  }
};

window.exportPresentation = () => {
  if (window.presentation) {
    window.presentation.exportToPDF();
  }
};