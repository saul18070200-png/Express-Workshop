// 1. Force Scroll to Top and Disable Browser Restoration ASAP
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    // Re-verify top position after DOM is ready
    window.scrollTo(0, 0);

    console.log('NOVAX loaded');

    // Mobile Menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav__link');

    mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileBtn.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            mobileBtn.classList.remove('active');
        });
    });

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Initial fold elements should be visible instantly
    const sections = document.querySelectorAll('.section:not(.hero)');
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });

    // Logo and Hero are native, no JS needed for visibility.

    // Form Submission handled natively by FormSubmit


    // --- PREMIUM FEATURES ---

    // 1. Typing Animation
    const typingText = document.getElementById('typing-text');
    const phrases = ["potencia sistemas críticos", "construye arquitectura de élite", "escala sin improvisar", "diseña alta ingeniería"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typingText.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typingText.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Pause before new word
        }

        setTimeout(type, typeSpeed);
    }

    if (typingText) {
        type();
    }

    // 2. Canvas Particles
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
                this.color = `rgba(0, 240, 255, ${Math.random() * 0.5})`;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for (let i = 0; i < 120; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p, index) => {
                p.update();
                p.draw();

                // Draw connections
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 - distance / 1500})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();
    }

    // 3. 3D Tilt Effect
    const cards = document.querySelectorAll('.service-card, .project-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // 4. Simplified Cursor Logic
    const cursor = document.querySelector('.custom-cursor-dot');

    if (cursor) {
        window.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });

        const interactiveElements = document.querySelectorAll('a, button, .service-card, .project-card, input, select, textarea, .custom-select');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('active'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
    }

    // 5. Magnetic Buttons
    const magneticButtons = document.querySelectorAll('.btn');
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // 6. Interactive Tech Orb
    const orb = document.querySelector('.tech-orb');
    const hero = document.querySelector('.hero');
    if (orb && hero) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            orb.style.transform = `translate(${x * 50}px, ${y * 50}px)`;
            orb.classList.add('active');
        });

        hero.addEventListener('mouseleave', () => {
            orb.style.transform = 'translate(0, 0)';
            orb.classList.remove('active');
        });
    }
    // 5. Custom Dropdown Logic
    // Generic Custom Dropdown Logic
    function setupCustomSelect(selectId, inputId) {
        const customSelect = document.getElementById(selectId);
        if (!customSelect) return;

        const trigger = customSelect.querySelector('.select-trigger');
        const triggerText = trigger.querySelector('span');
        const options = customSelect.querySelectorAll('.option');
        const hiddenInput = document.getElementById(inputId);

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other selects
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== customSelect) s.classList.remove('active');
            });
            customSelect.classList.toggle('active');
        });

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                const text = option.innerText;

                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                triggerText.innerText = text;
                triggerText.style.color = 'var(--text-main)';
                hiddenInput.value = value;
                customSelect.classList.remove('active');
            });
        });
    }

    setupCustomSelect('serviceSelect', 'serviceInput');
    setupCustomSelect('budgetSelect', 'budgetInput');

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('active'));
    });
});
