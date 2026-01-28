// ===== SELF-STORAGE KONFIGURATOR PRO =====
// Main Application Logic

// ===== GLOBAL STATE =====
const state = {
    hallShape: 'rectangle',
    hallLength: 30,
    hallWidth: 20,
    armALength: 20,
    armAWidth: 10,
    armBLength: 15,
    armBWidth: 10,
    totalArea: 600,
    systemHeight: 3000,
    doorHeight: 2130,
    corridorWidth: 1400,
    smallPercent: 50,
    mediumPercent: 30,
    largePercent: 20,
    // Options
    hasMesh: true,
    hasSoffit: false,
    hasElectroLocks: true,
    hasRollerDoors: false,
    needsGate: false,
    hasCameras: true,
    hasLighting: true,
    // Calculated values
    boxes: [],
    corridorLength: 0,
    frontWallLength: 0,
    partitionWallLength: 0,
    netArea: 0,
    grossArea: 600,
    efficiency: 0
};

// ===== PRICING (default values) =====
const prices = {
    whiteWall: 110,      // PLN/m²
    grayWall: 84,        // PLN/m²
    mesh: 50,            // PLN/m²
    kickPlate: 81,       // PLN/mb
    doorSingle: 780,     // PLN/szt
    doorDouble: 1560,    // PLN/szt
    roller15: 1700,      // PLN/szt
    roller20: 1800,      // PLN/szt
    electroLock: 550,    // PLN/szt
    soffit: 80,          // PLN/mb
    gate: 15000,         // PLN
    camera: 500,         // PLN/szt
    lamp: 350            // PLN/szt
};

// ===== CASH FLOW PARAMS =====
const cashFlowParams = {
    rentPrice: 85,           // PLN/m²/msc
    monthlyRental: 20,       // m²/msc
    maxOccupancy: 85,        // %
    contractLength: 10,      // lat
    licenseFee: 15,          // %
    fixedCosts: 5000         // PLN/msc
};

// Calculated costs and results
let calculatedCosts = null;
let cashFlowResults = null;
let cashFlowChart = null;

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeInputs();
    initializeSliders();
    initializeEventListeners();
    updateGrossArea();
});

// ===== TAB NAVIGATION =====
function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Hide all content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected content
            const tabId = 'tab-' + tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ===== INPUT INITIALIZATION =====
function initializeInputs() {
    // Hall shape selector
    document.getElementById('hallShape').addEventListener('change', (e) => {
        state.hallShape = e.target.value;
        toggleDimensionInputs();
        updateGrossArea();
    });

    // Dimension inputs
    const dimInputs = ['hallLength', 'hallWidth', 'armALength', 'armAWidth', 
                       'armBLength', 'armBWidth', 'totalArea', 'systemHeight',
                       'doorHeight', 'corridorWidth'];
    
    dimInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', (e) => {
                state[id] = parseFloat(e.target.value) || 0;
                updateGrossArea();
            });
        }
    });

    // Options checkboxes
    const options = ['hasMesh', 'hasSoffit', 'hasElectroLocks', 'hasRollerDoors',
                     'needsGate', 'hasCameras', 'hasLighting'];
    
    options.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', (e) => {
                state[id] = e.target.checked;
            });
        }
    });

    // Price inputs
    const priceInputs = {
        'priceWhiteWall': 'whiteWall',
        'priceGrayWall': 'grayWall',
        'priceMesh': 'mesh',
        'priceKickPlate': 'kickPlate',
        'priceDoorSingle': 'doorSingle',
        'priceDoorDouble': 'doorDouble',
        'priceRoller15': 'roller15',
        'priceRoller20': 'roller20',
        'priceElectroLock': 'electroLock',
        'priceSoffit': 'soffit',
        'priceGate': 'gate',
        'priceCamera': 'camera',
        'priceLamp': 'lamp'
    };

    Object.entries(priceInputs).forEach(([inputId, priceKey]) => {
        const el = document.getElementById(inputId);
        if (el) {
            el.addEventListener('input', (e) => {
                prices[priceKey] = parseFloat(e.target.value) || 0;
            });
        }
    });

    // Cash flow inputs
    const cfInputs = {
        'rentPrice': 'rentPrice',
        'monthlyRental': 'monthlyRental',
        'maxOccupancy': 'maxOccupancy',
        'contractLength': 'contractLength',
        'licenseFee': 'licenseFee',
        'fixedCosts': 'fixedCosts'
    };

    Object.entries(cfInputs).forEach(([inputId, paramKey]) => {
        const el = document.getElementById(inputId);
        if (el) {
            el.addEventListener('input', (e) => {
                cashFlowParams[paramKey] = parseFloat(e.target.value) || 0;
            });
        }
    });
}

// ===== SLIDER INITIALIZATION =====
function initializeSliders() {
    const sliders = ['small', 'medium', 'large'];
    
    sliders.forEach(size => {
        const slider = document.getElementById(`${size}Percent`);
        const value = document.getElementById(`${size}PercentValue`);
        
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            state[`${size}Percent`] = val;
            value.textContent = val + '%';
            updateProgressBar();
        });
    });
}

function updateProgressBar() {
    const total = state.smallPercent + state.mediumPercent + state.largePercent;
    
    document.getElementById('progressSmall').style.width = 
        (state.smallPercent / Math.max(total, 1) * 100) + '%';
    document.getElementById('progressMedium').style.width = 
        (state.mediumPercent / Math.max(total, 1) * 100) + '%';
    document.getElementById('progressLarge').style.width = 
        (state.largePercent / Math.max(total, 1) * 100) + '%';
    
    const totalEl = document.getElementById('totalPercent');
    totalEl.textContent = total + '%';
    
    // Visual feedback for validation
    const progressBar = document.querySelector('.total-progress');
    if (total === 100) {
        totalEl.style.color = '#28a745';
        progressBar.style.boxShadow = '0 0 8px rgba(40, 167, 69, 0.5)';
        totalEl.innerHTML = total + '% <i class="fas fa-check-circle" style="color:#28a745"></i>';
    } else if (total > 100) {
        totalEl.style.color = '#dc3545';
        progressBar.style.boxShadow = '0 0 8px rgba(220, 53, 69, 0.5)';
        totalEl.innerHTML = total + '% <i class="fas fa-exclamation-circle" style="color:#dc3545"></i>';
    } else {
        totalEl.style.color = '#ffc107';
        progressBar.style.boxShadow = '0 0 8px rgba(255, 193, 7, 0.5)';
        totalEl.innerHTML = total + '% <i class="fas fa-exclamation-triangle" style="color:#ffc107"></i>';
    }
}

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // Generate plan button
    document.getElementById('generatePlan').addEventListener('click', generatePlan);
    
    // Calculate cashflow button
    document.getElementById('calculateCashflow').addEventListener('click', calculateCashFlow);
    
    // Reset prices button
    document.getElementById('resetPrices').addEventListener('click', resetPrices);
    
    // Print button
    document.getElementById('printBtn').addEventListener('click', printReport);
    
    // Export PDF
    document.getElementById('exportPdf').addEventListener('click', printReport);
    
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.getElementById('closeSettings').addEventListener('click', closeSettingsModal);
    document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
    document.getElementById('clearApiKey').addEventListener('click', clearApiKey);
    document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
    
    // Close modal on overlay click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') closeSettingsModal();
    });
    
    // Load saved API key
    loadApiKey();
}

// ===== API KEY MANAGEMENT =====
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        document.getElementById('apiKeyInput').value = savedKey;
    }
    updateApiStatus();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (key) {
        localStorage.setItem('openai_api_key', key);
        updateApiStatus();
        alert('Klucz API został zapisany!');
        closeSettingsModal();
    } else {
        alert('Wprowadź klucz API');
    }
}

function clearApiKey() {
    localStorage.removeItem('openai_api_key');
    document.getElementById('apiKeyInput').value = '';
    updateApiStatus();
    alert('Klucz API został usunięty');
}

function loadApiKey() {
    updateApiStatus();
}

function updateApiStatus() {
    const status = document.getElementById('apiStatus');
    const key = localStorage.getItem('openai_api_key');
    
    if (key) {
        status.className = 'api-status connected';
        status.innerHTML = '<i class="fas fa-circle"></i><span>Klucz API skonfigurowany</span>';
    } else {
        status.className = 'api-status disconnected';
        status.innerHTML = '<i class="fas fa-circle"></i><span>Brak klucza API</span>';
    }
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKeyInput');
    const icon = document.querySelector('#toggleApiKey i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ===== HELPER FUNCTIONS =====
function toggleDimensionInputs() {
    const rectDims = document.getElementById('rectangleDims');
    const lDims = document.getElementById('lShapeDims');
    const customArea = document.getElementById('customArea');
    
    rectDims.style.display = state.hallShape === 'rectangle' ? 'block' : 'none';
    lDims.style.display = state.hallShape === 'L-shape' ? 'block' : 'none';
    customArea.style.display = state.hallShape === 'custom' ? 'block' : 'none';
}

function updateGrossArea() {
    let area = 0;
    
    switch(state.hallShape) {
        case 'rectangle':
            area = state.hallLength * state.hallWidth;
            break;
        case 'L-shape':
            area = (state.armALength * state.armAWidth) + 
                   (state.armBLength * state.armBWidth) -
                   (Math.min(state.armAWidth, state.armBWidth) * Math.min(state.armAWidth, state.armBWidth));
            break;
        case 'custom':
            area = state.totalArea;
            break;
    }
    
    state.grossArea = Math.round(area);
    document.getElementById('grossArea').textContent = state.grossArea;
}

function resetPrices() {
    // Reset to defaults
    document.getElementById('priceWhiteWall').value = 110;
    document.getElementById('priceGrayWall').value = 84;
    document.getElementById('priceMesh').value = 50;
    document.getElementById('priceKickPlate').value = 81;
    document.getElementById('priceDoorSingle').value = 780;
    document.getElementById('priceDoorDouble').value = 1560;
    document.getElementById('priceRoller15').value = 1700;
    document.getElementById('priceRoller20').value = 1800;
    document.getElementById('priceElectroLock').value = 550;
    document.getElementById('priceSoffit').value = 80;
    document.getElementById('priceGate').value = 15000;
    document.getElementById('priceCamera').value = 500;
    document.getElementById('priceLamp').value = 350;
    
    // Update prices object
    prices.whiteWall = 110;
    prices.grayWall = 84;
    prices.mesh = 50;
    prices.kickPlate = 81;
    prices.doorSingle = 780;
    prices.doorDouble = 1560;
    prices.roller15 = 1700;
    prices.roller20 = 1800;
    prices.electroLock = 550;
    prices.soffit = 80;
    prices.gate = 15000;
    prices.camera = 500;
    prices.lamp = 350;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(value, decimals = 0) {
    return new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

// ===== MAIN PLAN GENERATION =====
function generatePlan() {
    // Validate percentages - must be exactly 100%
    const total = state.smallPercent + state.mediumPercent + state.largePercent;
    if (total !== 100) {
        alert(`Suma procentów musi wynosić dokładnie 100%!\nObecnie: ${total}%\n\nDostosuj suwaki podziału boksów.`);
        return;
    }
    
    const normalizedSmall = state.smallPercent / 100;
    const normalizedMedium = state.mediumPercent / 100;
    const normalizedLarge = state.largePercent / 100;
    
    // Calculate usable area (approx 70% efficiency)
    const corridorPercent = 0.30;
    const usableArea = state.grossArea * (1 - corridorPercent);
    
    // Generate boxes with optimization
    state.boxes = generateBoxesOptimized(usableArea, normalizedSmall, normalizedMedium, normalizedLarge);
    
    // Calculate metrics
    state.netArea = state.boxes.reduce((sum, box) => sum + box.area, 0);
    state.efficiency = Math.round((state.netArea / state.grossArea) * 100);
    
    // Calculate wall lengths
    calculateWallLengths();
    
    // Update stats
    updatePlanStats();
    
    // Calculate costs
    calculateCosts();
    
    // Generate summary
    generateSummary();
    
    // Generate floor plan display
    generateFloorPlanDisplay();
    
    // Switch to plan tab
    document.querySelector('.nav-tab[data-tab="plan"]').click();
}

// ===== BOX GENERATION WITH OPTIMIZATION =====
function generateBoxesOptimized(usableArea, smallRatio, mediumRatio, largeRatio) {
    const boxes = [];
    
    // Optimal box sizes for each category (most space-efficient)
    const smallSizes = [2, 3]; // Prefer 2m² for max quantity
    const mediumSizes = [4, 5, 6]; // Prefer 4m² for max quantity
    const largeSizes = [8, 10, 12]; // Prefer 8m² for max quantity
    
    // Target areas for each category
    const targetSmall = usableArea * smallRatio;
    const targetMedium = usableArea * mediumRatio;
    const targetLarge = usableArea * largeRatio;
    
    let totalUsed = 0;
    
    // OPTIMIZATION STRATEGY: Use smallest size in each category to maximize box count
    // But maintain variety for realistic distribution
    
    // Generate large boxes - prefer 8m² for quantity, mix in some larger
    let currentArea = 0;
    while (currentArea < targetLarge) {
        // 70% chance for smallest (8m²), 20% for medium (10m²), 10% for largest (12m²)
        let size;
        const rand = Math.random();
        if (rand < 0.7) size = 8;
        else if (rand < 0.9) size = 10;
        else size = 12;
        
        if (currentArea + size <= targetLarge + 2) {
            boxes.push({ area: size, category: 'large' });
            currentArea += size;
            totalUsed += size;
        } else {
            // Try smaller size
            if (currentArea + 8 <= targetLarge + 2) {
                boxes.push({ area: 8, category: 'large' });
                currentArea += 8;
                totalUsed += 8;
            } else break;
        }
    }
    
    // Generate medium boxes - prefer 4m² for quantity
    currentArea = 0;
    while (currentArea < targetMedium) {
        let size;
        const rand = Math.random();
        if (rand < 0.5) size = 4;
        else if (rand < 0.8) size = 5;
        else size = 6;
        
        if (currentArea + size <= targetMedium + 2) {
            boxes.push({ area: size, category: 'medium' });
            currentArea += size;
            totalUsed += size;
        } else {
            if (currentArea + 4 <= targetMedium + 2) {
                boxes.push({ area: 4, category: 'medium' });
                currentArea += 4;
                totalUsed += 4;
            } else break;
        }
    }
    
    // Generate small boxes - prefer 2m² for maximum quantity
    currentArea = 0;
    while (currentArea < targetSmall) {
        let size;
        const rand = Math.random();
        if (rand < 0.6) size = 2;
        else size = 3;
        
        if (currentArea + size <= targetSmall + 1) {
            boxes.push({ area: size, category: 'small' });
            currentArea += size;
            totalUsed += size;
        } else {
            if (currentArea + 2 <= targetSmall + 1) {
                boxes.push({ area: 2, category: 'small' });
                currentArea += 2;
                totalUsed += 2;
            } else break;
        }
    }
    
    // FINAL OPTIMIZATION: Fill ALL remaining space with smallest boxes
    let remainingSpace = usableArea - totalUsed;
    while (remainingSpace >= 2) {
        boxes.push({ area: 2, category: 'small' });
        remainingSpace -= 2;
        totalUsed += 2;
    }
    
    // Sort boxes for better visual layout: large first, then medium, then small
    boxes.sort((a, b) => b.area - a.area);
    
    return boxes;
}

// ===== FLOOR PLAN DISPLAY =====
function generateFloorPlanDisplay() {
    // Simply show the optimized box layout
    showFloorPlanPlaceholder();
}

function getBoxCountsBySize() {
    const counts = {};
    state.boxes.forEach(box => {
        if (!counts[box.area]) {
            counts[box.area] = 0;
        }
        counts[box.area]++;
    });
    return counts;
}

function showFloorPlanPlaceholder() {
    const container = document.getElementById('svgContainer');
    const boxCounts = getBoxCountsBySize();
    const sortedSizes = Object.keys(boxCounts).map(Number).sort((a, b) => a - b);
    
    // Calculate hall dimensions for visual
    const hallWidth = Math.min(state.hallLength * 12, 550);
    const hallHeight = Math.min(state.hallWidth * 12, 350);
    const corridorHeight = 40;
    const rowHeight = (hallHeight - corridorHeight - 20) / 2;
    
    // Calculate box widths to fit in hall
    const totalBoxArea = state.boxes.reduce((sum, b) => sum + b.area, 0);
    const halfBoxes = Math.ceil(state.boxes.length / 2);
    const topRowBoxes = state.boxes.slice(0, halfBoxes);
    const bottomRowBoxes = state.boxes.slice(halfBoxes);
    
    // Calculate scale factor to fit boxes
    const topRowArea = topRowBoxes.reduce((sum, b) => sum + b.area, 0);
    const bottomRowArea = bottomRowBoxes.reduce((sum, b) => sum + b.area, 0);
    const maxRowArea = Math.max(topRowArea, bottomRowArea);
    const scaleFactor = (hallWidth - 20) / (maxRowArea * 6);
    
    // Create a visual representation
    let html = `
        <div class="floor-plan-display">
            <div class="plan-visual">
                <div class="hall-outline" style="width: ${hallWidth}px; height: ${hallHeight}px;">
                    <div class="hall-label">${state.hallLength}m x ${state.hallWidth}m (${state.grossArea}m²)</div>
                    <div class="boxes-row top-row" style="height:${rowHeight}px;">`;
    
    // Add visual boxes for top row - scaled to fit
    topRowBoxes.forEach(box => {
        const colorClass = box.category;
        const width = Math.max(Math.min(box.area * scaleFactor * 5, 80), 18);
        html += `<div class="visual-box ${colorClass}" style="width:${width}px;height:${rowHeight - 6}px;font-size:${width > 25 ? '10px' : '8px'}" title="${box.area}m²">${box.area}</div>`;
    });
    
    html += `</div>
                    <div class="corridor" style="height:${corridorHeight}px;">
                        <span>KORYTARZ ${state.corridorWidth}mm</span>
                    </div>
                    <div class="boxes-row bottom-row" style="height:${rowHeight}px;">`;
    
    // Add visual boxes for bottom row
    bottomRowBoxes.forEach(box => {
        const colorClass = box.category;
        const width = Math.max(Math.min(box.area * scaleFactor * 5, 80), 18);
        html += `<div class="visual-box ${colorClass}" style="width:${width}px;height:${rowHeight - 6}px;font-size:${width > 25 ? '10px' : '8px'}" title="${box.area}m²">${box.area}</div>`;
    });
    
    html += `</div>
                </div>
                <div class="hall-legend">
                    <div class="legend-item"><span class="legend-box small"></span> Małe (1-3m²)</div>
                    <div class="legend-item"><span class="legend-box medium"></span> Średnie (4-7m²)</div>
                    <div class="legend-item"><span class="legend-box large"></span> Duże (8-15m²)</div>
                </div>
            </div>
            <div class="box-stats-table">
                <h4><i class="fas fa-th"></i> Przykładowe zestawienie boksów</h4>
                <p class="table-subtitle">Na podstawie wybranej konfiguracji</p>
                <table>
                    <thead>
                        <tr>
                            <th>Rozmiar</th>
                            <th>Ilość</th>
                            <th>Suma m²</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    let totalCount = 0;
    let totalArea = 0;
    
    sortedSizes.forEach(size => {
        const count = boxCounts[size];
        const area = size * count;
        totalCount += count;
        totalArea += area;
        
        let category = 'small';
        if (size >= 4 && size <= 7) category = 'medium';
        if (size >= 8) category = 'large';
        
        html += `<tr class="${category}-row">
            <td><span class="size-badge ${category}">${size} m²</span></td>
            <td>${count} szt.</td>
            <td>${area} m²</td>
        </tr>`;
    });
    
    html += `</tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td><strong>SUMA</strong></td>
                            <td><strong>${totalCount} szt.</strong></td>
                            <td><strong>${totalArea} m²</strong></td>
                        </tr>
                    </tfoot>
                </table>
                <div class="optimization-note">
                    <i class="fas fa-lightbulb"></i>
                    <span>Algorytm optymalizuje ilość boksów przy zachowaniu zadanych proporcji</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ===== WALL LENGTH CALCULATIONS =====
function calculateWallLengths() {
    // Calculate based on box layout
    let frontWall = 0;
    let partitionWall = 0;
    
    state.boxes.forEach(box => {
        // Each box has a front wall
        const width = Math.sqrt(box.area * 1.5); // Assuming 1.5:1 ratio
        const depth = box.area / width;
        
        frontWall += width;
        partitionWall += depth * 2; // Both sides
    });
    
    // Add outer corridor walls
    const corridorLengthEstimate = state.grossArea * 0.3 / (state.corridorWidth / 1000);
    state.corridorLength = Math.round(corridorLengthEstimate);
    
    state.frontWallLength = Math.round(frontWall);
    state.partitionWallLength = Math.round(partitionWall);
}

// ===== SVG GENERATION =====
function generateSVG() {
    const container = document.getElementById('svgContainer');
    
    // Calculate SVG dimensions
    const padding = 50;
    const scale = 18; // pixels per meter
    
    let hallW, hallH;
    if (state.hallShape === 'rectangle') {
        hallW = state.hallLength;
        hallH = state.hallWidth;
    } else if (state.hallShape === 'L-shape') {
        hallW = Math.max(state.armALength, state.armBLength);
        hallH = state.armAWidth + state.armBWidth;
    } else {
        const side = Math.sqrt(state.grossArea);
        hallW = side;
        hallH = side;
    }
    
    const width = hallW * scale + padding * 2;
    const height = hallH * scale + padding * 2 + 80; // Extra space for stats table
    
    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto; font-family: Inter, sans-serif;">`;
    
    // Definitions for gradients and patterns
    svg += `<defs>
        <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#e8f5e9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#c8e6c9;stop-opacity:1" />
        </linearGradient>
        <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#eee" stroke-width="0.5"/>
        </pattern>
    </defs>`;
    
    // Background with grid
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#fafafa"/>`;
    svg += `<rect x="${padding}" y="${padding}" width="${hallW * scale}" height="${hallH * scale}" fill="url(#gridPattern)"/>`;
    
    // Draw hall outline
    svg += drawHallOutline(padding, scale, hallW, hallH);
    
    // Draw improved boxes layout
    svg += drawImprovedBoxesLayout(padding, scale, hallW, hallH);
    
    // Draw dimensions
    svg += drawDimensions(padding, scale, hallW, hallH);
    
    // Draw stats table
    svg += drawStatsTable(padding, scale, hallW, hallH, height);
    
    svg += '</svg>';
    
    container.innerHTML = svg;
}

function drawHallOutline(padding, scale, hallW, hallH) {
    let path = '';
    const w = hallW * scale;
    const h = hallH * scale;
    
    if (state.hallShape === 'rectangle' || state.hallShape === 'custom') {
        path = `<rect x="${padding}" y="${padding}" width="${w}" height="${h}" 
                 fill="#f5f5f5" stroke="#1a1a2e" stroke-width="5"/>`;
    } else if (state.hallShape === 'L-shape') {
        const aW = state.armAWidth * scale;
        const aL = state.armALength * scale;
        const bW = state.armBWidth * scale;
        const bL = state.armBLength * scale;
        
        path = `<path d="M ${padding} ${padding} 
                         L ${padding + aL} ${padding} 
                         L ${padding + aL} ${padding + aW} 
                         L ${padding + bL} ${padding + aW}
                         L ${padding + bL} ${padding + aW + bW}
                         L ${padding} ${padding + aW + bW} Z"
                 fill="#f5f5f5" stroke="#1a1a2e" stroke-width="5"/>`;
    }
    
    return path;
}

function drawImprovedBoxesLayout(padding, scale, hallW, hallH) {
    let svg = '';
    const w = hallW * scale;
    const h = hallH * scale;
    
    // Corridor parameters
    const corridorWidthM = state.corridorWidth / 1000;
    const corridorPx = corridorWidthM * scale;
    
    // Standard box depth (meters)
    const boxDepthM = 3; // typical 3m deep boxes
    const boxDepthPx = boxDepthM * scale;
    
    // Calculate layout - central corridor with boxes on both sides
    const corridorY = padding + (h - corridorPx) / 2;
    
    // Draw corridor
    svg += `<rect x="${padding + 3}" y="${corridorY}" width="${w - 6}" height="${corridorPx}" 
             fill="url(#corridorGrad)" stroke="#4caf50" stroke-width="2"/>`;
    
    // Corridor label
    svg += `<text x="${padding + w/2}" y="${corridorY + corridorPx/2 + 5}" 
             text-anchor="middle" fill="#2e7d32" font-size="14" font-weight="600">KORYTARZ ${state.corridorWidth}mm</text>`;
    
    // Sort boxes by size for better layout
    const sortedBoxes = [...state.boxes].sort((a, b) => b.area - a.area);
    
    // Split boxes for top and bottom rows
    const topBoxes = [];
    const bottomBoxes = [];
    
    sortedBoxes.forEach((box, i) => {
        if (i % 2 === 0) {
            topBoxes.push(box);
        } else {
            bottomBoxes.push(box);
        }
    });
    
    // Calculate available space for each row
    const topRowY = padding + 3;
    const topRowHeight = corridorY - padding - 6;
    const bottomRowY = corridorY + corridorPx + 3;
    const bottomRowHeight = h - (corridorY - padding) - corridorPx - 6;
    
    // Draw top row boxes
    let currentX = padding + 5;
    const maxX = padding + w - 5;
    
    topBoxes.forEach((box, index) => {
        // Calculate box width based on area and fixed depth
        const boxWidthM = box.area / boxDepthM;
        let boxWidthPx = boxWidthM * scale;
        
        // Ensure minimum width
        boxWidthPx = Math.max(boxWidthPx, 25);
        
        // Check if fits
        if (currentX + boxWidthPx > maxX) return;
        
        // Colors
        const colors = getBoxColors(box.category);
        
        // Box rectangle
        svg += `<rect x="${currentX}" y="${topRowY}" width="${boxWidthPx}" height="${topRowHeight}" 
                 fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5" rx="1"/>`;
        
        // Front wall (facing corridor) - BLUE
        svg += `<line x1="${currentX}" y1="${topRowY + topRowHeight}" 
                      x2="${currentX + boxWidthPx}" y2="${topRowY + topRowHeight}"
                      stroke="#0066cc" stroke-width="4"/>`;
        
        // Partition walls (sides) - ORANGE
        if (index > 0) {
            svg += `<line x1="${currentX}" y1="${topRowY}" 
                          x2="${currentX}" y2="${topRowY + topRowHeight - 2}"
                          stroke="#ff8c00" stroke-width="2"/>`;
        }
        
        // Door indication
        const doorWidth = box.category === 'large' ? 15 : 10;
        const doorX = currentX + (boxWidthPx - doorWidth) / 2;
        svg += `<rect x="${doorX}" y="${topRowY + topRowHeight - 4}" width="${doorWidth}" height="6" 
                 fill="#fff" stroke="#0066cc" stroke-width="1"/>`;
        
        // Box label
        if (boxWidthPx > 30) {
            svg += `<text x="${currentX + boxWidthPx/2}" y="${topRowY + topRowHeight/2}" 
                     text-anchor="middle" fill="#fff" font-size="${boxWidthPx > 50 ? 12 : 10}" font-weight="700">${box.area} m²</text>`;
        }
        
        currentX += boxWidthPx + 2;
    });
    
    // Draw bottom row boxes
    currentX = padding + 5;
    
    bottomBoxes.forEach((box, index) => {
        const boxWidthM = box.area / boxDepthM;
        let boxWidthPx = boxWidthM * scale;
        boxWidthPx = Math.max(boxWidthPx, 25);
        
        if (currentX + boxWidthPx > maxX) return;
        
        const colors = getBoxColors(box.category);
        
        // Box rectangle
        svg += `<rect x="${currentX}" y="${bottomRowY}" width="${boxWidthPx}" height="${bottomRowHeight}" 
                 fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5" rx="1"/>`;
        
        // Front wall (facing corridor) - BLUE
        svg += `<line x1="${currentX}" y1="${bottomRowY}" 
                      x2="${currentX + boxWidthPx}" y2="${bottomRowY}"
                      stroke="#0066cc" stroke-width="4"/>`;
        
        // Partition walls - ORANGE
        if (index > 0) {
            svg += `<line x1="${currentX}" y1="${bottomRowY + 2}" 
                          x2="${currentX}" y2="${bottomRowY + bottomRowHeight}"
                          stroke="#ff8c00" stroke-width="2"/>`;
        }
        
        // Door indication
        const doorWidth = box.category === 'large' ? 15 : 10;
        const doorX = currentX + (boxWidthPx - doorWidth) / 2;
        svg += `<rect x="${doorX}" y="${bottomRowY - 2}" width="${doorWidth}" height="6" 
                 fill="#fff" stroke="#0066cc" stroke-width="1"/>`;
        
        // Box label
        if (boxWidthPx > 30) {
            svg += `<text x="${currentX + boxWidthPx/2}" y="${bottomRowY + bottomRowHeight/2 + 4}" 
                     text-anchor="middle" fill="#fff" font-size="${boxWidthPx > 50 ? 12 : 10}" font-weight="700">${box.area} m²</text>`;
        }
        
        currentX += boxWidthPx + 2;
    });
    
    return svg;
}

function getBoxColors(category) {
    switch(category) {
        case 'small':
            return { fill: '#26a69a', stroke: '#00897b' }; // Teal
        case 'medium':
            return { fill: '#42a5f5', stroke: '#1e88e5' }; // Blue
        case 'large':
            return { fill: '#66bb6a', stroke: '#43a047' }; // Green
        default:
            return { fill: '#78909c', stroke: '#546e7a' }; // Gray
    }
}

function drawDimensions(padding, scale, hallW, hallH) {
    let svg = '';
    const w = hallW * scale;
    const h = hallH * scale;
    
    // Width dimension (top)
    svg += `<line x1="${padding}" y1="${padding - 20}" x2="${padding + w}" y2="${padding - 20}" 
             stroke="#666" stroke-width="1.5"/>`;
    svg += `<line x1="${padding}" y1="${padding - 28}" x2="${padding}" y2="${padding - 12}" stroke="#666" stroke-width="1"/>`;
    svg += `<line x1="${padding + w}" y1="${padding - 28}" x2="${padding + w}" y2="${padding - 12}" stroke="#666" stroke-width="1"/>`;
    svg += `<rect x="${padding + w/2 - 30}" y="${padding - 40}" width="60" height="18" fill="#fff" rx="2"/>`;
    svg += `<text x="${padding + w/2}" y="${padding - 26}" text-anchor="middle" 
             fill="#1a1a2e" font-size="13" font-weight="700">${hallW.toFixed(1)} m</text>`;
    
    // Height dimension (right)
    svg += `<line x1="${padding + w + 20}" y1="${padding}" x2="${padding + w + 20}" y2="${padding + h}" 
             stroke="#666" stroke-width="1.5"/>`;
    svg += `<line x1="${padding + w + 12}" y1="${padding}" x2="${padding + w + 28}" y2="${padding}" stroke="#666" stroke-width="1"/>`;
    svg += `<line x1="${padding + w + 12}" y1="${padding + h}" x2="${padding + w + 28}" y2="${padding + h}" stroke="#666" stroke-width="1"/>`;
    svg += `<text x="${padding + w + 35}" y="${padding + h/2 + 5}" 
             fill="#1a1a2e" font-size="13" font-weight="700" 
             transform="rotate(90 ${padding + w + 35} ${padding + h/2})">${hallH.toFixed(1)} m</text>`;
    
    return svg;
}

function drawStatsTable(padding, scale, hallW, hallH, svgHeight) {
    let svg = '';
    const w = hallW * scale;
    const tableY = padding + hallH * scale + 25;
    const tableX = padding;
    
    // Group boxes by size
    const sizeGroups = {};
    state.boxes.forEach(box => {
        if (!sizeGroups[box.area]) {
            sizeGroups[box.area] = { count: 0, total: 0 };
        }
        sizeGroups[box.area].count++;
        sizeGroups[box.area].total += box.area;
    });
    
    // Sort by size
    const sortedSizes = Object.keys(sizeGroups).map(Number).sort((a, b) => a - b);
    
    // Table header
    svg += `<rect x="${tableX}" y="${tableY}" width="280" height="25" fill="#1a1a2e" rx="4 4 0 0"/>`;
    svg += `<text x="${tableX + 10}" y="${tableY + 17}" fill="#fff" font-size="11" font-weight="600">ROZMIAR</text>`;
    svg += `<text x="${tableX + 90}" y="${tableY + 17}" fill="#fff" font-size="11" font-weight="600">ILOŚĆ</text>`;
    svg += `<text x="${tableX + 160}" y="${tableY + 17}" fill="#fff" font-size="11" font-weight="600">SUMA m²</text>`;
    
    // Table rows
    let rowY = tableY + 25;
    let totalCount = 0;
    let totalArea = 0;
    
    sortedSizes.forEach((size, i) => {
        const group = sizeGroups[size];
        const bgColor = i % 2 === 0 ? '#f8f9fa' : '#fff';
        
        svg += `<rect x="${tableX}" y="${rowY}" width="280" height="20" fill="${bgColor}"/>`;
        svg += `<text x="${tableX + 10}" y="${rowY + 14}" fill="#333" font-size="11">${size} m²</text>`;
        svg += `<text x="${tableX + 90}" y="${rowY + 14}" fill="#333" font-size="11">${group.count}</text>`;
        svg += `<text x="${tableX + 160}" y="${rowY + 14}" fill="#333" font-size="11">${group.total}</text>`;
        
        totalCount += group.count;
        totalArea += group.total;
        rowY += 20;
    });
    
    // Total row
    svg += `<rect x="${tableX}" y="${rowY}" width="280" height="24" fill="#0066cc" rx="0 0 4 4"/>`;
    svg += `<text x="${tableX + 10}" y="${rowY + 16}" fill="#fff" font-size="12" font-weight="700">SUMA</text>`;
    svg += `<text x="${tableX + 90}" y="${rowY + 16}" fill="#fff" font-size="12" font-weight="700">${totalCount}</text>`;
    svg += `<text x="${tableX + 160}" y="${rowY + 16}" fill="#fff" font-size="12" font-weight="700">${totalArea}</text>`;
    
    // Stats panel on the right
    const statsX = tableX + 300;
    
    svg += `<rect x="${statsX}" y="${tableY}" width="160" height="90" fill="#fff" stroke="#ddd" rx="4"/>`;
    svg += `<text x="${statsX + 80}" y="${tableY + 20}" text-anchor="middle" fill="#666" font-size="10">Powierzchnia Brutto</text>`;
    svg += `<text x="${statsX + 80}" y="${tableY + 38}" text-anchor="middle" fill="#0066cc" font-size="18" font-weight="700">${state.grossArea} m²</text>`;
    
    svg += `<text x="${statsX + 80}" y="${tableY + 55}" text-anchor="middle" fill="#666" font-size="10">Wydajność</text>`;
    svg += `<text x="${statsX + 80}" y="${tableY + 73}" text-anchor="middle" fill="#28a745" font-size="18" font-weight="700">${state.efficiency}%</text>`;
    
    // Legend
    const legendX = statsX + 170;
    svg += `<rect x="${legendX}" y="${tableY}" width="130" height="90" fill="#fff" stroke="#ddd" rx="4"/>`;
    svg += `<text x="${legendX + 10}" y="${tableY + 18}" fill="#333" font-size="10" font-weight="600">LEGENDA</text>`;
    
    svg += `<rect x="${legendX + 10}" y="${tableY + 28}" width="14" height="10" fill="#26a69a" rx="2"/>`;
    svg += `<text x="${legendX + 30}" y="${tableY + 36}" fill="#333" font-size="9">Małe (1-3m²)</text>`;
    
    svg += `<rect x="${legendX + 10}" y="${tableY + 44}" width="14" height="10" fill="#42a5f5" rx="2"/>`;
    svg += `<text x="${legendX + 30}" y="${tableY + 52}" fill="#333" font-size="9">Średnie (4-7m²)</text>`;
    
    svg += `<rect x="${legendX + 10}" y="${tableY + 60}" width="14" height="10" fill="#66bb6a" rx="2"/>`;
    svg += `<text x="${legendX + 30}" y="${tableY + 68}" fill="#333" font-size="9">Duże (8-15m²)</text>`;
    
    svg += `<line x1="${legendX + 10}" y1="${tableY + 80}" x2="${legendX + 24}" y2="${tableY + 80}" stroke="#0066cc" stroke-width="3"/>`;
    svg += `<text x="${legendX + 30}" y="${tableY + 83}" fill="#333" font-size="9">Frontowa</text>`;
    
    svg += `<line x1="${legendX + 75}" y1="${tableY + 80}" x2="${legendX + 89}" y2="${tableY + 80}" stroke="#ff8c00" stroke-width="3"/>`;
    svg += `<text x="${legendX + 95}" y="${tableY + 83}" fill="#333" font-size="9">Działowa</text>`;
    
    return svg;
}

// ===== UPDATE PLAN STATS =====
function updatePlanStats() {
    document.getElementById('planStats').style.display = 'grid';
    document.getElementById('statTotalBoxes').textContent = state.boxes.length;
    document.getElementById('statNetArea').textContent = state.netArea + ' m²';
    document.getElementById('statEfficiency').textContent = state.efficiency + '%';
    
    const avgBox = state.boxes.length > 0 ? (state.netArea / state.boxes.length).toFixed(2) : 0;
    document.getElementById('statAvgBox').textContent = avgBox + ' m²';
    
    // Update box count breakdown
    const smallCount = state.boxes.filter(b => b.category === 'small').length;
    const mediumCount = state.boxes.filter(b => b.category === 'medium').length;
    const largeCount = state.boxes.filter(b => b.category === 'large').length;
    
    document.getElementById('statSmallCount').textContent = smallCount;
    document.getElementById('statMediumCount').textContent = mediumCount;
    document.getElementById('statLargeCount').textContent = largeCount;
}

// ===== COST CALCULATIONS =====
function calculateCosts() {
    const systemHeightM = state.systemHeight / 1000;
    const doorHeightM = state.doorHeight / 1000;
    const doorArea = 1 * doorHeightM; // 1m wide door
    
    // Count boxes by category
    const smallBoxes = state.boxes.filter(b => b.category === 'small').length;
    const mediumBoxes = state.boxes.filter(b => b.category === 'medium').length;
    const largeBoxes = state.boxes.filter(b => b.category === 'large').length;
    
    // Calculate quantities
    const whiteWallArea = (state.frontWallLength * systemHeightM) - (state.boxes.length * doorArea);
    const grayWallArea = state.partitionWallLength * systemHeightM;
    const meshArea = state.hasMesh ? state.netArea : 0;
    const kickPlateLength = state.frontWallLength - state.boxes.length; // minus door widths
    
    // Doors and rollers
    let singleDoors = smallBoxes + mediumBoxes;
    let doubleDoors = 0;
    let rollers15 = 0;
    let rollers20 = 0;
    
    if (state.hasRollerDoors) {
        rollers20 = largeBoxes;
    } else {
        doubleDoors = largeBoxes;
    }
    
    // Locks
    const electroLocks = state.hasElectroLocks ? state.boxes.length : 0;
    
    // Soffit
    const soffitLength = state.hasSoffit ? state.corridorLength : 0;
    
    // Cameras (1 per 50m² of gross area)
    const cameras = state.hasCameras ? Math.ceil(state.grossArea / 50) : 0;
    
    // Lamps (1 per 10m of corridor)
    const lamps = state.hasLighting ? Math.ceil(state.corridorLength / 10) : 0;
    
    // Calculate costs
    calculatedCosts = {
        whiteWall: { qty: whiteWallArea.toFixed(1), unit: 'm²', price: prices.whiteWall, total: whiteWallArea * prices.whiteWall },
        grayWall: { qty: grayWallArea.toFixed(1), unit: 'm²', price: prices.grayWall, total: grayWallArea * prices.grayWall },
        mesh: { qty: meshArea.toFixed(1), unit: 'm²', price: prices.mesh, total: meshArea * prices.mesh },
        kickPlate: { qty: kickPlateLength.toFixed(1), unit: 'mb', price: prices.kickPlate, total: kickPlateLength * prices.kickPlate },
        singleDoors: { qty: singleDoors, unit: 'szt', price: prices.doorSingle, total: singleDoors * prices.doorSingle },
        doubleDoors: { qty: doubleDoors, unit: 'szt', price: prices.doorDouble, total: doubleDoors * prices.doorDouble },
        rollers15: { qty: rollers15, unit: 'szt', price: prices.roller15, total: rollers15 * prices.roller15 },
        rollers20: { qty: rollers20, unit: 'szt', price: prices.roller20, total: rollers20 * prices.roller20 },
        electroLocks: { qty: electroLocks, unit: 'szt', price: prices.electroLock, total: electroLocks * prices.electroLock },
        soffit: { qty: soffitLength.toFixed(1), unit: 'mb', price: prices.soffit, total: soffitLength * prices.soffit },
        gate: { qty: state.needsGate ? 1 : 0, unit: 'szt', price: prices.gate, total: state.needsGate ? prices.gate : 0 },
        cameras: { qty: cameras, unit: 'szt', price: prices.camera, total: cameras * prices.camera },
        lamps: { qty: lamps, unit: 'szt', price: prices.lamp, total: lamps * prices.lamp }
    };
    
    // Calculate grand total
    calculatedCosts.grandTotal = Object.values(calculatedCosts).reduce((sum, item) => {
        return sum + (item.total || 0);
    }, 0);
    
    // Render cost summary
    renderCostSummary();
}

function renderCostSummary() {
    const container = document.getElementById('costSummary');
    
    const costLabels = {
        whiteWall: 'Ściana frontowa (biała)',
        grayWall: 'Ściana działowa (szara)',
        mesh: 'Siatka zabezpieczająca',
        kickPlate: 'Kick Plate (odbojnica)',
        singleDoors: 'Drzwi pojedyncze (1m)',
        doubleDoors: 'Drzwi podwójne (2m)',
        rollers15: 'Roleta 1.5m',
        rollers20: 'Roleta 2m',
        electroLocks: 'Zamki elektroniczne',
        soffit: 'Sufit (soffit)',
        gate: 'Brama wjazdowa',
        cameras: 'Kamery',
        lamps: 'Oświetlenie LED'
    };
    
    let html = `<table class="cost-table">
        <thead>
            <tr>
                <th>Pozycja</th>
                <th>Ilość</th>
                <th>Cena jedn.</th>
                <th class="amount">Wartość</th>
            </tr>
        </thead>
        <tbody>`;
    
    Object.entries(costLabels).forEach(([key, label]) => {
        const item = calculatedCosts[key];
        if (item && item.qty > 0) {
            html += `<tr>
                <td>${label}</td>
                <td>${item.qty} ${item.unit}</td>
                <td>${formatCurrency(item.price)}/${item.unit}</td>
                <td class="amount">${formatCurrency(item.total)}</td>
            </tr>`;
        }
    });
    
    html += `</tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="3">SUMA CAŁKOWITA</td>
                <td class="amount">${formatCurrency(calculatedCosts.grandTotal)}</td>
            </tr>
        </tfoot>
    </table>`;
    
    container.innerHTML = html;
}

// ===== CASH FLOW CALCULATIONS =====
function calculateCashFlow() {
    if (!calculatedCosts) {
        alert('Najpierw wygeneruj plan!');
        return;
    }
    
    const totalInvestment = calculatedCosts.grandTotal;
    const maxRentableArea = state.netArea * (cashFlowParams.maxOccupancy / 100);
    const monthlyRent = cashFlowParams.rentPrice;
    const monthlyGrowth = cashFlowParams.monthlyRental;
    const licenseFeeRate = cashFlowParams.licenseFee / 100;
    const fixedCosts = cashFlowParams.fixedCosts;
    const contractMonths = cashFlowParams.contractLength * 12;
    
    // Calculate monthly cash flows
    const monthlyData = [];
    let currentRentedArea = 0;
    let cumulativeCashFlow = -totalInvestment;
    let breakEvenMonth = null;
    
    for (let month = 1; month <= contractMonths; month++) {
        // Increase rented area
        currentRentedArea = Math.min(currentRentedArea + monthlyGrowth, maxRentableArea);
        
        // Calculate revenues
        const grossRevenue = currentRentedArea * monthlyRent;
        const licenseFee = grossRevenue * licenseFeeRate;
        const netRevenue = grossRevenue - licenseFee - fixedCosts;
        
        cumulativeCashFlow += netRevenue;
        
        if (breakEvenMonth === null && cumulativeCashFlow >= 0) {
            breakEvenMonth = month;
        }
        
        monthlyData.push({
            month,
            rentedArea: currentRentedArea,
            grossRevenue,
            licenseFee,
            fixedCosts,
            netRevenue,
            cumulativeCashFlow
        });
    }
    
    // Calculate summary metrics
    const monthlyRevenueAtMax = maxRentableArea * monthlyRent;
    const monthlyNetAtMax = monthlyRevenueAtMax - (monthlyRevenueAtMax * licenseFeeRate) - fixedCosts;
    const totalProfit = cumulativeCashFlow;
    const roi = ((totalProfit + totalInvestment) / totalInvestment * 100 - 100).toFixed(1);
    const annualReturn = (roi / cashFlowParams.contractLength).toFixed(1);
    
    cashFlowResults = {
        totalInvestment,
        maxRentableArea,
        breakEvenMonth,
        monthlyRevenueAtMax,
        monthlyNetAtMax,
        totalProfit,
        roi,
        annualReturn,
        monthlyData
    };
    
    // Render results
    renderCashFlowResults();
    renderCashFlowChart();
}

function renderCashFlowResults() {
    const container = document.getElementById('cashflowResults');
    
    const breakEvenText = cashFlowResults.breakEvenMonth 
        ? `${cashFlowResults.breakEvenMonth} msc (${(cashFlowResults.breakEvenMonth / 12).toFixed(1)} lat)`
        : 'Powyżej okresu kontraktu';
    
    container.innerHTML = `
        <div class="financial-metrics">
            <div class="metric-card highlight">
                <span class="metric-value">${formatCurrency(cashFlowResults.totalInvestment)}</span>
                <span class="metric-label">Całkowita inwestycja</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${formatNumber(cashFlowResults.maxRentableArea, 1)} m²</span>
                <span class="metric-label">Max. pow. do wynajęcia</span>
            </div>
            <div class="metric-card success">
                <span class="metric-value">${breakEvenText}</span>
                <span class="metric-label">Próg rentowności</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${formatCurrency(cashFlowResults.monthlyRevenueAtMax)}</span>
                <span class="metric-label">Przychód msc (max)</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${formatCurrency(cashFlowResults.monthlyNetAtMax)}</span>
                <span class="metric-label">Zysk netto msc (max)</span>
            </div>
            <div class="metric-card highlight">
                <span class="metric-value">${cashFlowResults.roi}%</span>
                <span class="metric-label">ROI (${cashFlowParams.contractLength} lat)</span>
            </div>
            <div class="metric-card">
                <span class="metric-value">${cashFlowResults.annualReturn}%</span>
                <span class="metric-label">Śr. roczny zwrot</span>
            </div>
            <div class="metric-card success">
                <span class="metric-value">${formatCurrency(cashFlowResults.totalProfit)}</span>
                <span class="metric-label">Całkowity zysk</span>
            </div>
        </div>
    `;
}

function renderCashFlowChart() {
    const ctx = document.getElementById('cashflowChart').getContext('2d');
    
    // Destroy existing chart
    if (cashFlowChart) {
        cashFlowChart.destroy();
    }
    
    // Prepare data (yearly aggregation for readability)
    const years = [];
    const revenue = [];
    const profit = [];
    const cumulative = [];
    
    for (let year = 1; year <= cashFlowParams.contractLength; year++) {
        years.push(`Rok ${year}`);
        
        const yearData = cashFlowResults.monthlyData.slice((year - 1) * 12, year * 12);
        const yearRevenue = yearData.reduce((sum, m) => sum + m.grossRevenue, 0);
        const yearProfit = yearData.reduce((sum, m) => sum + m.netRevenue, 0);
        const yearEndCumulative = yearData[yearData.length - 1]?.cumulativeCashFlow || 0;
        
        revenue.push(yearRevenue);
        profit.push(yearProfit);
        cumulative.push(yearEndCumulative);
    }
    
    cashFlowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Przychód roczny',
                    data: revenue,
                    backgroundColor: 'rgba(0, 102, 204, 0.7)',
                    borderColor: 'rgba(0, 102, 204, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Zysk netto roczny',
                    data: profit,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Skumulowany Cash Flow',
                    data: cumulative,
                    type: 'line',
                    borderColor: 'rgba(255, 140, 0, 1)',
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// ===== SUMMARY GENERATION =====
function generateSummary() {
    const container = document.getElementById('summaryContent');
    
    const avgBox = state.boxes.length > 0 ? (state.netArea / state.boxes.length).toFixed(2) : 0;
    const smallBoxes = state.boxes.filter(b => b.category === 'small').length;
    const mediumBoxes = state.boxes.filter(b => b.category === 'medium').length;
    const largeBoxes = state.boxes.filter(b => b.category === 'large').length;
    
    // Round down to thousands
    const roundedCost = calculatedCosts ? Math.floor(calculatedCosts.grandTotal / 1000) * 1000 : 0;
    
    container.innerHTML = `
        <div class="summary-section">
            <div class="summary-header">
                <h2><i class="fas fa-warehouse"></i> Projekt Self-Storage</h2>
            </div>
            <div class="summary-body">
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="value">${state.grossArea} m²</span>
                        <span class="label">Powierzchnia brutto</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${state.netArea} m²</span>
                        <span class="label">Powierzchnia netto</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${state.efficiency}%</span>
                        <span class="label">Wydajność</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${state.boxes.length}</span>
                        <span class="label">Liczba boksów</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <div class="summary-header">
                <h2><i class="fas fa-th"></i> Struktura Boksów</h2>
            </div>
            <div class="summary-body">
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="value" style="color:#26a69a">${smallBoxes}</span>
                        <span class="label">Małe (1-3m²)</span>
                    </div>
                    <div class="summary-item">
                        <span class="value" style="color:#42a5f5">${mediumBoxes}</span>
                        <span class="label">Średnie (4-7m²)</span>
                    </div>
                    <div class="summary-item">
                        <span class="value" style="color:#66bb6a">${largeBoxes}</span>
                        <span class="label">Duże (8-15m²)</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${avgBox} m²</span>
                        <span class="label">Średni rozmiar</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <div class="summary-header">
                <h2><i class="fas fa-cogs"></i> Parametry Techniczne</h2>
            </div>
            <div class="summary-body">
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="value">${state.systemHeight} mm</span>
                        <span class="label">Wysokość systemu</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${state.corridorWidth} mm</span>
                        <span class="label">Szerokość korytarza</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${state.frontWallLength} mb</span>
                        <span class="label">Ściany frontowe</span>
                    </div>
                    <div class="summary-item">
                        <span class="value">${state.partitionWallLength} mb</span>
                        <span class="label">Ścianki działowe</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${calculatedCosts ? `
        <div class="summary-total">
            <span class="label">Szacunkowy koszt inwestycji (w przybliżeniu)</span>
            <span class="value">~ ${formatCurrency(roundedCost)}</span>
        </div>
        <p class="summary-note">* Koszt zaokrąglony w dół do tysięcy PLN</p>
        ` : ''}
        
        <!-- AI Analysis Section -->
        <div class="summary-section ai-analysis-section">
            <div class="summary-header">
                <h2><i class="fas fa-robot"></i> Analiza AI - Optymalizacja ROI</h2>
                <button class="btn btn-primary btn-sm" id="generateAiAnalysis">
                    <i class="fas fa-magic"></i> Generuj analizę
                </button>
            </div>
            <div class="summary-body">
                <div id="aiAnalysisContent" class="ai-analysis-content">
                    <div class="ai-analysis-placeholder">
                        <i class="fas fa-lightbulb"></i>
                        <p>Kliknij "Generuj analizę" aby otrzymać rekomendacje AI dotyczące optymalizacji projektu</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for AI analysis button
    document.getElementById('generateAiAnalysis').addEventListener('click', generateAIAnalysis);
}

// ===== AI ANALYSIS FOR ROI OPTIMIZATION =====
async function generateAIAnalysis() {
    const container = document.getElementById('aiAnalysisContent');
    const apiKey = localStorage.getItem('openai_api_key');
    
    if (!apiKey) {
        container.innerHTML = `
            <div class="ai-analysis-error">
                <i class="fas fa-key"></i>
                <p>Skonfiguruj klucz API OpenAI w ustawieniach (ikona zębatki)</p>
            </div>
        `;
        return;
    }
    
    // Show loading
    container.innerHTML = `
        <div class="ai-loading">
            <div class="spinner"></div>
            <p>Analizuję projekt...</p>
        </div>
    `;
    
    // Prepare data for analysis
    const boxCounts = getBoxCountsBySize();
    const smallBoxes = state.boxes.filter(b => b.category === 'small').length;
    const mediumBoxes = state.boxes.filter(b => b.category === 'medium').length;
    const largeBoxes = state.boxes.filter(b => b.category === 'large').length;
    const roundedCost = Math.floor(calculatedCosts.grandTotal / 1000) * 1000;
    
    let boxBreakdown = '';
    Object.entries(boxCounts).forEach(([size, count]) => {
        boxBreakdown += `${count}x ${size}m², `;
    });
    
    const prompt = `Jesteś ekspertem w branży Self-Storage. Przeanalizuj poniższy projekt i podaj konkretne rekomendacje dotyczące optymalizacji ROI i kosztów.

DANE PROJEKTU:
- Powierzchnia brutto: ${state.grossArea} m²
- Powierzchnia netto (boksy): ${state.netArea} m²
- Wydajność: ${state.efficiency}%
- Liczba boksów: ${state.boxes.length}
- Podział: ${smallBoxes} małych (1-3m²), ${mediumBoxes} średnich (4-7m²), ${largeBoxes} dużych (8-15m²)
- Szczegółowy rozkład: ${boxBreakdown.slice(0, -2)}
- Średni rozmiar boksu: ${(state.netArea / state.boxes.length).toFixed(2)} m²
- Szacunkowy koszt inwestycji: ${roundedCost} PLN
- Cena najmu: ${cashFlowParams.rentPrice} PLN/m²/msc
${cashFlowResults ? `- ROI (${cashFlowParams.contractLength} lat): ${cashFlowResults.roi}%
- Próg rentowności: ${cashFlowResults.breakEvenMonth} miesięcy` : ''}

Podaj analizę w następującym formacie:
1. OCENA MIKSU BOKSÓW - czy obecny podział jest optymalny dla ROI
2. REKOMENDACJE OPTYMALIZACJI - konkretne zmiany w strukturze boksów
3. POTENCJAŁ ZWIĘKSZENIA PRZYCHODÓW - ile można zyskać przy optymalizacji
4. RYZYKA I UWAGI - na co zwrócić uwagę

Odpowiedz zwięźle, konkretnie, po polsku. Maksymalnie 300 słów.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Jesteś ekspertem w branży Self-Storage z 15-letnim doświadczeniem w Polsce. Analizujesz projekty pod kątem maksymalizacji ROI.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 800,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Błąd API');
        }
        
        const data = await response.json();
        const analysis = data.choices[0].message.content;
        
        // Format and display analysis
        container.innerHTML = `
            <div class="ai-analysis-result">
                ${formatAIAnalysis(analysis)}
                <div class="analysis-footer">
                    <span><i class="fas fa-robot"></i> Wygenerowano przez AI (GPT-4)</span>
                    <button class="btn btn-secondary btn-sm" onclick="generateAIAnalysis()">
                        <i class="fas fa-sync-alt"></i> Odśwież
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('AI Analysis Error:', error);
        container.innerHTML = `
            <div class="ai-analysis-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Błąd: ${error.message}</p>
                <button class="btn btn-secondary btn-sm" onclick="generateAIAnalysis()">Spróbuj ponownie</button>
            </div>
        `;
    }
}

function formatAIAnalysis(text) {
    // Convert markdown-like formatting to HTML
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/(\d+)\.\s+(.*?)(?=<br>|<\/p>|$)/g, '<div class="analysis-point"><span class="point-number">$1</span><span class="point-text">$2</span></div>');
    
    return `<p>${html}</p>`;
}

// ===== PRINT REPORT =====
function printReport() {
    if (!calculatedCosts) {
        alert('Najpierw wygeneruj plan!');
        return;
    }
    
    const printContainer = document.getElementById('printContent');
    
    // Get box counts
    const boxCounts = getBoxCountsBySize();
    const sortedSizes = Object.keys(boxCounts).map(Number).sort((a, b) => a - b);
    const smallBoxes = state.boxes.filter(b => b.category === 'small').length;
    const mediumBoxes = state.boxes.filter(b => b.category === 'medium').length;
    const largeBoxes = state.boxes.filter(b => b.category === 'large').length;
    
    // Round cost down to thousands
    const roundedCost = Math.floor(calculatedCosts.grandTotal / 1000) * 1000;
    
    // Build box table rows
    let boxTableRows = '';
    let totalCount = 0;
    let totalArea = 0;
    
    sortedSizes.forEach(size => {
        const count = boxCounts[size];
        const area = size * count;
        totalCount += count;
        totalArea += area;
        boxTableRows += `<tr><td>${size} m²</td><td>${count} szt.</td><td>${area} m²</td></tr>`;
    });
    
    // Build cost table rows
    const costLabels = {
        whiteWall: 'Ściana frontowa (biała)',
        grayWall: 'Ściana działowa (szara)',
        mesh: 'Siatka zabezpieczająca',
        kickPlate: 'Kick Plate (odbojnica)',
        singleDoors: 'Drzwi pojedyncze (1m)',
        doubleDoors: 'Drzwi podwójne (2m)',
        rollers15: 'Roleta 1.5m',
        rollers20: 'Roleta 2m',
        electroLocks: 'Zamki elektroniczne',
        soffit: 'Sufit (soffit)',
        gate: 'Brama wjazdowa',
        cameras: 'Kamery',
        lamps: 'Oświetlenie LED'
    };
    
    let costTableRows = '';
    Object.entries(costLabels).forEach(([key, label]) => {
        const item = calculatedCosts[key];
        if (item && item.qty > 0) {
            costTableRows += `<tr>
                <td>${label}</td>
                <td>${item.qty} ${item.unit}</td>
                <td>${formatCurrency(item.price)}/${item.unit}</td>
                <td style="text-align:right;font-weight:600;">${formatCurrency(item.total)}</td>
            </tr>`;
        }
    });
    
    // Cash flow data
    let cashFlowSection = '';
    if (cashFlowResults) {
        const breakEvenText = cashFlowResults.breakEvenMonth 
            ? `${cashFlowResults.breakEvenMonth} msc (${(cashFlowResults.breakEvenMonth / 12).toFixed(1)} lat)`
            : 'Powyżej okresu kontraktu';
        
        cashFlowSection = `
            <div class="print-section">
                <h2>Analiza Cash Flow</h2>
                <div class="print-grid">
                    <div class="print-stat">
                        <span class="value">${formatCurrency(cashFlowResults.maxRentableArea * cashFlowParams.rentPrice)}</span>
                        <span class="label">Przychód msc (max)</span>
                    </div>
                    <div class="print-stat">
                        <span class="value">${formatCurrency(cashFlowResults.monthlyNetAtMax)}</span>
                        <span class="label">Zysk netto msc</span>
                    </div>
                    <div class="print-stat">
                        <span class="value">${breakEvenText}</span>
                        <span class="label">Próg rentowności</span>
                    </div>
                    <div class="print-stat">
                        <span class="value">${cashFlowResults.roi}%</span>
                        <span class="label">ROI (${cashFlowParams.contractLength} lat)</span>
                    </div>
                </div>
                <table class="print-table">
                    <tr><th>Parametr</th><th>Wartość</th></tr>
                    <tr><td>Cena najmu</td><td>${cashFlowParams.rentPrice} PLN/m²/msc</td></tr>
                    <tr><td>Komercjalizacja</td><td>${cashFlowParams.monthlyRental} m²/msc</td></tr>
                    <tr><td>Max. obłożenie</td><td>${cashFlowParams.maxOccupancy}%</td></tr>
                    <tr><td>Długość kontraktu</td><td>${cashFlowParams.contractLength} lat</td></tr>
                    <tr><td>Opłata licencyjna</td><td>${cashFlowParams.licenseFee}%</td></tr>
                    <tr><td>Koszty stałe</td><td>${formatCurrency(cashFlowParams.fixedCosts)}/msc</td></tr>
                    <tr class="total-row"><td>Całkowity zysk (${cashFlowParams.contractLength} lat)</td><td>${formatCurrency(cashFlowResults.totalProfit)}</td></tr>
                </table>
            </div>
        `;
    }
    
    // Generate print content
    printContainer.innerHTML = `
        <div class="print-header">
            <h1>Self-Storage - Projekt Inwestycyjny</h1>
            <p>Data: ${new Date().toLocaleDateString('pl-PL')} | Powierzchnia: ${state.grossArea} m²</p>
        </div>
        
        <div class="print-section">
            <h2>Parametry Projektu</h2>
            <div class="print-grid">
                <div class="print-stat">
                    <span class="value">${state.grossArea} m²</span>
                    <span class="label">Pow. brutto</span>
                </div>
                <div class="print-stat">
                    <span class="value">${state.netArea} m²</span>
                    <span class="label">Pow. netto</span>
                </div>
                <div class="print-stat">
                    <span class="value">${state.efficiency}%</span>
                    <span class="label">Wydajność</span>
                </div>
                <div class="print-stat">
                    <span class="value">${state.boxes.length}</span>
                    <span class="label">Liczba boksów</span>
                </div>
            </div>
            <div class="print-grid">
                <div class="print-stat">
                    <span class="value">${smallBoxes}</span>
                    <span class="label">Małe (1-3m²)</span>
                </div>
                <div class="print-stat">
                    <span class="value">${mediumBoxes}</span>
                    <span class="label">Średnie (4-7m²)</span>
                </div>
                <div class="print-stat">
                    <span class="value">${largeBoxes}</span>
                    <span class="label">Duże (8-15m²)</span>
                </div>
                <div class="print-stat">
                    <span class="value">${state.systemHeight} mm</span>
                    <span class="label">Wys. systemu</span>
                </div>
            </div>
        </div>
        
        <div class="print-section">
            <h2>Zestawienie Boksów</h2>
            <table class="print-table">
                <tr><th>Rozmiar</th><th>Ilość</th><th>Suma m²</th></tr>
                ${boxTableRows}
                <tr class="total-row"><td>RAZEM</td><td>${totalCount} szt.</td><td>${totalArea} m²</td></tr>
            </table>
        </div>
        
        <div class="print-section">
            <h2>Kalkulacja Kosztów</h2>
            <table class="print-table">
                <tr><th>Pozycja</th><th>Ilość</th><th>Cena jedn.</th><th style="text-align:right;">Wartość</th></tr>
                ${costTableRows}
                <tr class="total-row"><td colspan="3">SUMA</td><td style="text-align:right;">${formatCurrency(calculatedCosts.grandTotal)}</td></tr>
            </table>
        </div>
        
        ${cashFlowSection}
        
        <div class="print-total">
            <span class="label">Szacunkowy koszt inwestycji</span>
            <span class="value">~ ${formatCurrency(roundedCost)}</span>
        </div>
        
        <div class="print-footer">
            <p>Dokument wygenerowany przez Self-Storage Konfigurator Pro | ${new Date().toLocaleString('pl-PL')}</p>
            <p>* Koszty są orientacyjne i mogą ulec zmianie</p>
        </div>
    `;
    
    // Trigger print
    setTimeout(() => {
        window.print();
    }, 100);
}
