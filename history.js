/**
 * ============================================================================
 * STUDIO ANALYTICS - HISTORY MANAGER COMPONENT
 * ============================================================================
 * Professional history management with visual timeline and comparison
 * 
 * @author NexusApp Studio
 * @version 3.0.0
 * ============================================================================
 */

const HistoryManager = (function() {
    'use strict';

    // ========================================================================
    // STATE
    // ========================================================================

    let historyData = [];
    let filteredData = [];
    let currentFilter = 'all'; // 'all', 'week', 'month', 'year'
    let currentSort = 'date-desc'; // 'date-desc', 'date-asc', 'followers-desc', 'followers-asc'

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize history manager
     */
    async function init() {
        console.log('[HistoryManager] Initializing...');
        
        // Load history from database
        await loadHistory();
        
        // Setup event listeners
        setupEventListeners();
        
        // Render initial view
        render();
    }

    /**
     * Load history from database
     */
    async function loadHistory() {
        const user = window.AuthSystem?.getCurrentUser();
        if (!user) {
            console.log('[HistoryManager] No user logged in');
            return;
        }

        try {
            const history = await window.DatabaseManager?.loadHistory(user.uid, 50);
            historyData = history || [];
            filteredData = [...historyData];
            console.log(`[HistoryManager] Loaded ${historyData.length} records`);
        } catch (error) {
            console.error('[HistoryManager] Error loading history:', error);
            historyData = [];
            filteredData = [];
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('[data-history-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.historyFilter;
                applyFilter(filter);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('historySortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                applySort(e.target.value);
            });
        }

        // Search input
        const searchInput = document.getElementById('historySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                applySearch(e.target.value);
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('historyRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await loadHistory();
                render();
            });
        }
    }

    // ========================================================================
    // FILTERING & SORTING
    // ========================================================================

    /**
     * Apply time filter
     * @param {string} filter - Filter type
     */
    function applyFilter(filter) {
        currentFilter = filter;
        
        const now = new Date();
        const filterDate = new Date();

        switch (filter) {
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                // 'all' - no filtering
                filteredData = [...historyData];
                render();
                return;
        }

        filteredData = historyData.filter(item => {
            const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
            return itemDate >= filterDate;
        });

        render();
    }

    /**
     * Apply sorting
     * @param {string} sortType - Sort type
     */
    function applySort(sortType) {
        currentSort = sortType;

        filteredData.sort((a, b) => {
            switch (sortType) {
                case 'date-desc':
                    return getTimestamp(b) - getTimestamp(a);
                case 'date-asc':
                    return getTimestamp(a) - getTimestamp(b);
                case 'followers-desc':
                    return (b.metrics?.followers || 0) - (a.metrics?.followers || 0);
                case 'followers-asc':
                    return (a.metrics?.followers || 0) - (b.metrics?.followers || 0);
                default:
                    return 0;
            }
        });

        render();
    }

    /**
     * Apply search filter
     * @param {string} query - Search query
     */
    function applySearch(query) {
        if (!query || query.trim() === '') {
            filteredData = [...historyData];
        } else {
            const lowerQuery = query.toLowerCase();
            filteredData = historyData.filter(item => {
                const username = item.username?.toLowerCase() || '';
                const date = formatDate(item.createdAt).toLowerCase();
                return username.includes(lowerQuery) || date.includes(lowerQuery);
            });
        }

        render();
    }

    /**
     * Get timestamp from item
     * @param {object} item - History item
     * @returns {number}
     */
    function getTimestamp(item) {
        if (item.createdAt?.toDate) {
            return item.createdAt.toDate().getTime();
        }
        return new Date(item.createdAt).getTime();
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    /**
     * Render history view
     */
    function render() {
        const container = document.getElementById('historyContainer');
        if (!container) {
            console.warn('[HistoryManager] History container not found');
            return;
        }

        if (filteredData.length === 0) {
            container.innerHTML = renderEmptyState();
            return;
        }

        // Render timeline
        container.innerHTML = `
            <div class="history-timeline">
                ${filteredData.map((item, index) => renderHistoryCard(item, index)).join('')}
            </div>
        `;

        // Attach event listeners to cards
        attachCardListeners();
    }

    /**
     * Render empty state
     * @returns {string} HTML
     */
    function renderEmptyState() {
        return `
            <div class="history-empty-state">
                <div class="empty-icon">📊</div>
                <h3 class="empty-title">No hay análisis guardados</h3>
                <p class="empty-description">
                    Tus análisis de Instagram se guardarán automáticamente aquí.
                    Comienza analizando tus datos para ver tu historial.
                </p>
                <button class="btn-primary" onclick="document.getElementById('uploadSection').scrollIntoView({behavior: 'smooth'})">
                    Comenzar Análisis
                </button>
            </div>
        `;
    }

    /**
     * Render history card
     * @param {object} item - History item
     * @param {number} index - Item index
     * @returns {string} HTML
     */
    function renderHistoryCard(item, index) {
        const metrics = item.metrics || {};
        const date = formatDate(item.createdAt);
        const timeAgo = formatTimeAgo(item.createdAt);

        // Calculate change from previous analysis
        const previousItem = filteredData[index + 1];
        const change = previousItem ? calculateChange(item, previousItem) : null;

        return `
            <div class="history-card" data-analysis-id="${item.id}">
                <div class="history-card-header">
                    <div class="history-card-date">
                        <span class="history-date-main">${date}</span>
                        <span class="history-date-ago">${timeAgo}</span>
                    </div>
                    <div class="history-card-actions">
                        <button class="btn-icon-sm" data-action="view" data-id="${item.id}" title="Ver detalles">
                            👁️
                        </button>
                        <button class="btn-icon-sm" data-action="export" data-id="${item.id}" title="Exportar">
                            📥
                        </button>
                        <button class="btn-icon-sm" data-action="delete" data-id="${item.id}" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>

                <div class="history-card-body">
                    <div class="history-metrics-grid">
                        <div class="history-metric">
                            <div class="metric-label">Seguidores</div>
                            <div class="metric-value">${formatNumber(metrics.followers || 0)}</div>
                            ${change ? renderChange(change.followers) : ''}
                        </div>
                        <div class="history-metric">
                            <div class="metric-label">Siguiendo</div>
                            <div class="metric-value">${formatNumber(metrics.following || 0)}</div>
                            ${change ? renderChange(change.following) : ''}
                        </div>
                        <div class="history-metric">
                            <div class="metric-label">No te siguen</div>
                            <div class="metric-value">${formatNumber(metrics.notFollowingBack || 0)}</div>
                            ${change ? renderChange(change.notFollowingBack, true) : ''}
                        </div>
                        <div class="history-metric">
                            <div class="metric-label">Bots detectados</div>
                            <div class="metric-value">${formatNumber(metrics.botsDetected || 0)}</div>
                            ${change ? renderChange(change.botsDetected, true) : ''}
                        </div>
                    </div>

                    ${metrics.engagementRate ? `
                        <div class="history-engagement">
                            <span class="engagement-label">Engagement Rate:</span>
                            <span class="engagement-value">${metrics.engagementRate.toFixed(2)}%</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render change indicator
     * @param {number} change - Change value
     * @param {boolean} inverse - Inverse colors (red=good, green=bad)
     * @returns {string} HTML
     */
    function renderChange(change, inverse = false) {
        if (change === 0) {
            return '<div class="metric-change neutral">—</div>';
        }

        const isPositive = change > 0;
        const className = inverse 
            ? (isPositive ? 'negative' : 'positive')
            : (isPositive ? 'positive' : 'negative');
        
        const icon = isPositive ? '↑' : '↓';
        const sign = isPositive ? '+' : '';

        return `
            <div class="metric-change ${className}">
                ${icon} ${sign}${change}
            </div>
        `;
    }

    /**
     * Calculate change between two analyses
     * @param {object} current - Current analysis
     * @param {object} previous - Previous analysis
     * @returns {object} Changes
     */
    function calculateChange(current, previous) {
        const curr = current.metrics || {};
        const prev = previous.metrics || {};

        return {
            followers: (curr.followers || 0) - (prev.followers || 0),
            following: (curr.following || 0) - (prev.following || 0),
            notFollowingBack: (curr.notFollowingBack || 0) - (prev.notFollowingBack || 0),
            botsDetected: (curr.botsDetected || 0) - (prev.botsDetected || 0)
        };
    }

    /**
     * Attach event listeners to cards
     */
    function attachCardListeners() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = e.target.dataset.action;
                const id = e.target.dataset.id;
                await handleAction(action, id);
            });
        });
    }

    /**
     * Handle card actions
     * @param {string} action - Action type
     * @param {string} id - Analysis ID
     */
    async function handleAction(action, id) {
        const item = historyData.find(h => h.id === id);
        if (!item) return;

        switch (action) {
            case 'view':
                viewAnalysis(item);
                break;
            case 'export':
                exportAnalysis(item);
                break;
            case 'delete':
                await deleteAnalysis(id);
                break;
        }
    }

    /**
     * View analysis details
     * @param {object} item - Analysis item
     */
    function viewAnalysis(item) {
        // TODO: Implement detailed view modal
        console.log('[HistoryManager] View analysis:', item);
        alert('Vista detallada próximamente');
    }

    /**
     * Export analysis
     * @param {object} item - Analysis item
     */
    function exportAnalysis(item) {
        // Use existing export functionality
        if (window.InstagramAnalyzer?.exportData) {
            window.InstagramAnalyzer.exportData('json', item);
        }
    }

    /**
     * Delete analysis
     * @param {string} id - Analysis ID
     */
    async function deleteAnalysis(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este análisis?')) {
            return;
        }

        const user = window.AuthSystem?.getCurrentUser();
        if (!user) return;

        try {
            await window.DatabaseManager?.deleteAnalysis(user.uid, id);
            
            // Remove from local data
            historyData = historyData.filter(h => h.id !== id);
            filteredData = filteredData.filter(h => h.id !== id);
            
            render();
            
            if (window.showToast) {
                window.showToast('Análisis eliminado correctamente', 'success');
            }
        } catch (error) {
            console.error('[HistoryManager] Error deleting analysis:', error);
            if (window.showToast) {
                window.showToast('Error al eliminar el análisis', 'error');
            }
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Format date
     * @param {*} timestamp - Timestamp
     * @returns {string}
     */
    function formatDate(timestamp) {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    /**
     * Format time ago
     * @param {*} timestamp - Timestamp
     * @returns {string}
     */
    function formatTimeAgo(timestamp) {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `hace ${minutes}m`;
        if (hours < 24) return `hace ${hours}h`;
        if (days < 30) return `hace ${days}d`;
        return formatDate(timestamp);
    }

    /**
     * Format number with separators
     * @param {number} num - Number
     * @returns {string}
     */
    function formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    return Object.freeze({
        init,
        loadHistory,
        refresh: async () => {
            await loadHistory();
            render();
        }
    });

})();

// Make available globally
window.HistoryManager = HistoryManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for auth to be ready
        setTimeout(() => HistoryManager.init(), 2000);
    });
} else {
    setTimeout(() => HistoryManager.init(), 2000);
}
