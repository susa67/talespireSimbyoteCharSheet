// ===== ФАЙЛ: main.js =====
// Версия 4.1 - Полностью переработанная система сохранения для TaleSpire
// Главный файл приложения Pathfinder 2E Character Sheet для TaleSpire

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНСТАНТЫ =====
window.saveTimeout = null;
window.isInitializing = true;
window.classesData = [];
window.ancestriesData = [];
window.backgroundsData = [];
window.allBackgrounds = [];

// Храним ПОЛНЫЕ ОБЪЕКТЫ для всех трёх полей
window.selectedClass = null;
window.selectedAncestry = null;
window.selectedBackground = null;

// Глобальные ссылки на объекты из других файлов
window.attacks = window.attacks || [];
window.spells = window.spells || [];
window.spellSlots = window.spellSlots || { casterType: 'spontaneous', slots: {} };
window.inventory = window.inventory || [];

const proficiencyLevels = {
    'untrained': { code: 'Н', name: 'Ненаученный', bonus: 0 },
    'trained': { code: 'И', name: 'Изученный', bonus: 2 },
    'expert': { code: 'Э', name: 'Экспертный', bonus: 4 },
    'master': { code: 'М', name: 'Мастерский', bonus: 6 },
    'legendary': { code: 'Л', name: 'Легендарный', bonus: 8 }
};

const FALLBACK_CLASSES = [
    { value: "Алхимик", label: "Алхимик / Alchemist", url: "https://pf2.ru/classes/alchemist" },
    { value: "Бард", label: "Бард / Bard", url: "https://pf2.ru/classes/bard" },
    { value: "Варвар", label: "Варвар / Barbarian", url: "https://pf2.ru/classes/barbarian" },
    { value: "Воин", label: "Воин / Fighter", url: "https://pf2.ru/classes/fighter" },
    { value: "Волшебник", label: "Волшебник / Wizard", url: "https://pf2.ru/classes/wizard" },
    { value: "Другой", label: "Другой (введите вручную)", url: "" }
];

const FALLBACK_ANCESTRIES = [
    { value: "Дварф", label: "Дварф / Dwarf", url: "https://pf2.ru/ancestries/dwarf" },
    { value: "Эльф", label: "Эльф / Elf", url: "https://pf2.ru/ancestries/elf" },
    { value: "Гном", label: "Гном / Gnome", url: "https://pf2.ru/ancestries/gnome" },
    { value: "Полурослик", label: "Полурослик / Halfling", url: "https://pf2.ru/ancestries/halfling" },
    { value: "Человек", label: "Человек / Human", url: "https://pf2.ru/ancestries/human" },
    { value: "Другой", label: "Другое (введите вручную)", url: "" }
];

const FALLBACK_BACKGROUNDS = [
    { value: "Академик", label: "Академик", eng: "academic", description: "Ученый, исследователь" },
    { value: "Воин", label: "Воин", eng: "warrior", description: "Боец, солдат" },
    { value: "Кузнец", label: "Кузнец", eng: "blacksmith", description: "Ремесленник, оружейник" },
    { value: "Другой", label: "Другое (введите вручную)", eng: "other", description: "Пользовательская предыстория" }
];

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

function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
}

function updateElementValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.value = value;
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function showConfirm(message, onConfirm, onCancel) {
    const modal = document.getElementById('confirmModal');
    const messageElement = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    
    if (!modal || !messageElement || !yesBtn || !noBtn) {
        if (onConfirm && confirm(message)) onConfirm();
        return;
    }
    
    messageElement.textContent = message;
    modal.style.display = 'flex';
    
    const handleConfirm = function() {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
        yesBtn.onclick = null;
        noBtn.onclick = null;
    };
    
    const handleCancel = function() {
        modal.style.display = 'none';
        if (onCancel) onCancel();
        yesBtn.onclick = null;
        noBtn.onclick = null;
    };
    
    yesBtn.onclick = handleConfirm;
    noBtn.onclick = handleCancel;
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

function showQuickMessage(message, type) {
    const existingMessage = document.getElementById('quick-message');
    if (existingMessage) existingMessage.remove();
    
    const quickMessage = document.createElement('div');
    quickMessage.id = 'quick-message';
    quickMessage.textContent = message;
    quickMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 12px;
        background: ${type === 'heal' ? '#2ecc71' : '#e74c3c'};
        color: white;
        font-weight: bold;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(quickMessage);
    
    setTimeout(() => {
        if (quickMessage.parentNode) quickMessage.parentNode.removeChild(quickMessage);
    }, 2000);
}

// ===== ЗАГРУЗКА ДАННЫХ ИЗ JSON ФАЙЛОВ =====
async function loadJSONData() {
    try {
        const [classesResponse, ancestriesResponse, backgroundsResponse] = await Promise.all([
            fetch('data/classes.json').catch(() => null),
            fetch('data/ancestries.json').catch(() => null),
            fetch('data/backgrounds.json').catch(() => null)
        ]);

        if (classesResponse && classesResponse.ok) {
            const data = await classesResponse.json();
            window.classesData = data.classes || data;
            console.log('📚 Загружено классов:', window.classesData.length);
        } else {
            window.classesData = FALLBACK_CLASSES;
            console.log('⚠️ Используем резервные классы');
        }

        if (ancestriesResponse && ancestriesResponse.ok) {
            const data = await ancestriesResponse.json();
            window.ancestriesData = data.ancestries || data;
            console.log('🧬 Загружено происхождений:', window.ancestriesData.length);
        } else {
            window.ancestriesData = FALLBACK_ANCESTRIES;
            console.log('⚠️ Используем резервные происхождения');
        }

        if (backgroundsResponse && backgroundsResponse.ok) {
            const data = await backgroundsResponse.json();
            window.backgroundsData = data.backgrounds || data;
            console.log('📖 Загружено предысторий:', window.backgroundsData.length);
        } else {
            window.backgroundsData = FALLBACK_BACKGROUNDS;
            console.log('⚠️ Используем резервные предыстории');
        }

        initializeBackgrounds();
        return true;
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        loadFallbackData();
        return false;
    }
}

function loadFallbackData() {
    console.log('🔄 Используем резервные данные');
    window.classesData = FALLBACK_CLASSES;
    window.ancestriesData = FALLBACK_ANCESTRIES;
    window.backgroundsData = FALLBACK_BACKGROUNDS;
    initializeBackgrounds();
}

function initializeBackgrounds() {
    window.allBackgrounds = [...window.backgroundsData];
    window.allBackgrounds.sort((a, b) => a.value.localeCompare(b.value));
    console.log('✅ Предыстории инициализированы');
}

// ===== ОСНОВНЫЕ ФУНКЦИИ ДЛЯ ОБЪЕКТОВ =====
function updateClassLink() {
    console.log('🔄 updateClassLink вызван');
    const classSelect = document.getElementById('charClass');
    const container = classSelect?.closest('.select-with-link-container');
    const link = document.getElementById('classLink');
    
    if (!classSelect || !container || !link) {
        console.warn('❌ Элементы не найдены');
        return;
    }
    
    const selectedOption = classSelect.options[classSelect.selectedIndex];
    const value = classSelect.value;
    
    console.log('📊 Значение класса:', value);
    console.log('📊 selectedOption:', selectedOption);
    console.log('📊 window.selectedClass до:', window.selectedClass);
    
    if (value && selectedOption && selectedOption.value !== '') {
        window.selectedClass = {
            value: selectedOption.value,
            label: selectedOption.text,
            url: selectedOption.dataset.url || ''
        };
        
        console.log('📊 window.selectedClass после:', window.selectedClass);
        
        if (window.selectedClass.url && window.selectedClass.url.trim() !== '') {
            link.href = window.selectedClass.url;
            link.title = `Открыть описание класса "${window.selectedClass.value}" на PF2.ru`;
            container.classList.add('has-link');
            link.classList.add('visible');
            link.style.display = 'flex';
            console.log('🔗 Ссылка на класс установлена');
        } else {
            container.classList.remove('has-link');
            link.classList.remove('visible');
            link.style.display = 'none';
        }
    } else {
        window.selectedClass = null;
        container.classList.remove('has-link');
        link.classList.remove('visible');
        link.style.display = 'none';
        console.log('❌ Класс не выбран');
    }
    
    saveCharacterToTaleSpire();
}

function updateAncestryLink() {
    console.log('🔄 updateAncestryLink вызван');
    const ancestrySelect = document.getElementById('ancestry');
    const container = ancestrySelect?.closest('.select-with-link-container');
    const link = document.getElementById('ancestryLink');
    
    if (!ancestrySelect || !container || !link) return;
    
    const selectedOption = ancestrySelect.options[ancestrySelect.selectedIndex];
    const value = ancestrySelect.value;
    
    console.log('📊 Значение происхождения:', value);
    console.log('📊 window.selectedAncestry до:', window.selectedAncestry);
    
    if (value && selectedOption && selectedOption.value !== '') {
        window.selectedAncestry = {
            value: selectedOption.value,
            label: selectedOption.text,
            url: selectedOption.dataset.url || ''
        };
        
        console.log('📊 window.selectedAncestry после:', window.selectedAncestry);
        
        if (window.selectedAncestry.url && window.selectedAncestry.url.trim() !== '' && value !== 'Другой') {
            link.href = window.selectedAncestry.url;
            link.title = `Открыть описание происхождения "${window.selectedAncestry.value}" на PF2.ru`;
            container.classList.add('has-link');
            link.classList.add('visible');
            link.style.display = 'flex';
            console.log('🔗 Ссылка на происхождение установлена');
        } else {
            container.classList.remove('has-link');
            link.classList.remove('visible');
            link.style.display = 'none';
        }
    } else {
        window.selectedAncestry = null;
        container.classList.remove('has-link');
        link.classList.remove('visible');
        link.style.display = 'none';
        console.log('❌ Происхождение не выбрано');
    }
    
    saveCharacterToTaleSpire();
}

function updateBackgroundLink() {
    console.log('🔄 updateBackgroundLink вызван');
    const backgroundInput = document.getElementById('background');
    const container = backgroundInput?.closest('.select-with-link-container');
    const link = document.getElementById('backgroundLink');
    
    if (!backgroundInput || !container || !link) return;
    
    const value = backgroundInput.value.trim();
    
    if (!value) {
        container.classList.remove('has-link');
        link.classList.remove('visible');
        link.style.display = 'none';
        window.selectedBackground = null;
        return;
    }
    
    if (window.allBackgrounds) {
        const foundBg = window.allBackgrounds.find(bg => 
            (bg.label && bg.label.toLowerCase() === value.toLowerCase()) ||
            (bg.value && bg.value.toLowerCase() === value.toLowerCase())
        );
        
        if (foundBg) {
            window.selectedBackground = foundBg;
        } else {
            window.selectedBackground = {
                value: value,
                label: value,
                url: '',
                description: 'Пользовательская предыстория'
            };
        }
    }
    
    console.log('📊 window.selectedBackground:', window.selectedBackground);
    
    if (window.selectedBackground && window.selectedBackground.url && window.selectedBackground.url.trim() !== '') {
        link.href = window.selectedBackground.url;
        link.title = `Открыть описание предыстории "${window.selectedBackground.label}" на PF2.ru`;
        container.classList.add('has-link');
        link.classList.add('visible');
        link.style.display = 'flex';
    } else {
        container.classList.remove('has-link');
        link.classList.remove('visible');
        link.style.display = 'none';
    }
    
    saveCharacterToTaleSpire();
}

// ===== ИНИЦИАЛИЗАЦИЯ СЕЛЕКТОРОВ =====
function initClassSelector() {
    const classSelect = document.getElementById('charClass');
    if (!classSelect) return;

    classSelect.innerHTML = '<option value="">Выберите класс</option>';
    
    window.classesData.forEach(item => {
        const option = new Option(item.label, item.value);
        option.dataset.url = item.url || '';
        classSelect.add(option);
    });

    classSelect.addEventListener('change', function() {
        updateClassLink();
    });
}

function initAncestrySelector() {
    const ancestrySelect = document.getElementById('ancestry');
    if (!ancestrySelect) return;

    ancestrySelect.innerHTML = '<option value="">Выберите происхождение</option>';
    
    window.ancestriesData.forEach(item => {
        const option = new Option(item.label, item.value);
        option.dataset.url = item.url || '';
        ancestrySelect.add(option);
    });

    ancestrySelect.addEventListener('change', function() {
        updateAncestryLink();
    });
}

// ===== СИСТЕМА ПРЕДЫСТОРИЙ =====
function initBackgroundSelector() {
    const backgroundInput = document.getElementById('background');
    if (!backgroundInput) return;

    backgroundInput.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        showBackgroundModal(event);
    });

    backgroundInput.addEventListener('input', function() {
        updateBackgroundLink();
    });
}

function showBackgroundModal(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const modal = document.getElementById('backgroundModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    const searchInput = document.getElementById('backgroundSearch');
    if (searchInput) searchInput.value = '';
    
    populateAlphabetFilter();
    populateBackgroundList();
    
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 100);
}

function hideBackgroundModal() {
    const modal = document.getElementById('backgroundModal');
    if (modal) modal.style.display = 'none';
}

function populateAlphabetFilter() {
    const filterContainer = document.getElementById('alphabetFilter');
    if (!filterContainer) return;
    
    const letters = new Set();
    window.allBackgrounds.forEach(bg => {
        const firstLetter = bg.label.charAt(0).toUpperCase();
        letters.add(firstLetter);
    });
    
    const sortedLetters = Array.from(letters).sort();
    filterContainer.innerHTML = `
        <button class="alphabet-btn active" onclick="filterByLetter('all')">Все</button>
        ${sortedLetters.map(letter => 
            `<button class="alphabet-btn" onclick="filterByLetter('${letter}')">${letter}</button>`
        ).join('')}
    `;
}

function populateBackgroundList(letter = 'all') {
    const listContainer = document.getElementById('backgroundList');
    if (!listContainer) return;
    
    let filtered = window.allBackgrounds;
    
    if (letter !== 'all') {
        filtered = filtered.filter(bg => bg.label.charAt(0).toUpperCase() === letter);
    }
    
    const searchInput = document.getElementById('backgroundSearch');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase();
        filtered = filtered.filter(bg => 
            bg.label.toLowerCase().includes(searchTerm) || 
            (bg.description && bg.description.toLowerCase().includes(searchTerm))
        );
    }
    
    listContainer.innerHTML = filtered.map(bg => `
        <div class="background-item ${window.selectedBackground && window.selectedBackground.value === bg.value ? 'selected' : ''}" 
             onclick="selectBackground(${JSON.stringify(bg).replace(/"/g, '&quot;')})">
            <div class="background-name">${escapeHtml(bg.label)}</div>
            ${bg.description ? `<div class="background-description">${escapeHtml(bg.description)}</div>` : ''}
            ${bg.url ? '<span class="background-link-icon">🔗</span>' : ''}
        </div>
    `).join('');
    
    const countElement = document.getElementById('backgroundCount');
    if (countElement) {
        countElement.textContent = `Найдено: ${filtered.length}`;
    }
}

function filterByLetter(letter) {
    const buttons = document.querySelectorAll('.alphabet-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = Array.from(buttons).find(btn => 
        (letter === 'all' && btn.textContent === 'Все') || btn.textContent === letter
    );
    if (activeBtn) activeBtn.classList.add('active');
    
    populateBackgroundList(letter);
}

function searchBackgrounds() {
    const activeBtn = document.querySelector('.alphabet-btn.active');
    const letter = activeBtn ? (activeBtn.textContent === 'Все' ? 'all' : activeBtn.textContent) : 'all';
    populateBackgroundList(letter);
}

function selectBackground(background) {
    const inputField = document.getElementById('background');
    if (!inputField) return;
    
    try {
        const bg = typeof background === 'string' ? JSON.parse(background) : background;
        inputField.value = bg.label;
        window.selectedBackground = bg;
        
        hideBackgroundModal();
        updateBackgroundLink();
    } catch (e) {
        console.error('Ошибка выбора предыстории:', e);
    }
}

function clearBackgroundSelection() {
    const inputField = document.getElementById('background');
    if (inputField) inputField.value = '';
    window.selectedBackground = null;
    updateBackgroundLink();
    hideBackgroundModal();
}

// ===== СИСТЕМА ХАРАКТЕРИСТИК =====
function calculateAbilityModifiers() {
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    
    abilities.forEach(ability => {
        const score = parseInt(document.getElementById(ability + 'Score')?.value) || 10;
        const modifier = Math.floor((score - 10) / 2);
        const modElement = document.getElementById(ability + 'Mod');
        
        if (modElement) {
            modElement.textContent = formatBonus(modifier);
            modElement.style.color = modifier >= 0 ? '#4cc9f0' : '#ff4757';
        }
    });
    
    updateSavingThrows();
}

function initSavingThrows() {
    ['fortitudeBonus', 'reflexBonus', 'willBonus'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateSavingThrows);
        }
    });
    updateSavingThrows();
}

function updateSavingThrows() {
    const conScore = parseInt(document.getElementById('conScore')?.value) || 10;
    const conMod = Math.floor((conScore - 10) / 2);
    const fortBonus = parseInt(document.getElementById('fortitudeBonus')?.value) || 0;
    updateElementText('fortitudeTotal', formatBonus(conMod + fortBonus));
    
    const dexScore = parseInt(document.getElementById('dexScore')?.value) || 10;
    const dexMod = Math.floor((dexScore - 10) / 2);
    const reflexBonus = parseInt(document.getElementById('reflexBonus')?.value) || 0;
    updateElementText('reflexTotal', formatBonus(dexMod + reflexBonus));
    
    const wisScore = parseInt(document.getElementById('wisScore')?.value) || 10;
    const wisMod = Math.floor((wisScore - 10) / 2);
    const willBonus = parseInt(document.getElementById('willBonus')?.value) || 0;
    updateElementText('willTotal', formatBonus(wisMod + willBonus));
    
    saveCharacterToTaleSpire();
}

function rollSavingThrow(saveType) {
    const totalElement = document.getElementById(saveType + 'Total');
    if (!totalElement) return;
    
    const totalText = totalElement.textContent;
    const bonus = parseInt(totalText) || 0;
    
    const saveNames = {
        'fortitude': 'Стойкость',
        'reflex': 'Рефлексы',
        'will': 'Воля'
    };
    
    rollDice(`Спасбросок: ${saveNames[saveType]}`, bonus);
}

function initPerception() {
    const element = document.getElementById('perceptionBonus');
    if (element) {
        element.addEventListener('input', updatePerception);
    }
    updatePerception();
}

function updatePerception() {
    const bonusInput = document.getElementById('perceptionBonus');
    const totalElement = document.getElementById('perceptionTotal');
    
    if (!bonusInput || !totalElement) return;
    
    const bonus = parseInt(bonusInput.value) || 0;
    totalElement.textContent = formatBonus(bonus);
    saveCharacterToTaleSpire();
}

function rollPerception() {
    const totalElement = document.getElementById('perceptionTotal');
    if (!totalElement) return;
    
    const totalText = totalElement.textContent;
    const bonus = parseInt(totalText) || 0;
    
    rollDice("Внимательность", bonus);
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

function initHealth() {
    updateHealthBar();
    
    ['currentHP', 'maxHP'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function() {
                clearTimeout(window.healthUpdateTimeout);
                window.healthUpdateTimeout = setTimeout(updateHealthBar, 100);
            });
            
            element.addEventListener('blur', function() {
                let value = parseInt(this.value) || 0;
                if (value < 0) value = 0;
                if (value > 999) value = 999;
                this.value = value;
                updateHealthBar();
                saveCharacterToTaleSpire();
            });
        }
    });
}

function updateHealthBar() {
    const currentInput = document.getElementById('currentHP');
    const maxInput = document.getElementById('maxHP');
    const healthFill = document.getElementById('healthFill');
    
    if (!currentInput || !maxInput || !healthFill) return;
    
    let currentHP = parseInt(currentInput.value) || 0;
    let maxHP = parseInt(maxInput.value) || 1;
    
    if (maxHP <= 0) maxHP = 1;
    if (currentHP < 0) currentHP = 0;
    if (currentHP > maxHP) currentHP = maxHP;
    
    const percentage = Math.min(Math.max((currentHP / maxHP) * 100, 0), 100);
    
    healthFill.style.width = `${percentage}%`;
    
    if (percentage > 60) {
        healthFill.style.background = 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)';
    } else if (percentage > 30) {
        healthFill.style.background = 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)';
    } else if (percentage > 0) {
        healthFill.style.background = 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)';
    } else {
        healthFill.style.background = 'linear-gradient(90deg, #95a5a6 0%, #7f8c8d 100%)';
    }
}

function changeHP(amount) {
    const currentInput = document.getElementById('currentHP');
    const maxInput = document.getElementById('maxHP');
    
    if (!currentInput || !maxInput) return;
    
    let currentHP = parseInt(currentInput.value) || 0;
    const maxHP = parseInt(maxInput.value) || 0;
    
    currentHP += amount;
    
    if (currentHP < 0) currentHP = 0;
    if (currentHP > maxHP) currentHP = maxHP;
    
    currentInput.value = currentHP;
    updateHealthBar();
    saveCharacterToTaleSpire();
    
    showQuickMessage(amount > 0 ? `+${amount} HP` : `${amount} HP`, amount > 0 ? 'heal' : 'damage');
}

// ===== СИСТЕМА СОХРАНЕНИЯ TALESPIRE =====
// Основная функция сохранения в TaleSpire (аналогично custom2e_sheet.js)
async function saveCharacterToTaleSpire() {
    if (window.isInitializing) {
        console.log('⏸️ Пропускаем сохранение во время инициализации');
        return;
    }
    
    try {
        console.log('💾 Начинаем сохранение в TaleSpire...');
        
        // 1. Собираем все данные персонажа
        const characterData = getCharacterData();
        console.log('📊 Данные персонажа собраны');
        
        // 2. Всегда сохраняем в localStorage для подстраховки
        try {
            localStorage.setItem('pf2eCharacter', JSON.stringify(characterData));
            console.log('✅ Сохранено в localStorage');
        } catch (e) {
            console.error('❌ Не удалось сохранить в localStorage:', e);
        }
        
        // 3. Сохраняем в TaleSpire Campaign Storage (если доступно)
        if (typeof TS !== 'undefined' && TS.localStorage) {
            try {
                // Получаем текущие данные из TaleSpire
                let storedData;
                try {
                    storedData = await TS.localStorage.campaign.getBlob();
                    console.log('📂 Получены данные из TaleSpire');
                } catch (e) {
                    console.log('📭 Нет предыдущих данных в TaleSpire, начинаем с чистого листа');
                    storedData = null;
                }
                
                // Парсим или создаем новый объект
                let data = {};
                if (storedData) {
                    try {
                        data = JSON.parse(storedData);
                        console.log('✅ Данные TaleSpire успешно распарсены');
                    } catch (e) {
                        console.warn('⚠️ Ошибка парсинга данных TaleSpire, начинаем заново');
                        data = {};
                    }
                }
                
                // Сохраняем полные данные персонажа
                data.pf2e_fullData = JSON.stringify(characterData);
                console.log('📝 Полные данные сохранены в pf2e_fullData');
                
                // Сохраняем отдельные важные поля для совместимости
                data.pf2e_charName = document.getElementById('charName')?.value || '';
                data.pf2e_playerName = document.getElementById('playerName')?.value || '';
                data.pf2e_level = document.getElementById('level')?.value || '1';
                data.pf2e_charClass = document.getElementById('charClass')?.value || '';
                data.pf2e_ancestry = document.getElementById('ancestry')?.value || '';
                data.pf2e_background = document.getElementById('background')?.value || '';
                
                // Сохраняем объекты класса и происхождения
                if (window.selectedClass) {
                    data.pf2e_selectedClass = JSON.stringify(window.selectedClass);
                }
                if (window.selectedAncestry) {
                    data.pf2e_selectedAncestry = JSON.stringify(window.selectedAncestry);
                }
                if (window.selectedBackground) {
                    data.pf2e_selectedBackground = JSON.stringify(window.selectedBackground);
                }
                
                // Сохраняем характеристики
                data.pf2e_strScore = document.getElementById('strScore')?.value || '10';
                data.pf2e_dexScore = document.getElementById('dexScore')?.value || '10';
                data.pf2e_conScore = document.getElementById('conScore')?.value || '10';
                data.pf2e_intScore = document.getElementById('intScore')?.value || '10';
                data.pf2e_wisScore = document.getElementById('wisScore')?.value || '10';
                data.pf2e_chaScore = document.getElementById('chaScore')?.value || '10';
                
                // Сохраняем здоровье
                data.pf2e_currentHP = document.getElementById('currentHP')?.value || '0';
                data.pf2e_maxHP = document.getElementById('maxHP')?.value || '0';
                
                // Сохраняем спасброски
                data.pf2e_fortitudeBonus = document.getElementById('fortitudeBonus')?.value || '0';
                data.pf2e_reflexBonus = document.getElementById('reflexBonus')?.value || '0';
                data.pf2e_willBonus = document.getElementById('willBonus')?.value || '0';
                data.pf2e_perceptionBonus = document.getElementById('perceptionBonus')?.value || '0';
                
                // Сохраняем модульные данные
                data.pf2e_attacks = JSON.stringify(window.attacks || []);
                data.pf2e_spells = JSON.stringify(window.spells || []);
                data.pf2e_spellSlots = JSON.stringify(window.spellSlots || { casterType: 'spontaneous', slots: {} });
                data.pf2e_inventory = JSON.stringify(window.inventory || []);
                
                // Сохраняем в TaleSpire
                await TS.localStorage.campaign.setBlob(JSON.stringify(data));
                console.log('✅ Успешно сохранено в TaleSpire Campaign Storage');
                
            } catch (error) {
                console.error('❌ Ошибка сохранения в TaleSpire:', error);
            }
        } else {
            console.log('⚠️ TaleSpire API недоступен, сохранение только в localStorage');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка сохранения:', error);
    }
}

// Функция загрузки из TaleSpire
async function loadCharacterFromTaleSpire() {
    console.log('🔄 Загрузка персонажа из TaleSpire...');
    
    try {
        // Пробуем загрузить из TaleSpire в первую очередь
        if (typeof TS !== 'undefined' && TS.localStorage) {
            try {
                const storedData = await TS.localStorage.campaign.getBlob();
                
                if (storedData) {
                    console.log('📂 Данные найдены в TaleSpire');
                    const data = JSON.parse(storedData);
                    
                    // Способ 1: Загружаем из полных данных (приоритет)
                    if (data.pf2e_fullData) {
                        try {
                            const characterData = JSON.parse(data.pf2e_fullData);
                            console.log('✅ Загружаем полные данные из pf2e_fullData');
                            loadCharacterData(characterData);
                            return true;
                        } catch (e) {
                            console.warn('⚠️ Ошибка парсинга полных данных:', e);
                        }
                    }
                    
                    // Способ 2: Загружаем отдельные поля
                    console.log('📝 Загружаем отдельные поля из TaleSpire');
                    
                    // Восстанавливаем основные поля
                    const fieldsToLoad = [
                        'charName', 'playerName', 'level',
                        'strScore', 'dexScore', 'conScore', 'intScore', 'wisScore', 'chaScore',
                        'currentHP', 'maxHP',
                        'fortitudeBonus', 'reflexBonus', 'willBonus', 'perceptionBonus'
                    ];
                    
                    fieldsToLoad.forEach(field => {
                        const taleSpireField = `pf2e_${field}`;
                        if (data[taleSpireField] !== undefined) {
                            const element = document.getElementById(field);
                            if (element) {
                                element.value = data[taleSpireField];
                            }
                        }
                    });
                    
                    // Восстанавливаем селекты
                    if (data.pf2e_charClass) {
                        const classSelect = document.getElementById('charClass');
                        if (classSelect) {
                            classSelect.value = data.pf2e_charClass;
                        }
                    }
                    
                    if (data.pf2e_ancestry) {
                        const ancestrySelect = document.getElementById('ancestry');
                        if (ancestrySelect) {
                            ancestrySelect.value = data.pf2e_ancestry;
                        }
                    }
                    
                    if (data.pf2e_background) {
                        const backgroundInput = document.getElementById('background');
                        if (backgroundInput) {
                            backgroundInput.value = data.pf2e_background;
                        }
                    }
                    
                    // Восстанавливаем объекты
                    try {
                        if (data.pf2e_selectedClass) {
                            window.selectedClass = JSON.parse(data.pf2e_selectedClass);
                            console.log('✅ Объект класса восстановлен:', window.selectedClass);
                        }
                        if (data.pf2e_selectedAncestry) {
                            window.selectedAncestry = JSON.parse(data.pf2e_selectedAncestry);
                            console.log('✅ Объект происхождения восстановлен:', window.selectedAncestry);
                        }
                        if (data.pf2e_selectedBackground) {
                            window.selectedBackground = JSON.parse(data.pf2e_selectedBackground);
                            console.log('✅ Объект предыстории восстановлен:', window.selectedBackground);
                        }
                    } catch (e) {
                        console.warn('⚠️ Ошибка восстановления объектов:', e);
                    }
                    
                    // Восстанавливаем модульные данные
                    try {
                        if (data.pf2e_attacks) {
                            window.attacks = JSON.parse(data.pf2e_attacks);
                            if (window.renderAttacks) window.renderAttacks();
                        }
                        if (data.pf2e_spells) {
                            window.spells = JSON.parse(data.pf2e_spells);
                            if (window.renderKnownSpells) window.renderKnownSpells();
                        }
                        if (data.pf2e_spellSlots) {
                            window.spellSlots = JSON.parse(data.pf2e_spellSlots);
                            if (window.renderSlotsConfig) window.renderSlotsConfig();
                            const casterTypeSelect = document.getElementById('casterType');
                            if (casterTypeSelect && window.spellSlots.casterType) {
                                casterTypeSelect.value = window.spellSlots.casterType;
                            }
                        }
                        if (data.pf2e_inventory) {
                            window.inventory = JSON.parse(data.pf2e_inventory);
                            if (window.renderInventory) window.renderInventory();
                            if (window.updateBulkDisplay) window.updateBulkDisplay();
                        }
                    } catch (e) {
                        console.warn('⚠️ Ошибка восстановления модульных данных:', e);
                    }
                    
                    // Обновляем UI
                    setTimeout(() => {
                        calculateAbilityModifiers();
                        updateSavingThrows();
                        updatePerception();
                        updateHealthBar();
                        updateClassLink();
                        updateAncestryLink();
                        updateBackgroundLink();
                    }, 500);
                    
                    console.log('✅ Данные из TaleSpire успешно загружены');
                    return true;
                } else {
                    console.log('📭 В TaleSpire нет сохраненных данных');
                }
            } catch (error) {
                console.warn('⚠️ Ошибка загрузки из TaleSpire:', error);
            }
        }
        
        // Пробуем загрузить из localStorage
        console.log('🔄 Пробуем загрузить из localStorage...');
        const saved = localStorage.getItem('pf2eCharacter');
        if (saved) {
            try {
                const characterData = JSON.parse(saved);
                loadCharacterData(characterData);
                console.log('✅ Загружено из localStorage');
                return true;
            } catch (e) {
                console.error('❌ Ошибка парсинга localStorage:', e);
            }
        }
        
        console.log('📭 Нет сохраненных данных для загрузки');
        return false;
        
    } catch (error) {
        console.error('❌ Критическая ошибка загрузки:', error);
        return false;
    }
}

// Старая функция для обратной совместимости
function saveCharacter() {
    saveCharacterToTaleSpire();
}

function loadCharacter() {
    loadCharacterFromTaleSpire();
}

// ===== УПРАВЛЕНИЕ ДАННЫМИ =====
function getCharacterData() {
    const skillsData = window.getAllSkillsData ? window.getAllSkillsData() : {};
    
    return {
        metadata: {
            version: "4.1",
            system: "Pathfinder 2E",
            exportDate: new Date().toISOString(),
            saveMethod: "talespire"
        },
        charName: document.getElementById('charName')?.value || '',
        playerName: document.getElementById('playerName')?.value || '',
        charClass: document.getElementById('charClass')?.value || '',
        ancestry: document.getElementById('ancestry')?.value || '',
        background: document.getElementById('background')?.value || '',
        level: parseInt(document.getElementById('level')?.value) || 1,
        strScore: parseInt(document.getElementById('strScore')?.value) || 10,
        dexScore: parseInt(document.getElementById('dexScore')?.value) || 10,
        conScore: parseInt(document.getElementById('conScore')?.value) || 10,
        intScore: parseInt(document.getElementById('intScore')?.value) || 10,
        wisScore: parseInt(document.getElementById('wisScore')?.value) || 10,
        chaScore: parseInt(document.getElementById('chaScore')?.value) || 10,
        currentHP: parseInt(document.getElementById('currentHP')?.value) || 0,
        maxHP: parseInt(document.getElementById('maxHP')?.value) || 0,
        fortitudeBonus: document.getElementById('fortitudeBonus')?.value || '',
        reflexBonus: document.getElementById('reflexBonus')?.value || '',
        willBonus: document.getElementById('willBonus')?.value || '',
        perceptionBonus: document.getElementById('perceptionBonus')?.value || '',
        
        selectedClass: window.selectedClass,
        selectedAncestry: window.selectedAncestry,
        selectedBackground: window.selectedBackground,
        
        attacks: window.attacks || [],
        skills: skillsData,
        spells: window.spells || [],
        spellSlots: window.spellSlots || { casterType: 'spontaneous', slots: {} },
        inventory: window.inventory || []
    };
}

function loadCharacterData(characterData) {
    try {
        console.log('🔄 Загрузка данных персонажа');
        
        // Временно отключаем флаг инициализации для импорта
        const wasInitializing = window.isInitializing;
        window.isInitializing = false;
        
        // Восстанавливаем объекты из импортированных данных
        if (characterData.selectedClass) {
            try {
                window.selectedClass = typeof characterData.selectedClass === 'string' 
                    ? JSON.parse(characterData.selectedClass) 
                    : characterData.selectedClass;
            } catch (e) {
                console.error('Ошибка импорта selectedClass:', e);
                window.selectedClass = null;
            }
        }
        
        if (characterData.selectedAncestry) {
            try {
                window.selectedAncestry = typeof characterData.selectedAncestry === 'string'
                    ? JSON.parse(characterData.selectedAncestry)
                    : characterData.selectedAncestry;
            } catch (e) {
                console.error('Ошибка импорта selectedAncestry:', e);
                window.selectedAncestry = null;
            }
        }
        
        if (characterData.selectedBackground) {
            try {
                window.selectedBackground = typeof characterData.selectedBackground === 'string'
                    ? JSON.parse(characterData.selectedBackground)
                    : characterData.selectedBackground;
            } catch (e) {
                console.error('Ошибка импорта selectedBackground:', e);
                window.selectedBackground = null;
            }
        }
        
        // Загружаем заклинания
        if (characterData.spells && Array.isArray(characterData.spells)) {
            window.spells = characterData.spells;
            if (window.saveSpells) window.saveSpells();
            if (window.renderKnownSpells) window.renderKnownSpells();
        }
        
        // Загружаем ячейки заклинаний
        if (characterData.spellSlots) {
            window.spellSlots = characterData.spellSlots;
            if (window.saveSpellSlots) window.saveSpellSlots();
            if (window.renderSlotsConfig) window.renderSlotsConfig();
            if (window.updateSlotsVisual) window.updateSlotsVisual();
            if (window.updateSpellSlotsBadge) window.updateSpellSlotsBadge();
            
            const casterTypeSelect = document.getElementById('casterType');
            if (casterTypeSelect && characterData.spellSlots.casterType) {
                casterTypeSelect.value = characterData.spellSlots.casterType;
            }
        }
        
        // Устанавливаем значения полей формы
        const fieldsToLoad = [
            'charName', 'playerName', 'level',
            'strScore', 'dexScore', 'conScore', 'intScore', 'wisScore', 'chaScore',
            'currentHP', 'maxHP',
            'fortitudeBonus', 'reflexBonus', 'willBonus', 'perceptionBonus'
        ];
        
        fieldsToLoad.forEach(field => {
            if (characterData[field] !== undefined && characterData[field] !== null) {
                const element = document.getElementById(field);
                if (element) {
                    element.value = characterData[field];
                }
            }
        });
        
        // Устанавливаем значения в select'ы из объектов
        if (window.selectedClass && window.selectedClass.value) {
            const classSelect = document.getElementById('charClass');
            if (classSelect) {
                classSelect.value = window.selectedClass.value;
            }
        }
        
        if (window.selectedAncestry && window.selectedAncestry.value) {
            const ancestrySelect = document.getElementById('ancestry');
            if (ancestrySelect) {
                ancestrySelect.value = window.selectedAncestry.value;
            }
        }
        
        if (window.selectedBackground) {
            const backgroundInput = document.getElementById('background');
            if (backgroundInput) {
                backgroundInput.value = window.selectedBackground.label || window.selectedBackground.value;
            }
        }
        
        // Загружаем данные модулей
        if (characterData.attacks && Array.isArray(characterData.attacks)) {
            window.attacks = characterData.attacks;
            if (window.renderAttacks) window.renderAttacks();
            if (window.saveAttacks) window.saveAttacks();
        }
        
        if (characterData.skills && typeof characterData.skills === 'object') {
            if (window.loadSkillsData) window.loadSkillsData(characterData.skills);
            if (window.saveSkills) window.saveSkills();
        }
        
        // Обновляем UI
        calculateAbilityModifiers();
        updateSavingThrows();
        updatePerception();
        updateHealthBar();
        
        // Обновляем ссылки
        updateClassLink();
        updateAncestryLink();
        updateBackgroundLink();
        
        // Сохраняем импортированные данные
        setTimeout(() => {
            saveCharacterToTaleSpire();
        }, 1000);
        
        // Восстанавливаем флаг инициализации
        window.isInitializing = wasInitializing;
        
        console.log('✅ Импорт данных персонажа завершён успешно');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка импорта данных персонажа:', error);
        showAlert('Ошибка импорта персонажа: ' + error.message);
        window.isInitializing = false;
        return false;
    }
}

function findClassByValue(value) {
    if (!value || !window.classesData || window.classesData.length === 0) return null;
    
    let found = window.classesData.find(c => c.value === value);
    
    if (!found) {
        found = window.classesData.find(c => 
            c.label && c.label.toLowerCase().includes(value.toLowerCase())
        );
    }
    
    return found;
}

function findAncestryByValue(value) {
    if (!value || !window.ancestriesData || window.ancestriesData.length === 0) return null;
    
    let found = window.ancestriesData.find(a => a.value === value);
    
    if (!found) {
        found = window.ancestriesData.find(a => 
            a.label && a.label.toLowerCase().includes(value.toLowerCase())
        );
    }
    
    return found;
}

function findBackgroundByValue(value) {
    if (!value || !window.allBackgrounds || window.allBackgrounds.length === 0) return null;
    
    let found = window.allBackgrounds.find(bg => 
        bg.value === value || 
        bg.label === value ||
        (bg.label && bg.label.toLowerCase() === value.toLowerCase())
    );
    
    if (!found) {
        found = window.allBackgrounds.find(bg => 
            bg.label && bg.label.toLowerCase().includes(value.toLowerCase())
        );
    }
    
    return found;
}

function showExportSection() {
    const exportSection = document.getElementById('exportSection');
    const jsonOutput = document.getElementById('jsonDataOutput');
    
    if (!exportSection || !jsonOutput) return;
    
    try {
        const characterData = getCharacterData();
        const dataStr = JSON.stringify(characterData, null, 2);
        jsonOutput.value = dataStr;
        exportSection.style.display = 'block';
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        showAlert('Ошибка при экспорте данных');
    }
}

function hideExportSection() {
    const exportSection = document.getElementById('exportSection');
    if (exportSection) exportSection.style.display = 'none';
}

function copyToClipboard() {
    const textarea = document.getElementById('jsonDataOutput');
    if (!textarea) return;
    
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    
    try {
        const successful = document.execCommand('copy');
        showAlert(successful ? '✅ Данные скопированы!' : '❌ Не удалось скопировать');
    } catch (error) {
        console.error('Ошибка копирования:', error);
        showAlert('Не удалось скопировать. Скопируйте текст вручную.');
    }
}

function importCharacter() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput) return;
    
    fileInput.value = '';
    
    fileInput.onclick = function() {
        this.value = null;
    };
    
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log('Файл не выбран');
            return;
        }
        
        console.log('📁 Выбран файл для импорта:', file.name);
        
        if (!file.name.toLowerCase().endsWith('.json')) {
            showAlert('Ошибка: выбранный файл не является JSON файлом');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Ошибка: файл слишком большой (максимум 5MB)');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const fileContent = e.target.result;
                
                if (!fileContent || fileContent.trim() === '') {
                    showAlert('Ошибка: файл пустой');
                    return;
                }
                
                const characterData = JSON.parse(fileContent);
                
                if (!characterData || typeof characterData !== 'object') {
                    showAlert('Ошибка: неверный формат данных в файле');
                    return;
                }
                
                if (loadCharacterData(characterData)) {
                    showAlert(`✅ Персонаж загружен из файла: ${file.name}`);
                }
                
            } catch (error) {
                console.error('❌ Ошибка импорта:', error);
                showAlert('Ошибка импорта: неверный формат JSON файла.');
            }
        };
        
        reader.onerror = function() {
            console.error('Ошибка чтения файла');
            showAlert('Ошибка чтения файла');
        };
        
        reader.readAsText(file);
        
        setTimeout(() => {
            fileInput.value = '';
        }, 100);
    };
    
    fileInput.click();
}

function clearCharacter() {
    showConfirm('Очистить лист персонажа? Все несохраненные данные будут потеряны.', function() {
        document.querySelectorAll('input').forEach(input => {
            if (input.type !== 'file' && input.id !== 'importFile') {
                input.value = '';
            }
        });
        
        // Очищаем селекты
        const classSelect = document.getElementById('charClass');
        if (classSelect) classSelect.value = '';
        
        const ancestrySelect = document.getElementById('ancestry');
        if (ancestrySelect) ancestrySelect.value = '';
        
        const backgroundInput = document.getElementById('background');
        if (backgroundInput) backgroundInput.value = '';
        
        window.selectedClass = null;
        window.selectedAncestry = null;
        window.selectedBackground = null;
        
        updateElementValue('level', 1);
        updateElementValue('strScore', 10);
        updateElementValue('dexScore', 10);
        updateElementValue('conScore', 10);
        updateElementValue('intScore', 10);
        updateElementValue('wisScore', 10);
        updateElementValue('chaScore', 10);
        updateElementValue('currentHP', 0);
        updateElementValue('maxHP', 0);
        
        window.attacks = [];
        window.spells = [];
        window.spellSlots = { casterType: 'spontaneous', slots: {} };
        window.inventory = [];
        
        // Очищаем хранилища
        localStorage.removeItem('pf2eCharacter');
        localStorage.removeItem('pf2eAttacks');
        localStorage.removeItem('pf2eSpells');
        localStorage.removeItem('pf2eSkills');
        localStorage.removeItem('pf2eSpellSlots');
        localStorage.removeItem('pf2eInventory');
        
        // Очищаем TaleSpire
        if (typeof TS !== 'undefined' && TS.localStorage) {
            TS.localStorage.campaign.deleteBlob().then(() => {
                console.log('✅ Данные удалены из TaleSpire');
            }).catch(error => {
                console.error('❌ Ошибка удаления из TaleSpire:', error);
            });
        }
        
        // Обновляем модули
        if (window.saveSpells) window.saveSpells();
        if (window.renderKnownSpells) window.renderKnownSpells();
        if (window.saveSpellSlots) window.saveSpellSlots();
        if (window.renderSlotsConfig) window.renderSlotsConfig();
        if (window.updateSlotsVisual) window.updateSlotsVisual();
        if (window.updateSpellSlotsBadge) window.updateSpellSlotsBadge();
        if (window.renderAttacks) window.renderAttacks();
        if (window.renderInventory) window.renderInventory();
        if (window.updateBulkDisplay) window.updateBulkDisplay();
        
        // Обновляем UI
        calculateAbilityModifiers();
        updateSavingThrows();
        updateHealthBar();
        updateClassLink();
        updateAncestryLink();
        updateBackgroundLink();
        
        showAlert('Лист персонажа успешно очищен!');
    });
}

// ===== СИСТЕМА ВКЛАДОК И ТЕМ =====
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabContent = document.getElementById(targetTab);
            if (tabContent) tabContent.classList.add('active');
        });
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('pf2e-theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('pf2e-theme', themeName);
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupEventListeners() {
    console.log('🎯 Настройка обработчиков событий...');
    
    // 1. Обработчики для характеристик
    document.querySelectorAll('.ability-score').forEach(input => {
        input.addEventListener('change', calculateAbilityModifiers);
        input.addEventListener('input', calculateAbilityModifiers);
    });
    
    // 2. Обработчики для автосохранения
    const excludeIds = ['importFile', 'backgroundSearch', 'spellSearch'];
    const excludeTypes = ['file', 'hidden'];
    
    document.querySelectorAll('input, select, textarea').forEach(element => {
        const isExcluded = excludeIds.includes(element.id) || 
                          excludeTypes.includes(element.type) ||
                          element.classList.contains('no-auto-save');
        
        if (!isExcluded && element.id) {
            if (element.tagName === 'INPUT' && 
                (element.type === 'text' || element.type === 'number')) {
                element.addEventListener('input', createAutoSaveHandler(element));
            } else {
                element.addEventListener('change', createAutoSaveHandler(element));
            }
            
            if (element.tagName === 'TEXTAREA') {
                element.addEventListener('input', createAutoSaveHandler(element, 2000));
            }
        }
    });
    
    // 3. Обработчики для кнопок бросков
    document.querySelectorAll('.skill-roll-btn, .btn-perception, .btn-save, .btn-attack, .btn-damage-action, .btn-cast').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // 4. Обработчик для кнопок изменения HP
    document.querySelectorAll('.btn-damage, .btn-heal').forEach(btn => {
        btn.addEventListener('click', function(e) {
            setTimeout(() => {
                if (!window.isInitializing) saveCharacterToTaleSpire();
            }, 100);
        });
    });
    
    console.log('✅ Все обработчики событий настроены');
}

function createAutoSaveHandler(element, delay = 1000) {
    return function() {
        if (window.isInitializing) return;
        
        if (element === document.activeElement && 
            (element.type === 'text' || element.tagName === 'TEXTAREA')) {
            clearTimeout(window.saveTimeout);
            window.saveTimeout = setTimeout(() => {
                saveCharacterToTaleSpire();
            }, delay);
        } else {
            clearTimeout(window.saveTimeout);
            window.saveTimeout = setTimeout(() => {
                saveCharacterToTaleSpire();
            }, delay);
        }
    };
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', function(e) {
        if (!window.isInitializing) {
            saveCharacterToTaleSpire();
        }
    });
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && !window.isInitializing) {
            saveCharacterToTaleSpire();
        }
    });
}

// ===== ФУНКЦИИ ДЛЯ ЗАКЛИНАНИЙ =====
function toggleSpellForm() {
    // Переключаемся на вкладку заклинаний
    const spellsTabButton = document.querySelector('.tab-button[data-tab="spells-tab"]');
    if (spellsTabButton) {
        spellsTabButton.click();
        
        // Затем переключаемся на подвкладку библиотеки
        setTimeout(() => {
            if (window.toggleSubtab) {
                window.toggleSubtab('library-subtab');
            }
        }, 100);
    }
}

function toggleSlotsForm() {
    // Сначала переключаемся на вкладку заклинаний
    const spellsTabButton = document.querySelector('.tab-button[data-tab="spells-tab"]');
    if (spellsTabButton) {
        spellsTabButton.click();
        
        // Ждем полного переключения вкладки
        setTimeout(() => {
            // Используем функцию из spell.js
            if (window.toggleSubtab && typeof window.toggleSubtab === 'function') {
                window.toggleSubtab('slots-subtab');
            } else {
                console.error('Функция toggleSubtab не доступна');
                // Альтернативный вариант
                const slotsBtn = document.querySelector('.spell-tab-btn[data-subtab="slots-subtab"]');
                if (slotsBtn) slotsBtn.click();
            }
        }, 200);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
async function initializeApp() {
    console.log('🚀 Начинаем инициализацию приложения...');
    window.isInitializing = true;
    
    try {
        // 1. Проверяем доступность TaleSpire
        if (typeof TS !== 'undefined') {
            console.log('🎮 TaleSpire API доступен');
        } else {
            console.log('⚠️ TaleSpire API недоступен (работаем в браузере)');
        }
        
        // 2. Загружаем JSON данные (классы, происхождения, предыстории)
        await loadJSONData();
        console.log('📚 JSON данные загружены');
        
        // 3. Даем время на загрузку всех модулей
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 4. Инициализируем базовые компоненты
        initTabs();
        initTheme();
        initHealth();
        initSavingThrows();
        initPerception();
        
        // 5. Инициализируем селекторы
        initClassSelector();
        initAncestrySelector();
        initBackgroundSelector();
        
        // 6. Загружаем данные персонажа из TaleSpire
        console.log('🔄 Загружаем данные персонажа...');
        await loadCharacterFromTaleSpire();
        
        // 7. Даем время на обновление UI после загрузки
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 8. Инициализируем модули с проверкой
        if (typeof window.initSkills === 'function') {
            window.initSkills();
            console.log('✅ Модуль навыков инициализирован');
        } else {
            console.warn('⚠️ Модуль навыков не загружен');
        }
        
        if (typeof window.initSpells === 'function') {
            window.initSpells();
            console.log('✅ Модуль заклинаний инициализирован');
        } else {
            console.warn('⚠️ Модуль заклинаний не загружен');
        }
        
        if (typeof window.initAttackForm === 'function') {
            window.initAttackForm();
            console.log('✅ Модуль атак инициализирован');
        } else {
            console.warn('⚠️ Модуль атак не загружен');
        }
        
        if (typeof window.initInventory === 'function') {
            window.initInventory();
            console.log('✅ Модуль инвентаря инициализирован');
        } else {
            console.warn('⚠️ Модуль инвентаря не загружен');
        }
        
        // 9. Загружаем данные модулей (дублирующая загрузка для надежности)
        if (typeof window.loadAttacks === 'function') window.loadAttacks();
        if (typeof window.loadSpells === 'function') window.loadSpells();
        if (typeof window.loadSpellSlots === 'function') window.loadSpellSlots();
        if (typeof window.loadSkills === 'function') window.loadSkills();
        
        // 10. Настраиваем обработчики событий
        setupEventListeners();
        setupBeforeUnload();
        
        // 11. Принудительно обновляем ссылки и UI
        setTimeout(() => {
            updateClassLink();
            updateAncestryLink();
            updateBackgroundLink();
            calculateAbilityModifiers();
            updateHealthBar();
            console.log('🔄 UI обновлен');
        }, 1000);
        
        window.isInitializing = false;
        console.log('✅ Инициализация завершена успешно!');
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        window.isInitializing = false;
        showAlert('Ошибка загрузки приложения: ' + error.message);
    }
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====
window.showBackgroundModal = showBackgroundModal;
window.hideBackgroundModal = hideBackgroundModal;
window.clearBackgroundSelection = clearBackgroundSelection;
window.searchBackgrounds = searchBackgrounds;
window.rollSavingThrow = rollSavingThrow;
window.rollPerception = rollPerception;
window.changeHP = changeHP;
window.showExportSection = showExportSection;
window.hideExportSection = hideExportSection;
window.copyToClipboard = copyToClipboard;
window.importCharacter = importCharacter;
window.clearCharacter = clearCharacter;
window.toggleSlotsForm = toggleSlotsForm;
window.toggleSpellForm = toggleSpellForm;
window.setTheme = setTheme;
window.initializeApp = initializeApp;
window.calculateAbilityModifiers = calculateAbilityModifiers;
window.updateHealthBar = updateHealthBar;
window.updatePerception = updatePerception;
window.updateSavingThrows = updateSavingThrows;
window.updateClassLink = updateClassLink;
window.updateAncestryLink = updateAncestryLink;
window.updateBackgroundLink = updateBackgroundLink;
window.saveCharacter = saveCharacter;
window.saveCharacterToTaleSpire = saveCharacterToTaleSpire;
window.loadCharacter = loadCharacter;
window.loadCharacterFromTaleSpire = loadCharacterFromTaleSpire;
window.loadCharacterData = loadCharacterData;
window.findClassByValue = findClassByValue;
window.findAncestryByValue = findAncestryByValue;
window.findBackgroundByValue = findBackgroundByValue;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('main.js версия 4.1 загружен (совместимость с TaleSpire)');
    
    // Даем время на загрузку всех скриптов
    setTimeout(() => {
        window.initializeApp();
    }, 200);
});