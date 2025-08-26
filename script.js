// Global state
let csvData = null;
let ga4Data = null;
let aiData = null;
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeFileUploads();
    initializeAIForm();
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// File Upload Management
function initializeFileUploads() {
    // CSV Upload
    const csvDropzone = document.getElementById('csv-dropzone');
    const csvFileInput = document.getElementById('csv-file-input');
    
    csvDropzone.addEventListener('click', () => csvFileInput.click());
    csvDropzone.addEventListener('dragover', handleDragOver);
    csvDropzone.addEventListener('dragleave', handleDragLeave);
    csvDropzone.addEventListener('drop', (e) => handleFileDrop(e, 'csv'));
    csvFileInput.addEventListener('change', (e) => handleFileSelect(e, 'csv'));

    // GA4 Upload
    const ga4Dropzone = document.getElementById('ga4-dropzone');
    const ga4FileInput = document.getElementById('ga4-file-input');
    
    ga4Dropzone.addEventListener('click', () => ga4FileInput.click());
    ga4Dropzone.addEventListener('dragover', handleDragOver);
    ga4Dropzone.addEventListener('dragleave', handleDragLeave);
    ga4Dropzone.addEventListener('drop', (e) => handleFileDrop(e, 'ga4'));
    ga4FileInput.addEventListener('change', (e) => handleFileSelect(e, 'ga4'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleFileDrop(e, type) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0], type);
    }
}

function handleFileSelect(e, type) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0], type);
    }
}

// File Processing
function processFile(file, type) {
    if (type === 'csv') {
        processCsvFile(file);
    } else if (type === 'ga4') {
        processGa4File(file);
    }
}

function processCsvFile(file) {
    const loadingEl = document.getElementById('csv-loading');
    const errorEl = document.getElementById('csv-error');
    const previewEl = document.getElementById('csv-preview');

    // Show loading, hide error
    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    previewEl.style.display = 'none';

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'txt') {
        parseTextFile(file);
    } else {
        // Use Papa Parse for CSV files
        Papa.parse(file, {
            complete: function(results) {
                try {
                    if (results.errors.length > 0) {
                        showError('csv', `CSV 解析錯誤: ${results.errors[0].message}`);
                        return;
                    }

                    const data = results.data;
                    const headers = data[0];
                    const rows = data.slice(1).filter(row => row.some(cell => cell !== ''));

                    const parsedData = rows.map((row, index) => {
                        const obj = { id: index };
                        headers.forEach((header, i) => {
                            obj[header] = row[i] || '';
                        });
                        return obj;
                    });

                    csvData = parsedData;
                    showCsvPreview(file, parsedData);
                    updateDataVisualization();
                    loadingEl.style.display = 'none';
                } catch (err) {
                    showError('csv', 'CSV 文件處理失敗，請檢查文件格式');
                }
            },
            header: false,
            skipEmptyLines: true,
            encoding: 'UTF-8'
        });
    }
}

function parseTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            // Detect delimiter
            const firstLine = lines[0];
            let delimiter = ',';
            if (firstLine.includes('\t')) delimiter = '\t';
            else if (firstLine.includes(';')) delimiter = ';';
            
            const data = lines.map(line => line.split(delimiter));
            const headers = data[0];
            const rows = data.slice(1);

            const parsedData = rows.map((row, index) => {
                const obj = { id: index };
                headers.forEach((header, i) => {
                    obj[header] = row[i] || '';
                });
                return obj;
            });

            csvData = parsedData;
            showCsvPreview(file, parsedData);
            updateDataVisualization();
            document.getElementById('csv-loading').style.display = 'none';
        } catch (err) {
            showError('csv', 'TXT 文件處理失敗，請檢查文件格式');
        }
    };
    
    reader.onerror = function() {
        showError('csv', '文件讀取失敗');
    };
    
    reader.readAsText(file, 'UTF-8');
}

function processGa4File(file) {
    const loadingEl = document.getElementById('ga4-loading');
    const errorEl = document.getElementById('ga4-error');
    const previewEl = document.getElementById('ga4-preview');

    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    previewEl.style.display = 'none';

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        
        // Simulate processing delay
        setTimeout(() => {
            const mockData = {
                type: 'ga4_screenshot',
                fileName: file.name,
                uploadTime: new Date().toISOString(),
                extractedMetrics: {
                    users: Math.floor(Math.random() * 10000) + 1000,
                    sessions: Math.floor(Math.random() * 15000) + 2000,
                    pageviews: Math.floor(Math.random() * 30000) + 5000,
                    bounceRate: (Math.random() * 30 + 20).toFixed(2) + '%',
                    avgSessionDuration: Math.floor(Math.random() * 300 + 60) + 's'
                },
                note: '這是基於圖像文件名生成的模擬數據。實際應用中需要整合 OCR 或圖像識別 API 來提取真實數據。'
            };

            ga4Data = mockData;
            showGa4Preview(file, imageUrl, mockData);
            updateDataVisualization();
            loadingEl.style.display = 'none';
        }, 2000);
    };

    reader.onerror = function() {
        showError('ga4', '圖像文件讀取失敗');
    };

    reader.readAsDataURL(file);
}

function showError(type, message) {
    const errorEl = document.getElementById(`${type}-error`);
    const loadingEl = document.getElementById(`${type}-loading`);
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    loadingEl.style.display = 'none';
}

function showCsvPreview(file, data) {
    const previewEl = document.getElementById('csv-preview');
    
    const preview = data.slice(0, 5);
    const headers = Object.keys(preview[0]).filter(key => key !== 'id').slice(0, 6);
    
    const html = `
        <div class="file-info">
            <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
            </svg>
            已上傳: ${file.name}
        </div>
        <div>
            <h3 style="font-size: 0.875rem; font-weight: 500; color: #111827; margin-bottom: 0.5rem;">數據預覽 (前 5 行):</h3>
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${preview.slice(0, 3).map(row => 
                            `<tr>
                                ${headers.map(header => {
                                    const value = String(row[header]).slice(0, 20);
                                    const truncated = String(row[header]).length > 20 ? '...' : '';
                                    return `<td>${value}${truncated}</td>`;
                                }).join('')}
                            </tr>`
                        ).join('')}
                    </tbody>
                </table>
            </div>
            <div style="display: flex; justify-content: between; align-items: center; margin-top: 0.5rem; font-size: 0.75rem;">
                <p style="color: #6b7280;">共 ${data.length} 行數據已載入</p>
                <span style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                    ${file.name.endsWith('.txt') ? 'TXT' : 'CSV'} 格式
                </span>
            </div>
        </div>
    `;
    
    previewEl.innerHTML = html;
    previewEl.style.display = 'block';
}

function showGa4Preview(file, imageUrl, data) {
    const previewEl = document.getElementById('ga4-preview');
    
    const html = `
        <div class="file-info">
            <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
            已上傳: ${file.name}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
                <h3 style="font-size: 0.875rem; font-weight: 500; color: #111827; margin-bottom: 0.5rem;">圖片預覽:</h3>
                <img src="${imageUrl}" alt="GA4 Screenshot Preview" style="max-width: 100%; height: auto; border-radius: 0.375rem; border: 1px solid #e5e7eb; max-height: 200px;">
            </div>
            <div>
                <h3 style="font-size: 0.875rem; font-weight: 500; color: #111827; margin-bottom: 0.5rem;">提取的數據:</h3>
                <div style="background: #f9fafb; border-radius: 0.375rem; padding: 0.75rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem;">
                        <div><strong>用戶數:</strong> <span style="color: #3b82f6;">${data.extractedMetrics.users}</span></div>
                        <div><strong>會話數:</strong> <span style="color: #3b82f6;">${data.extractedMetrics.sessions}</span></div>
                        <div><strong>頁面瀏覽量:</strong> <span style="color: #3b82f6;">${data.extractedMetrics.pageviews}</span></div>
                        <div><strong>跳出率:</strong> <span style="color: #3b82f6;">${data.extractedMetrics.bounceRate}</span></div>
                        <div style="grid-column: span 2;"><strong>平均會話時長:</strong> <span style="color: #3b82f6;">${data.extractedMetrics.avgSessionDuration}</span></div>
                    </div>
                    <div style="margin-top: 0.75rem; padding: 0.5rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.25rem; font-size: 0.75rem; color: #92400e;">
                        💡 ${data.note}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    previewEl.innerHTML = html;
    previewEl.style.display = 'block';
}

// AI Form Management
function initializeAIForm() {
    const connectBtn = document.getElementById('connect-ai-btn');
    const disconnectBtn = document.getElementById('disconnect-ai-btn');
    
    connectBtn.addEventListener('click', handleAIConnect);
    disconnectBtn.addEventListener('click', handleAIDisconnect);
    
    // Form validation
    const painPointsInput = document.getElementById('pain-points-input');
    painPointsInput.addEventListener('input', validateAIForm);
}

function validateAIForm() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const painPoints = document.getElementById('pain-points-input').value.trim();
    const connectBtn = document.getElementById('connect-ai-btn');
    
    connectBtn.disabled = !apiKey || !painPoints;
}

function handleAIConnect() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const painPoints = document.getElementById('pain-points-input').value.trim();
    const category = document.getElementById('category-select').value;
    const provider = document.querySelector('input[name="provider"]:checked').value;
    
    if (!apiKey || !painPoints) {
        alert('請輸入 API Key 和描述您的痛點需求');
        return;
    }
    
    const connectBtn = document.getElementById('connect-ai-btn');
    connectBtn.disabled = true;
    connectBtn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center;">
            <div class="spinner" style="margin-right: 0.5rem;"></div>
            AI 分析中...
        </div>
    `;
    
    // Simulate AI connection and analysis
    setTimeout(() => {
        const mockData = generateMockAIData(painPoints, category, provider);
        aiData = mockData;
        
        showAIResults(mockData);
        updateDataVisualization();
        
        connectBtn.disabled = false;
        connectBtn.innerHTML = '🤖 開始 AI 分析';
    }, 3000);
}

function generateMockAIData(painPoints, category, provider) {
    return {
        type: 'ai_enhanced_ga4',
        provider,
        userPainPoints: painPoints,
        selectedCategory: category,
        connectionTime: new Date().toISOString(),
        metrics: {
            users: Math.floor(Math.random() * 50000) + 10000,
            sessions: Math.floor(Math.random() * 75000) + 15000,
            pageviews: Math.floor(Math.random() * 150000) + 30000,
            bounceRate: (Math.random() * 25 + 25).toFixed(2) + '%',
            avgSessionDuration: Math.floor(Math.random() * 240 + 120) + 's',
            conversionRate: (Math.random() * 5 + 1).toFixed(2) + '%',
            revenueGrowth: (Math.random() * 20 + 5).toFixed(1) + '%',
        },
        insights: generateAIInsights(painPoints, category)
    };
}

function generateAIInsights(painPoints, category) {
    const insights = {
        conversion: `針對您的痛點需求「${painPoints}」，基於網站數據提供以下分析建議：

🔍 **問題診斷**
• 轉換率需要提升，目前表現低於行業平均
• 跳出率過高影響用戶留存和轉換
• 結帳流程可能存在障礙

💡 **解決方案**
1. 優化高流量頁面的轉換流程設計
2. A/B 測試不同的 CTA 按鈕和表單設計
3. 改善跳出率高的頁面內容相關性
4. 實施再營銷策略挽回流失用戶

🚀 **預期效果**
• 實施後預計可提升轉換率 15-25%
• 降低跳出率 5-10%
• 增加平均會話時長 10-20%`,

        traffic: `針對您的痛點需求「${painPoints}」，基於網站數據提供以下分析建議：

🔍 **問題診斷**
• 流量來源過於集中，需要多元化
• 有機搜尋流量有增長潛力
• 社交媒體流量佔比偏低

💡 **解決方案**
1. 投資 SEO 優化提升有機流量
2. 加強社交媒體行銷策略
3. 建立推薦流量合作夥伴關係
4. 內容行銷吸引目標受眾

🚀 **預期效果**
• 實施後預計可提升整體流量 20-30%
• 多元化流量來源降低風險
• 提高品牌知名度和曝光度`,

        engagement: `針對您的痛點需求「${painPoints}」，基於網站數據提供以下分析建議：

🔍 **問題診斷**
• 用戶參與度需要提升
• 頁面互動元素不足
• 內容吸引力有待加強

💡 **解決方案**
1. 增加互動元素提高用戶參與
2. 優化內容策略提供更多價值
3. 實施個人化推薦機制
4. 建立用戶社群促進互動

🚀 **預期效果**
• 實施後預計可提升用戶參與度 25-35%
• 增加頁面停留時間
• 提高用戶回訪率`,

        default: `針對您的痛點需求「${painPoints}」，基於網站數據提供以下分析建議：

🔍 **問題診斷**
• 網站整體表現需要優化
• 用戶體驗存在改善空間
• 數據追蹤和分析需要加強

💡 **解決方案**
1. 提升頁面載入速度和用戶體驗
2. 優化行動端適應性
3. 完善站內搜尋和導航功能
4. 建立完整的數據追蹤體系

🚀 **預期效果**
• 實施後預計可提升整體表現 20-30%
• 改善用戶滿意度
• 提高業務轉換效果`
    };

    return insights[category] || insights.default;
}

function showAIResults(data) {
    // Show connection status
    const statusEl = document.getElementById('ai-connection-status');
    statusEl.textContent = `${data.provider === 'google' ? 'Google AI' : 'OpenAI'} 已連接`;
    statusEl.style.display = 'inline-flex';
    
    // Hide form, show results
    document.getElementById('ai-connection-form').style.display = 'none';
    document.getElementById('ai-results').style.display = 'flex';
    
    // Show metrics
    const metricsEl = document.getElementById('ai-metrics');
    metricsEl.innerHTML = `
        <div class="metric-card" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
            <div class="metric-label">用戶數</div>
            <div class="metric-value">${data.metrics.users.toLocaleString()}</div>
        </div>
        <div class="metric-card" style="background: linear-gradient(135deg, #10b981, #059669);">
            <div class="metric-label">轉換率</div>
            <div class="metric-value">${data.metrics.conversionRate}</div>
        </div>
        <div class="metric-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
            <div class="metric-label">營收成長</div>
            <div class="metric-value">${data.metrics.revenueGrowth}</div>
        </div>
        <div class="metric-card" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <div class="metric-label">跳出率</div>
            <div class="metric-value">${data.metrics.bounceRate}</div>
        </div>
    `;
    
    // Show insights
    const insightsEl = document.getElementById('ai-insights');
    insightsEl.textContent = data.insights;
}

function handleAIDisconnect() {
    // Hide connection status
    document.getElementById('ai-connection-status').style.display = 'none';
    
    // Show form, hide results
    document.getElementById('ai-connection-form').style.display = 'flex';
    document.getElementById('ai-results').style.display = 'none';
    
    // Clear form
    document.getElementById('api-key-input').value = '';
    document.getElementById('pain-points-input').value = '';
    document.getElementById('category-select').value = '';
    document.querySelector('input[name="provider"][value="google"]').checked = true;
    
    // Reset AI data
    aiData = null;
    updateDataVisualization();
}

// Data Visualization
function updateDataVisualization() {
    const hasData = csvData || ga4Data || aiData;
    const noDataEl = document.getElementById('no-data-message');
    const ga4AnalysisEl = document.getElementById('ga4-analysis');
    const csvAnalysisEl = document.getElementById('csv-analysis');
    const recommendationsEl = document.getElementById('analysis-recommendations');
    
    if (!hasData) {
        noDataEl.style.display = 'block';
        ga4AnalysisEl.style.display = 'none';
        csvAnalysisEl.style.display = 'none';
        recommendationsEl.style.display = 'none';
        return;
    }
    
    noDataEl.style.display = 'none';
    
    // Show GA4 analysis if we have GA4 or AI data
    if (ga4Data || aiData) {
        showGA4Analysis();
        ga4AnalysisEl.style.display = 'block';
    } else {
        ga4AnalysisEl.style.display = 'none';
    }
    
    // Show CSV analysis if we have CSV data
    if (csvData) {
        showCSVAnalysis();
        csvAnalysisEl.style.display = 'block';
    } else {
        csvAnalysisEl.style.display = 'none';
    }
    
    // Show recommendations
    showRecommendations();
    recommendationsEl.style.display = 'block';
}

function showGA4Analysis() {
    const data = aiData || ga4Data;
    const metricsEl = document.getElementById('ga4-metrics-cards');
    const chartsEl = document.getElementById('ga4-charts');
    
    if (data.type === 'ai_enhanced_ga4') {
        // Show AI enhanced metrics
        metricsEl.innerHTML = `
            <div class="metrics-card">
                <div class="metrics-card-label">用戶數</div>
                <div class="metrics-card-value">${data.metrics.users.toLocaleString()}</div>
            </div>
            <div class="metrics-card green">
                <div class="metrics-card-label">會話數</div>
                <div class="metrics-card-value">${data.metrics.sessions.toLocaleString()}</div>
            </div>
            <div class="metrics-card purple">
                <div class="metrics-card-label">頁面瀏覽量</div>
                <div class="metrics-card-value">${data.metrics.pageviews.toLocaleString()}</div>
            </div>
            <div class="metrics-card orange">
                <div class="metrics-card-label">轉換率</div>
                <div class="metrics-card-value">${data.metrics.conversionRate}</div>
            </div>
        `;
    } else if (data.type === 'ga4_screenshot') {
        // Show screenshot extracted metrics
        metricsEl.innerHTML = `
            <div class="metrics-card">
                <div class="metrics-card-label">用戶數</div>
                <div class="metrics-card-value">${data.extractedMetrics.users.toLocaleString()}</div>
            </div>
            <div class="metrics-card green">
                <div class="metrics-card-label">會話數</div>
                <div class="metrics-card-value">${data.extractedMetrics.sessions.toLocaleString()}</div>
            </div>
            <div class="metrics-card purple">
                <div class="metrics-card-label">頁面瀏覽量</div>
                <div class="metrics-card-value">${data.extractedMetrics.pageviews.toLocaleString()}</div>
            </div>
            <div class="metrics-card orange">
                <div class="metrics-card-label">跳出率</div>
                <div class="metrics-card-value">${data.extractedMetrics.bounceRate}</div>
            </div>
        `;
    }
    
    // Create a simple chart using Chart.js
    chartsEl.innerHTML = `
        <div class="chart-container">
            <h3 class="chart-title">數據概覽</h3>
            <canvas id="ga4Chart" class="chart-canvas"></canvas>
        </div>
    `;
    
    createGA4Chart(data);
}

function createGA4Chart(data) {
    const ctx = document.getElementById('ga4Chart').getContext('2d');
    
    let chartData;
    if (data.type === 'ai_enhanced_ga4') {
        chartData = [
            { label: '用戶數', value: data.metrics.users },
            { label: '會話數', value: data.metrics.sessions },
            { label: '頁面瀏覽量', value: data.metrics.pageviews }
        ];
    } else {
        chartData = [
            { label: '用戶數', value: data.extractedMetrics.users },
            { label: '會話數', value: data.extractedMetrics.sessions },
            { label: '頁面瀏覽量', value: data.extractedMetrics.pageviews }
        ];
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(item => item.label),
            datasets: [{
                data: chartData.map(item => item.value),
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function showCSVAnalysis() {
    const metricsEl = document.getElementById('csv-metrics-cards');
    const chartsEl = document.getElementById('csv-charts');
    const tableEl = document.getElementById('csv-table');
    
    // Show CSV metrics
    const numericKeys = getNumericKeys(csvData);
    metricsEl.innerHTML = `
        <div class="metrics-card">
            <div class="metrics-card-label">總記錄數</div>
            <div class="metrics-card-value">${csvData.length}</div>
        </div>
        <div class="metrics-card green">
            <div class="metrics-card-label">欄位數</div>
            <div class="metrics-card-value">${Object.keys(csvData[0]).filter(key => key !== 'id').length}</div>
        </div>
        <div class="metrics-card purple">
            <div class="metrics-card-label">數值欄位</div>
            <div class="metrics-card-value">${numericKeys.length}</div>
        </div>
    `;
    
    // Create chart if we have numeric data
    if (numericKeys.length > 0) {
        chartsEl.innerHTML = `
            <div class="chart-container">
                <h3 class="chart-title">數值數據分布 (前 10 行)</h3>
                <canvas id="csvChart" class="chart-canvas"></canvas>
            </div>
        `;
        createCSVChart(csvData, numericKeys);
    } else {
        chartsEl.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">無數值數據可視覺化</p>';
    }
    
    // Show data table
    showDataTable(csvData);
}

function getNumericKeys(data) {
    if (!data || data.length === 0) return [];
    
    const keys = Object.keys(data[0]).filter(key => key !== 'id');
    return keys.filter(key => {
        const sampleValue = data[0][key];
        return !isNaN(Number(sampleValue)) && sampleValue !== '';
    });
}

function createCSVChart(data, numericKeys) {
    const ctx = document.getElementById('csvChart').getContext('2d');
    const chartData = data.slice(0, 10).map((item, index) => ({
        index: index + 1,
        ...Object.fromEntries(numericKeys.slice(0, 5).map(key => [key, Number(item[key]) || 0]))
    }));
    
    const datasets = numericKeys.slice(0, 5).map((key, index) => ({
        label: key,
        data: chartData.map(item => item[key]),
        borderColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index],
        backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'][index] + '20',
        borderWidth: 2,
        fill: false
    }));
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(item => item.index),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function showDataTable(data) {
    const tableEl = document.getElementById('csv-table');
    const headers = Object.keys(data[0]).filter(key => key !== 'id').slice(0, 8);
    const rows = data.slice(0, 5);
    
    const html = `
        <div class="data-table-container">
            <div class="table-header">
                <h3 class="table-title">數據表格預覽</h3>
            </div>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => 
                            `<tr>
                                ${headers.map(header => {
                                    const value = String(row[header]).slice(0, 30);
                                    const truncated = String(row[header]).length > 30 ? '...' : '';
                                    return `<td>${value}${truncated}</td>`;
                                }).join('')}
                            </tr>`
                        ).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    tableEl.innerHTML = html;
}

function showRecommendations() {
    const contentEl = document.getElementById('recommendations-content');
    let recommendations = [];
    
    if (ga4Data || aiData) {
        recommendations.push({
            icon: 'blue',
            title: 'GA4 數據洞察',
            content: aiData ? 
                `基於您的痛點「${aiData.userPainPoints}」，AI 已提供專業分析建議。建議定期監控關鍵指標變化。` :
                '基於截圖提取的數據，建議定期監控這些關鍵指標的變化趨勢。'
        });
    }
    
    if (csvData) {
        recommendations.push({
            icon: 'green',
            title: 'CSV 數據分析',
            content: `您的數據集包含 ${csvData.length} 筆記錄。建議進一步清理數據並探索變數之間的關聯性。`
        });
    }
    
    const html = recommendations.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-icon ${rec.icon}">
                <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                </svg>
            </div>
            <div class="recommendation-content">
                <h3>${rec.title}</h3>
                <p>${rec.content}</p>
            </div>
        </div>
    `).join('');
    
    contentEl.innerHTML = html;
}