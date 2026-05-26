const SOURCE_CLASS = {
  'TechCrunch': 'tc',
  'The Verge': 'tv',
  'X/Twitter': 'tw',
};

const FAV_KEY = 'ai-news:favorites:v1';

const $list = document.getElementById('news-list');
const $meta = document.getElementById('meta');
const $search = document.getElementById('search-input');
const $searchClear = document.getElementById('search-clear');
const $searchBox = $search.parentElement;
const $tabs = document.querySelectorAll('.tab');
const $favCount = document.getElementById('fav-count');
const $refreshBtn = document.getElementById('refresh-btn');
const $empty = document.getElementById('empty-state');
const $emptySub = document.getElementById('empty-sub');
const $toast = document.getElementById('toast');

let allItems = [];
let currentTab = 'all';
let searchQuery = '';
let lastGeneratedAt = null;

// ============ Favorites ============
function getFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveFavs(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
  updateFavCount();
}
function toggleFav(url) {
  const favs = getFavs();
  if (favs.has(url)) favs.delete(url); else favs.add(url);
  saveFavs(favs);
  return favs.has(url);
}
function updateFavCount() {
  $favCount.textContent = getFavs().size;
}

// ============ Skeleton ============
function renderSkeletons(n = 6) {
  $list.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton">
      <div class="sk-line sk-tag"></div>
      <div class="sk-line sk-title"></div>
      <div class="sk-line sk-title-2"></div>
      <div class="sk-line sk-text"></div>
      <div class="sk-line sk-text-2"></div>
      <div class="sk-line sk-foot"></div>
    </div>
  `).join('');
}

// ============ Meta ============
function setMeta(data) {
  const dt = new Date(data.generated_at);
  const time = dt.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  const sources = new Set(data.items.map(i => i.source)).size;
  $meta.innerHTML = `
    <span class="stat-item">
      <span class="stat-label">更新于</span>
      <span class="stat-value">${time}</span>
    </span>
    <span class="stat-item">
      <span class="stat-label">条数</span>
      <span class="stat-value">${data.items.length}</span>
    </span>
    <span class="stat-item">
      <span class="stat-label">来源</span>
      <span class="stat-value">${sources}</span>
    </span>
  `;
}

// ============ Render ============
function getFilteredItems() {
  const favs = getFavs();
  let items = allItems;
  if (currentTab === 'fav') items = items.filter(i => favs.has(i.url));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      (i.title || '').toLowerCase().includes(q) ||
      (i.summary || '').toLowerCase().includes(q) ||
      (i.source || '').toLowerCase().includes(q)
    );
  }
  return items;
}

function render() {
  const items = getFilteredItems();
  const favs = getFavs();

  if (items.length === 0) {
    $list.innerHTML = '';
    $empty.hidden = false;
    if (currentTab === 'fav' && !searchQuery) {
      $empty.querySelector('.empty-text').textContent = '还没有收藏的新闻';
      $emptySub.textContent = '点击卡片右上角的心形按钮收藏';
    } else {
      $empty.querySelector('.empty-text').textContent = '没有匹配的新闻';
      $emptySub.textContent = searchQuery ? `没有包含「${searchQuery}」的内容` : '试试其他关键词';
    }
    return;
  }
  $empty.hidden = true;
  $list.innerHTML = items.map((item, idx) => renderCard(item, idx, favs.has(item.url))).join('');
  attachFavHandlers();
}

function renderCard(item, idx, faved) {
  const cls = SOURCE_CLASS[item.source] || 'default';
  const maxImp = 3.0;
  const ratio = Math.min(1, Math.max(0.1, (item.importance || 0) / maxImp));
  const time = formatTime(item.published_at);
  const delay = Math.min(idx * 50, 600);

  return `
    <article class="card" style="animation-delay:${delay}ms">
      <div class="card-head">
        <div class="head-left">
          <span class="source ${cls}">${escapeHtml(item.source)}</span>
          <div class="importance">
            <span class="imp-bar"><span class="imp-bar-fill" style="--imp:${ratio}"></span></span>
            <span class="imp-val">${(item.importance || 0).toFixed(2)}</span>
          </div>
        </div>
        <button class="fav-btn ${faved ? 'faved' : ''}" data-url="${escapeHtml(item.url)}" title="${faved ? '已收藏' : '收藏'}" aria-label="收藏">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6.5 5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 4 0 5.5 4 4 7-2.5 4.5-9.5 9-9.5 9z"/></svg>
        </button>
      </div>
      <h2><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h2>
      <p class="summary">${escapeHtml(stripHtml(item.summary || ''))}</p>
      <div class="card-foot">
        <span class="time">${time}</span>
        <a class="read-more" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">阅读原文 →</a>
      </div>
    </article>
  `;
}

function attachFavHandlers() {
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = btn.dataset.url;
      const nowFaved = toggleFav(url);
      btn.classList.toggle('faved', nowFaved);
      btn.title = nowFaved ? '已收藏' : '收藏';
      showToast(nowFaved ? '已加入收藏' : '已取消收藏', 'success');
      if (currentTab === 'fav' && !nowFaved) {
        setTimeout(render, 200);
      }
    });
  });
}

function stripHtml(s) {
  return String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatTime(s) {
  if (!s) return '';
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return s;
  const diffMs = Date.now() - dt.getTime();
  const diffMin = diffMs / 6e4;
  const diffHr = diffMs / 36e5;
  if (diffMin < 1) return '刚刚';
  if (diffHr < 1) return Math.round(diffMin) + ' 分钟前';
  if (diffHr < 24) return Math.round(diffHr) + ' 小时前';
  if (diffHr < 24 * 7) return Math.round(diffHr / 24) + ' 天前';
  return dt.toLocaleDateString('zh-CN');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ============ Toast ============
let toastTimer = null;
function showToast(text, type = 'loading', duration = 2500) {
  clearTimeout(toastTimer);
  $toast.className = 'toast show ' + type;
  $toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(text)}</span>`;
  if (duration > 0) {
    toastTimer = setTimeout(() => $toast.classList.remove('show'), duration);
  }
}
function hideToast() {
  clearTimeout(toastTimer);
  $toast.classList.remove('show');
}

// ============ Data ============
async function loadData(showSkeleton = true) {
  if (showSkeleton) renderSkeletons(6);
  try {
    const resp = await fetch('data.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('fetch failed');
    const data = await resp.json();

    if (showSkeleton) await new Promise(r => setTimeout(r, 250));

    allItems = data.items || [];
    lastGeneratedAt = data.generated_at;
    setMeta(data);
    render();
  } catch (e) {
    $meta.innerHTML = `<span class="stat-item"><span class="stat-value" style="color:#ec4899">加载失败</span></span>`;
    $list.innerHTML = `
      <div class="empty">
        <p class="empty-text">无法读取数据</p>
        <p class="empty-sub">请确认后端已生成 data.json</p>
      </div>
    `;
  }
}

// ============ Refresh ============
async function handleRefresh() {
  $refreshBtn.disabled = true;
  $refreshBtn.classList.add('refreshing');
  showToast('正在抓取最新资讯，请稍候…', 'loading', 0);

  try {
    const r = await fetch('/api/refresh', { method: 'POST' });
    if (r.status === 409) {
      showToast('已在刷新中…', 'loading', 0);
    } else if (!r.ok) {
      throw new Error('refresh failed');
    }

    const startedAt = Date.now();
    while (true) {
      await new Promise(res => setTimeout(res, 2000));
      const s = await fetch('/api/refresh/status', { cache: 'no-store' }).then(x => x.json());
      if (!s.running) {
        if (s.last_error) {
          showToast('刷新失败: ' + s.last_error, 'error', 4000);
        } else {
          showToast('刷新成功！', 'success', 2000);
          await loadData(false);
        }
        break;
      }
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      showToast(`正在抓取最新资讯…（已用时 ${elapsed} 秒）`, 'loading', 0);
    }
  } catch (e) {
    showToast('刷新请求失败，请检查后端服务', 'error', 4000);
  } finally {
    $refreshBtn.disabled = false;
    $refreshBtn.classList.remove('refreshing');
  }
}

// ============ Events ============
$search.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  $searchBox.classList.toggle('has-value', !!searchQuery);
  render();
});

$searchClear.addEventListener('click', () => {
  $search.value = '';
  searchQuery = '';
  $searchBox.classList.remove('has-value');
  render();
  $search.focus();
});

$tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    $tabs.forEach(t => t.classList.remove('tab-active'));
    tab.classList.add('tab-active');
    currentTab = tab.dataset.tab;
    render();
  });
});

$refreshBtn.addEventListener('click', handleRefresh);

// ============ Init ============
updateFavCount();
loadData();
