// ===== ФАЙЛ: attack.js =====
// Система атак и урона для Pathfinder 2E Character Sheet

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
window.attacks = [];

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatBonus(bonus) {
    if (bonus > 0) return `+${bonus}`;
    if (bonus < 0) return `${bonus}`;
    return "0";
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showAlert(message) {
    const modal = document.getElementById('alertModal');
    const messageElement = document.getElementById('alertMessage');
    const okBtn = document.getElementById('alertOk');
    
    if (!modal || !messageElement || !okBtn) {
        alert(message);
        return;
    }
    
    messageElement.textContent = message;
    modal.style.display = 'flex';
    
    const handleOk = function() {
        modal.style.display = 'none';
        okBtn.onclick = null;
    };
    
    okBtn.onclick = handleOk;
}

function rollDice(name, bonus) {
    if (typeof TS !== 'undefined' && TS.dice) {
        TS.dice.putDiceInTray([{
            name: name,
            roll: `d20${bonus >= 0 ? '+' : ''}${bonus}`
        }]);
    } else {
        console.log(`Бросок: ${name} - d20${bonus >= 0 ? '+' : ''}${bonus}`);
    }
}

// ===== ФУНКЦИИ ДЛЯ ФОРМЫ ДОБАВЛЕНИЯ АТАК =====

window.selectedDamageTypes = [];

function toggleDamageType(type) {
    const button = document.querySelector(`.damage-type-option[data-type="${type}"]`);
    const index = window.selectedDamageTypes.indexOf(type);
    
    if (index === -1) {
        window.selectedDamageTypes.push(type);
        button.classList.add('active');
    } else {
        window.selectedDamageTypes.splice(index, 1);
        button.classList.remove('active');
    }
    
    updateAttackPreview();
}
function clearAttackForm() {
    document.getElementById('attackName').value = '';
    document.getElementById('attackBonus').value = '';
    document.getElementById('attackDamage').value = '';
    document.getElementById('attackDescription').value = '';
    
    selectedDamageTypes = [];
    document.querySelectorAll('.damage-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    updateAttackPreview();
}

function updateAttackPreview() {
    const preview = document.getElementById('attackPreview');
    if (!preview) return;
    
    const name = document.getElementById('attackName').value;
    const bonus = document.getElementById('attackBonus').value;
    const damage = document.getElementById('attackDamage').value;
    const description = document.getElementById('attackDescription').value;
    
    if (!name && !bonus && !damage && !description) {
        preview.innerHTML = '<div class="preview-placeholder">Здесь будет отображаться предпросмотр вашей атаки</div>';
        return;
    }
    
    const damageTypeNames = {
        'slashing': 'Режущий',
        'bludgeoning': 'Дробящий',
        'piercing': 'Колющий',
        'magical': 'Магический'
    };
    
    const damageTypeIcons = {
        'slashing': '🔪',
        'bludgeoning': '🔨',
        'piercing': '🏹',
        'magical': '✨'
    };
    
    window.previewHTML = '<div class="preview-content">';
    
    if (name) {
        previewHTML += `<div class="preview-name"><strong>${escapeHtml(name)}</strong></div>`;
    }
    
    if (bonus || damage) {
        previewHTML += '<div class="preview-stats">';
        if (bonus) {
            previewHTML += `<span class="preview-bonus">🎯 ${bonus >= 0 ? '+' : ''}${bonus}</span>`;
        }
        if (damage) {
            previewHTML += `<span class="preview-damage">💥 ${escapeHtml(damage)}</span>`;
        }
        previewHTML += '</div>';
    }
    
    if (selectedDamageTypes.length > 0) {
        previewHTML += '<div class="preview-types">';
        selectedDamageTypes.forEach(type => {
            previewHTML += `<span class="preview-type">${damageTypeIcons[type]} ${damageTypeNames[type]}</span>`;
        });
        previewHTML += '</div>';
    }
    
    if (description) {
        previewHTML += `<div class="preview-description">${escapeHtml(description.substring(0, 100))}${description.length > 100 ? '...' : ''}</div>`;
    }
    
    previewHTML += '</div>';
    preview.innerHTML = previewHTML;
}

// ===== ОСНОВНЫЕ ФУНКЦИИ СИСТЕМЫ АТАК =====

function toggleAttackForm() {
    const form = document.getElementById('addAttackForm');
    const button = document.querySelector('.btn-toggle-form'); // Исправлено!
    
    if (!form || !button) return;
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        button.textContent = '➖';
        button.title = 'Скрыть форму добавления атаки';
        
        // Фокус на первое поле
        setTimeout(() => {
            const nameInput = document.getElementById('attackName');
            if (nameInput) nameInput.focus();
        }, 100);
    } else {
        form.style.display = 'none';
        button.textContent = '➕';
        button.title = 'Показать форму добавления атаки';
    }
}

function addAttack() {
    const name = document.getElementById('attackName')?.value.trim();
    const bonusInput = document.getElementById('attackBonus')?.value;
    const damage = document.getElementById('attackDamage')?.value.trim();
    
    if (!name || !damage) {
        showAlert(name ? 'Введите урон атаки' : 'Введите название атаки');
        return;
    }
    
    const typeMapping = {
        'slashing': 'Режущий',
        'bludgeoning': 'Дробящий',
        'piercing': 'Колющий',
        'magical': 'М'
    };
    
    const damageTypes = selectedDamageTypes.map(type => typeMapping[type] || type);
    
    const attack = {
        id: Date.now().toString(),
        name: name,
        bonus: parseInt(bonusInput) || 0,
        damage: damage,
        damageTypes: damageTypes,
        description: document.getElementById('attackDescription')?.value.trim() || ''
    };
    
    attacks.push(attack);
    saveAttacks();
    renderAttacks();
    
    clearAttackForm();
    showAlert(`Атака "${name}" добавлена!`);
}

function loadAttacks() {
    try {
        const saved = localStorage.getItem('pf2eAttacks');
        attacks = saved ? JSON.parse(saved) : [];
        renderAttacks();
    } catch (error) {
        console.error('Ошибка загрузки атак:', error);
        attacks = [];
        renderAttacks();
    }
}

function saveAttacks() {
    try {
        localStorage.setItem('pf2eAttacks', JSON.stringify(attacks));
    } catch (error) {
        console.error('Ошибка сохранения атак:', error);
    }
}

function renderAttacks() {
    const container = document.getElementById('attacksContainer');
    if (!container) return;
    
    if (attacks.length === 0) {
        container.innerHTML = '<div class="attacks-empty">⚔️ Нет добавленных атак. Нажмите "+" чтобы добавить первую атаку!</div>';
        return;
    }
    
    container.innerHTML = attacks.map(attack => `
        <div class="attack-item" data-id="${attack.id}">
            <div class="attack-header">
                <div class="attack-main-info">
                    <div class="attack-title-row">
                        <span class="attack-name">${escapeHtml(attack.name)}</span>
                        <div class="attack-quick-stats">
                            <span class="attack-bonus-badge" title="Бонус к атаке">
                                🎯 ${formatBonus(attack.bonus)}
                            </span>
                            <span class="attack-damage-badge" title="Урон">
                                💥 ${escapeHtml(attack.damage)}
                            </span>
                        </div>
                    </div>
                    
                    ${attack.damageTypes.length > 0 ? `
                        <div class="attack-types">
                            <span class="types-label">Типы урона:</span>
                            ${attack.damageTypes.map(type => `
                                <span class="damage-type-badge ${type.toLowerCase()}" 
                                      title="${getDamageTypeName(type)}">
                                    ${getDamageTypeIcon(type)}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${attack.description ? `
                        <div class="attack-description">
                            <span class="description-icon">📝</span>
                            ${escapeHtml(attack.description)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="attack-actions">
                    <button onclick="rollAttackFromList('${attack.id}')" 
                            class="btn-attack" 
                            title="Бросок атаки">
                        <span class="btn-icon">🎯</span>
                        <span class="btn-text">Атака</span>
                    </button>
                    <button onclick="rollDamage('${attack.id}')" 
                            class="btn-damage-action" 
                            title="Бросок урона">
                        <span class="btn-icon">💥</span>
                        <span class="btn-text">Урон</span>
                    </button>
                    <button onclick="deleteAttack('${attack.id}')" 
                            class="btn-delete" 
                            title="Удалить атаку">
                        <span class="btn-icon">🗑️</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Добавьте эти вспомогательные функции
function getDamageTypeIcon(type) {
    const icons = {
        'Режущий': 'Р', // Режущий
        'Дробящий': 'Д', // Дробящий
        'Колющий': 'К', // Колющий
        'М': '✨', // Магический
        'slashing': '🔪',
        'bludgeoning': '🔨',
        'piercing': '🏹',
        'magical': '✨'
    };
    return icons[type] || '';
}

function rollAttackFromList(attackId) {
    const attack = attacks.find(a => a.id === attackId);
    if (!attack) return;
    
    rollDice(`Attack: ${attack.name}`, attack.bonus);
}

function rollDamage(attackId) {
    const attack = attacks.find(a => a.id === attackId);
    if (!attack) return;
    
    if (typeof TS !== 'undefined' && TS.dice) {
        TS.dice.putDiceInTray([{
            name: `damage: ${attack.name}`,
            roll: attack.damage
        }]);
    } else {
        console.log(`Урон: ${attack.name} - ${attack.damage}`);
    }
}

function deleteAttack(attackId) {
    attacks = attacks.filter(attack => attack.id !== attackId);
    saveAttacks();
    renderAttacks();
    showAlert('Атака удалена!');
}

function getDamageTypeName(type) {
    const types = {
        'Р': 'Режущий',
        'Д': 'Дробящий', 
        'К': 'Колющий',
        'М': 'Магический'
    };
    return types[type] || type;
}

// ===== ИНИЦИАЛИЗАЦИЯ ФОРМЫ АТАК =====
function initAttackForm() {
    // Инициализация счетчика символов
    const descriptionTextarea = document.getElementById('attackDescription');
    if (descriptionTextarea) {
        descriptionTextarea.addEventListener('input', function() {
            const charCount = document.getElementById('charCount');
            if (charCount) {
                charCount.textContent = this.value.length;
            }
            updateAttackPreview();
        });
    }
    
    // Инициализация слушателей для предпросмотра
    ['attackName', 'attackBonus', 'attackDamage'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateAttackPreview);
        }
    });
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====


// attack.js - в конец файла добавьте:
window.attacks = attacks;
window.loadAttacks = loadAttacks;
window.renderAttacks = renderAttacks;
window.toggleAttackForm = toggleAttackForm;
window.addAttack = addAttack;
window.rollAttackFromList = rollAttackFromList;
window.initAttackForm = initAttackForm;
window.rollDamage = rollDamage;
window.deleteAttack = deleteAttack;
window.toggleDamageType = toggleDamageType;
window.clearAttackForm = clearAttackForm;
console.log('attack.js загружен');