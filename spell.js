// ===== ФАЙЛ: spell.js =====
// Версия 2.0 - Переработана система подвкладок

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
window.spells = [];
window.spellSlots = {
    casterType: 'spontaneous',
    slots: {}
};

window.allSpells = [];
window.currentFilter = 'all';
window.currentTraditionFilter = 'all';

// Инициализация переменных
window.currentPage = 1;
const spellsPerPage = 50;
window.filteredSpells = [];
window.libraryLoaded = false;

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

// === ЗАГРУЗКА БИБЛИОТЕКИ ЗАКЛИНАНИЙ ===
async function loadAllSpells() {
    try {
        const response = await fetch('data/allspells.json');
        const rawSpells = await response.json();
        
        allSpells = rawSpells.map(spell => transformSpellData(spell));
        
        console.log(`Загружено ${allSpells.length} заклинаний из библиотеки`);
        updateTraditionFilterOptions();
        libraryLoaded = true;
        renderSpellLibraryPage(1);
        
    } catch (error) {
        console.error('Ошибка загрузки библиотеки заклинаний:', error);
        showAlert('Не удалось загрузить библиотеку заклинаний');
        createFallbackSpells();
    }
}

function transformSpellData(rawSpell) {
    const typeString = rawSpell.type || '';
    let spellType = 'Заклинание';
    let spellLevel = parseInt(rawSpell.level) || 0;
    
    const lowerType = typeString.toLowerCase();
    
    if (lowerType.includes('фокус')) {
        spellType = 'Фокус';
        spellLevel = 0;
    } else if (lowerType.includes('фокальное')) {
        spellType = 'Фокальное';
        const levelMatch = typeString.match(/\d+/);
        if (levelMatch) spellLevel = parseInt(levelMatch[0]);
    } else if (lowerType.includes('заклинание')) {
        spellType = 'Заклинание';
    }
    
    const formattedAction = formatSpellAction(rawSpell.action);
    
    return {
        id: rawSpell.id || generateSpellId(rawSpell),
        name: rawSpell.name || '',
        nameEn: rawSpell.nameEn || '',
        level: spellLevel,
        type: spellType,
        originalType: typeString,
        traditions: Array.isArray(rawSpell.traditions) ? rawSpell.traditions : [],
        traits: Array.isArray(rawSpell.traits) ? rawSpell.traits : [],
        action: formattedAction,
        originalAction: rawSpell.action || '',
        range: rawSpell.range || '',
        area: rawSpell.area || '',
        target: rawSpell.target || '',
        duration: rawSpell.duration || '',
        savingThrow: rawSpell.savingThrow || '',
        description: rawSpell.description || '',
        source: rawSpell.source || '',
        url: rawSpell.url || '',
        isFocus: spellType === 'Фокус',
        isFocal: spellType === 'Фокальное',
        isSpell: spellType === 'Заклинание',
        _raw: rawSpell
    };
}

function generateSpellId(spell) {
    if (spell.id) return spell.id;
    const name = spell.name || 'unnamed';
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .trim();
}

// === РАБОТА С ПОДВКЛАДКАМИ ===

function switchToSubtab(subtabId, animate = true) {
    console.log('Переключаемся на подвкладку:', subtabId);
    
    // Скрываем все подвкладки
    document.querySelectorAll('.spell-subtab').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.spell-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем целевую подвкладку
    const targetTab = document.getElementById(subtabId);
    const targetBtn = document.querySelector(`.spell-tab-btn[data-subtab="${subtabId}"]`);
    
    if (targetTab && targetBtn) {
        if (animate) {
            targetTab.style.opacity = '0';
            targetTab.style.display = 'block';
            requestAnimationFrame(() => {
                targetTab.style.transition = 'opacity 0.3s ease';
                targetTab.style.opacity = '1';
            });
        } else {
            targetTab.style.display = 'block';
        }
        
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
        
        // Выполняем действия для подвкладки
        performSubtabActions(subtabId);
    } else {
        console.error('Подвкладка или кнопка не найдены:', subtabId);
    }
}

function initSpellsSubtabs() {
    console.log('Инициализация подвкладок заклинаний...');
    
    // Сначала скрываем все подвкладки
    const allSubtabs = document.querySelectorAll('.spell-subtab');
    allSubtabs.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // Находим все кнопки подвкладок
    const tabButtons = document.querySelectorAll('.spell-tab-btn');
    
    // Назначаем обработчики на кнопки
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('data-subtab');
            if (this.classList.contains('active')) {
                return;
            }
            
            // Анимация нажатия
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
                switchToSubtab(targetId, true);
            }, 150);
        });
    });
    
    // Активируем подвкладку "Изученные" по умолчанию
    const knownTabButton = document.querySelector('.spell-tab-btn[data-subtab="known-subtab"]');
    if (knownTabButton) {
        console.log('Активируем подвкладку "Изученные" по умолчанию');
        setTimeout(() => {
            switchToSubtab('known-subtab', false);
        }, 100);
    } else if (tabButtons.length > 0) {
        const firstButton = tabButtons[0];
        const firstTabId = firstButton.getAttribute('data-subtab');
        setTimeout(() => {
            switchToSubtab(firstTabId, false);
        }, 100);
    }
    
    console.log('✅ Подвкладки инициализированы');
}

function toggleSubtab(subtabId) {
    console.log('Программное переключение на подвкладку:', subtabId);
    
    const targetButton = document.querySelector(`.spell-tab-btn[data-subtab="${subtabId}"]`);
    if (targetButton) {
        if (targetButton.classList.contains('active')) {
            return;
        }
        
        setTimeout(() => {
            targetButton.click();
        }, 10);
    } else {
        console.error('Кнопка подвкладки не найдена:', subtabId);
    }
}

// === ОБНОВЛЕНИЕ БЕЙДЖЕЙ ===

function updateSpellBadges() {
    const knownBadge = document.getElementById('knownSpellsBadge');
    if (knownBadge && spells) {
        knownBadge.textContent = spells.length;
    }
    
    updateSpellSlotsBadge();
}

function updateSpellSlotsBadge() {
    const badge = document.getElementById('spellSlotsBadge');
    if (!badge) return;
    
    let totalSlots = 0;
    let usedSlots = 0;
    
    for (let level = 1; level <= 10; level++) {
        const slot = spellSlots.slots[level];
        if (slot) {
            totalSlots += slot.max || 0;
            usedSlots += slot.used || 0;
        }
    }
    
    badge.textContent = `${usedSlots}/${totalSlots}`;
    
    badge.className = 'tab-badge';
    if (totalSlots === 0) {
        badge.classList.add('empty');
    } else if (usedSlots === 0) {
        badge.classList.add('full');
    } else if (usedSlots === totalSlots) {
        badge.classList.add('depleted');
    } else {
        badge.classList.add('partial');
    }
}

// === БИБЛИОТЕКА ЗАКЛИНАНИЙ ===

function renderSpellLibraryPage(page) {
    const container = document.getElementById('spellLibraryList');
    const pagination = document.getElementById('libraryPagination');
    const countElement = document.getElementById('libraryCount');
    
    if (!container) return;
    
    currentPage = page;
    
    if (!allSpells || allSpells.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Библиотека загружается...</h3>
                <p>Пожалуйста, подождите</p>
            </div>
        `;
        return;
    }
    
    let filtered = allSpells;
    
    // Применяем фильтры
    if (currentFilter !== 'all') {
        if (currentFilter === 'focus') {
            filtered = filtered.filter(s => s.type === 'Фокус');
        } else if (currentFilter === 'focal') {
            filtered = filtered.filter(s => s.type === 'Фокальное');
        } else if (currentFilter === '0') {
            filtered = filtered.filter(s => s.type === 'Заклинание' && s.level === 0);
        } else {
            filtered = filtered.filter(s => s.level == currentFilter);
        }
    }
    
    if (currentTraditionFilter !== 'all') {
        filtered = filtered.filter(s => 
            s.traditions && s.traditions.includes(currentTraditionFilter)
        );
    }
    
    const searchTerm = document.getElementById('spellSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(searchTerm) ||
            (s.nameEn && s.nameEn.toLowerCase().includes(searchTerm)) ||
            (s.description && s.description.toLowerCase().includes(searchTerm)) ||
            (s.traits && s.traits.some(trait => trait.toLowerCase().includes(searchTerm)))
        );
    }
    
    filteredSpells = filtered;
    
    if (countElement) {
        countElement.textContent = `Найдено: ${filteredSpells.length}`;
    }
    
    const totalPages = Math.ceil(filteredSpells.length / spellsPerPage);
    const startIndex = (currentPage - 1) * spellsPerPage;
    const endIndex = startIndex + spellsPerPage;
    const spellsToShow = filteredSpells.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    if (spellsToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Заклинания не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
            </div>
        `;
        if (pagination) pagination.style.display = 'none';
        return;
    }
    
    // Добавляем карточки
    spellsToShow.forEach(spell => {
        const cardHtml = createSpellCard(spell, false);
        const cardElement = document.createElement('div');
        cardElement.innerHTML = cardHtml;
        container.appendChild(cardElement.firstElementChild);
    });
    
    // Пагинация
    if (pagination) {
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            const pageInfo = pagination.querySelector('.page-info');
            if (pageInfo) {
                pageInfo.textContent = `${currentPage} / ${totalPages}`;
            }
            
            const prevBtn = pagination.querySelector('.prev');
            const nextBtn = pagination.querySelector('.next');
            if (prevBtn) prevBtn.disabled = currentPage === 1;
            if (nextBtn) nextBtn.disabled = currentPage === totalPages;
        } else {
            pagination.style.display = 'none';
        }
    }
}

function createSpellCard(spell, isKnown = false) {
    const isInKnownList = spells.find(s => s.id === spell.id);
    const isFocus = spell.type === 'Фокус';
    const isFocal = spell.type === 'Фокальное';
    const isCantrip = spell.type === 'Заклинание' && spell.level === 0;
    
    const hasUrl = spell.url && spell.url.trim() !== '';
    
    let levelClass = '';
    if (isFocus) {
        levelClass = 'focus';
    } else if (isFocal) {
        levelClass = 'focal';
    } else if (isCantrip) {
        levelClass = 'cantrip';
    } else {
        levelClass = `level-${spell.level}`;
    }
    
    let levelDisplay = '';
    if (isFocus) {
        levelDisplay = 'Фокус';
    } else if (isFocal) {
        levelDisplay = `Фокальное ${spell.level}`;
    } else if (isCantrip) {
        levelDisplay = 'Заговор';
    } else {
        levelDisplay = `${spell.level} уровень`;
    }
    
    const traitsHtml = spell.traits && spell.traits.length > 0 ? 
        `<div class="spell-traits">
            ${spell.traits.slice(0, 3).map(trait => 
                `<span class="trait-badge" title="${escapeHtml(trait)}">${escapeHtml(trait)}</span>`
            ).join('')}
            ${spell.traits.length > 3 ? `<span class="trait-more">+${spell.traits.length - 3}</span>` : ''}
        </div>` : '';
    
    const traditionsHtml = spell.traditions && spell.traditions.length > 0 ? 
        `<div class="spell-traditions">
            ${spell.traditions.map(trad => 
                `<span class="tradition-tag" title="${escapeHtml(trad)}">${escapeHtml(getShortTraditionName(trad))}</span>`
            ).join('')}
        </div>` : '';
    
    const plainDescription = spell.description 
        ? spell.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')
        : '';
    const shortDescription = plainDescription.length > 120 
        ? plainDescription.substring(0, 120) + '...' 
        : plainDescription;
    
    const actionHtml = spell.action ? 
        `<div class="spell-action">
            <span class="action-icon">⚡</span>
            <span class="action-text">${spell.action}</span>
        </div>` : '';
    
    return `
        <div class="spell-card ${isInKnownList ? 'known' : ''} ${isKnown && spell.prepared ? 'prepared' : ''}" data-id="${spell.id}" data-level="${spell.level}">
            <div class="spell-card-header">
                <div class="spell-level-badge ${levelClass}">
                    ${levelDisplay}
                </div>
                <div class="spell-name">
                    ${escapeHtml(spell.name)}
                    ${hasUrl ? `
                        <a href="${spell.url}" target="_blank" class="spell-link" title="Открыть на PF2.ru">
                            🔗
                        </a>
                    ` : ''}
                </div>
                ${isKnown ? `
                    <div class="spell-status">
                        ${spell.prepared ? '<span class="status-badge prepared" title="Подготовлено">✓</span>' : ''}
                        ${isFocus ? '<span class="status-badge focus" title="Фокус">Ф</span>' : ''}
                    </div>
                ` : ''}
            </div>
            
            ${traitsHtml}
            
            <div class="spell-card-body">
                ${traditionsHtml}
                ${actionHtml}
                
                <div class="spell-description">
                    ${escapeHtml(shortDescription)}
                </div>
            </div>
            
            <div class="spell-card-actions">
                <button onclick="showSpellDetails('${spell.id}')" class="btn-info">
                    <span class="btn-icon">👁️</span>
                    <span class="btn-text">Детали</span>
                </button>
                
                ${hasUrl ? `
                    <a href="${spell.url}" target="_blank" class="btn-link" title="Открыть на PF2.ru">
                        <span class="btn-icon">🔗</span>
                        <span class="btn-text"></span>
                    </a>
                ` : ''}
                
                ${!isInKnownList ? `
                    <button onclick="addToKnownSpells('${spell.id}')" class="btn-add">
                        <span class="btn-icon">+</span>
                        <span class="btn-text">Изучить</span>
                    </button>
                ` : isKnown ? `
                    <button onclick="toggleSpellPrepared('${spell.id}')" class="btn-prepare ${spell.prepared ? 'active' : ''}">
                        <span class="btn-icon">${spell.prepared ? '✓' : '○'}</span>
                        <span class="btn-text">${spell.prepared ? 'Подготовлено' : 'Подготовить'}</span>
                    </button>
                    <button onclick="castSpell('${spell.id}')" class="btn-cast" ${!spell.prepared && !isFocus ? 'disabled' : ''}>
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">Произнести</span>
                    </button>
                    <button onclick="removeFromKnownSpells('${spell.id}')" class="btn-remove" title="Удалить">
                        <span class="btn-icon">🗑️</span>
                    </button>
                ` : `
                    <span class="already-known">✓ Изучено</span>
                `}
            </div>
        </div>
    `;
}

function updateTraditionFilterOptions() {
    const filterSelect = document.getElementById('traditionFilter');
    if (!filterSelect) return;
    
    const traditions = new Set();
    allSpells.forEach(spell => {
        if (spell.traditions && Array.isArray(spell.traditions)) {
            spell.traditions.forEach(t => traditions.add(t));
        }
    });
    
    const sortedTraditions = Array.from(traditions).sort();
    filterSelect.innerHTML = `
        <option value="all">Все традиции</option>
        ${sortedTraditions.map(t => `<option value="${t}">${t}</option>`).join('')}
    `;
}

function filterByLevel(level) {
    currentFilter = String(level);
    
    document.querySelectorAll('.level-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.level-filter-btn[data-level="${String(level)}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    renderSpellLibraryPage(1);
}

function filterByTradition(tradition) {
    currentTraditionFilter = tradition;
    renderSpellLibraryPage(1);
}

function searchSpells() {
    renderSpellLibraryPage(1);
}

// === ИЗУЧЕННЫЕ ЗАКЛИНАНИЯ ===

function addToKnownSpells(spellId) {
    const spellToAdd = allSpells.find(s => s.id === spellId);
    if (!spellToAdd) {
        showAlert('Заклинание не найдено в библиотеке');
        return;
    }
    
    if (spells.find(s => s.id === spellId)) {
        showAlert('Это заклинание уже изучено');
        return;
    }
    
    const knownSpell = {
        ...spellToAdd,
        prepared: false,
        isFocus: spellToAdd.type === 'Фокус'
    };
    
    spells.push(knownSpell);
    saveSpells();
    renderKnownSpells();
    updateSpellBadges();
    showAlert(`Заклинание "${spellToAdd.name}" добавлено в изученные!`);
    
    const libraryCard = document.querySelector(`.spell-library-card[data-id="${spellId}"]`);
    if (libraryCard) {
        const actionsDiv = libraryCard.querySelector('.spell-library-actions');
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                <button onclick="showSpellDetails('${spellId}')" class="btn-info">
                    Подробнее
                </button>
                <span class="already-known">✓ Изучено</span>
            `;
        }
    }
}

function removeFromKnownSpells(spellId) {
    spells = spells.filter(s => s.id !== spellId);
    saveSpells();
    renderKnownSpells();
    updateSpellBadges();
    showAlert('Заклинание удалено из изученных');
    
    const libraryCard = document.querySelector(`.spell-library-card[data-id="${spellId}"]`);
    if (libraryCard) {
        const actionsDiv = libraryCard.querySelector('.spell-library-actions');
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                <button onclick="showSpellDetails('${spellId}')" class="btn-info">
                    Подробнее
                </button>
                <button onclick="addToKnownSpells('${spellId}')" class="btn-add">
                    Изучить
                </button>
            `;
        }
    }
}

function toggleSpellPrepared(spellId) {
    const spell = spells.find(s => s.id === spellId);
    if (spell) {
        spell.prepared = !spell.prepared;
        saveSpells();
        renderKnownSpells();
        document.dispatchEvent(new CustomEvent('spellChanged'));
    }
}

function renderKnownSpells() {
    const container = document.getElementById('knownSpellsList');
    const emptyState = document.getElementById('knownEmptyState');
    
    if (!container || !emptyState) return;
    
    container.innerHTML = '';
    
    if (spells.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        updateSpellCounters(); // Эта функция теперь обновляет и ячейки
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    spells.forEach(spell => {
        const cardHtml = createSpellCard(spell, true);
        const cardElement = document.createElement('div');
        cardElement.innerHTML = cardHtml;
        container.appendChild(cardElement.firstElementChild);
    });
    
    updateSpellCounters(); // Эта функция теперь обновляет и ячейки
    setupKnownSpellsFilters();
}

function createSpellTableRow(spell) {
    const slotInfo = spellSlots.slots[spell.level];
    const canPrepare = !spell.isFocus && slotInfo && slotInfo.max > 0;
    
    let levelDisplay = '';
    let levelClass = '';
    if (spell.type === 'Фокус') {
        levelDisplay = 'Фокус';
        levelClass = 'focus';
    } else if (spell.level === 0) {
        levelDisplay = 'Заговор';
        levelClass = 'cantrip';
    } else {
        levelDisplay = `Ур. ${spell.level}`;
    }
    
    const traitsHtml = spell.traits && spell.traits.length > 0 ? 
        spell.traits.slice(0, 2).map(trait => 
            `<span class="spell-trait">${trait}</span>`
        ).join('') : '';
    
    const traditionsHtml = spell.traditions && spell.traditions.length > 0 ? 
        spell.traditions.map(trad => 
            `<span class="tradition-badge">${trad}</span>`
        ).join('') : '';
    
    return `
        <div class="spell-table-row ${spell.prepared ? 'prepared' : ''}" data-id="${spell.id}">
            <div class="name-cell">
                <div class="spell-name">${escapeHtml(spell.name)}</div>
                ${traitsHtml ? `<div class="spell-traits">${traitsHtml}</div>` : ''}
            </div>
            
            <div class="level-cell">
                <span class="spell-level-badge ${levelClass}">${levelDisplay}</span>
            </div>
            
            <div class="tradition-cell">
                ${traditionsHtml || '-'}
            </div>
            
            <div class="action-cell">
                ${spell.action || '-'}
            </div>
            
            <div class="prepared-cell">
                ${canPrepare ? `
                    <label class="prepared-toggle-compact">
                        <input type="checkbox" 
                               class="spell-prepared-checkbox" 
                               data-spell-id="${spell.id}"
                               ${spell.prepared ? 'checked' : ''}>
                        <span class="toggle-switch"></span>
                        <span class="toggle-label">${spell.prepared ? '✓' : ''}</span>
                    </label>
                ` : spell.isFocus ? '<span class="focus-spell-label">Фокус</span>' : '<span class="cant-prepare">-</span>'}
            </div>
            
            <div class="actions-cell">
                <button onclick="castSpell('${spell.id}')" 
                        class="btn-action btn-cast" 
                        ${!spell.prepared && !spell.isFocus ? 'disabled' : ''}>
                    ✨ Произнести
                </button>
                <button onclick="showSpellDetails('${spell.id}')" class="btn-action btn-info">
                    🔍
                </button>
                <button onclick="removeFromKnownSpells('${spell.id}')" class="btn-action btn-delete">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

function updateSpellCounters() {
    const totalSpells = spells.length;
    const preparedSpells = spells.filter(s => s.prepared).length;
    
    const totalElement = document.getElementById('totalSpellsCount');
    const preparedElement = document.getElementById('preparedSpellsCount');
    
    if (totalElement) totalElement.textContent = totalSpells;
    if (preparedElement) preparedElement.textContent = preparedSpells;
	  updateSlotsInfoDisplay();
}
function updateSlotsInfoDisplay() {
    // Вычисляем общее количество ячеек и использованных
    let totalSlots = 0;
    let usedSlots = 0;
    
    for (let level = 1; level <= 10; level++) {
        const slot = spellSlots.slots[level];
        if (slot) {
            totalSlots += slot.max || 0;
            usedSlots += slot.used || 0;
        }
    }
    
    // Обновляем элементы во вкладке "Изученные"
    const slotsInfoElement = document.getElementById('slotsInfo');
    const slotsProgressElement = document.getElementById('slotsProgress');
    
    if (slotsInfoElement) {
        if (totalSlots === 0) {
            slotsInfoElement.textContent = "Ячейки: не настроены";
        } else {
            slotsInfoElement.textContent = `Ячейки: ${usedSlots}/${totalSlots}`;
        }
    }
    
    if (slotsProgressElement) {
        if (totalSlots === 0) {
            slotsProgressElement.style.width = '0%';
            slotsProgressElement.style.backgroundColor = '#95a5a6';
        } else {
            const percentage = Math.round((usedSlots / totalSlots) * 100);
            slotsProgressElement.style.width = `${percentage}%`;
            
            // Цвет в зависимости от заполненности
            if (percentage > 80) {
                slotsProgressElement.style.backgroundColor = '#e74c3c';
            } else if (percentage > 50) {
                slotsProgressElement.style.backgroundColor = '#f39c12';
            } else {
                slotsProgressElement.style.backgroundColor = '#2ecc71';
            }
        }
    }
}
function setupTableEventListeners() {
    document.querySelectorAll('.spell-prepared-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            toggleSpellPrepared(this.dataset.spellId);
        });
    });
    
    setupKnownSpellsFilters();
}

function setupKnownSpellsFilters() {
    const filterInput = document.getElementById('filterKnownSpells');
    const filterLevel = document.getElementById('filterKnownLevel');
    const filterTradition = document.getElementById('filterKnownTradition');
    const filterPrepared = document.getElementById('filterKnownPrepared');
    
    if (!filterInput || !filterLevel || !filterTradition || !filterPrepared) return;
    
    // Заполняем список традиций
    const traditions = new Set();
    spells.forEach(spell => {
        if (spell.traditions) {
            spell.traditions.forEach(t => traditions.add(t));
        }
    });
    
    const traditionSelect = document.getElementById('filterKnownTradition');
    traditionSelect.innerHTML = '<option value="all">Все традиции</option>';
    Array.from(traditions).sort().forEach(tradition => {
        traditionSelect.innerHTML += `<option value="${tradition}">${tradition}</option>`;
    });
    
    // Функция фильтрации
    const applyFilters = () => {
        const searchTerm = filterInput.value.toLowerCase();
        const levelFilter = filterLevel.value;
        const traditionFilter = filterTradition.value;
        const preparedFilter = filterPrepared.value;
        
        document.querySelectorAll('#knownSpellsList .spell-card').forEach(card => {
            const spellId = card.dataset.id;
            const spell = spells.find(s => s.id === spellId);
            if (!spell) return;
            
            const spellName = spell.name.toLowerCase();
            const spellLevel = spell.level;
            const spellType = spell.type;
            const spellTraditions = spell.traditions || [];
            const isPrepared = spell.prepared;
            
            let visible = true;
            
            if (searchTerm && !spellName.includes(searchTerm)) {
                visible = false;
            }
            
            if (levelFilter !== 'all') {
                if (levelFilter === 'focus' && spellType !== 'Фокус') {
                    visible = false;
                } else if (levelFilter === '0' && !(spellType === 'Заклинание' && spellLevel === 0)) {
                    visible = false;
                } else if (levelFilter !== 'focus' && levelFilter !== '0' && spellLevel != levelFilter) {
                    visible = false;
                }
            }
            
            if (traditionFilter !== 'all' && !spellTraditions.includes(traditionFilter)) {
                visible = false;
            }
            
            if (preparedFilter !== 'all') {
                if (preparedFilter === 'prepared' && !isPrepared) {
                    visible = false;
                } else if (preparedFilter === 'not-prepared' && isPrepared) {
                    visible = false;
                }
            }
            
            card.style.display = visible ? 'block' : 'none';
        });
        
        const visibleCards = document.querySelectorAll('#knownSpellsList .spell-card[style*="display: block"]');
        if (visibleCards.length === 0 && spells.length > 0) {
            document.getElementById('knownSpellsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Заклинания не найдены</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                </div>
            `;
        }
    };
    
    filterInput.addEventListener('input', applyFilters);
    filterLevel.addEventListener('change', applyFilters);
    filterTradition.addEventListener('change', applyFilters);
    filterPrepared.addEventListener('change', applyFilters);
    
    applyFilters();
}

// === ЯЧЕЙКИ ЗАКЛИНАНИЙ ===

function castSpell(spellId) {
    const spell = spells.find(s => s.id === spellId);
    if (!spell) {
        showAlert('Заклинание не найдено в изученных');
        return;
    }
    
    if (!spell.prepared && !spell.isFocus) {
        showAlert('Это заклинание не подготовлено!');
        return;
    }
    
    if (!spell.isFocus && spell.level) {
        const slot = spellSlots.slots[spell.level];
        if (!slot || slot.used >= slot.max) {
            showAlert(`Нет доступных ячеек ${spell.level} уровня!`);
            return;
        }
        
        slot.used++;
        saveSpellSlots();
        updateSpellSlotsBadge();
        updateSlotTile(spell.level);
        updateSlotsSummary();
		updateSlotsInfoDisplay();

		
    }
    
    if (typeof TS !== 'undefined' && TS.dice) {
        TS.dice.putDiceInTray([{
            name: `Заклинание: ${spell.name}`,
            roll: `d20`
        }]);
    }
    
    showAlert(`Произносится: ${spell.name}`);
}

function bindSlotEvents() {
    document.querySelectorAll('.btn-slot-use').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tile = this.closest('.slot-tile');
            const level = parseInt(tile.querySelector('.level-number').textContent);
            useOneSlot(level);
        });
    });
    
    document.querySelectorAll('.btn-slot-rest').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tile = this.closest('.slot-tile');
            const level = parseInt(tile.querySelector('.level-number').textContent);
            restOneSlot(level);
        });
    });
    
    document.querySelectorAll('.btn-slot-config').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tile = this.closest('.slot-tile');
            const level = parseInt(tile.querySelector('.level-number').textContent);
            editSlotConfig(level);
        });
    });
    
    document.querySelectorAll('.slot-dot').forEach(dot => {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            const tile = this.closest('.slot-tile');
            const level = parseInt(tile.querySelector('.level-number').textContent);
            const index = parseInt(this.dataset.index);
            toggleSlotDot(level, index);
        });
    });
}

function renderSlotsConfig() {
    const container = document.getElementById('slotsGrid');
    if (!container) {
        console.error('Контейнер ячеек не найден');
        return;
    }
    
    container.innerHTML = '';
    
    const casterTypeSelect = document.getElementById('casterType');
    if (casterTypeSelect) {
        casterTypeSelect.value = spellSlots.casterType || 'spontaneous';
    }
    
    for (let level = 1; level <= 10; level++) {
        const slot = spellSlots.slots[level] || { max: 0, used: 0 };
        
        const tile = document.createElement('div');
        tile.className = 'slot-tile';
        tile.innerHTML = createSlotTile(level, slot);
        container.appendChild(tile);
    }
    
    const specialTiles = document.createElement('div');
    specialTiles.className = 'special-slots';
    specialTiles.innerHTML = `
        <div class="slot-tile special">
            <div class="slot-tile-header">
                <span class="slot-label">Фокус</span>
                <span class="slot-status">∞</span>
            </div>
            <div class="slot-description">Неограниченное использование</div>
        </div>
        <div class="slot-tile special">
            <div class="slot-tile-header">
                <span class="slot-label">Заговоры</span>
                <span class="slot-status">∞</span>
            </div>
            <div class="slot-description">Неограниченное использование</div>
        </div>
    `;
    
    container.appendChild(specialTiles);
    
    updateSlotsSummary();
    
    setTimeout(() => {
        bindSlotEvents();
    }, 100);
}

function createSlotTile(level, slot) {
    const percentage = slot.max > 0 ? Math.round((slot.used / slot.max) * 100) : 0;
    
    let statusClass = '';
    if (slot.max === 0) {
        statusClass = 'empty';
    } else if (slot.used === 0) {
        statusClass = 'full';
    } else if (slot.used === slot.max) {
        statusClass = 'depleted';
    } else {
        statusClass = 'partial';
    }
    
    return `
        <div class="slot-tile-header">
            <div class="slot-level-info">
                <span class="level-number">${level}</span>
                <span class="level-label">уровень</span>
            </div>
            <div class="slot-stats ${statusClass}">
                <span class="slot-count">${slot.used}/${slot.max}</span>
                ${slot.max > 0 ? `<span class="slot-percentage">${percentage}%</span>` : ''}
            </div>
        </div>
        
        <div class="slot-visual">
            <div class="slot-progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            
            <div class="slot-dots-container">
                ${slot.max > 0 ? createSlotDotsNew(level, slot) : '<div class="no-slots">Нет ячеек</div>'}
            </div>
        </div>
        
          <div class="slot-controls">
            <div class="slot-buttons">
                <button class="btn-slot-use" ${slot.used >= slot.max ? 'disabled' : ''}>
                    <span class="btn-icon">-</span>
                    <span>Использовать</span>
                </button>
                <button class="btn-slot-rest" ${slot.used <= 0 ? 'disabled' : ''}>
                    <span class="btn-icon">+</span>
                    <span>Восстановить</span>
                </button>
            </div>
            
            <div class="slot-config">
                <button class="btn-slot-config" onclick="editSlotConfig(${level})" title="Настроить">
                    <span class="btn-icon">⚙️</span>
                </button>
            </div>
        </div>
    `;
}

function createSlotDotsNew(level, slot) {
    const dots = [];
    for (let i = 0; i < slot.max; i++) {
        const isUsed = i < slot.used;
        dots.push(`
            <div class="slot-dot ${isUsed ? 'used' : 'available'}" 
                  data-index="${i}"
                  onclick="toggleSlotDot(${level}, ${i})">
                ${isUsed ? 'X' : 'V'}
            </div>
        `);
    }
    return `<div class="slot-dots">${dots.join('')}</div>`;
}

function toggleSlotDot(level, index) {
    if (!spellSlots.slots[level]) {
        spellSlots.slots[level] = { max: 0, used: 0 };
    }
    
    const slot = spellSlots.slots[level];
    
    if (index >= slot.max) {
        return;
    }
    
    if (index < slot.used) {
        slot.used--;
    } else {
        if (slot.used < slot.max) {
            slot.used++;
        }
    }
    
    updateSlotTile(level);
    saveSpellSlots();
    updateSpellSlotsBadge();
    updateSlotsSummary();
    
    showQuickMessage(`Ячейка ${level} уровня ${index < slot.used ? 'использована' : 'восстановлена'}`);
}

function useOneSlot(level) {
    if (!spellSlots.slots[level]) {
        spellSlots.slots[level] = { max: 0, used: 0 };
    }
 

    const slot = spellSlots.slots[level];
    
    if (slot.max === 0) {
        showAlert(`У вас нет ячеек ${level} уровня. Настройте ячейки сначала.`);
        return;
    }
    
    if (slot.used < slot.max) {
        slot.used++;
        updateSlotTile(level);
        saveSpellSlots();
        updateSpellSlotsBadge();
		   updateSlotsInfoDisplay();
        updateSlotsSummary();
        showQuickMessage(`Использована ячейка ${level} уровня`);
    } else {
        showAlert(`Все ячейки ${level} уровня уже использованы!`);
    }
}
function showQuickMessage(message) {
    // Удаляем существующие уведомления
    document.querySelectorAll('.quick-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'quick-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2s forwards;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2500);
}
function restOneSlot(level) {
    if (!spellSlots.slots[level]) {
        return;
    }
    
    const slot = spellSlots.slots[level];
    
    if (slot.used > 0) {
        slot.used--;
        updateSlotTile(level);
		updateSlotsInfoDisplay();
        saveSpellSlots();
        updateSpellSlotsBadge();
        updateSlotsSummary();
        showQuickMessage(`Восстановлена ячейка ${level} уровня`);
    } else {
        showAlert(`Нет использованных ячеек ${level} уровня`);
    }
}

function updateSlotTile(level) {
    const tiles = document.querySelectorAll('.slot-tile');
    const tile = Array.from(tiles).find(t => {
        const levelElement = t.querySelector('.level-number');
        return levelElement && parseInt(levelElement.textContent) === level;
    });
    
    if (!tile) {
        return;
    }
    
    const slot = spellSlots.slots[level] || { max: 0, used: 0 };
    const percentage = slot.max > 0 ? Math.round((slot.used / slot.max) * 100) : 0;
    
    const countElement = tile.querySelector('.slot-count');
    const percentageElement = tile.querySelector('.slot-percentage');
    const progressFill = tile.querySelector('.progress-fill');
    
    if (countElement) countElement.textContent = `${slot.used}/${slot.max}`;
    if (percentageElement) percentageElement.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    
    const dotsContainer = tile.querySelector('.slot-dots');
    if (dotsContainer && slot.max > 0) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < slot.max; i++) {
            const isUsed = i < slot.used;
            const dot = document.createElement('div');
            dot.className = `slot-dot ${isUsed ? 'used' : 'available'}`;
            dot.dataset.index = i;
            dot.textContent = isUsed ? 'X' : 'V';
            dot.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleSlotDot(level, i);
            });
            dotsContainer.appendChild(dot);
        }
    }
    
    const useBtn = tile.querySelector('.btn-slot-use');
    const restBtn = tile.querySelector('.btn-slot-rest');
    if (useBtn) useBtn.disabled = slot.used >= slot.max;
    if (restBtn) restBtn.disabled = slot.used <= 0;
    
    const statsElement = tile.querySelector('.slot-stats');
    if (statsElement) {
        statsElement.className = 'slot-stats';
        if (slot.max === 0) {
            statsElement.classList.add('empty');
        } else if (slot.used === 0) {
            statsElement.classList.add('full');
        } else if (slot.used === slot.max) {
            statsElement.classList.add('depleted');
        } else {
            statsElement.classList.add('partial');
        }
    }
}

function editSlotConfig(level) {
    console.log('editSlotConfig вызван для уровня:', level);
    
    const slot = spellSlots.slots[level] || { max: 0, used: 0 };
    
    // Проверяем, не открыто ли уже модальное окно
    if (document.querySelector('.slot-config-modal')) {
        console.log('Модальное окно уже открыто');
        return;
    }
    updateSlotsInfoDisplay();
    // Используем наше модальное окно вместо prompt
    showSlotConfigModal(level, slot.max);
}
function showSlotConfigModal(level, currentMax) {
    const modal = document.createElement('div');
    modal.className = 'modal slot-config-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Настройка ячеек ${level} уровня</h3>
                <button class="btn-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="slot-config-form">
                    <div class="form-group">
                        <label for="slotMaxInput">Максимальное количество ячеек:</label>
                        <div class="number-input-container">
                            <button type="button" class="number-btn minus" onclick="decrementSlotMax()">-</button>
                            <input type="number" id="slotMaxInput" min="0" max="20" value="${currentMax}" class="slot-max-input">
                            <button type="button" class="number-btn plus" onclick="incrementSlotMax()">+</button>
                        </div>
                        <div class="input-hint">От 0 до 20</div>
                    </div>
                    
                    <div class="slot-dots-preview">
                        <div class="preview-label">Предпросмотр:</div>
                        <div class="preview-dots" id="slotPreview">
                            ${createPreviewDots(currentMax)}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="applySlotConfig(${level})">Применить</button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Фокус на поле ввода
    setTimeout(() => {
        const input = modal.querySelector('#slotMaxInput');
        if (input) input.focus();
        input.select();
    }, 100);
    
    // Обновляем предпросмотр при изменении
    modal.querySelector('#slotMaxInput').addEventListener('input', function() {
        const value = parseInt(this.value) || 0;
        updateSlotPreview(value);
    });
}

function createPreviewDots(count) {
    const dots = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
        dots.push('<span class="preview-dot"></span>');
    }
    if (count > 10) {
        dots.push(`<span class="preview-more">+${count - 10}</span>`);
    }
    return dots.join('');
}

function updateSlotPreview(count) {
    const preview = document.getElementById('slotPreview');
    if (preview) {
        preview.innerHTML = createPreviewDots(count);
    }
}

function incrementSlotMax() {
    const input = document.getElementById('slotMaxInput');
    if (input) {
        let value = parseInt(input.value) || 0;
        if (value < 20) value++;
        input.value = value;
        updateSlotPreview(value);
        input.dispatchEvent(new Event('input'));
    }
}

function decrementSlotMax() {
    const input = document.getElementById('slotMaxInput');
    if (input) {
        let value = parseInt(input.value) || 0;
        if (value > 0) value--;
        input.value = value;
        updateSlotPreview(value);
        input.dispatchEvent(new Event('input'));
    }
}

function applySlotConfig(level) {
    const input = document.getElementById('slotMaxInput');
    const modal = document.querySelector('.slot-config-modal');
    
    if (!input || !modal) return;
    
    const max = parseInt(input.value) || 0;
    
    if (max < 0 || max > 20) {
        showAlert('Число должно быть от 0 до 20');
        return;
    }
    
    if (!spellSlots.slots[level]) {
        spellSlots.slots[level] = { max: 0, used: 0 };
    }
    
    const oldMax = spellSlots.slots[level].max;
    spellSlots.slots[level].max = max;
    
    if (spellSlots.slots[level].used > max) {
        spellSlots.slots[level].used = max;
    }
    
    updateSlotTile(level);
    saveSpellSlots();
    updateSpellSlotsBadge();
    updateSlotsSummary();
    
    modal.remove();
    
    if (max > oldMax) {
        showQuickMessage(`Добавлено ${max - oldMax} ячеек ${level} уровня`);
    } else if (max < oldMax) {
        showQuickMessage(`Убрано ${oldMax - max} ячеек ${level} уровня`);
    } else {
        showQuickMessage(`Ячейки ${level} уровня обновлены`);
    }
}

function updateSlotsSummary() {
    let totalSlots = 0;
    let usedSlots = 0;
    
    for (let level = 1; level <= 10; level++) {
        const slot = spellSlots.slots[level];
        if (slot) {
            totalSlots += slot.max || 0;
            usedSlots += slot.used || 0;
        }
    }
    
    const totalElement = document.getElementById('totalSlots');
    const usedElement = document.getElementById('usedSlots');
    const remainingElement = document.getElementById('remainingSlots');
    
    if (totalElement) totalElement.textContent = totalSlots;
    if (usedElement) usedElement.textContent = usedSlots;
    if (remainingElement) remainingElement.textContent = totalSlots - usedSlots;
}

function saveSlotsConfig() {
    try {
        const casterTypeSelect = document.getElementById('casterType');
        if (casterTypeSelect) {
            spellSlots.casterType = casterTypeSelect.value;
        }
        
        saveSpellSlots();
        updateSlotsSummary();
        updateSpellSlotsBadge();
        
        for (let level = 1; level <= 10; level++) {
            updateSlotTile(level);
        }
        
        showAlert('✅ Настройки ячеек сохранены!');
        
    } catch (error) {
        console.error('Ошибка сохранения конфигурации ячеек:', error);
        showAlert('❌ Ошибка сохранения настроек: ' + error.message);
    }
}

function restAllSlots() {
    console.log('restAllSlots вызвана');
	updateSlotsInfoDisplay();
    
    // Вместо confirm используем кастомное модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Восстановление ячеек заклинаний</h3>
                <button class="btn-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <p>Восстановить все ячейки заклинаний до максимума?</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="performRestAllSlots(this)">Да, восстановить</button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Новая функция для выполнения восстановления
function performRestAllSlots(button) {
    console.log('Выполняем восстановление всех ячеек');
    
    const modal = button.closest('.modal');
    let restored = 0;
    
    for (let level = 1; level <= 10; level++) {
        if (spellSlots.slots[level]) {
            const oldUsed = spellSlots.slots[level].used;
            spellSlots.slots[level].used = 0;
            restored += oldUsed;
            updateSlotTile(level);
        }
    }
    
    saveSpellSlots();
    updateSlotsSummary();
    updateSpellSlotsBadge();
    
    // Закрываем модальное окно
    if (modal) modal.remove();
    
    // Показываем уведомление
    const notification = document.createElement('div');
    notification.className = 'quick-notification';
    notification.textContent = `✨ Восстановлено ${restored} ячеек!`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2s forwards;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2500);
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function formatSpellAction(action) {
    if (!action) return '';
    
    let formatted = action;
    
    const actionReplacements = {
        '\\[one-action\\]': '>',
        '\\[two-actions\\]': '>>', 
        '\\[three-actions\\]': '>>>',
        '\\[reaction\\]': 'Реакция',
        '\\[free-action\\]': 'Свободное действие',
        ';': ' '
    };
    
    Object.keys(actionReplacements).forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        formatted = formatted.replace(regex, actionReplacements[pattern]);
    });
    
    return formatted.trim();
}

function getShortTraditionName(fullName) {
    const name = fullName.toLowerCase();
    if (name.includes('мистич')) return 'МИСТ';
    if (name.includes('сакральн')) return 'САКР';
    if (name.includes('первобыт')) return 'ПЕРВ';
    if (name.includes('оккульт')) return 'ОККУ';
    return fullName.substring(0, 4);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message) {
    alert(message);
}

function showSpellDetails(spellId) {
    const spell = allSpells.find(s => s.id === spellId) || spells.find(s => s.id === spellId);
    if (!spell) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal spell-details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${escapeHtml(spell.name)}</h3>
                <button class="btn-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="spell-detail-section">
                    <h4>Основная информация</h4>
                    ${createDetailRow('Уровень', spell.type === 'Фокус' ? 'Фокус' : spell.level)}
                    ${createDetailRow('Тип', spell.type)}
                    ${spell.traits && spell.traits.length > 0 ? createDetailRow('Дескрипторы', spell.traits.join(', ')) : ''}
                    ${spell.traditions && spell.traditions.length > 0 ? createDetailRow('Традиции', spell.traditions.join(', ')) : ''}
                </div>
                
                <div class="spell-detail-section">
                    <h4>Характеристики</h4>
                    ${createDetailRow('Действия', spell.action)}
                    ${createDetailRow('Дистанция', spell.range)}
                    ${createDetailRow('Область', spell.area)}
                    ${createDetailRow('Цель', spell.target)}
                    ${createDetailRow('Длительность', spell.duration)}
                    ${createDetailRow('Спасбросок', spell.savingThrow)}
                </div>
                
                <div class="spell-detail-section">
                    <h4>Описание</h4>
                    <div class="spell-description-full">
                        ${spell.description || 'Нет описания'}
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                ${!spells.find(s => s.id === spell.id) ? `
                    <button onclick="addToKnownSpells('${spell.id}')" class="btn btn-primary">
                        Изучить
                    </button>
                ` : ''}
                <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">
                    Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function createDetailRow(label, value) {
    if (!value || (Array.isArray(value) && value.length === 0)) return '';
    
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return `
        <div class="spell-detail-row">
            <span class="label">${label}:</span>
            <span class="value">${escapeHtml(displayValue)}</span>
        </div>
    `;
}

function createFallbackSpells() {
    allSpells = [
        {
            id: 'test_spell_1',
            name: 'Тестовое Заклинание',
            level: 1,
            type: 'Заклинание',
            traditions: ['Мистическая'],
            action: '[two-actions]',
            description: 'Тестовое заклинание для демонстрации работы системы.'
        }
    ];
    console.log('Используем тестовые заклинания');
    renderSpellLibraryPage(1);
}

// === СИСТЕМА ХРАНЕНИЯ ===

function loadSpells() {
    try {
        const saved = localStorage.getItem('pf2eSpells');
        spells = saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Ошибка загрузки изученных заклинаний:', error);
        spells = [];
    }
}

function saveSpells() {
    try {
        localStorage.setItem('pf2eSpells', JSON.stringify(spells));
    } catch (error) {
        console.error('Ошибка сохранения изученных заклинаний:', error);
    }
}

function loadSpellSlots() {
    try {
        const saved = localStorage.getItem('pf2eSpellSlots');
        if (saved) {
            spellSlots = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Ошибка загрузки ячеек заклинаний:', error);
    }
}

function saveSpellSlots() {
    try {
        localStorage.setItem('pf2eSpellSlots', JSON.stringify(spellSlots));
    } catch (error) {
        console.error('Ошибка сохранения ячеек заклинаний:', error);
    }
}

function saveCurrentSpellSlots() {
    try {
        for (let level = 1; level <= 10; level++) {
            const maxInput = document.querySelector(`.slot-max[data-level="${level}"]`);
            const usedInput = document.querySelector(`.slot-used[data-level="${level}"]`);
            
            if (maxInput && usedInput) {
                if (!spellSlots.slots[level]) {
                    spellSlots.slots[level] = { max: 0, used: 0 };
                }
                spellSlots.slots[level].max = parseInt(maxInput.value) || 0;
                spellSlots.slots[level].used = parseInt(usedInput.value) || 0;
            }
        }
        
        const casterTypeSelect = document.getElementById('casterType');
        if (casterTypeSelect) {
            spellSlots.casterType = casterTypeSelect.value;
        }
        
        saveSpellSlots();
    } catch (error) {
        console.error('Ошибка сохранения текущих настроек ячеек:', error);
    }
}

function saveCurrentKnownSpells() {
    try {
        saveSpells();
    } catch (error) {
        console.error('Ошибка сохранения изученных заклинаний:', error);
    }
}

// === АВТОСОХРАНЕНИЕ ===

function setupSpellsAutoSave() {
    const casterTypeSelect = document.getElementById('casterType');
    if (casterTypeSelect) {
        casterTypeSelect.addEventListener('change', function() {
            saveCurrentSpellSlots();
            if (window.saveCharacter) window.saveCharacter();
        });
    }
    
    document.querySelectorAll('.slot-max, .slot-used').forEach(input => {
        input.addEventListener('change', function() {
            saveCurrentSpellSlots();
            if (window.saveCharacter) window.saveCharacter();
        });
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.matches('.spell-prepared-checkbox, .btn-add, .btn-delete')) {
            setTimeout(() => {
                saveCurrentKnownSpells();
                if (window.saveCharacter) window.saveCharacter();
            }, 100);
        }
    });
}

// ===== ФУНКЦИИ ДЛЯ ПОДВКЛАДОК =====
function performSubtabActions(tabId) {
    console.log('Выполняем действия для подвкладки:', tabId);
    
    switch(tabId) {
        case 'library-subtab':
            if (!libraryLoaded && typeof loadAllSpells === 'function') {
                loadAllSpells();
            } else if (libraryLoaded && typeof renderSpellLibraryPage === 'function') {
                renderSpellLibraryPage(1);
            }
            break;
            
        case 'known-subtab':
            if (typeof renderKnownSpells === 'function') {
                requestAnimationFrame(() => {
                    renderKnownSpells();
                });
            }
            break;
            
        case 'slots-subtab':
            if (typeof renderSlotsConfig === 'function') {
                requestAnimationFrame(() => {
                    renderSlotsConfig();
                });
            }
            if (typeof updateSlotsSummary === 'function') {
                requestAnimationFrame(() => {
                    updateSlotsSummary();
                });
            }
            break;
    }
}

function initSpells() {
    console.log('Инициализация системы заклинаний...');
    
    loadSpells();
    loadSpellSlots();
    
    setTimeout(() => {
        if (typeof initSpellsSubtabs === 'function') {
            initSpellsSubtabs();
        } else {
            console.error('❌ Функция initSpellsSubtabs не найдена');
        }
        
        if (typeof loadAllSpells === 'function') {
            loadAllSpells();
        }
        
        if (typeof updateSpellBadges === 'function') {
            updateSpellBadges();
        }
        
        if (typeof renderKnownSpells === 'function') {
            renderKnownSpells();
        }
        
        if (typeof renderSlotsConfig === 'function') {
            renderSlotsConfig();
        }
        
        if (typeof setupSpellsAutoSave === 'function') {
            setupSpellsAutoSave();
        }
        
        console.log('✅ Система заклинаний инициализирована');
    }, 500);
}

// ===== ЭКСПОРТ ФУНКЦИЙ =====
window.spells = spells;
window.spellSlots = spellSlots;
window.allSpells = allSpells;
window.initSpells = initSpells;
window.loadSpells = loadSpells;
window.saveSpells = saveSpells;
window.loadSpellSlots = loadSpellSlots;
window.saveSpellSlots = saveSpellSlots;
window.filterByLevel = filterByLevel;
window.performRestAllSlots = performRestAllSlots;

window.filterByTradition = filterByTradition;
window.searchSpells = searchSpells;
window.castSpell = castSpell;
window.updateSpellSlotsBadge = updateSpellSlotsBadge;
window.renderSlotsConfig = renderSlotsConfig;
window.updateSlotsSummary = updateSlotsSummary;
window.saveSlotsConfig = saveSlotsConfig;
window.createSpellCard = createSpellCard;
window.createSlotTile = createSlotTile;
window.toggleSlotDot = toggleSlotDot;
window.useOneSlot = useOneSlot;
window.restOneSlot = restOneSlot;
window.editSlotConfig = editSlotConfig;
window.useSlot = useOneSlot;
window.freeSlot = restOneSlot;
window.showQuickMessage = showQuickMessage;
window.bindSlotEvents = bindSlotEvents;
window.updateSlotTile = updateSlotTile;
window.restAllSlots = restAllSlots;
// В конце spell.js добавьте:
window.updateSlotsInfoDisplay = updateSlotsInfoDisplay;
window.renderKnownSpells = renderKnownSpells;
window.performSubtabActions = performSubtabActions;
window.switchToSubtab = switchToSubtab;
window.showSpellDetails = showSpellDetails;
window.addToKnownSpells = addToKnownSpells;
window.removeFromKnownSpells = removeFromKnownSpells;
window.toggleSpellPrepared = toggleSpellPrepared;
// В конце spell.js добавьте:
window.showSlotConfigModal = showSlotConfigModal;
window.applySlotConfig = applySlotConfig;
window.incrementSlotMax = incrementSlotMax;
window.decrementSlotMax = decrementSlotMax;
window.saveCurrentSpellSlots = saveCurrentSpellSlots;
window.saveCurrentKnownSpells = saveCurrentKnownSpells;
window.setupSpellsAutoSave = setupSpellsAutoSave;
window.toggleSubtab = toggleSubtab;
window.initSpellsSubtabs = initSpellsSubtabs;
window.renderSpellLibraryPage = renderSpellLibraryPage;

console.log('spell.js версия 2.0 загружен успешно');