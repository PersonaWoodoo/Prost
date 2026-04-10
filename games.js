/* ============================================
   StarCasino - Все игры
   Версия 2.0
   ============================================ */

let crashInterval = null;
let crashMultiplier = 1;
let crashGameActive = false;
let crashCurrentBet = 0;
let crashAutoTarget = null;

function renderGameScreen(title, contentHtml, bgClass = '') {
    const container = document.getElementById('dynamicContent');
    container.className = `main-content ${bgClass}`;
    container.innerHTML = `
        <div class="game-screen">
            <div class="game-header">
                <button class="back-btn" id="gameBackBtn">← Назад</button>
                <h2>${title}</h2>
            </div>
            <div style="flex: 1; padding: 16px;">
                ${contentHtml}
            </div>
        </div>
    `;
    document.getElementById('gameBackBtn').addEventListener('click', () => {
        if (crashInterval) clearInterval(crashInterval);
        renderMainMenu();
        setActiveNav('solo');
    });
}

window.openCrashGame = function() {
    renderGameScreen('Краш 🚀', `
        <div class="crash-area" style="padding: 30px; text-align: center; background: rgba(0,0,0,0.7); border-radius: 32px;">
            <div class="multiplier" id="crashMultiplier" style="font-size: 4rem; color: #ffd966;">1.00x</div>
            <div style="font-size: 2rem; margin: 10px 0;" id="rocketEmoji">🚀</div>
        </div>
        <div class="bet-control">
            <input type="number" id="crashBetAmount" placeholder="Ставка ⭐" value="10" style="flex: 1;">
            <input type="number" id="crashAutoCashout" placeholder="Авто-кэшаут x" style="flex: 1;">
        </div>
        <div class="bet-control">
            <button id="crashStartBtn" style="flex: 1; background: #27ae60;">🚀 Старт</button>
            <button id="crashCashoutBtn" style="flex: 1;" disabled>💰 Кэшаут</button>
        </div>
        <div id="crashStatus" style="text-align: center; margin-top: 20px;"></div>
    `);
    
    const startBtn = document.getElementById('crashStartBtn');
    const cashoutBtn = document.getElementById('crashCashoutBtn');
    const betInput = document.getElementById('crashBetAmount');
    const autoInput = document.getElementById('crashAutoCashout');
    const multiplierDiv = document.getElementById('crashMultiplier');
    const statusDiv = document.getElementById('crashStatus');
    const rocketEmoji = document.getElementById('rocketEmoji');
    
    startBtn.onclick = () => {
        if (crashGameActive) return;
        const bet = parseFloat(betInput.value);
        if (isNaN(bet) || bet <= 0) {
            showPopup('Ошибка', 'Введите ставку');
            return;
        }
        if (!removeStars(bet)) return;
        
        crashCurrentBet = bet;
        crashMultiplier = 1.00;
        crashGameActive = true;
        crashAutoTarget = autoInput.value ? parseFloat(autoInput.value) : null;
        multiplierDiv.innerText = '1.00x';
        statusDiv.innerHTML = '🚀 Ракета взлетает!';
        startBtn.disabled = true;
        cashoutBtn.disabled = false;
        betInput.disabled = true;
        autoInput.disabled = true;
        
        let crashPoint = crashAutoTarget ? crashAutoTarget + Math.random() * 5 + 1 : 1.05 + Math.random() * 1.5;
        if (Math.random() > 0.85) crashPoint = Math.random() * 900 + 100;
        
        if (crashInterval) clearInterval(crashInterval);
        
        crashInterval = setInterval(() => {
            if (!crashGameActive) return;
            crashMultiplier += 0.02 + (crashMultiplier / 200);
            multiplierDiv.innerText = crashMultiplier.toFixed(2) + 'x';
            
            if (crashAutoTarget && crashMultiplier >= crashAutoTarget && !cashouted) cashout();
            if (crashMultiplier >= crashPoint) {
                clearInterval(crashInterval);
                crashGameActive = false;
                statusDiv.innerHTML = `💥 КРАШ! Проигрыш ${crashCurrentBet} ⭐`;
                rocketEmoji.innerText = '💥';
                startBtn.disabled = false;
                cashoutBtn.disabled = true;
                betInput.disabled = false;
                autoInput.disabled = false;
                hapticFeedback('error');
            }
        }, 60);
        
        let cashouted = false;
        function cashout() {
            if (!crashGameActive || cashouted) return;
            clearInterval(crashInterval);
            cashouted = true;
            crashGameActive = false;
            const winAmount = crashCurrentBet * crashMultiplier;
            addStars(winAmount);
            addExp(Math.floor(winAmount / 10));
            appState.totalWins++;
            saveToLocalStorage();
            statusDiv.innerHTML = `🎉 Кэшаут! Выигрыш ${winAmount.toFixed(0)} ⭐`;
            rocketEmoji.innerText = '💰';
            startBtn.disabled = false;
            cashoutBtn.disabled = true;
            betInput.disabled = false;
            autoInput.disabled = false;
            hapticFeedback('success');
        }
        cashoutBtn.onclick = cashout;
    };
};

window.openRouletteGame = function() {
    renderGameScreen('Рулетка 🎡', `
        <div style="text-align: center;">
            <div style="font-size: 2rem; margin: 20px;">🎡</div>
            <div class="bet-control">
                <button id="rouletteRed" style="background: #e74c3c;">🔴 Красное (x2)</button>
                <button id="rouletteBlack" style="background: #2c3e50;">⚫ Чёрное (x2)</button>
                <button id="rouletteGreen" style="background: #27ae60;">🟢 Зелёное (x14)</button>
            </div>
            <input type="number" id="rouletteBetAmount" placeholder="Ставка ⭐" value="10" style="width: 100%; margin: 10px 0;">
            <div id="rouletteResult" style="margin-top: 20px; font-size: 1.2rem;"></div>
        </div>
    `);
    
    const colors = ['Красное', 'Чёрное', 'Красное', 'Чёрное', 'Зелёное', 'Красное', 'Чёрное', 'Красное', 'Чёрное', 'Зелёное'];
    const multipliers = [2, 2, 2, 2, 14, 2, 2, 2, 2, 14];
    
    function spin(bet, chosenColor) {
        if (!removeStars(bet)) return;
        const index = Math.floor(Math.random() * colors.length);
        const result = colors[index];
        const mult = multipliers[index];
        const isWin = (result === chosenColor);
        let winAmount = 0;
        
        if (isWin) {
            winAmount = bet * mult;
            addStars(winAmount);
            addExp(Math.floor(winAmount / 10));
            document.getElementById('rouletteResult').innerHTML = `🎉 Выпало ${result}! Выигрыш ${winAmount} ⭐`;
            hapticFeedback('success');
        } else {
            document.getElementById('rouletteResult').innerHTML = `😞 Выпало ${result}. Проигрыш ${bet} ⭐`;
            hapticFeedback('error');
        }
    }
    
    document.getElementById('rouletteRed').onclick = () => {
        const bet = parseFloat(document.getElementById('rouletteBetAmount').value);
        if (bet > 0) spin(bet, 'Красное');
        else showPopup('Ошибка', 'Введите ставку');
    };
    document.getElementById('rouletteBlack').onclick = () => {
        const bet = parseFloat(document.getElementById('rouletteBetAmount').value);
        if (bet > 0) spin(bet, 'Чёрное');
        else showPopup('Ошибка', 'Введите ставку');
    };
    document.getElementById('rouletteGreen').onclick = () => {
        const bet = parseFloat(document.getElementById('rouletteBetAmount').value);
        if (bet > 0) spin(bet, 'Зелёное');
        else showPopup('Ошибка', 'Введите ставку');
    };
};

window.openHiLoGame = function() {
    let currentNumber = Math.floor(Math.random() * 1000) + 1;
    let multiplier = 1.00;
    let currentBet = 0;
    let gameActive = true;
    
    renderGameScreen('Hi-Lo 🔥', `
        <div style="text-align: center;">
            <div style="font-size: 4rem; font-weight: bold; background: rgba(0,0,0,0.5); border-radius: 30px; padding: 30px;" id="hiLoNumber">${currentNumber}</div>
            <div style="margin-top: 20px;">Множитель: <span id="hiLoMultiplier">1.00x</span></div>
        </div>
        <div class="bet-control">
            <button id="higherBtn" style="flex: 1; background: #27ae60;">📈 Выше</button>
            <button id="lowerBtn" style="flex: 1; background: #e74c3c;">📉 Ниже</button>
        </div>
        <button id="cashHiLoBtn" style="width: 100%; margin-top: 10px;">💰 Забрать выигрыш</button>
        <input type="number" id="hiloBetAmount" placeholder="Ставка ⭐" value="10" style="width: 100%; margin-top: 10px;">
        <div id="hiloStatus" style="text-align: center; margin-top: 20px;"></div>
    `);
    
    function endGame(isWin, winAmount = 0) {
        gameActive = false;
        if (isWin && winAmount > 0) {
            addStars(winAmount);
            addExp(Math.floor(winAmount / 10));
            document.getElementById('hiloStatus').innerHTML = `🎉 Выигрыш ${winAmount.toFixed(0)} ⭐`;
            hapticFeedback('success');
        } else {
            document.getElementById('hiloStatus').innerHTML = `💀 Проигрыш ${currentBet} ⭐`;
            hapticFeedback('error');
        }
        setTimeout(() => { renderMainMenu(); setActiveNav('solo'); }, 2000);
    }
    
    function makeGuess(guessHigher) {
        if (!gameActive) return;
        if (currentBet === 0) {
            currentBet = parseFloat(document.getElementById('hiloBetAmount').value);
            if (isNaN(currentBet) || currentBet <= 0) {
                showPopup('Ошибка', 'Введите ставку');
                return;
            }
            if (!removeStars(currentBet)) return;
        }
        const nextNumber = Math.floor(Math.random() * 1000) + 1;
        const isHigher = nextNumber > currentNumber;
        const isWin = (guessHigher && isHigher) || (!guessHigher && !isHigher);
        
        if (isWin) {
            multiplier *= 1.5;
            currentNumber = nextNumber;
            document.getElementById('hiLoNumber').innerText = currentNumber;
            document.getElementById('hiLoMultiplier').innerText = multiplier.toFixed(2) + 'x';
            document.getElementById('hiloStatus').innerHTML = `✅ Верно! Множитель x${multiplier.toFixed(2)}`;
            hapticFeedback('light');
        } else {
            endGame(false);
        }
    }
    
    document.getElementById('higherBtn').onclick = () => makeGuess(true);
    document.getElementById('lowerBtn').onclick = () => makeGuess(false);
    document.getElementById('cashHiLoBtn').onclick = () => {
        if (!gameActive || currentBet === 0) return;
        endGame(true, currentBet * multiplier);
    };
};

window.openLuckyWheel = function() {
    const sectors = [
        { mult: 0, weight: 60, label: 'x0' },
        { mult: 1, weight: 15, label: 'x1' },
        { mult: 2, weight: 10, label: 'x2' },
        { mult: 5, weight: 8, label: 'x5' },
        { mult: 10, weight: 7, label: 'x10' }
    ];
    const totalWeight = 100;
    const SPIN_COST = 50;
    
    renderGameScreen('Lucky Wheel 🎰', `
        <div style="text-align: center;">
            <div style="font-size: 4rem; margin: 20px;">🎡</div>
            <button id="spinWheelBtn" style="padding: 15px 40px; font-size: 1.2rem;">Крутить (${SPIN_COST}⭐)</button>
            <div id="wheelResult" style="margin-top: 20px; font-size: 1.2rem;"></div>
            <div style="margin-top: 20px; background: rgba(0,0,0,0.5); border-radius: 20px; padding: 15px;">
                <div>x0 (60%) | x1 (15%) | x2 (10%) | x5 (8%) | x10 (7%)</div>
            </div>
        </div>
    `);
    
    let spinning = false;
    const spinBtn = document.getElementById('spinWheelBtn');
    const resultDiv = document.getElementById('wheelResult');
    
    spinBtn.onclick = () => {
        if (spinning) return;
        if (!removeStars(SPIN_COST)) return;
        spinning = true;
        spinBtn.disabled = true;
        
        const random = Math.random() * totalWeight;
        let accumulated = 0;
        let selected = sectors[0];
        for (const sector of sectors) {
            accumulated += sector.weight;
            if (random <= accumulated) { selected = sector; break; }
        }
        
        const winAmount = selected.mult * SPIN_COST;
        setTimeout(() => {
            addStars(winAmount);
            addExp(Math.floor(winAmount / 10));
            resultDiv.innerHTML = `🎉 Выпал x${selected.mult}! Выигрыш ${winAmount} ⭐`;
            hapticFeedback('success');
            spinning = false;
            spinBtn.disabled = false;
        }, 500);
    };
};
