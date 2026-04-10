/* ============================================
   StarCasino - Основное ядро приложения
   Версия 2.0
   ============================================ */

let currentUserId = null;
let appState = {
    balance: 100,
    gifts: 0,
    exp: 0,
    level: 1,
    lastCheckinDate: null,
    checkinStreak: 0,
    referrals: [],
    referrer: null,
    totalDeposits: 0,
    totalBets: 0,
    totalWins: 0
};

const CONFIG = {
    ADMIN_IDS: ['8478884644', '8293927811'],
    BOT_TOKEN: '8774754079:AAHvbqlsyiS61V6xWA2pH78foh-ulcd1BkA',
    CHECKIN_REWARDS: [20, 35, 55, 80, 110, 150, 200, 300],
    MIN_WITHDRAW: 50,
    REFERRAL_BONUS: 3,
    REFERRAL_PERCENT: 0.05
};

const tg = window.Telegram.WebApp;

function saveToLocalStorage() {
    const data = {
        balance: appState.balance,
        gifts: appState.gifts,
        exp: appState.exp,
        level: appState.level,
        lastCheckinDate: appState.lastCheckinDate,
        checkinStreak: appState.checkinStreak,
        referrals: appState.referrals,
        referrer: appState.referrer,
        totalDeposits: appState.totalDeposits,
        totalBets: appState.totalBets,
        totalWins: appState.totalWins
    };
    localStorage.setItem(`user_${currentUserId}`, JSON.stringify(data));
    
    let allUsers = JSON.parse(localStorage.getItem('all_users_ids') || '[]');
    if (!allUsers.includes(currentUserId)) {
        allUsers.push(currentUserId);
        localStorage.setItem('all_users_ids', JSON.stringify(allUsers));
    }
}

function loadFromLocalStorage() {
    const raw = localStorage.getItem(`user_${currentUserId}`);
    if (raw) {
        const data = JSON.parse(raw);
        appState.balance = data.balance || 100;
        appState.gifts = data.gifts || 0;
        appState.exp = data.exp || 0;
        appState.level = data.level || 1;
        appState.lastCheckinDate = data.lastCheckinDate || null;
        appState.checkinStreak = data.checkinStreak || 0;
        appState.referrals = data.referrals || [];
        appState.referrer = data.referrer || null;
        appState.totalDeposits = data.totalDeposits || 0;
        appState.totalBets = data.totalBets || 0;
        appState.totalWins = data.totalWins || 0;
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && refCode !== currentUserId) {
            const referrerData = localStorage.getItem(`user_${refCode}`);
            if (referrerData) {
                let refObj = JSON.parse(referrerData);
                refObj.balance = (refObj.balance || 0) + CONFIG.REFERRAL_BONUS;
                refObj.referrals = refObj.referrals || [];
                if (!refObj.referrals.includes(currentUserId)) {
                    refObj.referrals.push(currentUserId);
                }
                localStorage.setItem(`user_${refCode}`, JSON.stringify(refObj));
                appState.referrer = refCode;
            }
        }
        appState.balance = 100;
    }
    updateUI();
}

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(appState.balance);
    let level = Math.floor(appState.exp / 1000) + 1;
    appState.level = level;
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) levelBadge.innerHTML = `🎖️ Уровень ${level}`;
    saveToLocalStorage();
}

function addStars(amount, reason = 'deposit') {
    if (amount <= 0) return false;
    appState.balance += amount;
    
    if (reason === 'deposit' && appState.referrer && amount > 0) {
        const refBonus = amount * CONFIG.REFERRAL_PERCENT;
        if (refBonus > 0) {
            let refData = localStorage.getItem(`user_${appState.referrer}`);
            if (refData) {
                let refParsed = JSON.parse(refData);
                refParsed.balance = (refParsed.balance || 0) + refBonus;
                localStorage.setItem(`user_${appState.referrer}`, JSON.stringify(refParsed));
            }
        }
        appState.totalDeposits += amount;
    }
    updateUI();
    hapticFeedback('light');
    return true;
}

function removeStars(amount) {
    if (appState.balance >= amount && amount > 0) {
        appState.balance -= amount;
        appState.totalBets += amount;
        updateUI();
        return true;
    } else {
        showPopup('Недостаточно средств', `Вам не хватает ${amount - appState.balance} ⭐`);
        return false;
    }
}

function addExp(amount) {
    appState.exp += amount;
    updateUI();
}

function hapticFeedback(type = 'light') {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(type);
    }
}

function showPopup(title, message, callback = null) {
    tg.showPopup({
        title: title,
        message: message,
        buttons: [{ type: 'ok' }]
    }, callback);
}

function generateReferralLink() {
    const botName = tg.initDataUnsafe?.user?.username || 'StarCasinoBot';
    return `https://t.me/${botName}?start=ref_${currentUserId}`;
}

function isAdmin() {
    return CONFIG.ADMIN_IDS.includes(currentUserId);
}

function initAuth() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentUserId = tg.initDataUnsafe.user.id.toString();
    } else {
        currentUserId = 'guest_' + Math.floor(Math.random() * 10000000);
    }
    loadFromLocalStorage();
    tg.expand();
    tg.enableClosingConfirmation();
    return currentUserId;
}

function renderMainMenu() {
    const container = document.getElementById('dynamicContent');
    container.className = 'main-content main-menu-bg';
    container.innerHTML = `
        <div class="games-grid">
            <div class="game-card" data-game="crash">
                <div class="game-icon">🚀</div>
                <div class="game-title">Краш</div>
            </div>
            <div class="game-card" data-game="roulette">
                <div class="game-icon">🎡</div>
                <div class="game-title">Рулетка</div>
            </div>
            <div class="game-card" data-game="hilo">
                <div class="game-icon">📈</div>
                <div class="game-title">Hi-Lo</div>
            </div>
            <div class="game-card" data-game="lucky">
                <div class="game-icon">🎰</div>
                <div class="game-title">Lucky Wheel</div>
            </div>
        </div>
        <div class="checkin-card" style="margin-top: 24px; background: rgba(0,0,0,0.6); border-radius: 28px; padding: 20px;">
            <div class="flex-between">
                <span>⭐ Ежедневный бонус</span>
                <span id="checkinReward">${CONFIG.CHECKIN_REWARDS[appState.checkinStreak % 8]} ⭐</span>
            </div>
            <button id="checkinBtn" style="width: 100%; margin-top: 12px;">Забрать бонус</button>
            <div id="checkinTimer" class="small-text" style="text-align: center; margin-top: 10px;"></div>
        </div>
    `;
    
    document.querySelectorAll('[data-game]').forEach(el => {
        el.addEventListener('click', () => {
            const game = el.dataset.game;
            hapticFeedback('light');
            if (game === 'crash') window.openCrashGame();
            else if (game === 'roulette') window.openRouletteGame();
            else if (game === 'hilo') window.openHiLoGame();
            else if (game === 'lucky') window.openLuckyWheel();
        });
    });
    
    document.getElementById('checkinBtn').addEventListener('click', () => claimDailyBonus());
    updateCheckinTimer();
}

function claimDailyBonus() {
    const today = new Date().toDateString();
    
    if (appState.lastCheckinDate === today) {
        showPopup('Уже получено', 'Вы уже получили сегодняшний бонус');
        return false;
    }
    
    if (appState.lastCheckinDate) {
        const lastDate = new Date(appState.lastCheckinDate);
        const todayDate = new Date();
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 3600 * 24));
        if (diffDays > 1) appState.checkinStreak = 0;
    }
    
    const reward = CONFIG.CHECKIN_REWARDS[appState.checkinStreak % 8];
    addStars(reward);
    appState.lastCheckinDate = today;
    appState.checkinStreak++;
    saveToLocalStorage();
    showPopup('Бонус получен!', `Вы получили ${reward} ⭐`);
    hapticFeedback('medium');
    renderMainMenu();
    return true;
}

function updateCheckinTimer() {
    const timerDiv = document.getElementById('checkinTimer');
    if (!timerDiv) return;
    
    function update() {
        if (appState.lastCheckinDate === new Date().toDateString()) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const msLeft = tomorrow - new Date();
            const hours = Math.floor(msLeft / (1000 * 3600));
            const minutes = Math.floor((msLeft % (1000 * 3600)) / (1000 * 60));
            timerDiv.innerText = `Следующий бонус через: ${hours}ч ${minutes}м`;
        } else {
            timerDiv.innerText = 'Доступно сейчас!';
        }
    }
    update();
    setInterval(update, 60000);
}

function renderProfile() {
    const container = document.getElementById('dynamicContent');
    container.className = 'main-content';
    container.innerHTML = `
        <div class="profile-info">
            <div class="flex-between"><span>⭐ Баланс:</span><span>${Math.floor(appState.balance)}</span></div>
            <div class="flex-between"><span>🎁 Подарки:</span><span>${appState.gifts}</span></div>
            <div class="flex-between"><span>🏆 Опыт:</span><span>${appState.exp}</span></div>
            <div class="flex-between"><span>📊 Уровень:</span><span>${appState.level}</span></div>
            <div class="ref-link">
                <span id="refLinkText">${generateReferralLink()}</span>
                <button id="copyRefBtn">📋 Копировать</button>
            </div>
        </div>
        
        <div class="profile-info">
            <h3>💰 Пополнение баланса</h3>
            <input type="number" id="depositAmount" placeholder="Сумма в ⭐" style="width: 100%; margin: 10px 0;">
            <button id="doDepositBtn" style="width: 100%;">Пополнить через Telegram Stars</button>
        </div>
        
        <div class="profile-info">
            <h3>💸 Вывод средств</h3>
            <input type="number" id="withdrawAmount" placeholder="Минимум ${CONFIG.MIN_WITHDRAW} ⭐" style="width: 100%; margin: 10px 0;">
            <input type="text" id="walletAddr" placeholder="Адрес кошелька" style="width: 100%; margin: 10px 0;">
            <button id="requestWithdrawBtn" style="width: 100%;">Запросить вывод</button>
        </div>
        
        ${isAdmin() ? `
        <div class="admin-panel">
            <h3>🔧 Админ-панель</h3>
            <button id="adminPanelBtn" style="width: 100%;">Открыть админ-панель</button>
        </div>
        ` : ''}
    `;
    
    document.getElementById('copyRefBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(generateReferralLink());
        showPopup('Скопировано', 'Ссылка скопирована');
    });
    
    document.getElementById('doDepositBtn')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('depositAmount').value);
        if (amount > 0) {
            addStars(amount, 'deposit');
            showPopup('Успех', `+${amount} ⭐`);
            renderProfile();
        }
    });
    
    document.getElementById('requestWithdrawBtn')?.addEventListener('click', () => {
        const amount = parseInt(document.getElementById('withdrawAmount').value);
        const wallet = document.getElementById('walletAddr').value;
        if (amount >= CONFIG.MIN_WITHDRAW && wallet) {
            if (appState.balance >= amount) {
                window.requestWithdraw(amount, wallet);
            } else {
                showPopup('Ошибка', 'Недостаточно средств');
            }
        } else {
            showPopup('Ошибка', `Минимум ${CONFIG.MIN_WITHDRAW} ⭐`);
        }
    });
    
    if (isAdmin()) {
        document.getElementById('adminPanelBtn')?.addEventListener('click', () => {
            if (window.openAdminPanel) window.openAdminPanel();
        });
    }
}

function renderPlaceholder(title) {
    const container = document.getElementById('dynamicContent');
    container.className = 'main-content';
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 4rem;">🚧</div>
            <h2>${title}</h2>
            <p style="margin-top: 20px;">В разработке</p>
            <button id="backToMainBtn" style="margin-top: 30px;">В меню</button>
        </div>
    `;
    document.getElementById('backToMainBtn')?.addEventListener('click', () => {
        renderMainMenu();
        setActiveNav('solo');
    });
}

let currentScreen = 'solo';

function setActiveNav(screen) {
    currentScreen = screen;
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.nav === screen) el.classList.add('active');
    });
}

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', () => {
            const nav = el.dataset.nav;
            hapticFeedback('light');
            setActiveNav(nav);
            switch(nav) {
                case 'solo': renderMainMenu(); break;
                case 'profile': renderProfile(); break;
                default: renderPlaceholder('В разработке');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    renderMainMenu();
    initNavigation();
    setActiveNav('solo');
    
    let tapCount = 0;
    document.querySelector('.balance-box').addEventListener('click', () => {
        tapCount++;
        setTimeout(() => { tapCount = 0; }, 1000);
        if (tapCount >= 5 && isAdmin()) {
            tapCount = 0;
            if (window.openAdminPanel) window.openAdminPanel();
        }
    });
});
