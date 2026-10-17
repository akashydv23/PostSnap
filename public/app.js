/**
 * PostSnap — Client Application Logic
 * Renders authentic X post cards in DOM and exports at 2x Retina resolution with html2canvas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');
  const formError = document.getElementById('formError');
  const errorMessage = document.getElementById('errorMessage');

  const progressState = document.getElementById('progressState');
  const progressTitle = document.getElementById('progressTitle');
  const progressDesc = document.getElementById('progressDesc');

  const resultArea = document.getElementById('resultArea');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const dimTag = document.getElementById('dimTag');

  const tweetCard = document.getElementById('tweetCard');
  const embedContainer = document.getElementById('embedContainer');
  const themePicker = document.getElementById('themePicker');
  const samplePills = document.querySelectorAll('.sample-pill');

  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const copyPngBtn = document.getElementById('copyPngBtn');
  const copyLabel = document.getElementById('copyLabel');
  const resetBtn = document.getElementById('resetBtn');

  // State
  let currentTheme = 'light';
  let activeTweetData = null;
  let activeTweetId = null;

  // -------------------------------------------------------------------------
  // SVGs (Verified Badge, X Logo, Engagement Icons)
  // -------------------------------------------------------------------------
  const ICONS = {
    xLogo: `<svg class="tc-logo" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    verifiedBlue: `<svg class="tc-verified-badge" width="18" height="18" viewBox="0 0 22 22" fill="#1d9bf0"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.136 5.378-5.378 1.293 1.302-6.671 6.67z"/></g></svg>`,
    reply: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    retweet: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
    heart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    bookmark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
  };

  // -------------------------------------------------------------------------
  // Helper: Format Numbers (e.g. 1702 -> 1,702 or 1.7K)
  // -------------------------------------------------------------------------
  function formatMetric(num) {
    if (num == null) return null;
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 10000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return Number(num).toLocaleString('en-US');
  }

  // -------------------------------------------------------------------------
  // Helper: Format Tweet Text (Highlight Links, Handles, Hashtags)
  // -------------------------------------------------------------------------
  function formatTweetText(text) {
    if (!text) return '';
    // Escape HTML first
    const div = document.createElement('div');
    div.innerText = text;
    let safe = div.innerHTML;

    // Replace URLs
    safe = safe.replace(/(https?:\/\/[^\s]+)/g, '<span class="tc-link">$1</span>');
    // Replace handles
    safe = safe.replace(/@([a-zA-Z0-9_]{1,15})/g, '<span class="tc-link">@$1</span>');
    // Replace hashtags
    safe = safe.replace(/#([a-zA-Z0-9_]+)/g, '<span class="tc-link">#$1</span>');

    return safe;
  }

  // -------------------------------------------------------------------------
  // Helper: Format Date
  // -------------------------------------------------------------------------
  function formatTweetDate(dateStr) {
    if (!dateStr || dateStr === 'Recent') return 'Recent';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${timePart} · ${datePart}`;
      }
    } catch (e) {}
    return dateStr;
  }

  // -------------------------------------------------------------------------
  // Render Official-Grade Tweet Card into DOM
  // -------------------------------------------------------------------------
  function renderTweetCard(tweet, method = 'captured') {
    const isFallback = method === 'recreated';
    const author = tweet.author || {};
    const name = author.name || 'User';
    const username = author.username || 'user';
    const verified = author.verified;
    const avatarUrl = author.avatarUrl;
    const text = tweet.text || '';
    const isLongText = tweet.isLongText || text.length > 280;
    const media = tweet.media;
    const card = tweet.card;
    const metrics = tweet.metrics;
    const createdAt = formatTweetDate(tweet.createdAt);

    // Build Avatar HTML (Proxy avatar to prevent canvas tainting)
    let avatarHtml = '';
    if (avatarUrl) {
      const proxiedAvatar = `/api/proxy-image?url=${encodeURIComponent(avatarUrl)}`;
      avatarHtml = `<div class="tc-avatar"><img src="${proxiedAvatar}" alt="${name}" crossorigin="anonymous" onerror="this.parentElement.innerHTML='${name.charAt(0).toUpperCase()}'"></div>`;
    } else {
      avatarHtml = `<div class="tc-avatar">${name.charAt(0).toUpperCase()}</div>`;
    }

    // Media HTML (Proxy media image to prevent canvas tainting)
    let mediaHtml = '';
    if (media && media.url) {
      const proxiedMedia = `/api/proxy-image?url=${encodeURIComponent(media.url)}`;
      mediaHtml = `
        <div class="tc-media-container">
          <img src="${proxiedMedia}" alt="Post media" class="tc-media-photo" crossorigin="anonymous" onerror="this.parentElement.style.display='none'">
        </div>
      `;
    } else if (card && (card.title || card.imageUrl)) {
      const proxiedCardImg = card.imageUrl ? `/api/proxy-image?url=${encodeURIComponent(card.imageUrl)}` : '';
      mediaHtml = `
        <div class="tc-link-card">
          ${proxiedCardImg ? `<img src="${proxiedCardImg}" alt="Card preview" class="tc-card-image" crossorigin="anonymous" onerror="this.style.display='none'">` : ''}
          <div class="tc-card-content">
            ${card.domain ? `<div class="tc-card-domain">${card.domain}</div>` : ''}
            ${card.title ? `<div class="tc-card-title">${card.title}</div>` : ''}
            ${card.description ? `<div class="tc-card-desc">${card.description}</div>` : ''}
          </div>
        </div>
      `;
    }

    // Metrics HTML
    let metricsHtml = '';
    if (metrics && (metrics.likes != null || metrics.retweets != null || metrics.replies != null)) {
      metricsHtml = `
        <div class="tc-metrics-row">
          <div class="tc-metric-item">
            <span class="tc-metric-icon">${ICONS.reply}</span>
            <span class="tc-metric-val">${formatMetric(metrics.replies) || '0'}</span>
          </div>
          <div class="tc-metric-item">
            <span class="tc-metric-icon">${ICONS.retweet}</span>
            <span class="tc-metric-val">${formatMetric(metrics.retweets) || '0'}</span>
          </div>
          <div class="tc-metric-item">
            <span class="tc-metric-icon">${ICONS.heart}</span>
            <span class="tc-metric-val">${formatMetric(metrics.likes) || '0'}</span>
          </div>
          <div class="tc-metric-item">
            <span class="tc-metric-icon">${ICONS.bookmark}</span>
          </div>
        </div>
      `;
    }

    // Assemble the complete tweet card
    tweetCard.className = `tweet-card-root theme-${currentTheme}`;
    tweetCard.innerHTML = `
      <div class="tc-header">
        <div class="tc-author-row">
          ${avatarHtml}
          <div class="tc-author-info">
            <div class="tc-name-line">
              <span class="tc-author-name">${name}</span>
              ${verified ? ICONS.verifiedBlue : ''}
            </div>
            <span class="tc-author-handle">@${username}</span>
          </div>
        </div>
        ${ICONS.xLogo}
      </div>

      <div class="tc-text ${isLongText ? 'long-text' : ''}">${formatTweetText(text)}</div>

      ${mediaHtml}

      <div class="tc-meta">${createdAt}</div>

      ${metricsHtml ? `<hr class="tc-divider">${metricsHtml}` : ''}

      <div class="tc-disclosure">
        ${isFallback ? 'Recreated from available post data' : 'Captured from X via PostSnap'}
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // Render Official X Iframe Embed
  // -------------------------------------------------------------------------
  function renderOfficialEmbed(tweetId) {
    embedContainer.innerHTML = '';
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.createTweet(
        tweetId,
        embedContainer,
        {
          theme: currentTheme === 'light' ? 'light' : 'dark',
          conversation: 'none',
          dnt: true,
        }
      ).then((el) => {
        if (!el) {
          embedContainer.innerHTML = `<div class="embed-placeholder">Official embed unavailable for this post.</div>`;
        }
      }).catch(() => {
        embedContainer.innerHTML = `<div class="embed-placeholder">Could not load official embed.</div>`;
      });
    } else {
      embedContainer.innerHTML = `<div class="embed-placeholder">Official X widget library is loading...</div>`;
    }
  }

  // -------------------------------------------------------------------------
  // Execute Post Capture
  // -------------------------------------------------------------------------
  async function executeCapture(url) {
    showError(null);
    resultArea.classList.add('hidden');
    progressState.classList.remove('hidden');
    progressTitle.innerText = 'Retrieving Post Data...';
    progressDesc.innerText = 'Connecting directly to X services for layout, media, and metrics';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, theme: currentTheme }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const err = data.error || {};
        throw new Error(err.error || 'Failed to capture post. Please check the link.');
      }

      activeTweetData = data.tweet;
      activeTweetId = data.tweet.id;
      const method = data.method;

      // Update Status Badge
      if (method === 'recreated') {
        statusBadge.className = 'status-badge fallback';
        statusText.innerText = 'Recreated from available post data';
      } else {
        statusBadge.className = 'status-badge';
        statusText.innerText = 'Captured from X';
      }

      // Render the card
      renderTweetCard(activeTweetData, method);

      // Render comparison embed
      renderOfficialEmbed(activeTweetId);

      // Show result
      progressState.classList.add('hidden');
      resultArea.classList.remove('hidden');

      // Scroll smoothly to result
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      progressState.classList.add('hidden');
      showError(err.message || 'An error occurred while capturing the post.');
    } finally {
      submitBtn.disabled = false;
    }
  }

  // -------------------------------------------------------------------------
  // Capture Card to High-Res 2x PNG
  // -------------------------------------------------------------------------
  async function generatePngBlob() {
    if (!window.html2canvas) {
      throw new Error('html2canvas screenshot library not loaded.');
    }

    const bg = currentTheme === 'dark' ? '#000000' : (currentTheme === 'dim' ? '#15202b' : '#ffffff');

    const canvas = await window.html2canvas(tweetCard, {
      scale: 2, // 2x Retina Resolution
      useCORS: true,
      allowTaint: false,
      backgroundColor: bg,
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    dimTag.innerText = `${canvas.width} × ${canvas.height} px`;

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, canvas });
        else reject(new Error('Failed to generate PNG blob'));
      }, 'image/png');
    });
  }

  // -------------------------------------------------------------------------
  // Download PNG Action
  // -------------------------------------------------------------------------
  downloadPngBtn.addEventListener('click', async () => {
    downloadPngBtn.disabled = true;
    const originalText = downloadPngBtn.innerHTML;
    downloadPngBtn.innerHTML = `<span>Exporting PNG...</span>`;

    try {
      const { blob } = await generatePngBlob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `PostSnap-${activeTweetId || 'post'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PNG Export error:', err);
      alert('Could not export PNG. Please try again.');
    } finally {
      downloadPngBtn.disabled = false;
      downloadPngBtn.innerHTML = originalText;
    }
  });

  // -------------------------------------------------------------------------
  // Copy to Clipboard Action
  // -------------------------------------------------------------------------
  copyPngBtn.addEventListener('click', async () => {
    copyPngBtn.disabled = true;
    copyLabel.innerText = 'Copying...';

    try {
      const { blob } = await generatePngBlob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        copyLabel.innerText = 'Copied to Clipboard!';
        setTimeout(() => {
          copyLabel.innerText = 'Copy Image';
        }, 2200);
      } else {
        alert('Clipboard image copy is not supported in this browser.');
      }
    } catch (err) {
      console.error('Copy error:', err);
      copyLabel.innerText = 'Copy Image';
    } finally {
      copyPngBtn.disabled = false;
    }
  });

  // -------------------------------------------------------------------------
  // UI Controls (Theme Switcher, Sample Posts, Paste, Reset)
  // -------------------------------------------------------------------------
  themePicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTheme = btn.dataset.theme;

    if (activeTweetData) {
      tweetCard.className = `tweet-card-root theme-${currentTheme}`;
      renderOfficialEmbed(activeTweetId);
    }
  });

  samplePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const url = pill.dataset.url;
      urlInput.value = url;
      executeCapture(url);
    });
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          urlInput.focus();
        }
      }
    } catch (e) {
      urlInput.focus();
    }
  });

  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) {
      executeCapture(url);
    }
  });

  resetBtn.addEventListener('click', () => {
    urlInput.value = '';
    resultArea.classList.add('hidden');
    formError.classList.add('hidden');
    urlInput.focus();
  });

  function showError(msg) {
    if (msg) {
      errorMessage.innerText = msg;
      formError.classList.remove('hidden');
    } else {
      formError.classList.add('hidden');
    }
  }
});
