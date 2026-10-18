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
  // -------------------------------------------------------------------------
  // Dynamic Library Loader & Wait Helpers
  // -------------------------------------------------------------------------
  async function ensureHtml2Canvas() {
    if (typeof window.html2canvas !== 'undefined') {
      return window.html2canvas;
    }

    return new Promise((resolve, reject) => {
      // 1. Try local vendored file first
      const script = document.createElement('script');
      script.src = '/html2canvas.min.js';
      script.onload = () => {
        if (typeof window.html2canvas !== 'undefined') resolve(window.html2canvas);
        else loadCdnFallback();
      };
      script.onerror = loadCdnFallback;

      function loadCdnFallback() {
        const cdnScript = document.createElement('script');
        cdnScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        cdnScript.onload = () => {
          if (typeof window.html2canvas !== 'undefined') resolve(window.html2canvas);
          else reject(new Error('html2canvas library failed to initialize.'));
        };
        cdnScript.onerror = () => reject(new Error('Failed to load html2canvas library from local and CDN.'));
        document.head.appendChild(cdnScript);
      }

      document.head.appendChild(script);
    });
  }

  async function waitForImages(container) {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) return;

    await Promise.all(images.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise((res) => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
        setTimeout(res, 2500); // 2.5s safety timeout
      });
    }));
  }

  // -------------------------------------------------------------------------
  // Capture Card to High-Res 2x PNG
  // -------------------------------------------------------------------------
  async function generatePngBlob() {
    const h2c = await ensureHtml2Canvas();
    await waitForImages(tweetCard);

    const bg = currentTheme === 'dark' ? '#000000' : (currentTheme === 'dim' ? '#15202b' : '#ffffff');

    let canvas;
    try {
      canvas = await h2c(tweetCard, {
        scale: 2, // 2x Retina Resolution
        useCORS: true,
        allowTaint: false,
        backgroundColor: bg,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 10000,
      });
    } catch (firstErr) {
      console.warn('html2canvas first attempt failed, retrying with allowTaint: true', firstErr);
      canvas = await h2c(tweetCard, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: bg,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });
    }

    if (dimTag) {
      dimTag.innerText = `${canvas.width} × ${canvas.height} px`;
    }

    // Convert canvas to blob with multiple fallbacks
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, canvas });
          } else {
            // Fallback via toDataURL
            try {
              const dataUrl = canvas.toDataURL('image/png');
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((b) => resolve({ blob: b, canvas }))
                .catch(reject);
            } catch (errData) {
              reject(errData);
            }
          }
        }, 'image/png');
      } catch (errBlob) {
        try {
          const dataUrl = canvas.toDataURL('image/png');
          fetch(dataUrl)
            .then((r) => r.blob())
            .then((b) => resolve({ blob: b, canvas }))
            .catch(reject);
        } catch (errData2) {
          reject(errBlob);
        }
      }
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
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = `PostSnap-${activeTweetId || 'post'}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
    } catch (err) {
      console.error('PNG Export error:', err);
      alert('Could not export PNG: ' + (err.message || 'Please try again.'));
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
        alert('Clipboard image copy is not supported in this browser. Please use Download PNG.');
      }
    } catch (err) {
      console.error('Copy error:', err);
      alert('Could not copy image: ' + (err.message || 'Please use Download PNG instead.'));
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

  // Watermelon UI: Dynamic Spotlight Mouse Cursor Tracking
  document.querySelectorAll('.spotlight-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // -------------------------------------------------------------------------
  // Watermelon UI: Smooth Glowing Cursor Follower
  // -------------------------------------------------------------------------
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  if (cursorDot && cursorRing && window.matchMedia('(hover: hover)').matches) {
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    document.addEventListener('mouseleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      requestAnimationFrame(animateCursor);
    }
    requestAnimationFrame(animateCursor);

    // Expand cursor ring on interactive elements
    const interactiveSelectors = 'a, button, input, .spotlight-card, .sample-pill, .dash-preset-btn, .toggle-chip, .dock-btn';
    document.querySelectorAll(interactiveSelectors).forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
    });
  }

  // -------------------------------------------------------------------------
  // Watermelon UI: Interactive Engine Intelligence Dashboard
  // -------------------------------------------------------------------------
  const labTweetCard = document.getElementById('labTweetCard');
  let labCurrentTheme = 'light';
  let labCurrentPreset = 'elon';

  const PRESET_DATA = {
    elon: {
      name: 'Elon Musk',
      username: 'elonmusk',
      verified: true,
      text: 'Our headquarters in San Francisco tonight',
      avatarUrl: 'https://pbs.twimg.com/profile_images/1892429462215286784/uA6mR7b9_400x400.jpg',
      createdAt: 'Jul 29, 2023 · 5:48 AM UTC',
      media: { url: 'https://pbs.twimg.com/media/F2NDiA9WwAAyH3_.jpg' },
      metrics: { likes: 420000, retweets: 45000, replies: 22000 },
    },
    jack: {
      name: 'jack',
      username: 'jack',
      verified: true,
      text: 'just setting up my twttr',
      avatarUrl: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_bigger.png',
      createdAt: 'Mar 21, 2006 · 8:50 PM UTC',
      metrics: { likes: 185000, retweets: 120000, replies: 8500 },
    },
    obama: {
      name: 'Barack Obama',
      username: 'BarackObama',
      verified: true,
      text: 'Four more years.',
      avatarUrl: 'https://pbs.twimg.com/profile_images/1329647526807543809/2DzsAfd__400x400.jpg',
      createdAt: 'Nov 7, 2012 · 4:16 AM UTC',
      metrics: { likes: 640000, retweets: 870000, replies: 45000 },
    },
    openai: {
      name: 'OpenAI',
      username: 'OpenAI',
      verified: true,
      text: 'We are introducing a series of updates to our frontier models designed to dramatically improve reasoning, coding comprehension, and multi-modal alignment across standard benchmarks.',
      avatarUrl: 'https://pbs.twimg.com/profile_images/1634097683261685761/th-bQ_XU_400x400.jpg',
      createdAt: 'Mar 19, 2024 · 5:00 PM UTC',
      metrics: { likes: 89000, retweets: 12000, replies: 3400 },
      isLongText: true,
    },
  };

  function renderLabCard(presetKey) {
    if (!labTweetCard) return;
    const tweet = PRESET_DATA[presetKey] || PRESET_DATA.elon;
    const author = tweet;

    let avatarHtml = `<div class="tc-avatar"><img src="/api/proxy-image?url=${encodeURIComponent(author.avatarUrl)}" alt="${author.name}" crossorigin="anonymous" onerror="this.parentElement.innerHTML='${author.name.charAt(0)}'"></div>`;
    
    let metricsHtml = `
      <div class="tc-metrics-row">
        <div class="tc-metric-item"><span class="tc-metric-icon">${ICONS.reply}</span><span class="tc-metric-val">${formatMetric(tweet.metrics.replies)}</span></div>
        <div class="tc-metric-item"><span class="tc-metric-icon">${ICONS.retweet}</span><span class="tc-metric-val">${formatMetric(tweet.metrics.retweets)}</span></div>
        <div class="tc-metric-item"><span class="tc-metric-icon">${ICONS.heart}</span><span class="tc-metric-val">${formatMetric(tweet.metrics.likes)}</span></div>
        <div class="tc-metric-item"><span class="tc-metric-icon">${ICONS.bookmark}</span></div>
      </div>
    `;

    labTweetCard.className = `tweet-card-root theme-${labCurrentTheme}`;
    labTweetCard.innerHTML = `
      <div class="tc-header">
        <div class="tc-author-row">
          ${avatarHtml}
          <div class="tc-author-info">
            <div class="tc-name-line">
              <span class="tc-author-name">${author.name}</span>
              ${author.verified ? ICONS.verifiedBlue : ''}
            </div>
            <span class="tc-author-handle">@${author.username}</span>
          </div>
        </div>
        ${ICONS.xLogo}
      </div>
      <div class="tc-text ${tweet.isLongText ? 'long-text' : ''}">${formatTweetText(tweet.text)}</div>
      <div class="tc-meta">${tweet.createdAt}</div>
      <hr class="tc-divider">
      ${metricsHtml}
      <div class="tc-disclosure">Interactive Engine Preview · PostSnap</div>
    `;
  }

  // Preset Buttons in Dashboard
  document.querySelectorAll('.dash-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dash-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      labCurrentPreset = btn.dataset.preset;
      renderLabCard(labCurrentPreset);
    });
  });

  // Theme Toggles in Dashboard
  const themeMap = {
    labThemeLight: 'light',
    labThemeDim: 'dim',
    labThemeDark: 'dark',
  };
  Object.keys(themeMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        ['labThemeLight', 'labThemeDim', 'labThemeDark'].forEach(k => {
          const btn = document.getElementById(k);
          if (btn) btn.classList.remove('active');
        });
        el.classList.add('active');
        labCurrentTheme = themeMap[id];
        renderLabCard(labCurrentPreset);
      });
    }
  });

  // Scale Toggles in Dashboard
  ['labScale2x', 'labScale3x'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        ['labScale2x', 'labScale3x'].forEach(k => document.getElementById(k)?.classList.remove('active'));
        el.classList.add('active');
      });
    }
  });

  // Floating Dock Theme Toggle
  const dockThemeToggle = document.getElementById('dockThemeToggle');
  if (dockThemeToggle) {
    const themes = ['light', 'dim', 'dark'];
    dockThemeToggle.addEventListener('click', () => {
      const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
      currentTheme = themes[nextIdx];
      
      // Update theme buttons
      document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === currentTheme);
      });

      if (activeTweetData) {
        tweetCard.className = `tweet-card-root theme-${currentTheme}`;
        renderOfficialEmbed(activeTweetId);
      }
    });
  }

  // Initial Lab Render
  renderLabCard('elon');

  // -------------------------------------------------------------------------
  // Watermelon UI: Rotating Words Headline
  // -------------------------------------------------------------------------
  const rotatingWords = ['creators', 'researchers', 'developers', 'archivists', 'journalists', 'designers'];
  let currentWordIdx = 0;
  const wordEl = document.getElementById('rotatingWord');
  if (wordEl) {
    setInterval(() => {
      wordEl.classList.add('fade-out');
      setTimeout(() => {
        currentWordIdx = (currentWordIdx + 1) % rotatingWords.length;
        wordEl.textContent = rotatingWords[currentWordIdx];
        wordEl.classList.remove('fade-out');
        wordEl.classList.add('fade-in');
        setTimeout(() => wordEl.classList.remove('fade-in'), 300);
      }, 300);
    }, 2500);
  }

  // -------------------------------------------------------------------------
  // Watermelon UI: Counting Numbers Animation
  // -------------------------------------------------------------------------
  const countingElements = document.querySelectorAll('.counting-number');
  if ('IntersectionObserver' in window && countingElements.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const isFloat = el.dataset.target.includes('.');
          const duration = 1200;
          const startTime = performance.now();

          function updateCounter(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - (1 - progress) * (1 - progress);
            const currentVal = isFloat ? (ease * target).toFixed(1) : Math.floor(ease * target);
            el.textContent = `${prefix}${currentVal}${suffix}`;
            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.textContent = `${prefix}${target}${suffix}`;
            }
          }
          requestAnimationFrame(updateCounter);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    countingElements.forEach(el => counterObserver.observe(el));
  }

  // -------------------------------------------------------------------------
  // Watermelon UI: Micro-Interaction 1 - Knob Slider / Scale Selector
  // -------------------------------------------------------------------------
  const knobWheel = document.getElementById('knobWheel');
  const knobIndicator = document.getElementById('knobIndicator');
  const knobCenterVal = document.getElementById('knobCenterVal');
  const dpiBtns = document.querySelectorAll('.dpi-btn');
  const knobDpiDetails = document.getElementById('knobDpiDetails');

  const DPI_MODES = {
    '1': { dpi: 72, label: '1x Web', deg: 0, res: '560 × Auto px', note: 'Standard web screen density' },
    '2': { dpi: 300, label: '2x Retina', deg: 90, res: '1120 × Auto px', note: 'Crisp Apple Retina 300 DPI' },
    '3': { dpi: 450, label: '3x Ultra', deg: 180, res: '1680 × Auto px', note: 'Ultra HD presentation scale' },
    '4': { dpi: 600, label: '4x Print', deg: 270, res: '2240 × Auto px', note: 'Maximum vector print fidelity' },
  };

  function setKnobMode(scaleKey) {
    const mode = DPI_MODES[scaleKey] || DPI_MODES['2'];
    if (knobIndicator) knobIndicator.style.transform = `rotate(${mode.deg}deg)`;
    if (knobCenterVal) knobCenterVal.textContent = `${mode.dpi}`;
    if (knobDpiDetails) {
      knobDpiDetails.textContent = `${mode.label} · ${mode.res} · ${mode.note}`;
    }
    dpiBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scale === scaleKey);
    });
  }

  dpiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setKnobMode(btn.dataset.scale);
    });
  });

  if (knobWheel) {
    let currentScaleKeys = ['1', '2', '3', '4'];
    let currentScaleIdx = 1;
    knobWheel.addEventListener('click', () => {
      currentScaleIdx = (currentScaleIdx + 1) % currentScaleKeys.length;
      setKnobMode(currentScaleKeys[currentScaleIdx]);
    });
  }

  // -------------------------------------------------------------------------
  // Watermelon UI: Micro-Interaction 2 - Morphing Action Button
  // -------------------------------------------------------------------------
  const morphBtn = document.getElementById('morphBtn');
  const morphBtnLabel = document.getElementById('morphBtnLabel');
  const morphBtnIcon = document.getElementById('morphBtnIcon');

  if (morphBtn) {
    morphBtn.addEventListener('click', () => {
      if (morphBtn.classList.contains('loading') || morphBtn.classList.contains('success')) return;

      morphBtn.classList.add('loading');
      if (morphBtnLabel) morphBtnLabel.textContent = 'Rendering 2x...';
      if (morphBtnIcon) {
        morphBtnIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
      }

      setTimeout(() => {
        morphBtn.classList.remove('loading');
        morphBtn.classList.add('success');
        if (morphBtnLabel) morphBtnLabel.textContent = 'Exported PNG!';
        if (morphBtnIcon) {
          morphBtnIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        }

        setTimeout(() => {
          morphBtn.classList.remove('success');
          if (morphBtnLabel) morphBtnLabel.textContent = 'Try Morphing PNG';
          if (morphBtnIcon) {
            morphBtnIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
          }
        }, 2200);
      }, 1000);
    });
  }

  // -------------------------------------------------------------------------
  // Watermelon UI: Micro-Interaction 3 - Preset Agent Selector in Bento
  // -------------------------------------------------------------------------
  const bentoAgentPills = document.querySelectorAll('.agent-pill');
  bentoAgentPills.forEach(pill => {
    pill.addEventListener('click', () => {
      bentoAgentPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const preset = pill.dataset.preset;
      renderLabCard(preset);
      document.querySelectorAll('.dash-preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === preset);
      });
    });
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

