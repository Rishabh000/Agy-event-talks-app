// Global State
let allUpdates = [];
let filteredUpdates = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedUpdate = null;

// DOM Elements
const feedGrid = document.getElementById('feed-grid');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const exportCsvBtn = document.getElementById('export-csv-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const filterTabs = document.getElementById('filter-tabs');
const updateCount = document.getElementById('update-count');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const previewTypeBadge = document.getElementById('preview-type-badge');
const previewDate = document.getElementById('preview-date');
const previewText = document.getElementById('preview-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCountText = document.getElementById('char-count-text');
const counterRing = document.getElementById('counter-ring');
const sendTweetBtn = document.getElementById('send-tweet-btn');
const hashtagChips = document.querySelectorAll('.hashtag-chip');

// Progress Ring Settings
const ringRadius = 10;
const ringCircumference = 2 * Math.PI * ringRadius;

// Initialize Progress Ring
if (counterRing) {
    counterRing.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    counterRing.style.strokeDashoffset = ringCircumference;
}

// Initialize Theme Mode
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
}

// Fetch Updates from Flask API
async function fetchUpdates() {
    try {
        setLoadingState(true);
        const response = await fetch('/api/updates');
        if (!response.ok) throw new Error('Network response was not ok');
        allUpdates = await response.json();
        
        // Sort updates by updated date desc
        allUpdates.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        
        applyFiltersAndSearch();
    } catch (error) {
        console.error('Error fetching updates:', error);
        feedGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <h3>Unable to load release notes</h3>
                <p>Please check your internet connection or try refreshing again shortly.</p>
            </div>
        `;
        updateCount.textContent = 'Failed to load updates';
    } finally {
        setLoadingState(false);
    }
}

// Set UI Loading State
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshIcon.classList.add('spinning');
        refreshBtn.disabled = true;
        
        // Show skeletons
        feedGrid.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    } else {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// Apply Selected Filter and Search query
function applyFiltersAndSearch() {
    filteredUpdates = allUpdates.filter(update => {
        // Apply filter tab
        const matchesFilter = currentFilter === 'all' || update.type.toLowerCase() === currentFilter;
        
        // Apply search query
        const textContent = `${update.type} ${update.date} ${update.raw_text}`.toLowerCase();
        const matchesSearch = textContent.includes(searchQuery.toLowerCase());
        
        return matchesFilter && matchesSearch;
    });
    
    renderFeed();
    updateStats();
}

// Update counts & stats
function updateStats() {
    if (allUpdates.length === 0) {
        updateCount.textContent = 'No updates available';
        return;
    }
    
    const countText = `${filteredUpdates.length} of ${allUpdates.length} updates found`;
    updateCount.textContent = countText;
}

// Render feed list
function renderFeed() {
    if (filteredUpdates.length === 0) {
        feedGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No updates match your criteria</h3>
                <p>Try searching for a different keyword or switching your filter category.</p>
            </div>
        `;
        return;
    }
    
    feedGrid.innerHTML = '';
    filteredUpdates.forEach((update, index) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.setAttribute('data-id', index);
        
        const typeClass = update.type.toLowerCase();
        
        card.innerHTML = `
            <div class="note-meta">
                <div class="note-tags">
                    <span class="type-badge ${typeClass}">${update.type}</span>
                </div>
                <span class="note-date">${update.date}</span>
            </div>
            <div class="note-body">
                ${update.content}
            </div>
            <div class="note-actions">
                <button class="btn-copy-action" data-index="${index}">
                    <svg viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Text</span>
                </button>
                <button class="btn-tweet-action" data-index="${index}">
                    <svg viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Tweet This
                </button>
            </div>
        `;
        
        feedGrid.appendChild(card);
    });
    
    // Bind Tweet button listeners
    document.querySelectorAll('.btn-tweet-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-index'));
            openTweetModal(filteredUpdates[idx]);
        });
    });

    // Bind Copy button listeners
    document.querySelectorAll('.btn-copy-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-index'));
            copyToClipboard(filteredUpdates[idx].raw_text, btn);
        });
    });
}

// Open tweet composer modal
function openTweetModal(update) {
    selectedUpdate = update;
    
    // Set Badge class & text
    previewTypeBadge.textContent = update.type;
    previewTypeBadge.className = `preview-badge ${update.type.toLowerCase()}`;
    
    // Set Date & content preview
    previewDate.textContent = update.date;
    previewText.textContent = update.raw_text;
    
    // Format default tweet body
    // Keep it short, clean, and add appropriate tags
    let defaultTweet = `Google Cloud BigQuery Update (${update.date}) - ${update.type}:\n\n${update.raw_text}`;
    
    // Truncate to leave space for hashtags and link
    if (defaultTweet.length > 210) {
        defaultTweet = defaultTweet.substring(0, 207) + '...';
    }
    
    defaultTweet += `\n\n#BigQuery #GoogleCloud`;
    tweetTextarea.value = defaultTweet;
    
    // Clear custom chip active styles initially, but set active for #BigQuery & #GoogleCloud
    hashtagChips.forEach(chip => {
        const tag = chip.getAttribute('data-tag');
        if (tag === '#BigQuery' || tag === '#GoogleCloud') {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    
    // Update character limit counter
    updateCharCount();
    
    // Show Modal
    tweetModal.classList.add('open');
}

// Close Modal
function closeTweetModal() {
    tweetModal.classList.remove('open');
    selectedUpdate = null;
}

// Update Character limit & circular progress bar
function updateCharCount() {
    const textLength = tweetTextarea.value.length;
    const remaining = 280 - textLength;
    
    charCountText.textContent = remaining;
    
    // Calculate progress ring
    const percentage = Math.min((textLength / 280) * 100, 100);
    const offset = ringCircumference - (percentage / 100) * ringCircumference;
    counterRing.style.strokeDashoffset = offset;
    
    // Add urgency color codes
    const counterContainer = document.querySelector('.char-counter');
    if (remaining < 0) {
        counterContainer.className = 'char-counter danger';
        sendTweetBtn.disabled = true;
    } else if (remaining <= 30) {
        counterContainer.className = 'char-counter warning';
        sendTweetBtn.disabled = false;
    } else {
        counterContainer.className = 'char-counter';
        sendTweetBtn.disabled = false;
    }
}

// Event Listeners
refreshBtn.addEventListener('click', fetchUpdates);

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFiltersAndSearch();
});

filterTabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-tab')) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-type');
        applyFiltersAndSearch();
    }
});

// Close Modal Events
closeModalBtn.addEventListener('click', closeTweetModal);
tweetModal.addEventListener('click', (e) => {
    if (e.target === tweetModal) closeTweetModal();
});

// Character Counter check on typing
tweetTextarea.addEventListener('input', updateCharCount);

// Hashtag Chip Toggle
hashtagChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-tag');
        const text = tweetTextarea.value;
        
        if (chip.classList.contains('active')) {
            // Remove hashtag
            chip.classList.remove('active');
            // Regex to match hashtag with optional preceding whitespace or trailing whitespace
            const regex = new RegExp(`\\s*${tag}\\b`, 'g');
            tweetTextarea.value = text.replace(regex, '').trim();
        } else {
            // Add hashtag
            chip.classList.add('active');
            if (text.includes(tag)) return;
            tweetTextarea.value = `${text} ${tag}`.trim();
        }
        updateCharCount();
    });
});

// Send/Post Tweet
sendTweetBtn.addEventListener('click', () => {
    const text = tweetTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    closeTweetModal();
});

// Copy to Clipboard Utility
function copyToClipboard(text, buttonEl) {
    navigator.clipboard.writeText(text).then(() => {
        const spanEl = buttonEl.querySelector('span');
        const originalText = spanEl.textContent;
        
        spanEl.textContent = 'Copied!';
        buttonEl.classList.add('copied');
        
        setTimeout(() => {
            spanEl.textContent = originalText;
            buttonEl.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Export to CSV Utility
function exportToCSV() {
    if (filteredUpdates.length === 0) {
        alert('No data available to export.');
        return;
    }
    
    const headers = ['Date', 'Type', 'Link', 'Text'];
    const rows = filteredUpdates.map(update => [
        update.date,
        update.type,
        update.link,
        update.raw_text
    ]);
    
    const csvContent = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map(r => r.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_release_notes_${currentFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Keyboard close handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tweetModal.classList.contains('open')) {
        closeTweetModal();
    }
});

// CSV Export Listener
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
}

// Theme Toggle Listener
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
    });
}

// Initial Fetch on Load
document.addEventListener('DOMContentLoaded', fetchUpdates);
