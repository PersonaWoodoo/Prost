/* ============================================
   StarCasino - Админ-панель и вывод средств
   Версия 2.0
   ============================================ */

window.requestWithdraw = function(amount, wallet) {
    const requestId = Date.now();
    const withdrawRequest = {
        id: requestId,
        userId: currentUserId,
        amount: amount,
        wallet: wallet,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    appState.balance -= amount;
    saveToLocalStorage();
    
    let requests = JSON.parse(localStorage.getItem('withdraw_requests') || '[]');
    requests.push(withdrawRequest);
    localStorage.setItem('withdraw_requests', JSON.stringify(requests));
    
    notifyAdmins(withdrawRequest);
    showPopup('Заявка отправлена', `Заявка на вывод ${amount} ⭐ отправлена`);
    hapticFeedback('success');
    renderProfile();
};

function notifyAdmins(request) {
    const message = `💰 НОВАЯ ЗАЯВКА НА ВЫВОД 💰\n\n🆔 ID: ${request.id}\n👤 Пользователь: ${request.userId}\n⭐ Сумма: ${request.amount}\n💳 Кошелёк: ${request.wallet}`;
    for (const adminId of CONFIG.ADMIN_IDS) {
        fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: adminId, text: message })
        }).catch(err => console.error(err));
    }
}

window.openAdminPanel = function() {
    if (!isAdmin()) return;
    
    const container = document.getElementById('dynamicContent');
    container.className = 'main-content';
    container.innerHTML = `
        <div class="admin-panel">
            <h2>🔧 Админ-панель</h2>
            <hr>
            <h3>👤 Управление пользователем</h3>
            <input type="text" id="adminTargetUserId" placeholder="ID пользователя" style="width: 100%; margin: 8px 0;">
            <input type="number" id="adminStarsAmount" placeholder="Сумма ⭐" style="width: 100%; margin: 8px 0;">
            <div class="bet-control">
                <button id="adminAddStarsBtn" style="flex: 1; background: #27ae60;">➕ Добавить</button>
                <button id="adminRemoveStarsBtn" style="flex: 1; background: #e74c3c;">➖ Забрать</button>
            </div>
            <hr>
            <h3>📋 Заявки на вывод</h3>
            <div id="adminWithdrawList" style="max-height: 300px; overflow-y: auto;"></div>
            <hr>
            <h3>🎁 Глобальный бонус</h3>
            <input type="number" id="globalBonusAmount" placeholder="Сумма бонуса ⭐" style="width: 100%; margin: 8px 0;">
            <button id="globalBonusBtn" style="width: 100%; background: #f39c12;">🎉 Выдать всем</button>
            <hr>
            <button id="closeAdminBtn" style="width: 100%; background: #555;">Закрыть</button>
        </div>
    `;
    
    function loadWithdrawRequests() {
        const requests = JSON.parse(localStorage.getItem('withdraw_requests') || '[]');
        const listDiv = document.getElementById('adminWithdrawList');
        if (requests.length === 0) {
            listDiv.innerHTML = '<div class="small-text">Нет заявок</div>';
            return;
        }
        listDiv.innerHTML = requests.map(req => `
            <div class="withdraw-request" style="background: #2c3e50; padding: 10px; margin: 8px 0; border-radius: 12px;">
                <div><strong>${req.userId}</strong> - ${req.amount} ⭐</div>
                <div class="small-text">${req.wallet.substring(0, 20)}...</div>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="approveBtn" data-id="${req.id}" style="background: #27ae60; padding: 5px 15px;">✅</button>
                    <button class="rejectBtn" data-id="${req.id}" style="background: #e74c3c; padding: 5px 15px;">❌</button>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.approveBtn').forEach(btn => {
            btn.onclick = () => approveWithdraw(parseInt(btn.dataset.id));
        });
        document.querySelectorAll('.rejectBtn').forEach(btn => {
            btn.onclick = () => rejectWithdraw(parseInt(btn.dataset.id));
        });
    }
    
    function approveWithdraw(id) {
        let requests = JSON.parse(localStorage.getItem('withdraw_requests') || '[]');
        const request = requests.find(r => r.id === id);
        if (request) {
            requests = requests.filter(r => r.id !== id);
            localStorage.setItem('withdraw_requests', JSON.stringify(requests));
            showPopup('Успех', 'Заявка одобрена');
            loadWithdrawRequests();
        }
    }
    
    function rejectWithdraw(id) {
        let requests = JSON.parse(localStorage.getItem('withdraw_requests') || '[]');
        const request = requests.find(r => r.id === id);
        if (request) {
            requests = requests.filter(r => r.id !== id);
            localStorage.setItem('withdraw_requests', JSON.stringify(requests));
            const userData = localStorage.getItem(`user_${request.userId}`);
            if (userData) {
                const user = JSON.parse(userData);
                user.balance += request.amount;
                localStorage.setItem(`user_${request.userId}`, JSON.stringify(user));
            }
            showPopup('Успех', 'Заявка отклонена, средства возвращены');
            loadWithdrawRequests();
        }
    }
    
    document.getElementById('adminAddStarsBtn').onclick = () => {
        const targetId = document.getElementById('adminTargetUserId').value;
        const amount = parseInt(document.getElementById('adminStarsAmount').value);
        if (targetId && amount > 0) {
            const userData = localStorage.getItem(`user_${targetId}`);
            if (userData) {
                const user = JSON.parse(userData);
                user.balance += amount;
                localStorage.setItem(`user_${targetId}`, JSON.stringify(user));
                showPopup('Успех', `+${amount} ⭐ пользователю ${targetId}`);
            } else showPopup('Ошибка', 'Пользователь не найден');
        }
    };
    
    document.getElementById('adminRemoveStarsBtn').onclick = () => {
        const targetId = document.getElementById('adminTargetUserId').value;
        const amount = parseInt(document.getElementById('adminStarsAmount').value);
        if (targetId && amount > 0) {
            const userData = localStorage.getItem(`user_${targetId}`);
            if (userData) {
                const user = JSON.parse(userData);
                user.balance = Math.max(0, user.balance - amount);
                localStorage.setItem(`user_${targetId}`, JSON.stringify(user));
                showPopup('Успех', `-${amount} ⭐ пользователю ${targetId}`);
            } else showPopup('Ошибка', 'Пользователь не найден');
        }
    };
    
    document.getElementById('globalBonusBtn').onclick = () => {
        const amount = parseInt(document.getElementById('globalBonusAmount').value);
        if (amount > 0) {
            const allUsers = JSON.parse(localStorage.getItem('all_users_ids') || '[]');
            for (const uid of allUsers) {
                const userData = localStorage.getItem(`user_${uid}`);
                if (userData) {
                    const user = JSON.parse(userData);
                    user.balance += amount;
                    localStorage.setItem(`user_${uid}`, JSON.stringify(user));
                }
            }
            if (!allUsers.includes(currentUserId)) {
                appState.balance += amount;
                saveToLocalStorage();
            }
            updateUI();
            showPopup('Глобальный бонус', `Выдано ${amount} ⭐`);
        }
    };
    
    document.getElementById('closeAdminBtn').onclick = () => {
        renderMainMenu();
        setActiveNav('solo');
    };
    
    loadWithdrawRequests();
};
