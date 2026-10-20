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
  let currentTheme = 'dark';
  let activeTweetData = null;
  let activeTweetId = null;

  // -------------------------------------------------------------------------
  // SVGs (Verified Badge, X Logo, Action Icons matching Photo 2)
  // -------------------------------------------------------------------------
  const ICONS = {
    xLogo: `<svg class="tc-logo" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    verifiedBlue: `<svg class="tc-verified-badge" width="18" height="18" viewBox="0 0 22 22" fill="#1d9bf0"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.136 5.378-5.378 1.293 1.302-6.671 6.67z"/></g></svg>`,
    reply: `<svg class="tc-metric-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    heartFilled: `<svg class="tc-metric-icon" width="18" height="18" viewBox="0 0 24 24" fill="#f91880"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    views: `<svg class="tc-metric-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.005-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>`,
    bookmarkBlue: `<svg class="tc-metric-icon" width="18" height="18" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg>`,
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

    // Build Avatar HTML (Proxy avatar to prevent canvas tainting, upgrade to high-res 400x400)
    let avatarHtml = '';
    if (avatarUrl) {
      let highResAvatar = avatarUrl;
      if (highResAvatar.includes('_normal.')) {
        highResAvatar = highResAvatar.replace('_normal.', '_400x400.');
      }
      const proxiedAvatar = `/api/proxy-image?url=${encodeURIComponent(highResAvatar)}`;
      avatarHtml = `<div class="tc-avatar"><img src="${proxiedAvatar}" alt="${name}" crossorigin="anonymous" onerror="this.parentElement.innerHTML='${name.charAt(0).toUpperCase()}'"></div>`;
    } else {
      avatarHtml = `<div class="tc-avatar">${name.charAt(0).toUpperCase()}</div>`;
    }

    // Media HTML (Proxy media image to prevent canvas tainting, upgrade to high-res large/orig)
    let mediaHtml = '';
    if (media && media.url) {
      let highResMediaUrl = media.url;
      if (highResMediaUrl.includes('pbs.twimg.com/media/')) {
        if (highResMediaUrl.includes('name=')) {
          highResMediaUrl = highResMediaUrl.replace(/name=[a-zA-Z0-9_]+/, 'name=large');
        } else if (!highResMediaUrl.includes('?')) {
          highResMediaUrl += '?name=large';
        }
      }
      const proxiedMedia = `/api/proxy-image?url=${encodeURIComponent(highResMediaUrl)}`;
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

    // Metrics HTML (Exact Photo 2 layout: Reply count, Pink Heart + Pink Like Count, Views, Blue Bookmark)
    let metricsHtml = '';
    if (metrics && (metrics.likes != null || metrics.replies != null || metrics.views != null)) {
      const viewsCount = metrics.views != null && Number(metrics.views) > 0
        ? Number(metrics.views)
        : (metrics.likes ? Math.round(Number(metrics.likes) * 26) : 0);

      metricsHtml = `
        <div class="tc-metrics-row">
          <div class="tc-metric-item">
            ${ICONS.reply}
            <span class="tc-metric-val">${formatMetric(metrics.replies) || '0'}</span>
          </div>
          <div class="tc-metric-item tc-metric-like">
            ${ICONS.heartFilled}
            <span class="tc-metric-val tc-metric-val-pink">${formatMetric(metrics.likes) || '0'}</span>
          </div>
          ${viewsCount > 0 ? `
          <div class="tc-metric-item">
            ${ICONS.views}
            <span class="tc-metric-val">${formatMetric(viewsCount)}</span>
          </div>
          ` : ''}
          <div class="tc-metric-item tc-metric-bookmark">
            ${ICONS.bookmarkBlue}
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
        ${isFallback
          ? 'Recreated from available post data by <span class="tc-author-credit">Akash Yadav</span> <svg class="tc-heart-icon" viewBox="0 0 24 24" width="12" height="12" aria-label="love"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
          : 'Captured from X via PostSnap by <span class="tc-author-credit">Akash Yadav</span> <svg class="tc-heart-icon" viewBox="0 0 24 24" width="12" height="12" aria-label="love"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'}
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

      // Trigger Living Real-Time Dynamic Color Shift based on post
      triggerDynamicAtmosphere(activeTweetData);

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
      if (img.complete && img.naturalWidth !== 0) {
        if ('decode' in img) {
          return img.decode().catch(() => {});
        }
        return Promise.resolve();
      }
      return new Promise((res) => {
        img.addEventListener('load', async () => {
          if ('decode' in img) {
            try { await img.decode(); } catch (e) {}
          }
          res();
        }, { once: true });
        img.addEventListener('error', res, { once: true });
        setTimeout(res, 3500); // 3.5s safety timeout
      });
    }));
  }

  // -------------------------------------------------------------------------
  // Capture Card to Ultra-Crisp 3x Retina PNG (Non-Pixelated, High Fidelity)
  // -------------------------------------------------------------------------
  async function generatePngBlob() {
    const h2c = await ensureHtml2Canvas();

    // Ensure all web fonts are loaded and ready before canvas rasterization
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (fErr) {
        console.warn('Font readiness wait skipped:', fErr);
      }
    }

    // Wait for all avatars and attached photos to load & decode
    await waitForImages(tweetCard);

    const bg = currentTheme === 'dark' ? '#000000' : (currentTheme === 'dim' ? '#15202b' : '#ffffff');

    // 3x Retina export scale: yields razor-sharp 1650px wide PNG for standard 550px card
    const exportScale = 3;

    const h2cOptions = {
      scale: exportScale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: bg,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200,
      windowHeight: 1200,
      imageTimeout: 15000,
      onclone: (clonedDoc, clonedEl) => {
        const card = clonedEl || clonedDoc.getElementById('tweetCard');
        if (card) {
          // Standardize card width to canonical desktop 550px (never squeezed on mobile)
          card.style.width = '550px';
          card.style.maxWidth = '550px';
          card.style.minWidth = '550px';
          card.style.margin = '0 auto';
          card.style.boxSizing = 'border-box';
          card.style.transform = 'none';

          // Ensure zero letter-spacing on text runs to prevent html2canvas kerning splits
          card.style.letterSpacing = '0px';
          card.style.fontKerning = 'normal';
          card.style.textRendering = 'geometricPrecision';
          card.style.webkitFontSmoothing = 'antialiased';

          if (card.parentElement) {
            card.parentElement.style.width = 'auto';
            card.parentElement.style.maxWidth = 'none';
            card.parentElement.style.overflow = 'visible';
            card.parentElement.style.display = 'block';
          }

          // Force watermark kerning in clone
          const disc = card.querySelector('.tc-disclosure');
          if (disc) {
            disc.style.letterSpacing = '0px';
            disc.style.fontKerning = 'normal';
            disc.style.webkitFontSmoothing = 'antialiased';
          }

          const authorCredit = card.querySelector('.tc-author-credit');
          if (authorCredit) {
            authorCredit.style.letterSpacing = '0px';
            authorCredit.style.fontKerning = 'normal';
          }
        }
      }
    };

    let canvas;
    try {
      canvas = await h2c(tweetCard, h2cOptions);
    } catch (firstErr) {
      console.warn('html2canvas first attempt failed, retrying with allowTaint: true', firstErr);
      canvas = await h2c(tweetCard, {
        ...h2cOptions,
        allowTaint: true,
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
  // Download PNG Action (Native Mobile Share Sheet on iOS/Android + Fallback)
  // -------------------------------------------------------------------------
  downloadPngBtn.addEventListener('click', async () => {
    downloadPngBtn.disabled = true;
    const originalText = downloadPngBtn.innerHTML;
    downloadPngBtn.innerHTML = `<span>Exporting Ultra-HD PNG...</span>`;

    try {
      const { blob } = await generatePngBlob();
      const fileName = `PostSnap-${activeTweetId || 'post'}.png`;

      // On iOS and Android: Trigger native share sheet if supported (direct 'Save Image' to Photos)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.canShare && window.File) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'PostSnap Screenshot',
              text: 'Captured via PostSnap',
            });
            downloadPngBtn.disabled = false;
            downloadPngBtn.innerHTML = originalText;
            return;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            downloadPngBtn.disabled = false;
            downloadPngBtn.innerHTML = originalText;
            return;
          }
        }
      }

      // Standard browser download trigger
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fileName;
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
    switchTheme(btn.dataset.theme);
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

  // -------------------------------------------------------------------------
  // Floating Dock Theme Toggle (Syncs directly with switchTheme)
  // -------------------------------------------------------------------------
  const dockThemeToggle = document.getElementById('dockThemeToggle');
  if (dockThemeToggle) {
    const themes = ['dark', 'dim', 'light'];
    dockThemeToggle.addEventListener('click', () => {
      const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
      switchTheme(themes[nextIdx]);
    });
  }

  // -------------------------------------------------------------------------
  // Ultra-Smooth, Zero-Latency Custom Cursor Follower (Hardware-Accelerated)
  // -------------------------------------------------------------------------
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  if (cursorDot && cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
      }
      cursorDot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isVisible = false;
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });

    function animateCursorRing() {
      if (isVisible) {
        ringX += (mouseX - ringX) * 0.22;
        ringY += (mouseY - ringY) * 0.22;
        cursorRing.style.transform = `translate3d(${ringX - 18}px, ${ringY - 18}px, 0)`;
      }
      requestAnimationFrame(animateCursorRing);
    }
    requestAnimationFrame(animateCursorRing);

    // Subtle scale feedback on interactive targets
    const interactiveSelectors = 'a, button, input, select, .sample-pill, .theme-btn, .clean-dropdown';
    document.querySelectorAll(interactiveSelectors).forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('active'), { passive: true });
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'), { passive: true });
    });
  }

  // -------------------------------------------------------------------------
  // Living Atmosphere & Real-Time Dynamic Palette Shift Engine
  // -------------------------------------------------------------------------
  const THEME_ATMOSPHERES = {
    dark: {
      r: 255, g: 42, b: 85,           // Aesthetic Crimson Flame #ff2a55 (Default)
      secR: 225, secG: 29, secB: 72,   // Rose Ruby #e11d48
      tertR: 159, tertG: 18, tertB: 57, // Deep Velvet Wine
    },
    dim: {
      r: 244, g: 63, b: 94,           // Coral Rose #f43f5e
      secR: 251, secG: 113, secB: 133, // Blush Crimson #fb7185
      tertR: 190, tertG: 18, tertB: 60, // Carmine
    },
    light: {
      r: 225, g: 29, b: 72,           // Vivid Crimson
      secR: 244, secG: 63, secB: 94,   // Rose Ember
      tertR: 251, tertG: 146, tertB: 60, // Warm Coral
    },
  };

  const AUTHOR_SIGNATURES = {
    'jack': { r: 245, g: 158, b: 11 },         // Retro Amber
    'elonmusk': { r: 235, g: 30, b: 70 },      // Tesla Velocity Red
    'barackobama': { r: 225, g: 29, b: 72 },   // Presidential Crimson
    'openai': { r: 16, g: 185, b: 129 },       // Emerald Intelligence
  };

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function applyAtmospherePalette(r, g, b, secR, secG, secB) {
    const root = document.documentElement;

    const hsl = rgbToHsl(r, g, b);
    hsl.s = Math.max(0.65, Math.min(1.0, hsl.s * 1.3));
    hsl.l = Math.max(0.48, Math.min(0.62, hsl.l));

    const prime = hslToRgb(hsl.h, hsl.s, hsl.l);

    let sec;
    if (secR != null) {
      sec = { r: secR, g: secG, b: secB };
    } else {
      const secHue = (hsl.h + 0.12) % 1.0;
      sec = hslToRgb(secHue, hsl.s, hsl.l);
    }

    const tertHue = (hsl.h - 0.12 + 1.0) % 1.0;
    const tert = hslToRgb(tertHue, hsl.s * 0.9, hsl.l * 0.9);

    const primeStr = `rgb(${prime.r}, ${prime.g}, ${prime.b})`;
    const secStr = `rgb(${sec.r}, ${sec.g}, ${sec.b})`;

    root.style.setProperty('--accent-blue', primeStr);
    root.style.setProperty('--accent-blue-hover', secStr);
    root.style.setProperty('--accent-glow', `rgba(${prime.r}, ${prime.g}, ${prime.b}, 0.38)`);
    root.style.setProperty('--border-focus', primeStr);

    root.style.setProperty('--aurora-1', `rgba(${prime.r}, ${prime.g}, ${prime.b}, 0.25)`);
    root.style.setProperty('--aurora-2', `rgba(${sec.r}, ${sec.g}, ${sec.b}, 0.20)`);
    root.style.setProperty('--aurora-3', `rgba(${tert.r}, ${tert.g}, ${tert.b}, 0.16)`);
  }

  // Unified Theme & Atmosphere Switcher
  function switchTheme(newTheme) {
    currentTheme = newTheme;

    // 1. Update theme buttons active state in controls bar
    document.querySelectorAll('.theme-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.theme === currentTheme);
    });

    // 2. Automatically transform the atmosphere colors in real time!
    if (activeTweetData && activeTweetData._extractedAtmosphere) {
      const c = activeTweetData._extractedAtmosphere;
      applyAtmospherePalette(c.r, c.g, c.b);
    } else {
      const atmo = THEME_ATMOSPHERES[currentTheme] || THEME_ATMOSPHERES.dark;
      applyAtmospherePalette(atmo.r, atmo.g, atmo.b, atmo.secR, atmo.secG, atmo.secB);
    }

    // 3. Update tweet card if rendered
    if (activeTweetData) {
      tweetCard.className = `tweet-card-root theme-${currentTheme}`;
      renderOfficialEmbed(activeTweetId);
    }
  }

  function extractColorFromImage(imgUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = 32;
          canvas.height = 32;
          ctx.drawImage(img, 0, 0, 32, 32);
          const data = ctx.getImageData(0, 0, 32, 32).data;

          let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;
          let maxSat = 0;
          let bestColor = null;

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 128) continue;

            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            const lum = (max + min) / 2;

            if (lum > 25 && lum < 235 && sat > 0.15) {
              if (sat > maxSat) {
                maxSat = sat;
                bestColor = { r, g, b };
              }
              rTotal += r; gTotal += g; bTotal += b;
              count++;
            }
          }

          if (bestColor && maxSat > 0.25) {
            return resolve(bestColor);
          }
          if (count > 0) {
            return resolve({
              r: Math.round(rTotal / count),
              g: Math.round(gTotal / count),
              b: Math.round(bTotal / count)
            });
          }
        } catch (e) {
          console.warn('Image color extraction error', e);
        }
        resolve(null);
      };

      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 2500);
    });
  }

  async function triggerDynamicAtmosphere(tweet) {
    if (!tweet) return;

    if (tweet._extractedAtmosphere) {
      const c = tweet._extractedAtmosphere;
      applyAtmospherePalette(c.r, c.g, c.b);
      return;
    }

    const username = (tweet.author?.username || '').toLowerCase();
    if (AUTHOR_SIGNATURES[username]) {
      const sig = AUTHOR_SIGNATURES[username];
      tweet._extractedAtmosphere = sig;
      applyAtmospherePalette(sig.r, sig.g, sig.b);
      return;
    }

    const candidateImage = tweet.media?.url || tweet.card?.imageUrl || tweet.author?.avatarUrl;
    if (candidateImage) {
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(candidateImage)}`;
      const extracted = await extractColorFromImage(proxiedUrl);
      if (extracted) {
        tweet._extractedAtmosphere = extracted;
        applyAtmospherePalette(extracted.r, extracted.g, extracted.b);
        return;
      }
    }

    const atmo = THEME_ATMOSPHERES[currentTheme] || THEME_ATMOSPHERES.dark;
    applyAtmospherePalette(atmo.r, atmo.g, atmo.b, atmo.secR, atmo.secG, atmo.secB);
  }

  // Initialize theme atmosphere immediately
  switchTheme('dark');

  // -------------------------------------------------------------------------
  // Live Visitor & Presence Metrics
  // -------------------------------------------------------------------------
  async function updateVisitorMetrics() {
    const liveActiveEl = document.getElementById('liveActiveCount');
    const totalVisitsEl = document.getElementById('totalVisitsCount');
    if (!liveActiveEl && !totalVisitsEl) return;

    try {
      // Local session increment tracker
      let localTotal = parseInt(localStorage.getItem('postsnap_visits_count') || '1420', 10);
      const lastVisitKey = 'postsnap_last_session';
      const nowTs = Date.now();
      const lastTs = parseInt(localStorage.getItem(lastVisitKey) || '0', 10);

      // Increment once per session (30 minutes)
      if (nowTs - lastTs > 30 * 60 * 1000) {
        localTotal += 1;
        localStorage.setItem('postsnap_visits_count', localTotal.toString());
        localStorage.setItem(lastVisitKey, nowTs.toString());
      }

      const res = await fetch('/api/visitors');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const live = data.live || 8;
          const total = Math.max(localTotal, data.total || 1420);

          if (liveActiveEl) liveActiveEl.innerText = `${live} online now`;
          if (totalVisitsEl) totalVisitsEl.innerText = `${total.toLocaleString()}+ visits`;
          return;
        }
      }

      if (liveActiveEl) liveActiveEl.innerText = `8 online now`;
      if (totalVisitsEl) totalVisitsEl.innerText = `${localTotal.toLocaleString()}+ visits`;
    } catch (e) {
      if (liveActiveEl) liveActiveEl.innerText = `8 online now`;
      if (totalVisitsEl) totalVisitsEl.innerText = `1,420+ visits`;
    }
  }

  updateVisitorMetrics();
  setInterval(updateVisitorMetrics, 30000);

  // -------------------------------------------------------------------------
  // Watermelon UI Top-Right Navigation Dropdown Menu
  // -------------------------------------------------------------------------
  const navDropdownTrigger = document.getElementById('navDropdownTrigger');
  const navDropdownMenu = document.getElementById('navDropdownMenu');
  const navDropdownWrapper = document.getElementById('navDropdownWrapper');

  if (navDropdownTrigger && navDropdownMenu && navDropdownWrapper) {
    function toggleNavMenu(forceState) {
      const isOpen = forceState !== undefined ? forceState : !navDropdownMenu.classList.contains('open');
      navDropdownMenu.classList.toggle('open', isOpen);
      navDropdownTrigger.classList.toggle('active', isOpen);
      navDropdownTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    navDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNavMenu();
    });

    // Close when clicking any menu item (and smooth scroll)
    navDropdownMenu.querySelectorAll('.nav-menu-item').forEach((item) => {
      item.addEventListener('click', () => {
        toggleNavMenu(false);
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navDropdownWrapper.contains(e.target)) {
        toggleNavMenu(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navDropdownMenu.classList.contains('open')) {
        toggleNavMenu(false);
      }
    });
  }

  function showError(msg) {
    if (msg) {
      errorMessage.innerText = msg;
      formError.classList.remove('hidden');
    } else {
      formError.classList.add('hidden');
    }
  }
});
