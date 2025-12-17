// ===== ФАЙЛ: skills.js =====
// Система навыков для Pathfinder 2E Character Sheet

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let skillsData = {};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatBonus(bonus) {
    if (bonus > 0) return `+${bonus}`;
    if (bonus < 0) return `${bonus}`;
    return "0";
}

function saveCharacter() {
    try {
        const data = {};
        document.querySelectorAll('input, select').forEach(element => {
            if (element.type !== 'file' && 
                element.id !== 'importFile' && 
                element.id !== 'backgroundSearch' &&
                element.id !== 'backgroundManual') {
                data[element.id] = element.value;
            }
        });
        
        if (window.selectedBackground) {
            data['selectedBackground'] = JSON.stringify(window.selectedBackground);
        }
        
        localStorage.setItem('pf2eCharacter', JSON.stringify(data));
    } catch (error) {
        console.error('Ошибка сохранения персонажа:', error);
    }
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

/**
 * Инициализация системы навыков
 */
function initSkills() {
    loadSkills();
    setupSkillsEventListeners();
    updateAllSkills();
}

/**
 * Настройка обработчиков событий для навыков
 */
function setupSkillsEventListeners() {
    // Кнопки владения
    document.querySelectorAll('.proficiency-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const row = this.closest('.skill-row');
            const buttons = row.querySelectorAll('.proficiency-btn');
            
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            updateSkillTotal(row);
            saveSkills();
        });
    });
    
    // Поля бонусов
    document.querySelectorAll('.skill-bonus-input').forEach(input => {
        input.addEventListener('input', function() {
            const row = this.closest('.skill-row');
            updateSkillTotal(row);
            saveSkills();
        });
    });
    
    // Кнопки бросков
    document.querySelectorAll('.skill-roll-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('.skill-row');
            rollSkill(row);
        });
    });
    
    // Уровень и характеристики
    const levelInput = document.getElementById('level');
    if (levelInput) levelInput.addEventListener('input', updateAllSkills);
    
    document.querySelectorAll('.ability-score').forEach(input => {
        input.addEventListener('input', updateAllSkills);
    });
}

/**
 * Обновить все навыки
 */
function updateAllSkills() {
    document.querySelectorAll('.skill-row').forEach(row => {
        updateSkillTotal(row);
    });
}

/**
 * Обновить итоговое значение навыка
 * @param {HTMLElement} row - Строка навыка
 */
function updateSkillTotal(row) {
    const level = parseInt(document.getElementById('level')?.value) || 1;
    const ability = row.getAttribute('data-ability');
    
    const abilityScore = parseInt(document.getElementById(ability + 'Score')?.value) || 10;
    const abilityMod = Math.floor((abilityScore - 10) / 2);
    
    const activeBtn = row.querySelector('.proficiency-btn.active');
    const proficiencyLevel = activeBtn ? activeBtn.getAttribute('data-level') : 'untrained';
    
    let proficiencyBonus = 0;
    if (proficiencyLevel === 'trained') proficiencyBonus = level + 2;
    else if (proficiencyLevel === 'expert') proficiencyBonus = level + 4;
    else if (proficiencyLevel === 'master') proficiencyBonus = level + 6;
    else if (proficiencyLevel === 'legendary') proficiencyBonus = level + 8;
    
    const bonusInput = row.querySelector('.skill-bonus-input');
    const itemBonus = parseInt(bonusInput?.value) || 0;
    
    const total = abilityMod + proficiencyBonus + itemBonus;
    
    const totalElement = row.querySelector('.skill-total-value');
    if (totalElement) totalElement.textContent = formatBonus(total);
}

/**
 * Бросок навыка
 * @param {HTMLElement} row - Строка навыка
 */
function rollSkill(row) {
    const skillName = row.querySelector('.skill-name-col')?.textContent.trim();
    const totalElement = row.querySelector('.skill-total-value');
    
    if (!skillName || !totalElement) return;
    
    const totalText = totalElement.textContent;
    const bonus = parseInt(totalText) || 0;
    
    rollDice(`Навык: ${skillName.split(' ')[0]}`, bonus);
}

/**
 * Сохранить навыки в localStorage
 */
function saveSkills() {
    try {
      const skillsToSave = {};

        document.querySelectorAll('.skill-row').forEach(row => {
            const skillId = row.getAttribute('data-skill');
            const activeBtn = row.querySelector('.proficiency-btn.active');
            const bonusInput = row.querySelector('.skill-bonus-input');
            
            if (skillId) {
                skillsData[skillId] = {
                    proficiency: activeBtn ? activeBtn.getAttribute('data-level') : 'untrained',
                    bonus: parseInt(bonusInput?.value) || 0
                };
            }
        });
        
        localStorage.setItem('pf2eSkills', JSON.stringify(skillsData));
    } catch (error) {
        console.error('Ошибка сохранения навыков:', error);
    }
}

/**
 * Загрузить навыки из localStorage
 */
function loadSkills() {
    try {
        const saved = localStorage.getItem('pf2eSkills');
        if (saved) {
            const skillsData = JSON.parse(saved);
            
            Object.keys(skillsData).forEach(skillId => {
                const row = document.querySelector(`.skill-row[data-skill="${skillId}"]`);
                if (row) {
                    const skillData = skillsData[skillId];
                    
                    const buttons = row.querySelectorAll('.proficiency-btn');
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('data-level') === skillData.proficiency) {
                            btn.classList.add('active');
                        }
                    });
                    
                    const bonusInput = row.querySelector('.skill-bonus-input');
                    if (bonusInput && skillData.bonus !== undefined) {
                        bonusInput.value = skillData.bonus;
                    }
                }
            });
        }
        updateAllSkills();
    } catch (error) {
        console.error('Ошибка загрузки навыков:', error);
    }
}

/**
 * Загрузить данные навыков из объекта
 * @param {Object} skillsData - Данные навыков
 */
function loadSkillsData(skillsData) {
    if (!skillsData) return;
    
    Object.keys(skillsData).forEach(skillId => {
        const row = document.querySelector(`.skill-row[data-skill="${skillId}"]`);
        if (row) {
            const skillData = skillsData[skillId];
            
            const buttons = row.querySelectorAll('.proficiency-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-level') === skillData.proficiency) {
                    btn.classList.add('active');
                }
            });
            
            const bonusInput = row.querySelector('.skill-bonus-input');
            if (bonusInput && skillData.bonus !== undefined) {
                bonusInput.value = skillData.bonus;
            }
        }
    });
    updateAllSkills();
    saveSkills();
}

/**
 * Получить все данные навыков
 * @returns {Object} Данные всех навыков
 */
function getAllSkillsData() {
    const skillsData = {};
    document.querySelectorAll('.skill-row').forEach(row => {
        const skillId = row.getAttribute('data-skill');
        const activeBtn = row.querySelector('.proficiency-btn.active');
        const bonusInput = row.querySelector('.skill-bonus-input');
        
        if (skillId) {
            skillsData[skillId] = {
                proficiency: activeBtn ? activeBtn.getAttribute('data-level') : 'untrained',
                bonus: parseInt(bonusInput?.value) || 0
            };
        }
    });
    return skillsData;
}


window.initSkills = initSkills;
window.saveSkills = saveSkills;
window.loadSkills = loadSkills;
window.loadSkillsData = loadSkillsData;
window.getAllSkillsData = getAllSkillsData;
console.log('skills.js загружен');