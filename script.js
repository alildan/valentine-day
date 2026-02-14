// Initialize configuration
const config = window.VALENTINE_CONFIG;

// Define early so onclick never throws (setupMusicPlayer overwrites when music is enabled)
window.startMusic = function () {};

// Validate configuration
function validateConfig() {
    const warnings = [];

    // Check required fields
    if (!config.valentineName) {
        warnings.push("Valentine's name is not set! Using default.");
        config.valentineName = "My Love";
    }

    // Validate colors
    const isValidHex = (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    Object.entries(config.colors).forEach(([key, value]) => {
        if (!isValidHex(value)) {
            warnings.push(`Invalid color for ${key}! Using default.`);
            config.colors[key] = getDefaultColor(key);
        }
    });

    // Validate animation values
    if (parseFloat(config.animations.floatDuration) < 5) {
        warnings.push("Float duration too short! Setting to 5s minimum.");
        config.animations.floatDuration = "5s";
    }

    if (config.animations.heartExplosionSize < 1 || config.animations.heartExplosionSize > 3) {
        warnings.push("Heart explosion size should be between 1 and 3! Using default.");
        config.animations.heartExplosionSize = 1.5;
    }

    // Log warnings if any
    if (warnings.length > 0) {
        console.warn("⚠️ Configuration Warnings:");
        warnings.forEach(warning => console.warn("- " + warning));
    }
}

// Default color values
function getDefaultColor(key) {
    const defaults = {
        backgroundStart: "#ffafbd",
        backgroundEnd: "#ffc3a0",
        buttonBackground: "#ff6b6b",
        buttonHover: "#ff8787",
        textColor: "#ff4757"
    };
    return defaults[key];
}

// Set page title
document.title = config.pageTitle;

// Initialize the page content when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Validate configuration first
    validateConfig();

    // Set texts from config + title reveal
    const titleEl = document.getElementById('valentineTitle');
    titleEl.textContent = `${config.valentineName}, my love...`;
    titleEl.classList.add('title-reveal');

    // Set first question texts
    document.getElementById('question1Text').textContent = config.questions.first.text;
    document.getElementById('yesBtn1').textContent = config.questions.first.yesBtn;
    document.getElementById('noBtn1').textContent = config.questions.first.noBtn;
    document.getElementById('secretAnswerBtn').textContent = config.questions.first.secretAnswer;
    
    // Set second question texts
    document.getElementById('question2Text').textContent = config.questions.second.text;
    document.getElementById('startText').textContent = config.questions.second.startText;
    document.getElementById('nextBtn').textContent = config.questions.second.nextBtn;
    
    // Set third question texts
    document.getElementById('question3Text').textContent = config.questions.third.text;
    document.getElementById('yesBtn3').textContent = config.questions.third.yesBtn;
    document.getElementById('noBtn3').textContent = config.questions.third.noBtn;

    // Create initial floating elements
    createFloatingElements();

    // First question entrance
    const q1 = document.getElementById('question1');
    requestAnimationFrame(() => q1.classList.add('visible'));

    // Setup music player
    setupMusicPlayer();
});

// Create floating hearts and bears
function createFloatingElements() {
    const container = document.querySelector('.floating-elements');
    
    // Create hearts
    config.floatingEmojis.hearts.forEach(heart => {
        const div = document.createElement('div');
        div.className = 'heart';
        div.innerHTML = heart;
        setRandomPosition(div);
        container.appendChild(div);
    });

    // Create bears
    config.floatingEmojis.bears.forEach(bear => {
        const div = document.createElement('div');
        div.className = 'bear';
        div.innerHTML = bear;
        setRandomPosition(div);
        container.appendChild(div);
    });
}

// Set random position, size, opacity, and sway for floating elements
function setRandomPosition(element) {
    element.style.left = Math.random() * 100 + 'vw';
    element.style.animationDelay = Math.random() * 8 + 's';
    const duration = 10 + Math.random() * 20;
    element.style.animationDuration = duration + 's';
    const scale = 0.65 + Math.random() * 0.7;
    element.style.setProperty('--float-scale', scale);
    element.style.opacity = 0.5 + Math.random() * 0.5;
    if (Math.random() > 0.4) element.classList.add('sway');
}

// Progressive reveal: each click (Yes, No, or secret answer button) makes the secret answer bigger
let secretRevealLevel = 0;
const SECRET_MAX_LEVEL = 15;
const SECRET_SCALE_START = 0.85;
const SECRET_SCALE_STEP = 0.12;

function revealSecretAnswer() {
    const el = document.getElementById('secretAnswer');
    if (!el) return;
    secretRevealLevel = Math.min(secretRevealLevel + 1, SECRET_MAX_LEVEL);
    el.classList.add('revealed');
    const scale = SECRET_SCALE_START + secretRevealLevel * SECRET_SCALE_STEP;
    el.style.setProperty('--secret-reveal-scale', scale);
    el.setAttribute('data-reveal-level', String(secretRevealLevel));
}

// Function to show next question with fade/slide transition
function showNextQuestion(questionNumber) {
    document.querySelectorAll('.question-section').forEach(q => {
        q.classList.add('hidden');
        q.classList.remove('visible');
    });
    const next = document.getElementById(`question${questionNumber}`);
    next.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => next.classList.add('visible'));
    });
    // Hide secret answer when leaving first question (level resets when they come back)
    const secretAnswer = document.getElementById('secretAnswer');
    if (secretAnswer) {
        if (questionNumber !== 1) {
            secretAnswer.classList.add('hidden');
        } else {
            secretAnswer.classList.remove('hidden');
        }
    }
}

// Function to move the "No" button when clicked (with wiggle)
function moveButton(button) {
    const x = Math.random() * (window.innerWidth - button.offsetWidth);
    const y = Math.random() * (window.innerHeight - button.offsetHeight);
    button.style.position = 'fixed';
    button.style.left = x + 'px';
    button.style.top = y + 'px';
    button.classList.remove('no-wiggle');
    button.classList.add('wiggle');
    setTimeout(() => {
        button.classList.remove('wiggle');
        button.classList.add('no-wiggle');
    }, 400);
}

// Love meter functionality
const loveMeter = document.getElementById('loveMeter');
const loveValue = document.getElementById('loveValue');
const extraLove = document.getElementById('extraLove');
let lastMilestone = 0;

function setInitialPosition() {
    loveMeter.value = 100;
    loveValue.textContent = 100;
    loveMeter.style.width = '100%';
    updateLoveFill(100);
}

function updateLoveFill(value) {
    const percent = Math.min(100, value / 100);
    document.documentElement.style.setProperty('--love-percent', percent + '%');
}

function milestoneBurst() {
    const meterEl = document.querySelector('.love-meter');
    if (!meterEl) return;
    const rect = meterEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const hearts = config.floatingEmojis.hearts;
    for (let i = 0; i < 6; i++) {
        const el = document.createElement('div');
        el.className = 'love-meter-burst';
        el.innerHTML = hearts[Math.floor(Math.random() * hearts.length)];
        el.style.left = cx + 'px';
        el.style.top = cy + 'px';
        const angle = (i / 6) * Math.PI * 2 + Math.random();
        const dist = 40 + Math.random() * 40;
        el.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
        el.style.setProperty('--by', Math.sin(angle) * dist + 'px');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 900);
    }
}

loveMeter.addEventListener('input', () => {
    const value = parseInt(loveMeter.value);
    loveValue.textContent = value;
    updateLoveFill(value);

    if (value > 100) {
        extraLove.classList.remove('hidden');
        const overflowPercentage = (value - 100) / 9900;
        const extraWidth = overflowPercentage * window.innerWidth * 0.8;
        loveMeter.style.width = `calc(100% + ${extraWidth}px)`;
        loveMeter.style.transition = 'width 0.3s';

        if (value >= 5000 && lastMilestone < 5000) {
            lastMilestone = 5000;
            milestoneBurst();
        } else if (value > 1000 && lastMilestone < 1000) {
            lastMilestone = 1000;
            milestoneBurst();
        } else if (value > 100 && lastMilestone < 100) {
            lastMilestone = 100;
            milestoneBurst();
        }

        if (value >= 5000) {
            extraLove.classList.add('super-love');
            extraLove.textContent = config.loveMessages.extreme;
        } else if (value > 1000) {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.high;
        } else {
            extraLove.classList.remove('super-love');
            extraLove.textContent = config.loveMessages.normal;
        }
    } else {
        extraLove.classList.add('hidden');
        extraLove.classList.remove('super-love');
        loveMeter.style.width = '100%';
        lastMilestone = 0;
    }
});

// Initialize love meter
window.addEventListener('DOMContentLoaded', setInitialPosition);
window.addEventListener('load', setInitialPosition);

// Celebration function
function celebrate() {
    document.querySelectorAll('.question-section').forEach(q => {
        q.classList.add('hidden');
        q.classList.remove('visible');
    });
    const celebration = document.getElementById('celebration');
    celebration.classList.remove('hidden');
    celebration.classList.add('celebration-visible');

    document.getElementById('celebrationTitle').textContent = config.celebration.title;
    document.getElementById('celebrationMessage').textContent = config.celebration.message;

    const emojiWrap = document.getElementById('celebrationEmojisWrap');
    emojiWrap.innerHTML = '';
    const emojis = [...config.celebration.emojis];
    emojis.forEach((char) => {
        if (!char.trim()) return;
        const span = document.createElement('span');
        span.className = 'celebration-emoji';
        span.textContent = char;
        emojiWrap.appendChild(span);
    });

    createHeartExplosion();
    createConfetti();
}

function createConfetti() {
    const colors = ['#ff6b6b', '#ff8787', '#ffb8b8', '#ff4757', '#fff0f5', '#ffc0cb'];
    for (let i = 0; i < 45; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        el.style.animationDelay = Math.random() * 0.5 + 's';
        el.style.animationDuration = 2.5 + Math.random() * 1.5 + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4500);
    }
}

// Create heart explosion animation
function createHeartExplosion() {
    for (let i = 0; i < 50; i++) {
        const heart = document.createElement('div');
        const randomHeart = config.floatingEmojis.hearts[Math.floor(Math.random() * config.floatingEmojis.hearts.length)];
        heart.innerHTML = randomHeart;
        heart.className = 'heart';
        document.querySelector('.floating-elements').appendChild(heart);
        setRandomPosition(heart);
    }
}

// Background music: Chrome only allows play() in the same call stack as a user tap/click.
// We show a "Tap to start" overlay; that first tap starts music so play() is in the gesture.
function setupMusicPlayer() {
    const bgMusic = document.getElementById('bgMusic');
    const musicSource = document.getElementById('musicSource');
    if (!bgMusic || !musicSource) return;
    if (!config.music.enabled) {
        var o = document.getElementById('musicTapOverlay');
        if (o) o.classList.add('hidden');
        return;
    }

    musicSource.src = config.music.musicUrl;
    bgMusic.volume = config.music.volume ?? 0.5;
    bgMusic.load();

    let musicStarted = false;
    function tryPlay() {
        if (musicStarted) return;
        musicStarted = true;
        var p = bgMusic.play();
        if (p && p.catch) p.catch(function () { musicStarted = false; });
    }

    window.startMusic = tryPlay;

    // Overlay: first tap starts music (play() runs in that tap) then overlay is removed
    var overlay = document.getElementById('musicTapOverlay');
    if (overlay) {
        function onTap() {
            tryPlay();
            overlay.classList.add('hidden');
        }
        overlay.addEventListener('click', onTap, { once: true });
        overlay.addEventListener('touchstart', onTap, { once: true, passive: true });
    }

    document.addEventListener('click', tryPlay, { once: true, capture: true });
    document.addEventListener('touchstart', tryPlay, { once: true, capture: true, passive: true });
} 