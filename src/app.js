'use strict';

/**
 * ============================================================================
 * STUDIO ANALYTICS - MAIN APPLICATION
 * ============================================================================
 * Core Instagram analysis functionality with file handling, data processing,
 * visualization, and export capabilities.
 *
 * @author NexusApp Studio
 * @version 3.0.0
 */

const InstagramAnalyzer = (function() {

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    const logger = window.StudioLogger?.create('App') || console;
    const config = () => window.StudioConfig || {};
    const utils = () => window.StudioUtils || {};

    // Data storage
    let followersData = null;
    let followingData = null;
    let analysisResults = null;
    let currentChart = null;
    let botAnalysisResults = null;

    // Pagination
    let currentPage = 1;
    const itemsPerPage = 50;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize the application
     */
    function init() {
        logger.info?.('Initializing Instagram Analyzer');

        setupEventListeners();
        setupDragAndDrop();

        logger.info?.('Instagram Analyzer ready');
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        const $ = utils().$ || document.getElementById.bind(document);

        // File upload buttons
        const followersBtn = $('followersBtn');
        const followingBtn = $('followingBtn');
        const followersInput = $('followersInput');
        const followingInput = $('followingInput');

        if (followersBtn) {
            followersBtn.addEventListener('click', () => followersInput?.click());
        }
        if (followingBtn) {
            followingBtn.addEventListener('click', () => followingInput?.click());
        }

        if (followersInput) {
            followersInput.addEventListener('change', (e) => handleFileUpload(e, 'followers'));
        }
        if (followingInput) {
            followingInput.addEventListener('change', (e) => handleFileUpload(e, 'following'));
        }

        // Analysis buttons
        const analyzeBtn = $('analyzeBtn');
        const newAnalysisBtn = $('newAnalysisBtn');

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', analyzeData);
        }
        if (newAnalysisBtn) {
            newAnalysisBtn.addEventListener('click', confirmReset);
        }

        // Export
        const exportBtn = $('exportBtn');
        const closeExportModal = $('closeExportModal');

        if (exportBtn) {
            exportBtn.addEventListener('click', showExportModal);
        }
        if (closeExportModal) {
            closeExportModal.addEventListener('click', hideExportModal);
        }

        // Export options
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => exportData(btn.dataset.format));
        });

        // Search
        const searchInput = $('searchInput');
        if (searchInput) {
            const debouncedSearch = utils().debounce?.(filterUsers, 300) || filterUsers;
            searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        }

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Modal close on outside click
        const exportModal = $('exportModal');
        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) {
                    hideExportModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    /**
     * Setup drag and drop for file upload
     */
    function setupDragAndDrop() {
        const uploadCard = document.querySelector('.upload-card');
        if (!uploadCard) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadCard.addEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadCard.addEventListener(eventName, () => {
                uploadCard.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadCard.addEventListener(eventName, () => {
                uploadCard.classList.remove('drag-over');
            });
        });

        uploadCard.addEventListener('drop', handleDrop);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                const fileName = file.name.toLowerCase();
                if (fileName.includes('follower')) {
                    processFile(file, 'followers');
                } else if (fileName.includes('following')) {
                    processFile(file, 'following');
                } else {
                    const type = confirm('¿Este archivo contiene seguidores? (Cancelar = Siguiendo)')
                        ? 'followers' : 'following';
                    processFile(file, type);
                }
            }
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboardShortcuts(e) {
        if (e.key === 'Escape') {
            hideExportModal();
        }

        if (e.ctrlKey && e.key === 'Enter') {
            if (followersData && followingData) {
                analyzeData();
            }
        }
    }

    // ========================================================================
    // FILE HANDLING
    // ========================================================================

    /**
     * Handle file upload event
     */
    async function handleFileUpload(e, type) {
        const file = e.target.files[0];
        if (!file) return;

        await processFile(file, type);
    }

    /**
     * Process uploaded file
     */
    async function processFile(file, type) {
        const uploadConfig = config().UPLOAD || {};
        const maxSize = uploadConfig.MAX_FILE_SIZE || 10 * 1024 * 1024;

        if (file.size > maxSize) {
            showToast(config().MESSAGES?.ERRORS?.FILE_TOO_LARGE || 'Archivo demasiado grande', 'error');
            return;
        }

        if (!file.type.includes('json') && !file.name.endsWith('.json')) {
            showToast(config().MESSAGES?.ERRORS?.INVALID_FILE_TYPE || 'Solo archivos JSON', 'error');
            return;
        }

        updateStatus(type === 'followers' ? 'followersStatus' : 'followingStatus', '⏳ Cargando...');

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const usernames = extractUsernames(data, type);

            if (usernames.length === 0) {
                showToast(config().MESSAGES?.ERRORS?.NO_USERS_FOUND || 'No se encontraron usuarios', 'error');
                updateStatus(type === 'followers' ? 'followersStatus' : 'followingStatus', '❌');
                return;
            }

            if (type === 'followers') {
                followersData = usernames;
                updateStatus('followersStatus', `✅ ${formatNumber(usernames.length)} seguidores`);
            } else {
                followingData = usernames;
                updateStatus('followingStatus', `✅ ${formatNumber(usernames.length)} siguiendo`);
            }

            checkAnalyzeButton();
            showToast(`${formatNumber(usernames.length)} usuarios cargados`, 'success');
            logger.info?.(`Loaded ${usernames.length} ${type}`);

        } catch (error) {
            logger.error?.('File parse error', error);
            showToast(config().MESSAGES?.ERRORS?.INVALID_JSON || 'Error al leer el archivo', 'error');
            updateStatus(type === 'followers' ? 'followersStatus' : 'followingStatus', '❌');
        }
    }

    /**
     * Extract usernames from Instagram JSON data
     */
    function extractUsernames(data, type) {
        let usernames = [];

        try {
            if (Array.isArray(data)) {
                usernames = data
                    .map(item => {
                        if (item.string_list_data?.[0]?.value) {
                            return item.string_list_data[0].value;
                        }
                        if (item.username) return item.username;
                        if (item.value) return item.value;
                        if (typeof item === 'string') return item;
                        return null;
                    })
                    .filter(Boolean);
            } else if (typeof data === 'object') {
                const key = type === 'followers' ? 'relationships_followers' : 'relationships_following';

                if (data[key] && Array.isArray(data[key])) {
                    usernames = data[key]
                        .map(item => item.string_list_data?.[0]?.value || item.username)
                        .filter(Boolean);
                } else {
                    for (const value of Object.values(data)) {
                        if (Array.isArray(value) && value.length > 0) {
                            const extracted = value
                                .map(item => item.string_list_data?.[0]?.value || item.username)
                                .filter(Boolean);
                            if (extracted.length > 0) {
                                usernames = extracted;
                                break;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error?.('Username extraction error', error);
        }

        return [...new Set(usernames.map(u => String(u).trim()).filter(Boolean))];
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    /**
     * Perform the analysis
     */
    async function analyzeData() {
        if (!followersData || !followingData) {
            showToast('Carga ambos archivos primero', 'warning');
            return;
        }

        logger.info?.('Starting analysis');

        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<span class="spinner"></span> Analizando...';
        }

        try {
            const followersSet = new Set(followersData);
            const followingSet = new Set(followingData);

            const notFollowingBack = followingData.filter(u => !followersSet.has(u));
            const mutuals = followingData.filter(u => followersSet.has(u));
            const onlyFollowers = followersData.filter(u => !followingSet.has(u));

            let botAnalysis = null;
            if (config().FEATURES?.ENABLE_BOT_DETECTION && window.StudioAPI?.analyzeBatch) {
                botAnalysis = window.StudioAPI.analyzeBatch(notFollowingBack);
                botAnalysisResults = botAnalysis;
            }

            const engagement = window.StudioAPI?.calculateEngagement(
                followersData.length,
                followingData.length
            );

            analysisResults = {
                followers: followersData.length,
                following: followingData.length,
                notFollowingBack,
                mutuals,
                onlyFollowers,
                botAnalysis,
                engagement,
                timestamp: new Date()
            };

            logger.info?.('Analysis complete', {
                followers: analysisResults.followers,
                following: analysisResults.following,
                notFollowingBack: notFollowingBack.length,
                mutuals: mutuals.length
            });

            displayResults();
            displayEngagementStats();
            await saveToFirebase();

            showToast(config().MESSAGES?.SUCCESS?.ANALYSIS_COMPLETE || '¡Análisis completado!', 'success');

        } catch (error) {
            logger.error?.('Analysis error', error);
            showToast('Error durante el análisis', 'error');
        } finally {
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '🔍 Analizar';
            }
        }
    }

    /**
     * Display analysis results
     */
    function displayResults() {
        if (!analysisResults) return;

        const $ = utils().$ || document.getElementById.bind(document);

        const stats = {
            'statFollowers': formatNumber(analysisResults.followers),
            'statFollowing': formatNumber(analysisResults.following),
            'statNotFollowingBack': formatNumber(analysisResults.notFollowingBack.length),
            'statMutual': formatNumber(analysisResults.mutuals.length)
        };

        Object.entries(stats).forEach(([id, value]) => {
            const el = $(id);
            if (el) el.textContent = value;
        });

        updateElement('countNotFollowing', analysisResults.notFollowingBack.length);
        updateElement('countMutual', analysisResults.mutuals.length);
        updateElement('countOnlyFollowers', analysisResults.onlyFollowers.length);

        renderChart();
        renderList('notFollowingList', analysisResults.notFollowingBack);
        renderList('mutualList', analysisResults.mutuals);
        renderList('onlyFollowersList', analysisResults.onlyFollowers);

        const uploadSection = $('uploadSection');
        const resultsSection = $('resultsSection');

        if (uploadSection) uploadSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';

        switchTab('notFollowing');
    }

    /**
     * Render the chart
     */
    /**
     * Display engagement stats in the second stats row
     */
    function displayEngagementStats() {
        if (!analysisResults) return;

        const $ = utils().$ || document.getElementById.bind(document);

        // Ratio followers/following
        const ratio = analysisResults.following > 0
            ? (analysisResults.followers / analysisResults.following).toFixed(2)
            : '∞';
        updateElement('statRatio', ratio);

        // Engagement rate
        const engagement = analysisResults.engagement?.rate
            ? `${analysisResults.engagement.rate}%`
            : analysisResults.followers > 0
                ? `${((analysisResults.mutuals.length / analysisResults.followers) * 100).toFixed(1)}%`
                : '0%';
        updateElement('statEngagement', engagement);

        // Bots detected
        const botsCount = botAnalysisResults?.summary?.likelyBots || 0;
        updateElement('statBots', formatNumber(botsCount));

        // Only followers
        updateElement('statOnlyFollowers', formatNumber(analysisResults.onlyFollowers.length));

        // Bots tab count
        const botsList = botAnalysisResults?.results?.filter(r => r.analysis.score >= 30) || [];
        updateElement('countBots', botsList.length);

        // Render bots list
        renderList('botsList', botsList.map(r => r.username));
    }

    function renderChart() {
        const canvas = document.getElementById('resultsChart');
        if (!canvas || !analysisResults || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');

        if (currentChart) {
            currentChart.destroy();
        }

        // Luxury palette
        const textColor = '#F0EDE6';
        const mutedColor = '#6B6760';

        currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No te siguen', 'Mutuos', 'Solo te siguen'],
                datasets: [{
                    data: [
                        analysisResults.notFollowingBack.length,
                        analysisResults.mutuals.length,
                        analysisResults.onlyFollowers.length
                    ],
                    backgroundColor: ['#8B3A3A', '#4A5D4A', '#1E2F4A'],
                    hoverBackgroundColor: ['#6B1E1E', '#2E3F2F', '#0B1C2D'],
                    borderWidth: 2,
                    borderColor: '#0A0A10',
                    hoverOffset: 12,
                    hoverBorderColor: '#C9A24D'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 24,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 13, family: 'Poppins', weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#12121C',
                        titleColor: '#C9A24D',
                        bodyColor: textColor,
                        borderColor: 'rgba(201, 162, 77, 0.25)',
                        borderWidth: 1,
                        padding: 16,
                        cornerRadius: 12,
                        displayColors: true,
                        titleFont: { family: 'Poppins', weight: '600' },
                        bodyFont: { family: 'Poppins' },
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return ` ${context.label}: ${formatNumber(context.raw)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1200,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    /**
     * Render a user list
     */
    function renderList(listId, users) {
        const list = document.getElementById(listId);
        if (!list) return;

        list.innerHTML = '';

        if (users.length === 0) {
            list.innerHTML = '<p class="empty-state">No hay usuarios en esta categoría</p>';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, users.length);
        const pageUsers = users.slice(startIndex, endIndex);

        const fragment = document.createDocumentFragment();

        pageUsers.forEach(username => {
            const item = createUserItem(username);
            fragment.appendChild(item);
        });

        list.appendChild(fragment);

        if (users.length > itemsPerPage) {
            const pagination = createPagination(users.length, listId);
            list.appendChild(pagination);
        }
    }

    /**
     * Create a user list item
     */
    function createUserItem(username) {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.setAttribute('role', 'listitem');

        const avatar = window.StudioAPI?.getAvatar(username) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1A1A24&color=C9A24D&size=40&bold=true`;

        let botBadge = '';
        if (botAnalysisResults?.results) {
            const botResult = botAnalysisResults.results.find(r => r.username === username);
            if (botResult && botResult.analysis.score >= 30) {
                const color = botResult.analysis.color;
                botBadge = `<span class="bot-badge" style="background:${color}" title="${botResult.analysis.classification}">${botResult.analysis.score}%</span>`;
            }
        }

        const safeUsername = escapeHTML(username);

        item.innerHTML = `
            <div class="user-info">
                <img src="${avatar}" alt="${safeUsername}" class="user-avatar-small" loading="lazy">
                <span class="username">${safeUsername}</span>
                ${botBadge}
            </div>
            <a href="https://instagram.com/${encodeURIComponent(username)}" target="_blank" rel="noopener noreferrer" class="profile-link" aria-label="Ver perfil de ${safeUsername}">Ver perfil</a>
        `;

        return item;
    }

    /**
     * Create pagination controls
     */
    function createPagination(totalItems, listId) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const pagination = document.createElement('div');
        pagination.className = 'pagination';

        pagination.innerHTML = `
            <button class="btn-page" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← Anterior</button>
            <span class="page-info">Página ${currentPage} de ${totalPages}</span>
            <button class="btn-page" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Siguiente →</button>
        `;

        pagination.querySelectorAll('.btn-page').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    currentPage = page;
                    const users = getListUsers(listId);
                    renderList(listId, users);
                }
            });
        });

        return pagination;
    }

    function getListUsers(listId) {
        if (!analysisResults) return [];
        switch (listId) {
            case 'notFollowingList': return analysisResults.notFollowingBack;
            case 'mutualList': return analysisResults.mutuals;
            case 'onlyFollowersList': return analysisResults.onlyFollowers;
            default: return [];
        }
    }

    // ========================================================================
    // TABS AND FILTERING
    // ========================================================================

    function switchTab(tab) {
        currentPage = 1;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tab);
        });
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    function filterUsers(query) {
        const q = query.toLowerCase().trim();
        document.querySelectorAll('.user-item').forEach(item => {
            const username = item.querySelector('.username')?.textContent?.toLowerCase() || '';
            item.style.display = username.includes(q) ? 'flex' : 'none';
        });
    }

    // ========================================================================
    // EXPORT FUNCTIONALITY
    // ========================================================================

    function showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }
    }

    function hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    async function exportData(format) {
        if (!analysisResults) {
            showToast('No hay datos para exportar', 'warning');
            return;
        }

        hideExportModal();
        showToast(`Generando ${format.toUpperCase()}...`, 'info');

        try {
            switch (format) {
                case 'pdf': await exportPDF(); break;
                case 'excel': exportExcel(); break;
                case 'csv': exportCSV(); break;
                case 'json': exportJSON(); break;
                case 'html': exportHTML(); break;
                case 'txt': exportTXT(); break;
                case 'markdown': exportMarkdown(); break;
                default: showToast('Formato no soportado', 'error');
            }
        } catch (error) {
            logger.error?.('Export error', error);
            showToast('Error al exportar', 'error');
        }
    }

    async function exportPDF() {
        if (typeof jsPDF === 'undefined' && typeof window.jspdf === 'undefined') {
            showToast('Librería PDF no disponible', 'error');
            return;
        }

        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString('es-ES');

        doc.setFontSize(24);
        doc.setTextColor(225, 48, 108);
        doc.text('Studio Analytics', 20, 25);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Reporte de Análisis - ${date}`, 20, 35);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Resumen:', 20, 50);

        doc.setFontSize(12);
        const stats = [
            `Seguidores: ${formatNumber(analysisResults.followers)}`,
            `Siguiendo: ${formatNumber(analysisResults.following)}`,
            `No te siguen: ${formatNumber(analysisResults.notFollowingBack.length)}`,
            `Mutuos: ${formatNumber(analysisResults.mutuals.length)}`,
            `Solo te siguen: ${formatNumber(analysisResults.onlyFollowers.length)}`
        ];

        stats.forEach((stat, i) => {
            doc.text(stat, 25, 60 + (i * 8));
        });

        doc.setFontSize(14);
        doc.text('No te siguen de vuelta:', 20, 110);

        doc.setFontSize(10);
        const maxUsers = Math.min(analysisResults.notFollowingBack.length, 50);
        for (let i = 0; i < maxUsers; i++) {
            const y = 120 + (i * 5);
            if (y > 280) {
                doc.addPage();
                doc.text(analysisResults.notFollowingBack[i], 25, 20);
            } else {
                doc.text(`${i + 1}. ${analysisResults.notFollowingBack[i]}`, 25, y);
            }
        }

        if (analysisResults.notFollowingBack.length > 50) {
            doc.text(`... y ${analysisResults.notFollowingBack.length - 50} más`, 25, 275);
        }

        doc.save('studio-analytics-report.pdf');
        showToast('PDF exportado', 'success');
    }

    function exportExcel() {
        if (typeof XLSX === 'undefined') {
            showToast('Librería Excel no disponible', 'error');
            return;
        }

        const wb = XLSX.utils.book_new();

        const summary = [
            ['Studio Analytics Report'],
            ['Fecha', new Date().toLocaleDateString('es-ES')],
            [''],
            ['Métrica', 'Valor'],
            ['Seguidores', analysisResults.followers],
            ['Siguiendo', analysisResults.following],
            ['No te siguen', analysisResults.notFollowingBack.length],
            ['Mutuos', analysisResults.mutuals.length],
            ['Solo te siguen', analysisResults.onlyFollowers.length]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summary);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

        const wsNotFollowing = XLSX.utils.aoa_to_sheet([
            ['Username', 'Perfil'],
            ...analysisResults.notFollowingBack.map(u => [u, `https://instagram.com/${u}`])
        ]);
        XLSX.utils.book_append_sheet(wb, wsNotFollowing, 'No te siguen');

        const wsMutuals = XLSX.utils.aoa_to_sheet([
            ['Username', 'Perfil'],
            ...analysisResults.mutuals.map(u => [u, `https://instagram.com/${u}`])
        ]);
        XLSX.utils.book_append_sheet(wb, wsMutuals, 'Mutuos');

        const wsOnlyFollowers = XLSX.utils.aoa_to_sheet([
            ['Username', 'Perfil'],
            ...analysisResults.onlyFollowers.map(u => [u, `https://instagram.com/${u}`])
        ]);
        XLSX.utils.book_append_sheet(wb, wsOnlyFollowers, 'Solo te siguen');

        XLSX.writeFile(wb, 'studio-analytics.xlsx');
        showToast('Excel exportado', 'success');
    }

    function exportCSV() {
        let csv = '\ufeff';
        csv += 'Categoría,Username,Perfil\n';

        analysisResults.notFollowingBack.forEach(u => {
            csv += `No te siguen,"${u}",https://instagram.com/${u}\n`;
        });
        analysisResults.mutuals.forEach(u => {
            csv += `Mutuos,"${u}",https://instagram.com/${u}\n`;
        });
        analysisResults.onlyFollowers.forEach(u => {
            csv += `Solo te siguen,"${u}",https://instagram.com/${u}\n`;
        });

        downloadFile(csv, 'studio-analytics.csv', 'text/csv;charset=utf-8');
        showToast('CSV exportado', 'success');
    }

    function exportJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            appVersion: config().APP?.VERSION || '3.0.0',
            summary: {
                followers: analysisResults.followers,
                following: analysisResults.following,
                notFollowingBack: analysisResults.notFollowingBack.length,
                mutuals: analysisResults.mutuals.length,
                onlyFollowers: analysisResults.onlyFollowers.length
            },
            engagement: analysisResults.engagement,
            data: {
                notFollowingBack: analysisResults.notFollowingBack,
                mutuals: analysisResults.mutuals,
                onlyFollowers: analysisResults.onlyFollowers
            }
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'studio-analytics.json', 'application/json');
        showToast('JSON exportado', 'success');
    }

    function exportHTML() {
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Studio Analytics Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #E1306C; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #E1306C; }
        .list { margin: 20px 0; }
        .list h3 { color: #333; }
        .user { padding: 8px; border-bottom: 1px solid #eee; }
        a { color: #E1306C; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>📊 Studio Analytics Report</h1>
    <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
    <div class="stats">
        <div class="stat"><div class="stat-value">${formatNumber(analysisResults.followers)}</div><div>Seguidores</div></div>
        <div class="stat"><div class="stat-value">${formatNumber(analysisResults.following)}</div><div>Siguiendo</div></div>
        <div class="stat"><div class="stat-value">${formatNumber(analysisResults.notFollowingBack.length)}</div><div>No te siguen</div></div>
        <div class="stat"><div class="stat-value">${formatNumber(analysisResults.mutuals.length)}</div><div>Mutuos</div></div>
    </div>
    <div class="list">
        <h3>❌ No te siguen de vuelta (${analysisResults.notFollowingBack.length})</h3>
        ${analysisResults.notFollowingBack.map(u => `<div class="user"><a href="https://instagram.com/${escapeHTML(u)}" target="_blank">${escapeHTML(u)}</a></div>`).join('')}
    </div>
    <div class="list">
        <h3>🤝 Mutuos (${analysisResults.mutuals.length})</h3>
        ${analysisResults.mutuals.map(u => `<div class="user"><a href="https://instagram.com/${escapeHTML(u)}" target="_blank">${escapeHTML(u)}</a></div>`).join('')}
    </div>
</body>
</html>`;

        downloadFile(html, 'studio-analytics.html', 'text/html');
        showToast('HTML exportado', 'success');
    }

    function exportTXT() {
        let txt = `STUDIO ANALYTICS REPORT
${'='.repeat(50)}
Fecha: ${new Date().toLocaleString('es-ES')}

RESUMEN
${'─'.repeat(30)}
Seguidores: ${formatNumber(analysisResults.followers)}
Siguiendo: ${formatNumber(analysisResults.following)}
No te siguen: ${formatNumber(analysisResults.notFollowingBack.length)}
Mutuos: ${formatNumber(analysisResults.mutuals.length)}
Solo te siguen: ${formatNumber(analysisResults.onlyFollowers.length)}

NO TE SIGUEN DE VUELTA (${analysisResults.notFollowingBack.length})
${'─'.repeat(30)}
${analysisResults.notFollowingBack.join('\n')}

MUTUOS (${analysisResults.mutuals.length})
${'─'.repeat(30)}
${analysisResults.mutuals.join('\n')}
`;

        downloadFile(txt, 'studio-analytics.txt', 'text/plain');
        showToast('TXT exportado', 'success');
    }

    function exportMarkdown() {
        const date = new Date().toLocaleString('es-ES');
        let md = `# Studio Analytics Report\n\n`;
        md += `> Generado el ${date}\n\n`;
        md += `## Resumen\n\n`;
        md += `| Métrica | Valor |\n`;
        md += `|---------|-------|\n`;
        md += `| Seguidores | ${formatNumber(analysisResults.followers)} |\n`;
        md += `| Siguiendo | ${formatNumber(analysisResults.following)} |\n`;
        md += `| No te siguen | ${formatNumber(analysisResults.notFollowingBack.length)} |\n`;
        md += `| Mutuos | ${formatNumber(analysisResults.mutuals.length)} |\n`;
        md += `| Solo te siguen | ${formatNumber(analysisResults.onlyFollowers.length)} |\n\n`;

        md += `## No te siguen de vuelta (${analysisResults.notFollowingBack.length})\n\n`;
        analysisResults.notFollowingBack.forEach((user, i) => {
            md += `${i + 1}. [@${user}](https://instagram.com/${user})\n`;
        });

        md += `\n## Mutuos (${analysisResults.mutuals.length})\n\n`;
        analysisResults.mutuals.forEach((user, i) => {
            md += `${i + 1}. [@${user}](https://instagram.com/${user})\n`;
        });

        if (analysisResults.botAnalysis?.summary) {
            md += `\n## Análisis de Bots\n\n`;
            md += `- Probables bots: ${analysisResults.botAnalysis.summary.likelyBots || 0}\n`;
            md += `- Sospechosos: ${analysisResults.botAnalysis.summary.suspicious || 0}\n`;
            md += `- Usuarios reales: ${analysisResults.botAnalysis.summary.realUsers || 0}\n`;
        }

        md += `\n---\n*Generado por Studio Analytics by NexusApp Studio*\n`;

        downloadFile(md, 'studio-analytics.md', 'text/markdown');
        showToast('Markdown exportado', 'success');
    }

    // ========================================================================
    // DATABASE OPERATIONS
    // ========================================================================

    async function saveToFirebase() {
        if (!window.AuthSystem?.isAuthenticated() || !window.DatabaseManager) return;

        const user = window.AuthSystem.getCurrentUser();
        if (!user) return;

        try {
            const data = {
                followers: analysisResults.followers,
                following: analysisResults.following,
                notFollowingBackCount: analysisResults.notFollowingBack.length,
                mutualsCount: analysisResults.mutuals.length,
                onlyFollowersCount: analysisResults.onlyFollowers.length
            };

            if (analysisResults.botAnalysis?.summary) {
                data.botAnalysis = analysisResults.botAnalysis.summary;
            }

            await window.DatabaseManager.saveAnalysis(user.uid, data);
            logger.info?.('Analysis saved to database');

        } catch (error) {
            logger.error?.('Error saving to database', error);
        }
    }

    async function loadHistory() {
        if (!window.AuthSystem?.isAuthenticated() || !window.DatabaseManager) return;

        const user = window.AuthSystem.getCurrentUser();
        if (!user) return;

        try {
            const history = await window.DatabaseManager.loadHistory(user.uid);
            renderHistory(history);
        } catch (error) {
            logger.error?.('Error loading history', error);
        }
    }

    function renderHistory(history) {
        const list = document.getElementById('historyList');
        if (!list) return;

        if (!history || history.length === 0) {
            list.innerHTML = '<p class="empty-state">Sin análisis previos</p>';
            return;
        }

        list.innerHTML = history.map(h => {
            const date = h.createdAt?.toDate?.()
                ? h.createdAt.toDate().toLocaleDateString('es-ES')
                : h.createdAt?.seconds
                    ? new Date(h.createdAt.seconds * 1000).toLocaleDateString('es-ES')
                    : 'Fecha desconocida';

            return `
                <div class="history-item" role="listitem">
                    <div class="history-info">
                        <strong>${formatNumber(h.followers)} seguidores</strong>
                        <span>${formatNumber(h.following)} siguiendo</span>
                        <span class="highlight">${formatNumber(h.notFollowingBackCount || 0)} no te siguen</span>
                    </div>
                    <small class="history-date">${date}</small>
                </div>
            `;
        }).join('');
    }

    // ========================================================================
    // RESET AND UTILITIES
    // ========================================================================

    function confirmReset() {
        if (analysisResults) {
            showConfirmModal('¿Descartar el análisis actual y comenzar uno nuevo?', reset);
            return;
        }
        reset();
    }

    function showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmModalMessage');
        const acceptBtn = document.getElementById('confirmAccept');
        const cancelBtn = document.getElementById('confirmCancel');
        const closeBtn = document.getElementById('closeConfirmModal');

        if (!modal) { if (confirm(message)) onConfirm(); return; }

        if (msgEl) msgEl.textContent = message;
        modal.classList.add('active');

        const cleanup = () => { modal.classList.remove('active'); };

        const handleAccept = () => { cleanup(); onConfirm(); };

        acceptBtn?.addEventListener('click', handleAccept, { once: true });
        cancelBtn?.addEventListener('click', cleanup, { once: true });
        closeBtn?.addEventListener('click', cleanup, { once: true });
    }

    function reset() {
        followersData = null;
        followingData = null;
        analysisResults = null;
        botAnalysisResults = null;
        currentPage = 1;

        updateStatus('followersStatus', '❌');
        updateStatus('followingStatus', '❌');

        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '🔍 Analizar';
        }

        const uploadSection = document.getElementById('uploadSection');
        const resultsSection = document.getElementById('resultsSection');

        if (uploadSection) uploadSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';

        const followersInput = document.getElementById('followersInput');
        const followingInput = document.getElementById('followingInput');
        if (followersInput) followersInput.value = '';
        if (followingInput) followingInput.value = '';

        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }

        logger.info?.('Application reset');
    }

    function updateElement(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function updateStatus(id, text) {
        updateElement(id, text);
    }

    function checkAnalyzeButton() {
        const btn = document.getElementById('analyzeBtn');
        if (btn) btn.disabled = !(followersData && followingData);
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        init,
        reset,
        loadHistory,
        analyzeData,
        getResults: () => analysisResults,
        hasData: () => !!(followersData && followingData),
        isAnalyzed: () => !!analysisResults
    });

})();

// Make available globally
window.InstagramAnalyzer = InstagramAnalyzer;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    if (window.InstagramAnalyzer) {
        window.InstagramAnalyzer.init();
    }
});
