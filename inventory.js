// ===== ФАЙЛ: inventory.js =====
// Версия 2.1 - Исправленные ошибки и полная функциональность

window.inventory = [];
window.editingItemId = null;
window.expandedItems = new Set();

// Инициализация инвентаря
function initInventory() {
    console.log('🔄 Инициализация инвентаря...');
    loadInventory();
    renderInventory();
    setupInventoryEventListeners();
    updateBulkDisplay();
    
    // Обновляем массу при изменении силы
    const strInput = document.getElementById('strScore');
    if (strInput) {
        strInput.addEventListener('input', updateBulkDisplay);
    }
    
    console.log('✅ Инициализация инвентаря завершена');
}

// Загрузка инвентаря
function loadInventory() {
    try {
        const saved = localStorage.getItem('pf2eInventory');
        if (saved) {
            window.inventory = JSON.parse(saved);
            console.log('🎒 Загружен инвентарь:', window.inventory.length, 'предметов');
        } else {
            window.inventory = [];
        }
    } catch (error) {
        console.error('Ошибка загрузки инвентаря:', error);
        window.inventory = [];
    }
}

// Сохранение инвентаря
function saveInventory() {
    try {
        localStorage.setItem('pf2eInventory', JSON.stringify(window.inventory));
        
        // Интеграция с общей системой сохранения
        if (window.saveCharacter) {
            window.saveCharacter();
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения инвентаря:', error);
    }
}

// ===== УПРАВЛЕНИЕ ФОРМОЙ =====
// ===== УПРАВЛЕНИЕ ФОРМОЙ =====
function toggleItemForm(forceShow = false) {
    console.log('📝 Переключение формы...');
    const form = document.getElementById('addItemForm');
    if (!form) {
        console.error('❌ Форма не найдена');
        return;
    }
    
    const isFormVisible = form.style.display === 'block';
    
    if (forceShow) {
        // Принудительно показать форму
        form.style.display = 'block';
        console.log('✅ Форма принудительно показана');
    } else if (isFormVisible) {
        // Форма видна - скрываем и сбрасываем редактирование
        form.style.display = 'none';
        console.log('✅ Форма скрыта');
        
        // Только при скрытии формы сбрасываем редактирование
        if (window.editingItemId) {
            cancelEdit();
        } else {
            clearItemForm();
        }
    } else {
        // Форма не видна - показываем
        form.style.display = 'block';
        console.log('✅ Форма показана');
        
        // Сбрасываем состояние редактирования при открытии формы
        if (window.editingItemId) {
            cancelEdit();
        }
    }
}

function editItem(itemId) {
    console.log('✏️ Редактирование предмета:', itemId);
    const item = window.inventory.find(item => item.id === itemId);
    if (!item) {
        console.error('❌ Предмет не найден');
        return;
    }
    
    window.editingItemId = itemId;
    
    // Заполняем форму
    document.getElementById('editItemId').value = itemId;
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemCategory').value = item.category || 'other';
    document.getElementById('itemBulk').value = item.bulk || '1';
    document.getElementById('itemQuantity').value = item.quantity || 1;
    document.getElementById('itemLocation').value = item.location || 'backpack';
    document.getElementById('itemDescription').value = item.description || '';
    
    // Обновляем UI формы
    document.getElementById('formTitle').textContent = '✏️ Редактировать предмет';
    document.getElementById('saveItemBtn').textContent = 'Сохранить изменения';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    document.getElementById('cancelEditMainBtn').style.display = 'inline-block';
    
    // Показываем форму, если скрыта
    if (document.getElementById('addItemForm').style.display !== 'block') {
        document.getElementById('addItemForm').style.display = 'block';
    }
    
    // Разворачиваем редактируемую карточку
    const card = document.querySelector(`.item-card[data-id="${itemId}"]`);
    if (card) {
        card.classList.add('expanded');
        const btn = card.querySelector('.item-expand-btn');
        if (btn) btn.textContent = '▲';
        window.expandedItems.add(itemId);
    }
    
    console.log('✅ Режим редактирования активирован');
}

function cancelEdit() {
    console.log('↶ Отмена редактирования');
    window.editingItemId = null;
    
    // Восстанавливаем UI формы
    document.getElementById('formTitle').textContent = '➕ Добавить предмет';
    document.getElementById('saveItemBtn').textContent = 'Добавить';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('cancelEditMainBtn').style.display = 'none';
    
    // Очищаем форму, но НЕ скрываем её
    clearItemForm();
    
    // Убираем подсветку карточек
    document.querySelectorAll('.item-card').forEach(card => {
        card.classList.remove('editing');
    });
    
    console.log('✅ Режим редактирования отменен');
}

function clearItemForm() {
    document.getElementById('editItemId').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemCategory').value = 'weapon';
    document.getElementById('itemBulk').value = '1';
    document.getElementById('itemQuantity').value = '1';
    document.getElementById('itemLocation').value = 'backpack';
    document.getElementById('itemDescription').value = '';
}

function saveItem() {
    const itemId = document.getElementById('editItemId').value;
    const name = document.getElementById('itemName')?.value.trim();
    const category = document.getElementById('itemCategory')?.value;
    const bulk = document.getElementById('itemBulk')?.value;
    const quantity = parseInt(document.getElementById('itemQuantity')?.value) || 1;
    const location = document.getElementById('itemLocation')?.value;
    const description = document.getElementById('itemDescription')?.value.trim();
    
    if (!name) {
        if (window.showAlert) {
            window.showAlert('Введите название предмета');
        } else {
            alert('Введите название предмета');
        }
        return;
    }
    
    if (itemId && window.editingItemId) {
        updateExistingItem(itemId, {
            name,
            category,
            bulk,
            quantity,
            location,
            description,
            updatedAt: new Date().toISOString()
        });
    } else {
        addNewItem({
            name,
            category,
            bulk,
            quantity,
            location,
            description
        });
    }
    
    // Скрываем форму после сохранения
    document.getElementById('addItemForm').style.display = 'none';
}

// ===== ОСНОВНЫЕ ОПЕРАЦИИ С ПРЕДМЕТАМИ =====
function addNewItem(itemData) {
    const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...itemData,
        createdAt: new Date().toISOString()
    };
    
    window.inventory.push(newItem);
    saveInventory();
    renderInventory();
    updateBulkDisplay();
    clearItemForm();
    
    showQuickMessage(`✅ Предмет "${itemData.name}" добавлен!`);
    console.log('✅ Добавлен новый предмет:', itemData.name);
}

function updateExistingItem(itemId, updates) {
    const itemIndex = window.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        const originalItem = window.inventory[itemIndex];
        window.inventory[itemIndex] = {
            ...originalItem,
            ...updates
        };
        
        saveInventory();
        renderInventory();
        updateBulkDisplay();
        cancelEdit();
        
        // Скрываем форму после сохранения
        document.getElementById('addItemForm').style.display = 'none';
        
        showQuickMessage(`✅ Предмет "${updates.name}" обновлён!`);
        console.log('✅ Предмет обновлен:', updates.name);
    }
}
function deleteItem(itemId) {
    const itemToDelete = window.inventory.find(item => item.id === itemId);
    
    if (!itemToDelete) {
        console.error('❌ Предмет для удаления не найден');
        return;
    }
    
    // Используем модальное окно подтверждения
    if (window.showConfirm) {
        window.showConfirm(
            `Удалить предмет "${itemToDelete.name}"?`,
            function() {
                performDelete(itemId, itemToDelete.name);
            }
        );
    } else {
        if (confirm(`Удалить предмет "${itemToDelete.name}"?`)) {
            performDelete(itemId, itemToDelete.name);
        }
    }
}

function performDelete(itemId, itemName) {
    const index = window.inventory.findIndex(item => item.id === itemId);
    if (index !== -1) {
        window.inventory.splice(index, 1);
    }
    
    // Удаляем из списка развернутых
    window.expandedItems.delete(itemId);
    
    saveInventory();
    renderInventory();
    updateBulkDisplay();
    
    if (window.editingItemId === itemId) {
        cancelEdit();
    }
    
    showQuickMessage(`🗑️ Предмет "${itemName}" удалён!`);
    console.log('🗑️ Удален предмет:', itemName);
}

function updateItemQuantity(itemId, delta) {
    const item = window.inventory.find(item => item.id === itemId);
    if (!item) {
        console.error('❌ Предмет для изменения количества не найден');
        return;
    }
    
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) {
        deleteItem(itemId);
    } else {
        item.quantity = newQuantity;
        saveInventory();
        renderInventory();
        updateBulkDisplay();
        showQuickMessage(`📦 ${item.name}: ${newQuantity} шт.`);
        console.log('📦 Изменено количество:', item.name, newQuantity);
    }
}

// ===== РЕНДЕРИНГ ИНТЕРФЕЙСА =====
function renderInventory() {
    console.log('🔄 Рендеринг инвентаря...');
    
    const wornContainer = document.getElementById('wornItems');
    const backpackContainer = document.getElementById('backpackItems');
    const otherContainer = document.getElementById('otherItems');
    
    if (!wornContainer || !backpackContainer || !otherContainer) {
        console.error('❌ Контейнеры для инвентаря не найдены');
        return;
    }
    
    // Группируем предметы
    const wornItems = window.inventory.filter(item => item.location === 'worn');
    const backpackItems = window.inventory.filter(item => item.location === 'backpack');
    const otherItems = window.inventory.filter(item => !['worn', 'backpack'].includes(item.location));
    
    // Обновляем счетчики
    updateItemCount('wornCount', wornItems.length);
    updateItemCount('backpackCount', backpackItems.length);
    updateItemCount('otherCount', otherItems.length);
    
    // Рендерим карточки
    wornContainer.innerHTML = wornItems.length > 0 ? 
        wornItems.map(item => createItemCard(item)).join('') : 
        createEmptyState('🛡️', 'Нет надетых предметов');
    
    backpackContainer.innerHTML = backpackItems.length > 0 ? 
        backpackItems.map(item => createItemCard(item)).join('') : 
        createEmptyState('🎒', 'Рюкзак пуст');
    
    otherContainer.innerHTML = otherItems.length > 0 ? 
        otherItems.map(item => createItemCard(item)).join('') : 
        createEmptyState('💎', 'Нет других предметов');
    
    // Добавляем обработчики
    setupExpandHandlers();
    
    console.log('✅ Рендеринг завершен');
}

function createItemCard(item) {
    const isEditing = window.editingItemId === item.id;
    const isExpanded = window.expandedItems.has(item.id);
    const escapedId = escapeHtml(item.id).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const categoryIcon = getCategoryIcon(item.category);
    const locationIcon = getLocationIcon(item.location);
    
    return `
        <div class="item-card ${isEditing ? 'editing' : ''} ${isExpanded ? 'expanded' : ''}" 
             data-id="${escapeHtml(item.id)}">
            
            ${isEditing ? '<div class="editing-indicator">✏️</div>' : ''}
            
            <div class="item-header">
                <div class="item-name">
                    <span class="item-category-icon">${categoryIcon}</span>
                    <span class="item-name-text">${escapeHtml(item.name)}</span>
                    ${item.quantity > 1 ? `<span class="item-quantity-badge">×${item.quantity}</span>` : ''}
                </div>
                <button class="item-expand-btn" onclick="toggleExpandItem('${escapedId}', event)">
                    ${isExpanded ? '▲' : '▼'}
                </button>
            </div>
            
            <div class="item-meta-compact">
                <div class="meta-item" title="Масса">
                    <span class="meta-icon">⚖️</span>
                    <span class="meta-value bulk-${item.bulk === 'L' ? 'light' : 'normal'}">
                        ${item.bulk}
                    </span>
                </div>
                <div class="meta-item" title="Категория">
                    <span class="meta-icon">🏷️</span>
                    <span class="meta-value">${getCategoryName(item.category)}</span>
                </div>
                <div class="meta-item" title="Расположение">
                    <span class="meta-icon">${locationIcon}</span>
                    <span class="meta-value">${getLocationName(item.location)}</span>
                </div>
            </div>
            
            <div class="item-body">
                ${item.description ? `
                    <div class="item-description">
                        <div class="description-label">📝 Описание:</div>
                        <div class="description-text">${escapeHtml(item.description)}</div>
                    </div>
                ` : ''}
                
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button onclick="updateItemQuantity('${escapedId}', -1)" 
                                class="btn-quantity minus" title="Уменьшить количество">
                            −
                        </button>
                        <span class="quantity-display">${item.quantity} шт.</span>
                        <button onclick="updateItemQuantity('${escapedId}', 1)" 
                                class="btn-quantity plus" title="Увеличить количество">
                            +
                        </button>
                    </div>
                    
                    <div class="action-buttons">
                        <button onclick="editItem('${escapedId}')" 
                                class="btn-action edit" title="Редактировать">
                            ✏️
                        </button>
                        <button onclick="deleteItem('${escapedId}')" 
                                class="btn-action delete" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleExpandItem(itemId, event) {
    if (event) event.stopPropagation();
    
    const card = document.querySelector(`.item-card[data-id="${itemId}"]`);
    if (!card) return;
    
    const isExpanded = card.classList.contains('expanded');
    
    if (isExpanded) {
        card.classList.remove('expanded');
        window.expandedItems.delete(itemId);
    } else {
        card.classList.add('expanded');
        window.expandedItems.add(itemId);
    }
    
    // Обновляем иконку кнопки
    const btn = card.querySelector('.item-expand-btn');
    if (btn) {
        btn.textContent = isExpanded ? '▼' : '▲';
    }
}

function setupExpandHandlers() {
    // Разворачивание по клику на заголовок карточки
    document.querySelectorAll('.item-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (!e.target.closest('.item-expand-btn') && 
                !e.target.closest('.btn-action') &&
                !e.target.closest('.btn-quantity')) {
                const card = this.closest('.item-card');
                if (card) {
                    const itemId = card.dataset.id;
                    toggleExpandItem(itemId, e);
                }
            }
        });
    });
}

// ===== РАСЧЕТ МАССЫ И ПЕРЕНАШИВАНИЯ =====
function calculateCarryCapacity() {
    const strScore = parseInt(document.getElementById('strScore')?.value) || 10;
    const strMod = Math.floor((strScore - 10) / 2);
    return Math.max(5 + strMod, 1); // Минимум 1
}

function calculateTotalBulk() {
    let total = 0;
    
    if (!window.inventory || !Array.isArray(window.inventory)) {
        return 0;
    }
    
    window.inventory.forEach(item => {
        let itemBulk = 0;
        
        if (item.bulk === 'L') {
            // Легкие предметы: 10 штук = 1 Bulk
            if (item.quantity >= 10) {
                itemBulk = Math.floor(item.quantity / 10);
            }
        } else {
            itemBulk = parseFloat(item.bulk) || 0;
            itemBulk *= item.quantity;
        }
        
        total += itemBulk;
    });
    
    return Math.round(total * 10) / 10;
}

function updateBulkDisplay() {
    const currentBulk = calculateTotalBulk();
    const maxBulk = calculateCarryCapacity();
    const status = getBulkStatus(currentBulk, maxBulk);
    
    // Обновляем прогресс-бар
    const percentage = Math.min((currentBulk / maxBulk) * 100, 100);
    const bulkBar = document.getElementById('bulkBar');
    const bulkText = document.getElementById('bulkText');
    const bulkStatus = document.getElementById('bulkStatus');
    
    if (bulkBar) {
        bulkBar.style.width = `${percentage}%`;
        // Меняем цвет в зависимости от статуса
        if (status === 'normal') {
            bulkBar.style.background = '#2ecc71';
        } else if (status === 'encumbered') {
            bulkBar.style.background = '#f39c12';
        } else {
            bulkBar.style.background = '#e74c3c';
        }
    }
    
    if (bulkText) {
        bulkText.textContent = `${currentBulk.toFixed(1)}/${maxBulk}`;
    }
    
    if (bulkStatus) {
        bulkStatus.textContent = getStatusText(status);
        bulkStatus.setAttribute('data-status', status);
        
        // Меняем цвет статуса
        if (status === 'normal') {
            bulkStatus.style.background = '#2ecc71';
        } else if (status === 'encumbered') {
            bulkStatus.style.background = '#f39c12';
        } else {
            bulkStatus.style.background = '#e74c3c';
        }
    }
    
    console.log('⚖️ Обновлена масса:', currentBulk, '/', maxBulk, status);
}

function getBulkStatus(current, max) {
    if (current <= max) return 'normal';
    if (current <= max + 5) return 'encumbered';
    return 'overloaded';
}

function getStatusText(status) {
    const texts = {
        'normal': '✅ В норме',
        'encumbered': '⚠️ Обременён',
        'overloaded': '❌ Перегружен'
    };
    return texts[status] || '❓ Неизвестно';
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function getCategoryIcon(category) {
    const icons = {
        'weapon': '⚔️',
        'armor': '🛡️',
        'wearable': '👕',
        'consumable': '🧪',
        'tool': '🔧',
        'treasure': '💎',
        'other': '📦'
    };
    return icons[category] || '📦';
}

function getCategoryName(category) {
    const names = {
        'weapon': 'Оружие',
        'armor': 'Доспехи',
        'wearable': 'Носимое',
        'consumable': 'Расходник',
        'tool': 'Инструмент',
        'treasure': 'Сокровище',
        'other': 'Прочее'
    };
    return names[category] || category;
}

function getLocationIcon(location) {
    const icons = {
        'backpack': '🎒',
        'worn': '👤',
        'hand': '🤲',
        'stored': '📦'
    };
    return icons[location] || '📦';
}

function getLocationName(location) {
    const names = {
        'backpack': 'Рюкзак',
        'worn': 'Надето',
        'hand': 'В руке',
        'stored': 'Хранится'
    };
    return names[location] || location;
}

function createEmptyState(icon, text) {
    return `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <div class="empty-text">${text}</div>
        </div>
    `;
}

function updateItemCount(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = count;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showQuickMessage(message) {
    if (window.showAlert) {
        window.showAlert(message);
    } else if (window.showAlert) {
        window.showAlert(message);
    } else {
        console.log('💬', message);
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function setupInventoryEventListeners() {
    console.log('🔧 Настройка обработчиков инвентаря...');
    
    // Автосохранение при изменениях
    const saveTimeoutHandler = function() {
        if (window.isInitializing) return;
        clearTimeout(window.inventorySaveTimeout);
        window.inventorySaveTimeout = setTimeout(() => {
            saveInventory();
        }, 1000);
    };
    
    // Создаем кастомное событие для изменений в инвентаре
    document.addEventListener('inventoryChanged', saveTimeoutHandler);
    
    // Закрытие формы по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && window.editingItemId) {
            cancelEdit();
        }
    });
    
    // Обновление массы при изменении силы
    const strScoreInput = document.getElementById('strScore');
    if (strScoreInput) {
        strScoreInput.addEventListener('change', updateBulkDisplay);
        strScoreInput.addEventListener('input', updateBulkDisplay);
    }
    
    // Назначаем обработчик для кнопки добавления (на всякий случай)
    const toggleBtn = document.getElementById('toggleFormBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleItemForm();
        });
    }
    
    // Назначаем обработчик для кнопки закрытия формы
    const closeFormBtn = document.querySelector('#addItemForm .btn-close-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleItemForm();
        });
    }
    
    console.log('✅ Обработчики настроены');
}

// ===== ГЛОБАЛЬНЫЙ ЭКСПОРТ =====
window.initInventory = initInventory;
window.loadInventory = loadInventory;
window.saveInventory = saveInventory;
window.toggleItemForm = toggleItemForm;
window.editItem = editItem;
window.cancelEdit = cancelEdit;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.updateItemQuantity = updateItemQuantity;
window.renderInventory = renderInventory;
window.updateBulkDisplay = updateBulkDisplay;
window.calculateTotalBulk = calculateTotalBulk;
window.calculateCarryCapacity = calculateCarryCapacity;
window.toggleExpandItem = toggleExpandItem;

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📦 Модуль инвентаря загружен');
        // Инициализация будет вызвана из main.js
    });
} else {
    console.log('📦 Модуль инвентаря загружен (DOM уже загружен)');
}