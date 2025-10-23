/**
 * MKAssistant Analytics Dashboard - Client-side JavaScript
 */

const API_BASE = '/api';
let charts = {};
let currentTimeRange = 30;

/**
 * Initialize dashboard
 */
async function initDashboard() {
  showLoading();

  try {
    await Promise.all([
      loadOverview(),
      loadEngagementTimeline(),
      loadPlatformData(),
      loadCategoryPerformance(),
      loadTopPosts(),
      loadRecentPosts(),
      loadRecommendations()
    ]);

    hideLoading();
    showContent();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showError('Failed to load dashboard. Please check if the server is running.');
  }
}

/**
 * Load overview metrics
 */
async function loadOverview() {
  const response = await fetch(`${API_BASE}/overview`);
  const { data } = await response.json();

  const current = data.last7Days.overallStats;
  const previous = data.last30Days.overallStats;

  // Update metrics
  document.getElementById('totalPosts').textContent = formatNumber(current.totalPosts);
  document.getElementById('totalEngagement').textContent = formatNumber(
    current.totalLikes + current.totalComments + current.totalShares
  );
  document.getElementById('avgEngagement').textContent = formatNumber(current.avgEngagementPerPost, 1);
  document.getElementById('successRate').textContent = formatPercent(current.successRate);

  // Calculate changes (comparing 7d vs 30d average)
  const avgPrevPosts = previous.totalPosts / 30 * 7;
  const postsChange = ((current.totalPosts - avgPrevPosts) / avgPrevPosts) * 100;
  updateChangeIndicator('postsChange', postsChange);

  const avgPrevEngagement = (previous.totalLikes + previous.totalComments + previous.totalShares) / 30 * 7;
  const currentEngagement = current.totalLikes + current.totalComments + current.totalShares;
  const engagementChange = ((currentEngagement - avgPrevEngagement) / avgPrevEngagement) * 100;
  updateChangeIndicator('engagementChange', engagementChange);
}

/**
 * Load engagement timeline chart
 */
async function loadEngagementTimeline() {
  const response = await fetch(`${API_BASE}/engagement/timeline?days=${currentTimeRange}`);
  const { data } = await response.json();

  const ctx = document.getElementById('timelineChart').getContext('2d');

  if (charts.timeline) {
    charts.timeline.destroy();
  }

  charts.timeline = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Likes',
          data: data.map(d => d.likes),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Comments',
          data: data.map(d => d.comments),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Shares',
          data: data.map(d => d.shares),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatNumber(value)
          }
        }
      }
    }
  });
}

/**
 * Load platform distribution chart
 */
async function loadPlatformData() {
  const response = await fetch(`${API_BASE}/platforms/comparison?days=${currentTimeRange}`);
  const { data } = await response.json();

  const ctx = document.getElementById('platformChart').getContext('2d');

  if (charts.platform) {
    charts.platform.destroy();
  }

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  charts.platform = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.platform),
      datasets: [{
        data: data.map(d => d.posts),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const platform = data[context.dataIndex];
              return [
                `${context.label}: ${context.parsed} posts`,
                `Avg Engagement: ${formatNumber(platform.avgEngagement, 1)}`
              ];
            }
          }
        }
      }
    }
  });
}

/**
 * Load category performance chart
 */
async function loadCategoryPerformance() {
  const response = await fetch(`${API_BASE}/category-performance`);
  const { data } = await response.json();

  const ctx = document.getElementById('categoryChart').getContext('2d');

  if (charts.category) {
    charts.category.destroy();
  }

  charts.category = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.category),
      datasets: [
        {
          label: 'Avg Likes',
          data: data.map(d => d.avgLikes),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1
        },
        {
          label: 'Avg Comments',
          data: data.map(d => d.avgComments),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10b981',
          borderWidth: 1
        },
        {
          label: 'Avg Shares',
          data: data.map(d => d.avgShares),
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderColor: '#f59e0b',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          stacked: false
        },
        x: {
          stacked: false
        }
      }
    }
  });
}

/**
 * Load platform comparison chart
 */
async function loadPlatformComparison() {
  const response = await fetch(`${API_BASE}/platforms/comparison?days=${currentTimeRange}`);
  const { data } = await response.json();

  const ctx = document.getElementById('comparisonChart').getContext('2d');

  if (charts.comparison) {
    charts.comparison.destroy();
  }

  charts.comparison = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Posts', 'Likes', 'Comments', 'Shares', 'Engagement Rate'],
      datasets: data.slice(0, 5).map((platform, idx) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const maxPosts = Math.max(...data.map(d => d.posts));
        const maxLikes = Math.max(...data.map(d => d.likes));
        const maxComments = Math.max(...data.map(d => d.comments));
        const maxShares = Math.max(...data.map(d => d.shares));
        const maxEngagement = Math.max(...data.map(d => d.avgEngagement));

        return {
          label: platform.platform,
          data: [
            (platform.posts / maxPosts) * 100,
            (platform.likes / maxLikes) * 100,
            (platform.comments / maxComments) * 100,
            (platform.shares / maxShares) * 100,
            (platform.avgEngagement / maxEngagement) * 100
          ],
          borderColor: colors[idx],
          backgroundColor: colors[idx] + '20',
          pointBackgroundColor: colors[idx],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: colors[idx]
        };
      })
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: value => value + '%'
          }
        }
      }
    }
  });
}

/**
 * Load top posts
 */
async function loadTopPosts() {
  const response = await fetch(`${API_BASE}/report?days=${currentTimeRange}`);
  const { data } = await response.json();

  const tbody = document.getElementById('topPostsBody');
  tbody.innerHTML = '';

  if (data.topPosts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No posts found</td></tr>';
    return;
  }

  data.topPosts.forEach(post => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="platform-badge">${post.platform}</span></td>
      <td class="content-cell">${escapeHtml(post.content)}...</td>
      <td class="metric-cell">${formatNumber(post.likes)}</td>
      <td class="metric-cell">${formatNumber(post.comments)}</td>
      <td class="metric-cell">${formatNumber(post.shares)}</td>
      <td class="metric-cell"><strong>${formatNumber(post.engagementScore)}</strong></td>
      <td class="date-cell">${formatDateTime(post.publishedTime)}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Load recent posts
 */
async function loadRecentPosts() {
  const response = await fetch(`${API_BASE}/posts/recent?limit=20`);
  const { data } = await response.json();

  const tbody = document.getElementById('recentPostsBody');
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No recent posts</td></tr>';
    return;
  }

  data.forEach(post => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span class="platform-badge">${post.platform}</span></td>
      <td class="content-cell">${escapeHtml(post.content)}...</td>
      <td><span class="type-badge">${post.postType}</span></td>
      <td><span class="status-badge status-${post.status}">${post.status}</span></td>
      <td class="metric-cell">${formatNumber(post.totalEngagement)}</td>
      <td class="date-cell">${formatDateTime(post.publishedTime)}</td>
    `;
    tbody.appendChild(row);
  });
}

/**
 * Load recommendations
 */
async function loadRecommendations() {
  const response = await fetch(`${API_BASE}/report?days=${currentTimeRange}`);
  const { data } = await response.json();

  const container = document.getElementById('recommendations');
  container.innerHTML = '';

  data.recommendations.forEach(rec => {
    const div = document.createElement('div');
    div.className = 'recommendation-item';
    div.textContent = rec;
    container.appendChild(div);
  });
}

/**
 * Refresh dashboard
 */
async function refreshDashboard() {
  currentTimeRange = parseInt(document.getElementById('timeRangeSelector').value);
  await initDashboard();
}

/**
 * Export data
 */
async function exportData() {
  const format = confirm('Export as CSV? (Cancel for JSON)') ? 'csv' : 'json';
  window.location.href = `${API_BASE}/export?format=${format}&days=${currentTimeRange}`;
}

/**
 * Helper: Format number
 */
function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Helper: Format percentage
 */
function formatPercent(num) {
  if (num === null || num === undefined) return '-';
  return num.toFixed(1) + '%';
}

/**
 * Helper: Format date
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Helper: Format datetime
 */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper: Update change indicator
 */
function updateChangeIndicator(elementId, change) {
  const element = document.getElementById(elementId);
  const isPositive = change > 0;
  const arrow = isPositive ? '↑' : '↓';
  const className = isPositive ? 'change-positive' : 'change-negative';

  element.textContent = `${arrow} ${Math.abs(change).toFixed(1)}%`;
  element.className = `metric-change ${className}`;
}

/**
 * UI helpers
 */
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('dashboard-content').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

function showContent() {
  document.getElementById('dashboard-content').classList.remove('hidden');
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  document.getElementById('loading').classList.add('hidden');
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();

  // Set up time range selector
  document.getElementById('timeRangeSelector').addEventListener('change', refreshDashboard);

  // Load platform comparison after other charts
  setTimeout(loadPlatformComparison, 500);
});
