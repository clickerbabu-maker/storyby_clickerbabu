/**
 * STORY BY CLICKER BABU - TIER-4 AWWWARDS & LUXURY SUITE ENGINE
 * Lenis Inertia Momentum Scroll • Chapter Nav Dots • Keyboard Navigation • RAW Slider • 1-Click WhatsApp Sync • Web Audio Synthesizer
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --------------------------------------------------------------------------
    // 1. SILK INERTIA MOMENTUM SCROLL ENGINE (LENIS)
    // --------------------------------------------------------------------------
    let lenis = null;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1.05,
            touchMultiplier: 1.5,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    // --------------------------------------------------------------------------
    // 2. DYNAMIC HEADER, READING PROGRESS BAR & PARALLAX
    // --------------------------------------------------------------------------
    const siteHeader = document.getElementById('siteHeader');
    const heroBgImage = document.getElementById('heroBgImage');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    const scrollProgressBar = document.getElementById('scrollProgress');

    const handleScroll = () => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (scrollProgressBar && totalHeight > 0) {
            const progress = (scrollY / totalHeight) * 100;
            scrollProgressBar.style.width = `${progress}%`;
        }

        if (scrollY > 50) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }

        if (heroBgImage && scrollY < window.innerHeight) {
            heroBgImage.style.transform = `translate3d(0, ${scrollY * 0.28}px, 0)`;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Mobile Navigation Drawer with Scroll Lock
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
            const isOpen = navLinks.classList.contains('mobile-open');
            hamburgerBtn.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        navLinks.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // Footer Brand Seal - Smooth Back to Top
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (lenis) {
                lenis.scrollTo(0, { duration: 1.5 });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // --------------------------------------------------------------------------
    // 3. FLOATING CHAPTER NAV DOTS & SCROLL SPY
    // --------------------------------------------------------------------------
    const chapterDots = document.querySelectorAll('.chapter-dot');
    const sections = ['hero', 'philosophy', 'portfolio', 'testimonials', 'distinction', 'faq', 'contact', 'artist'];

    // Chapter Dot Click Handler
    chapterDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = dot.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                if (lenis) {
                    lenis.scrollTo(targetEl, { offset: -40, duration: 1.2 });
                } else {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Scroll Spy for Chapter Dots
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.id;
                chapterDots.forEach(dot => {
                    if (dot.getAttribute('data-target') === currentId) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.35
    });

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
    });

    // --------------------------------------------------------------------------
    // 4. KEYBOARD QUICK-CHAPTER NAVIGATION (J = Next, K = Prev)
    // --------------------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        // Do not intercept if user is typing inside form inputs or lightbox is open
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isLightboxOpen = document.getElementById('lightboxModal')?.classList.contains('active');
        const isVideoOpen = document.getElementById('videoModal')?.classList.contains('active');
        
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || isLightboxOpen || isVideoOpen) {
            return;
        }

        let currentSectionIdx = 0;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        sections.forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el && el.offsetTop - 120 <= scrollY) {
                currentSectionIdx = idx;
            }
        });

        if (e.key === 'j' || e.key === 'J') {
            const nextIdx = Math.min(sections.length - 1, currentSectionIdx + 1);
            const targetEl = document.getElementById(sections[nextIdx]);
            if (targetEl) {
                if (lenis) lenis.scrollTo(targetEl, { offset: -40 });
                else targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (e.key === 'k' || e.key === 'K') {
            const prevIdx = Math.max(0, currentSectionIdx - 1);
            const targetEl = document.getElementById(sections[prevIdx]);
            if (targetEl) {
                if (lenis) lenis.scrollTo(targetEl, { offset: -40 });
                else targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // --------------------------------------------------------------------------
    // 4B. SMART MAGNETIC SOFT-SNAP ENGINE (GOLDEN RATIO AUTO-ALIGN)
    // --------------------------------------------------------------------------
    let snapTimeout = null;
    let isUserInteracting = false;

    const onUserScrollActivity = () => {
        isUserInteracting = true;
        if (snapTimeout) clearTimeout(snapTimeout);

        // Debounce: Trigger smart soft-snap 240ms after user finishes scrolling
        snapTimeout = setTimeout(() => {
            isUserInteracting = false;
            performMagneticSoftSnap();
        }, 240);
    };

    if (lenis) {
        lenis.on('scroll', onUserScrollActivity);
    } else {
        window.addEventListener('scroll', onUserScrollActivity, { passive: true });
    }
    window.addEventListener('wheel', () => { isUserInteracting = true; }, { passive: true });
    window.addEventListener('touchstart', () => { isUserInteracting = true; }, { passive: true });

    const performMagneticSoftSnap = () => {
        const isLightboxOpen = document.getElementById('lightboxModal')?.classList.contains('active');
        const isVideoOpen = document.getElementById('videoModal')?.classList.contains('active');
        if (isLightboxOpen || isVideoOpen || isUserInteracting) return;

        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const currentY = (lenis && Math.abs(lenis.scroll - scrollY) < 50) ? lenis.scroll : scrollY;
        const snapThreshold = 160; // Distance threshold to gently magnetize

        let closestSection = null;
        let minDistance = Infinity;

        for (const id of sections) {
            const el = document.getElementById(id);
            if (!el) continue;

            const targetTop = Math.max(0, el.offsetTop - 45);
            const distance = Math.abs(currentY - targetTop);

            if (distance <= snapThreshold && distance < minDistance) {
                minDistance = distance;
                closestSection = el;
            }
        }

        // Only snap if user is not already perfectly aligned
        if (closestSection && minDistance > 25) {
            if (lenis) {
                lenis.scrollTo(closestSection, {
                    offset: -45,
                    duration: 0.85,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            } else {
                window.scrollTo({ top: Math.max(0, closestSection.offsetTop - 45), behavior: 'smooth' });
            }
        }
    };

    // --------------------------------------------------------------------------
    // 4C. 3D GYRO HOLOGRAPHIC TILT & GOLDEN LIGHT SHEEN ENGINE (NO HAPPY PATH)
    // --------------------------------------------------------------------------
    const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isDesktopPointer) {
        let activeCard = null;
        let activeMedia = null;
        let cardRect = null;
        let targetRotX = 0;
        let targetRotY = 0;
        let currentRotX = 0;
        let currentRotY = 0;
        let isHovering = false;
        let rafId = null;

        const updateGyroFrame = () => {
            if (!activeMedia) {
                rafId = null;
                return;
            }

            // High-precision LERP interpolation
            currentRotX += (targetRotX - currentRotX) * 0.12;
            currentRotY += (targetRotY - currentRotY) * 0.12;

            const shadowX = -currentRotY * 1.6;
            const shadowY = currentRotX * 1.6 + 12;
            const shadowBlur = 32 + Math.abs(currentRotX) * 2.5;

            activeMedia.style.transform = `perspective(1200px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
            activeMedia.style.boxShadow = `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(0, 0, 0, 0.09)`;

            // Check if card has settled back to rest after mouseleave
            if (!isHovering && Math.abs(currentRotX) < 0.04 && Math.abs(currentRotY) < 0.04) {
                activeMedia.style.transform = '';
                activeMedia.style.boxShadow = '';
                if (activeCard) {
                    activeCard.style.zIndex = '';
                }
                activeCard = null;
                activeMedia = null;
                rafId = null;
                return;
            }

            rafId = requestAnimationFrame(updateGyroFrame);
        };

        const initCardListeners = (cardSelector, mediaSelector) => {
            const cards = document.querySelectorAll(cardSelector);
            cards.forEach(card => {
                const media = card.querySelector(mediaSelector) || card;
                
                card.addEventListener('mouseenter', () => {
                    activeCard = card;
                    activeMedia = media;
                    cardRect = media.getBoundingClientRect();
                    isHovering = true;
                    targetRotX = 0;
                    targetRotY = 0;
                    currentRotX = 0;
                    currentRotY = 0;
                    card.style.zIndex = '10';

                    if (!rafId) {
                        rafId = requestAnimationFrame(updateGyroFrame);
                    }
                });

                card.addEventListener('mousemove', (e) => {
                    if (!cardRect || activeMedia !== media) return;
                    const mouseX = e.clientX - cardRect.left;
                    const mouseY = e.clientY - cardRect.top;

                    // Normalized relative coordinates (-0.5 to +0.5)
                    const normX = (mouseX / cardRect.width) - 0.5;
                    const normY = (mouseY / cardRect.height) - 0.5;

                    // Subtle luxury rotation boundaries (Max ±6.5 deg)
                    targetRotX = Math.max(-6.5, Math.min(6.5, normY * -13));
                    targetRotY = Math.max(-6.5, Math.min(6.5, normX * 13));

                    // Update dynamic golden light reflection coordinates
                    const sheenX = Math.max(0, Math.min(100, (mouseX / cardRect.width) * 100));
                    const sheenY = Math.max(0, Math.min(100, (mouseY / cardRect.height) * 100));
                    media.style.setProperty('--sheen-x', `${sheenX.toFixed(1)}%`);
                    media.style.setProperty('--sheen-y', `${sheenY.toFixed(1)}%`);
                });

                card.addEventListener('mouseleave', () => {
                    isHovering = false;
                    targetRotX = 0;
                    targetRotY = 0;
                });
            });
        };

        initCardListeners('.grid-card', '.card-media');
        initCardListeners('.philosophy-image-col', '.editorial-frame');
        initCardListeners('.editorial-media-col', '.editorial-portrait-wrap');

        // Re-cache bounding rect on scroll and resize to prevent stale rect drift
        const invalidateRect = () => {
            if (activeMedia && isHovering) {
                cardRect = activeMedia.getBoundingClientRect();
            }
        };

        if (lenis) lenis.on('scroll', invalidateRect);
        window.addEventListener('scroll', invalidateRect, { passive: true });
        window.addEventListener('resize', invalidateRect, { passive: true });
    }

    // --------------------------------------------------------------------------
    // 5. INTERSECTION OBSERVER: REVEAL ANIMATIONS & STATS COUNTER
    // --------------------------------------------------------------------------
    const revealItems = document.querySelectorAll('.reveal-item');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                
                const statNums = entry.target.querySelectorAll('.stat-num[data-target]');
                statNums.forEach(numEl => {
                    const target = parseInt(numEl.getAttribute('data-target'), 10);
                    animateCounter(numEl, target);
                });

                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    revealItems.forEach(el => revealObserver.observe(el));

    function animateCounter(el, target) {
        let current = 0;
        const duration = 1600;
        const stepTime = 20;
        const totalSteps = duration / stepTime;
        const increment = target / totalSteps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            if (target === 100) {
                el.textContent = `${Math.floor(current)}%`;
            } else {
                el.textContent = `${Math.floor(current)}+`;
            }
        }, stepTime);
    }

    // --------------------------------------------------------------------------
    // 6. INTERACTIVE RAW VS COUTURE COLOR SCIENCE SLIDER ENGINE
    // --------------------------------------------------------------------------
    const comparisonSlider = document.getElementById('comparisonSlider');
    const sliderOverlay = document.getElementById('sliderOverlay');
    const sliderHandle = document.getElementById('sliderHandle');

    if (comparisonSlider && sliderOverlay && sliderHandle) {
        let isSliding = false;

        const setSliderPosition = (xPos) => {
            const rect = comparisonSlider.getBoundingClientRect();
            let offsetX = xPos - rect.left;
            
            const minX = rect.width * 0.05;
            const maxX = rect.width * 0.95;
            if (offsetX < minX) offsetX = minX;
            if (offsetX > maxX) offsetX = maxX;

            const percentage = (offsetX / rect.width) * 100;
            sliderOverlay.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
            sliderHandle.style.left = `${percentage}%`;
        };

        const startSlide = (e) => {
            isSliding = true;
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            setSliderPosition(clientX);
        };

        const moveSlide = (e) => {
            if (!isSliding) return;
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            setSliderPosition(clientX);
        };

        const stopSlide = () => {
            isSliding = false;
        };

        comparisonSlider.addEventListener('mousedown', startSlide);
        window.addEventListener('mousemove', moveSlide);
        window.addEventListener('mouseup', stopSlide);

        comparisonSlider.addEventListener('touchstart', startSlide, { passive: true });
        window.addEventListener('touchmove', moveSlide, { passive: true });
        window.addEventListener('touchend', stopSlide, { passive: true });
    }

    // --------------------------------------------------------------------------
    // 7. MASTERPIECE GALLERY FILTERING & VIEW SWITCHER
    // --------------------------------------------------------------------------
    const tabBtns = document.querySelectorAll('.portfolio-tabs .tab-btn');
    const gridCards = document.querySelectorAll('.portfolio-grid .grid-card');
    const portfolioGrid = document.getElementById('portfolioGrid');
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewFeedBtn = document.getElementById('viewFeedBtn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filter = btn.getAttribute('data-filter');

            gridCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 20);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.96)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 350);
                }
            });
        });
    });

    if (viewGridBtn && viewFeedBtn && portfolioGrid) {
        viewGridBtn.addEventListener('click', () => {
            viewGridBtn.classList.add('active');
            viewFeedBtn.classList.remove('active');
            portfolioGrid.classList.remove('feed-view');
        });

        viewFeedBtn.addEventListener('click', () => {
            viewFeedBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            portfolioGrid.classList.add('feed-view');
        });
    }

    // --------------------------------------------------------------------------
    // 8. 4K CINEMATIC SHOWREEL VIDEO MODAL ENGINE
    // --------------------------------------------------------------------------
    const openVideoBtn = document.getElementById('openVideoBtn');
    const videoModal = document.getElementById('videoModal');
    const videoCloseBtn = document.getElementById('videoCloseBtn');
    const cinemaVideo = document.getElementById('cinemaVideo');

    if (openVideoBtn && videoModal) {
        const openCinema = () => {
            videoModal.classList.add('active');
            videoModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (cinemaVideo) {
                cinemaVideo.currentTime = 0;
                cinemaVideo.play().catch(() => {});
            }
        };

        const closeCinema = () => {
            videoModal.classList.remove('active');
            videoModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (cinemaVideo) cinemaVideo.pause();
        };

        openVideoBtn.addEventListener('click', openCinema);
        if (videoCloseBtn) videoCloseBtn.addEventListener('click', closeCinema);

        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) closeCinema();
        });

        document.addEventListener('keydown', (e) => {
            if (videoModal.classList.contains('active') && e.key === 'Escape') {
                closeCinema();
            }
        });
    }

    // --------------------------------------------------------------------------
    // 9. PREDICTIVE HD LIGHTBOX ENGINE WITH DEEP-ZOOM & TOUCH-SWIPE
    // --------------------------------------------------------------------------
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDesc = document.getElementById('lightboxDesc');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentGallery = [];
    let currentIndex = 0;
    let isZoomed = false;
    const preloadedImages = new Map();

    function collectGalleryItems() {
        currentGallery = [];
        const visibleTriggers = document.querySelectorAll('.lightbox-trigger');
        visibleTriggers.forEach((trigger) => {
            const card = trigger.closest('.grid-card');
            if (!card || card.style.display !== 'none') {
                currentGallery.push({
                    src: trigger.getAttribute('src'),
                    title: trigger.getAttribute('data-title') || 'Masterpiece Capture',
                    desc: trigger.getAttribute('data-desc') || 'Story by Clicker Babu Luxury Anthology.'
                });
            }
        });
    }

    function preloadImage(url) {
        if (!url || preloadedImages.has(url)) return;
        const img = new Image();
        img.src = url;
        preloadedImages.set(url, img);
    }

    function resetZoom() {
        isZoomed = false;
        if (lightboxImg) {
            lightboxImg.classList.remove('zoomed');
            lightboxImg.style.transformOrigin = 'center center';
        }
    }

    function updateLightbox(index, direction = 'none') {
        if (currentGallery.length === 0) return;
        if (index < 0) index = currentGallery.length - 1;
        if (index >= currentGallery.length) index = 0;
        currentIndex = index;
        resetZoom();

        const item = currentGallery[currentIndex];

        lightboxImg.style.opacity = '0';
        lightboxImg.style.transform = direction === 'next' ? 'translateX(20px) scale(0.98)' : direction === 'prev' ? 'translateX(-20px) scale(0.98)' : 'scale(0.98)';

        setTimeout(() => {
            lightboxImg.src = item.src;
            lightboxTitle.textContent = item.title;
            lightboxDesc.textContent = item.desc;

            lightboxImg.style.opacity = '1';
            lightboxImg.style.transform = 'translateX(0) scale(1)';

            const nextIdx = (currentIndex + 1) % currentGallery.length;
            const prevIdx = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
            preloadImage(currentGallery[nextIdx].src);
            preloadImage(currentGallery[prevIdx].src);
        }, 150);
    }

    function openLightbox(src) {
        collectGalleryItems();
        currentIndex = currentGallery.findIndex(item => item.src === src);
        if (currentIndex === -1) currentIndex = 0;

        updateLightbox(currentIndex);
        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        resetZoom();
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.lightbox-trigger');
        if (trigger) {
            e.preventDefault();
            openLightbox(trigger.getAttribute('src'));
        }
    });

    if (lightboxImg) {
        lightboxImg.addEventListener('dblclick', (e) => {
            isZoomed = !isZoomed;
            if (isZoomed) {
                const rect = lightboxImg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                lightboxImg.style.transformOrigin = `${x}% ${y}%`;
                lightboxImg.classList.add('zoomed');
            } else {
                resetZoom();
            }
        });

        lightboxImg.addEventListener('mousemove', (e) => {
            if (!isZoomed) return;
            const rect = lightboxImg.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            lightboxImg.style.transformOrigin = `${x}% ${y}%`;
        });
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => updateLightbox(currentIndex - 1, 'prev'));
    if (lightboxNext) lightboxNext.addEventListener('click', () => updateLightbox(currentIndex + 1, 'next'));

    document.addEventListener('keydown', (e) => {
        if (!lightboxModal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') updateLightbox(currentIndex - 1, 'prev');
        if (e.key === 'ArrowRight') updateLightbox(currentIndex + 1, 'next');
    });

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Mobile Swipe Detection
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let lastTapTime = 0;

    lightboxModal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
            isZoomed = !isZoomed;
            if (isZoomed) {
                lightboxImg.classList.add('zoomed');
            } else {
                resetZoom();
            }
            e.preventDefault();
        }
        lastTapTime = currentTime;
    }, { passive: false });

    lightboxModal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        if (!isZoomed) {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 45) {
                if (deltaX < 0) updateLightbox(currentIndex + 1, 'next');
                else updateLightbox(currentIndex - 1, 'prev');
            }
        }
    }, { passive: true });

    // --------------------------------------------------------------------------
    // 10. MINIMALIST FAQ ACCORDION ENGINE
    // --------------------------------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        const body = item.querySelector('.faq-body');

        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-header').setAttribute('aria-expanded', 'false');
                otherItem.querySelector('.faq-body').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });

    // --------------------------------------------------------------------------
    // 11. AMBIENT CINEMATIC AUDIO SYNTHESIZER (WEB AUDIO API)
    // --------------------------------------------------------------------------
    const soundToggle = document.getElementById('soundToggle');
    let audioCtx = null;
    let isPlayingAudio = false;
    let masterGain = null;
    let oscillators = [];

    function initAmbientSynthesizer() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();

        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, audioCtx.currentTime);

        masterGain.connect(filter);
        filter.connect(audioCtx.destination);

        const notes = [110.00, 164.81, 220.00, 277.18, 329.63, 440.00];

        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), audioCtx.currentTime);

            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(0.04 / (idx + 1), audioCtx.currentTime);

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start();
            oscillators.push(osc);
        });
    }

    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            try {
                if (!audioCtx) initAmbientSynthesizer();
                if (audioCtx.state === 'suspended') audioCtx.resume();
            } catch (err) {
                console.warn('AudioContext resume deferred:', err);
            }

            isPlayingAudio = !isPlayingAudio;
            soundToggle.setAttribute('aria-pressed', isPlayingAudio ? 'true' : 'false');

            if (isPlayingAudio) {
                masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 1.8);
                soundToggle.classList.add('playing');
                soundToggle.querySelector('.sound-label').textContent = 'PLAYING';
            } else {
                masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
                soundToggle.classList.remove('playing');
                soundToggle.querySelector('.sound-label').textContent = 'SOUND';
            }
        });
    }

    // --------------------------------------------------------------------------
    // 12. 1-CLICK WHATSAPP LEAD SYNC & FORM TOAST ENGINE
    // --------------------------------------------------------------------------
    const weddingDateInput = document.getElementById('weddingDates');
    if (weddingDateInput) {
        const today = new Date().toISOString().split('T')[0];
        weddingDateInput.setAttribute('min', today);
    }

    const bookingForm = document.getElementById('bookingForm');
    const luxuryToast = document.getElementById('luxuryToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');
    const toastProgress = luxuryToast ? luxuryToast.querySelector('.toast-progress') : null;
    const whatsappSyncBtn = document.getElementById('whatsappSyncBtn');

    function showLuxuryToast(title, message, isSuccess = true) {
        if (!luxuryToast) return;
        toastTitle.textContent = title;
        toastMsg.textContent = message;

        luxuryToast.classList.add('show');
        if (toastProgress) {
            toastProgress.style.width = '100%';
            setTimeout(() => {
                toastProgress.style.width = '0%';
            }, 10);
        }

        setTimeout(() => {
            luxuryToast.classList.remove('show');
        }, 5000);
    }

    // Helper: Sanitize input strings against potential HTML tags / control characters
    function sanitizeInput(str) {
        if (!str) return '';
        return str.replace(/[<>]/g, '').trim();
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Anti-Spam Honeypot Check: Headless bots populate hidden fields
            const hpTrap = document.getElementById('hpConfirmField');
            if (hpTrap && hpTrap.value) {
                console.warn('Spam bot trap triggered. Silently dropping inquiry.');
                showLuxuryToast('Inquiry Submitted', 'Thank you! Your inquiry has been logged.', true);
                bookingForm.reset();
                return;
            }

            const name = sanitizeInput(document.getElementById('clientName')?.value || '');
            const email = sanitizeInput(document.getElementById('clientEmail')?.value || '');
            const phone = sanitizeInput(document.getElementById('clientPhone')?.value || '');
            const date = document.getElementById('weddingDates')?.value || '';
            const service = sanitizeInput(document.getElementById('serviceType')?.value || 'Royal Destination Wedding');
            const venue = sanitizeInput(document.getElementById('weddingVenue')?.value || '') || 'To be finalized';
            const notes = sanitizeInput(document.getElementById('clientNotes')?.value || '') || 'Looking forward to crafting our story!';

            if (!name || name.length < 2) {
                showLuxuryToast('Name Required', 'Please provide your full names.', false);
                document.getElementById('clientName')?.focus();
                return;
            }

            // Phone Validation: Accepts +91, dashes, spaces, 7 to 16 digits
            const phoneRegex = /^[+0-9\s-]{7,16}$/;
            if (!phone || !phoneRegex.test(phone)) {
                showLuxuryToast('Valid Phone Required', 'Please enter a valid phone number (7–16 digits).', false);
                document.getElementById('clientPhone')?.focus();
                return;
            }

            const waMessage = `👑 *New Wedding Commission Inquiry:*%0A%0A` +
                `• *Couple:* ${encodeURIComponent(name)}%0A` +
                `• *Wedding Date:* ${encodeURIComponent(date || 'Upcoming')}%0A` +
                `• *Service:* ${encodeURIComponent(service)}%0A` +
                `• *City / Venue:* ${encodeURIComponent(venue)}%0A` +
                `• *Email:* ${encodeURIComponent(email)}%0A` +
                `• *Phone:* ${encodeURIComponent(phone)}%0A` +
                `• *Vision Note:* ${encodeURIComponent(notes)}`;

            const waLink = `https://wa.me/917047470742?text=${waMessage}`;

            if (whatsappSyncBtn) {
                whatsappSyncBtn.href = waLink;
                whatsappSyncBtn.style.display = 'inline-flex';
            }

            showLuxuryToast(
                'Inquiry Received with Honor',
                `Thank you, ${name}! Clicker Babu will review your wedding date (${date || 'Upcoming'}). Click below to sync directly on WhatsApp.`
            );
        });
    }

    // --------------------------------------------------------------------------
    // 13. PWA SERVICE WORKER REGISTRATION (OFFLINE CACHING)
    // --------------------------------------------------------------------------
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((reg) => {
                console.log('Story by Clicker Babu PWA Service Worker registered:', reg.scope);
            }).catch((err) => {
                console.warn('PWA Service Worker registration deferred:', err);
            });
        });
    }

});
