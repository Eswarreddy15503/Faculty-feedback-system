/**
 * History page management: SQLite record fetching, search, filter across 3 result states,
 * detail review, reliability tags, and empty states.
 */

let currentHistoryFilter = 'all';

function initHistoryModule() {
  const searchInput = document.getElementById('history-search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const startFirstBtn = document.getElementById('history-start-first-btn');

  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadHistory(e.target.value.trim(), currentHistoryFilter);
      }, 300);
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentHistoryFilter = btn.dataset.filter || 'all';
      const query = searchInput ? searchInput.value.trim() : '';
      loadHistory(query, currentHistoryFilter);
    });
  });

  if (startFirstBtn) {
    startFirstBtn.addEventListener('click', () => {
      window.App.navigateTo('detect');
    });
  }
}

async function loadHistory(query = '', filter = 'all') {
  const tbody = document.getElementById('history-table-body');
  const tableContainer = document.getElementById('history-table-container');
  const emptyState = document.getElementById('history-empty-state');

  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filter && filter !== 'all') params.append('filter', filter);

    const response = await fetch(`/api/history?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch analysis history');

    const records = await response.json();

    if (!records || records.length === 0) {
      if (tableContainer) tableContainer.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (tableContainer) tableContainer.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    if (tbody) {
      tbody.innerHTML = records.map(rec => {
        const resStr = (rec.result || '').toLowerCase();
        const isDeepfake = resStr.includes('deepfake');
        const isInconclusive = resStr.includes('inconclusive');
        
        let badgeClass = 'badge-success';
        let badgeText = '✓ Likely Authentic';
        if (isDeepfake) {
          badgeClass = 'badge-danger';
          badgeText = '! Potential Deepfake';
        } else if (isInconclusive) {
          badgeClass = 'badge-warning';
          badgeText = '⚠ Inconclusive';
        }

        const formattedDate = rec.created_at ? rec.created_at.split(' ')[0] : 'N/A';
        const reliability = rec.reliability || 'Medium';
        const relClass = reliability.toLowerCase();

        return `
          <tr>
            <td>${formattedDate}</td>
            <td><strong>${escapeHtml(rec.filename)}</strong><br/><small class="text-muted">${rec.id}</small></td>
            <td><span class="badge badge-neutral">${rec.media_type}</span></td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
            <td><strong>${rec.confidence}%</strong></td>
            <td><span class="reliability-badge ${relClass}" style="font-size: 11px; padding: 2px 6px;">${reliability}</span></td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="window.HistoryModule.viewAnalysis('${rec.id}')">
                View
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('History load error:', err);
    if (tableContainer) tableContainer.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
  }
}

async function viewAnalysis(id) {
  try {
    const response = await fetch(`/api/history/${id}`);
    if (!response.ok) throw new Error('Analysis record not found.');
    
    const data = await response.json();
    window.ResultModule.displayResult(data);
    window.App.navigateTo('result');
    window.App.showToast(`Loaded analysis report: ${id}`);
  } catch (err) {
    console.error('Error viewing analysis:', err);
    window.App.showToast('Unable to load past analysis.', 'error');
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

window.HistoryModule = {
  init: initHistoryModule,
  load: loadHistory,
  viewAnalysis: viewAnalysis
};
