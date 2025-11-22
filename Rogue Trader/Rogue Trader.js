// Rogue Trader Character Sheet JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeSheet();
});

function initializeSheet() {
    // Load saved data first
    loadSavedData();
    
    // Auto-calculate movement values
    setupMovementCalculations();
    
    // Auto-calculate carry capacity
    setupCarryCapacityCalculations();
    
    // Setup bonus-value auto-tab functionality
    setupBonusAutoTab();
    
    // Auto-save functionality
    setupAutoSave();
}

// Reset all form fields
function resetForm() {
    if (confirm('Are you sure you want to reset all fields? This cannot be undone.')) {
        const form = document.querySelector('.character-sheet');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type === 'number') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });

        // Clear localStorage
        localStorage.removeItem('rogueTraderCharacterSheet');
        
        console.log('Form reset complete');
    }
}

// Setup automatic movement calculations
function setupMovementCalculations() {
    const agBonus = document.getElementById('ag-bonus');
    const strBonus = document.getElementById('str-bonus');
    
    // Movement fields
    const movementFields = ['move-half', 'move-full', 'move-charge', 'move-run', 'jump-base'];

    if (agBonus) {
        agBonus.addEventListener('input', calculateMovement);
    }
    
    if (strBonus) {
        strBonus.addEventListener('input', calculateMovement);
    }
    
    // Track manual edits to movement fields
    movementFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Mark as manually edited
                this.dataset.manualEdit = 'true';
            });
            
            // If field is cleared, remove manual edit flag
            field.addEventListener('blur', function() {
                if (this.value === '') {
                    delete this.dataset.manualEdit;
                    calculateMovement(); // Recalculate when cleared
                }
            });
        }
    });
}

function calculateMovement() {
    const agBonus = parseInt(document.getElementById('ag-bonus')?.value) || 0;
    const strBonus = parseInt(document.getElementById('str-bonus')?.value) || 0;

    // Calculate movement values based on AB
    const halfMove = agBonus;
    const fullMove = agBonus * 2;
    const charge = agBonus * 3;
    const run = agBonus * 6;
    const baseJump = strBonus * 20; // in cm

    // Update fields (will respect manual edits via updateField logic)
    updateField('move-half', halfMove);
    updateField('move-full', fullMove);
    updateField('move-charge', charge);
    updateField('move-run', run);
    updateField('jump-base', baseJump);
}

// Setup carry capacity calculations
function setupCarryCapacityCalculations() {
    const strBonus = document.getElementById('str-bonus');
    const toughBonus = document.getElementById('tough-bonus');

    if (strBonus && toughBonus) {
        strBonus.addEventListener('input', calculateCarryCapacity);
        toughBonus.addEventListener('input', calculateCarryCapacity);
    }
}

function calculateCarryCapacity() {
    const strBonus = parseInt(document.getElementById('str-bonus')?.value) || 0;
    const toughBonus = parseInt(document.getElementById('tough-bonus')?.value) || 0;
    
    // Calculate: Carry (kg) ≈ 6 × (SB + TB)^1.6
    const sum = strBonus + toughBonus;
    const carry = sum > 0 ? Math.round(6 * Math.pow(sum, 1.6)) : 0;
    
    updateField('carry-capacity', carry);
}

// Setup auto-tab from bonus-value to ones-value
function setupBonusAutoTab() {
    const bonusInputs = document.querySelectorAll('.bonus-value');
    
    bonusInputs.forEach(bonusInput => {
        bonusInput.addEventListener('input', function(e) {
            // Check if there's at least one digit
            if (this.value.length >= 1) {
                // Find the next ones-value sibling
                const onesInput = this.nextElementSibling;
                if (onesInput && onesInput.classList.contains('ones-value')) {
                    onesInput.focus();
                }
            }
        });
    });
}

function updateField(id, value) {
    const field = document.getElementById(id);
    if (field) {
        // Only update if the field is empty or if it matches the calculated value
        // This allows manual overrides to persist
        const currentValue = parseInt(field.value) || 0;
        const calculatedValue = value > 0 ? value : 0;
        
        // Update field without overwriting manual edits
        if (field.value === '' || !field.dataset.manualEdit) {
            field.value = calculatedValue > 0 ? calculatedValue : '';
        }
    }
}

// Auto-save functionality (saves to localStorage)
function setupAutoSave() {
    const form = document.querySelector('.character-sheet');

    // Save data on any input change (immediate save)
    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);
}

function saveFormData() {
    const form = document.querySelector('.character-sheet');
    const inputs = form.querySelectorAll('input, select, textarea');
    const data = {};

    inputs.forEach(input => {
        if (input.id) {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else {
                data[input.id] = input.value;
            }
        }
    });

    try {
        localStorage.setItem('rogueTraderCharacterSheet', JSON.stringify(data));
        console.log('Character sheet auto-saved');
    } catch (e) {
        console.error('Error saving character sheet:', e);
    }
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('rogueTraderCharacterSheet');
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            Object.keys(data).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = data[id];
                    } else {
                        element.value = data[id];
                    }
                }
            });

            console.log('Character sheet data loaded');
            
            // Recalculate movement and carry capacity after loading
            calculateMovement();
            calculateCarryCapacity();
        }
    } catch (e) {
        console.error('Error loading character sheet:', e);
    }
}

// Export character data as JSON
function exportCharacter() {
    const form = document.querySelector('.character-sheet');
    const inputs = form.querySelectorAll('input, select, textarea');
    const data = {};

    inputs.forEach(input => {
        if (input.id) {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else {
                data[input.id] = input.value;
            }
        }
    });

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    
    // Get character name for filename
    const characterName = document.getElementById('character-name')?.value || 'character';
    link.download = `${characterName.replace(/\s+/g, '-').toLowerCase()}-rogue-trader.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Import character data from JSON
function importCharacter() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                Object.keys(data).forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = data[id];
                        } else {
                            element.value = data[id];
                        }
                    }
                });

                calculateMovement();
                calculateCarryCapacity();
                saveFormData();
                
                alert('Character imported successfully!');
            } catch (error) {
                alert('Error importing character: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    // Trigger the file selector
    input.click();
}

// Dice rolling function
function roll(obj) {
    dice = obj.querySelector('.dice');
    console.log(dice)
    sides = dice.getAttribute('data-sides')
    console.log('Rolling d' + (dice.classList.contains('double') ? '100' : sides));
    if (dice.classList.contains('double')) {
        const dice_pair = dice.querySelectorAll('object');
        const left = Math.floor(Math.random() * 10);
        const right = Math.floor(Math.random() * 10);
        dice_pair.forEach((obj, i) => {
            const num = i === 0 ? left : right;
            const doc = obj.contentDocument;
            if (!doc) return;
            let overlay = doc.querySelector('#roll-overlay');
            if (!overlay) {
                overlay = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
                overlay.setAttribute('id', 'roll-overlay');
                overlay.setAttribute('x', '50%');
                let yPos = '55%';
                overlay.setAttribute('y', yPos);
                overlay.setAttribute('text-anchor', 'middle');
                overlay.setAttribute('fill', 'white');
                overlay.setAttribute('font-size', '14');
                doc.documentElement.appendChild(overlay);
            }
            overlay.textContent = num;
        });
    } else {
        const rollValue = Math.floor(Math.random() * sides) + 1;
        const doc = dice.contentDocument;
        if (!doc) return;
        let overlay = doc.querySelector('#roll-overlay');
        if (!overlay) {
            overlay = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
            overlay.setAttribute('id', 'roll-overlay');
            overlay.setAttribute('x', '50%');
            let yPos = '55%';
            if (sides === 4 || sides === 6 || sides === 12) {
                yPos = '65%';
            }
            overlay.setAttribute('y', yPos);
            overlay.setAttribute('text-anchor', 'middle');
            overlay.setAttribute('fill', 'white');
            overlay.setAttribute('font-size', '18');
            doc.documentElement.appendChild(overlay);
        }
        overlay.textContent = rollValue;
    }
}

// Make functions globally available
window.exportCharacter = exportCharacter;
window.importCharacter = importCharacter;
window.resetForm = resetForm;