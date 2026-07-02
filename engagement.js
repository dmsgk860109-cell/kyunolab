(function () {
  const articleType = document.querySelector('meta[property="og:type"][content="article"]');
  const article = document.querySelector('.article-layout > article');
  if (!articleType || !article) return;

  const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
  const title = document.querySelector('.article-title')?.textContent.trim() || document.title.replace(/\s*\|.*$/, '');
  const slug = new URL(canonical, window.location.origin).pathname.split('/').filter(Boolean).pop() || 'article';
  const related = article.querySelector('.related-articles');
  const body = article.querySelector('.story-body');
  if (!body || article.querySelector('.article-engagement')) return;

  const tagNames = getArticleTags();
  const section = document.createElement('section');
  section.className = 'article-engagement';
  section.setAttribute('aria-label', 'Article engagement');
  section.innerHTML = `
    <div class="engagement-interesting">
      <button class="engagement-button interesting-button" type="button" aria-label="Mark this article as interesting" aria-pressed="false">
        <span class="engagement-icon like-icon" aria-hidden="true">${icon('thumb')}</span>
        <span class="sr-only">Interesting</span>
        <span class="interesting-count" hidden></span>
      </button>
    </div>
    ${tagNames.length ? `
      <div class="article-tags" aria-label="Article tags">
        <p class="engagement-kicker">Tags</p>
        <div class="tag-list">
          ${tagNames.map((tag) => `<a href="/tags/${slugify(tag)}/" rel="tag">${escapeHtml(tag)}</a>`).join('')}
        </div>
      </div>
    ` : ''}
    <div class="article-share" aria-label="Share this article">
      <p class="engagement-kicker">Share</p>
      <div class="share-actions">
        <button class="share-native engagement-button icon-button" type="button" aria-label="Share this article" hidden>
          <span class="engagement-icon" aria-hidden="true">${icon('share')}</span><span class="sr-only">Share</span>
        </button>
        <button class="copy-link engagement-button icon-button" type="button" aria-label="Copy article link">
          <span class="engagement-icon" aria-hidden="true">${icon('link')}</span><span class="sr-only">Copy Link</span>
        </button>
        <a class="engagement-button icon-button" href="https://www.reddit.com/submit?url=${encodeURIComponent(canonical)}&title=${encodeURIComponent(title)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit">
          <span class="engagement-icon brand-icon" aria-hidden="true">${icon('reddit')}</span><span class="sr-only">Reddit</span>
        </a>
        <a class="engagement-button icon-button" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
          <span class="engagement-icon brand-icon" aria-hidden="true">${icon('facebook')}</span><span class="sr-only">Facebook</span>
        </a>
        <a class="engagement-button icon-button" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(title)}" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
          <span class="engagement-icon brand-icon" aria-hidden="true">${icon('x')}</span><span class="sr-only">X</span>
        </a>
        <span class="share-status" aria-live="polite"></span>
      </div>
    </div>
  `;

  if (related) {
    article.insertBefore(section, related);
  } else {
    body.insertAdjacentElement('afterend', section);
  }

  setupInteresting(section, slug);
  setupShare(section, title, canonical);

  function getArticleTags() {
    const labels = Array.from(article.querySelectorAll('.article-meta-grid dt'));
    const picked = labels
      .filter((dt) => /^(tag|topic)$/i.test(dt.textContent.trim()))
      .map((dt) => dt.nextElementSibling?.textContent.trim())
      .filter(Boolean);
    return Array.from(new Set(picked));
  }

  function setupInteresting(root, articleSlug) {
    const button = root.querySelector('.interesting-button');
    const countEl = root.querySelector('.interesting-count');
    const votedKey = `kyunolab:interesting:${articleSlug}`;
    const isVoted = readStorage(votedKey) === '1';

    if (isVoted) setVoted();
    fetchCount(articleSlug);

    button.addEventListener('click', async () => {
      pulse(button);
      if (readStorage(votedKey) === '1') return;
      writeStorage(votedKey, '1');
      setVoted();
      try {
        const response = await fetch('/api/interesting', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug: articleSlug })
        });
        if (!response.ok) return;
        const data = await response.json();
        if (Number.isFinite(data.count) && data.count > 0) showCount(data.count);
      } catch (_) {
        countEl.hidden = true;
      }
    });

    function setVoted() {
      button.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', 'Marked as interesting');
    }

    async function fetchCount(articleSlug) {
      try {
        const response = await fetch(`/api/interesting?slug=${encodeURIComponent(articleSlug)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (Number.isFinite(data.count) && data.count > 0) showCount(data.count);
      } catch (_) {
        countEl.hidden = true;
      }
    }

    function showCount(count) {
      countEl.textContent = count;
      countEl.hidden = false;
    }
  }

  function setupShare(root, shareTitle, shareUrl) {
    const copyButton = root.querySelector('.copy-link');
    const nativeButton = root.querySelector('.share-native');
    const status = root.querySelector('.share-status');

    if (navigator.share) {
      nativeButton.hidden = false;
      nativeButton.addEventListener('click', async () => {
        pulse(nativeButton);
        try {
          await navigator.share({ title: shareTitle, url: shareUrl });
        } catch (_) {}
      });
    }

    copyButton.addEventListener('click', async () => {
      pulse(copyButton);
      try {
        await copyText(shareUrl);
        showStatus('Copied');
      } catch (_) {
        showStatus('Copy failed');
      }
    });

    function showStatus(value) {
      status.textContent = value;
      window.setTimeout(() => {
        status.textContent = '';
      }, 1400);
    }
  }

  function pulse(element) {
    element.classList.remove('is-pulsing');
    void element.offsetWidth;
    element.classList.add('is-pulsing');
  }

  function icon(name) {
    const icons = {
      thumb: '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 21H4.8A1.8 1.8 0 0 1 3 19.2v-7.4A1.8 1.8 0 0 1 4.8 10H7v11Zm3.2 0H7V10l4.8-7a1.6 1.6 0 0 1 2.9 1.1l-.7 4.1h4.2a2.8 2.8 0 0 1 2.7 3.5l-1.5 6.8A3.2 3.2 0 0 1 16.3 21h-6.1Z"/></svg>',
      share: '<svg viewBox="0 0 24 24" focusable="false"><path d="M18 16.1c-1 0-1.9.4-2.5 1.1L8.9 13a3 3 0 0 0 0-2l6.5-4.1A3.2 3.2 0 1 0 14.3 5L7.8 9.1a3.2 3.2 0 1 0 0 5.8l6.5 4.1A3.2 3.2 0 1 0 18 16.1Z"/></svg>',
      link: '<svg viewBox="0 0 24 24" focusable="false"><path d="M9.4 14.6a1 1 0 0 1 0-1.4l3.8-3.8a1 1 0 0 1 1.4 1.4l-3.8 3.8a1 1 0 0 1-1.4 0Zm-1.7 3.5a4.2 4.2 0 0 1-3-7.2l3.2-3.2a4.2 4.2 0 0 1 6 0 1 1 0 1 1-1.4 1.4 2.2 2.2 0 0 0-3.2 0l-3.2 3.2a2.2 2.2 0 0 0 3.2 3.2 1 1 0 1 1 1.4 1.4 4.2 4.2 0 0 1-3 1.2Zm5.5-1.8a1 1 0 0 1-1.4-1.4 2.2 2.2 0 0 0 3.2 0l3.2-3.2a2.2 2.2 0 0 0-3.2-3.2 1 1 0 1 1-1.4-1.4 4.2 4.2 0 0 1 6 6l-3.2 3.2a4.2 4.2 0 0 1-6 0Z"/></svg>',
      reddit: '<svg viewBox="0 0 24 24" focusable="false"><path d="M21 12.3a2.2 2.2 0 0 0-3.7-1.6 9.8 9.8 0 0 0-4.3-1.2l.8-3.8 2.7.6a2 2 0 1 0 .3-1.4l-3.5-.8a.8.8 0 0 0-.9.6l-1 4.8a10 10 0 0 0-4.7 1.2A2.2 2.2 0 1 0 4.3 14c0 3 3.5 5.4 7.7 5.4s7.7-2.4 7.7-5.4c.8-.4 1.3-1 1.3-1.7ZM8.8 13.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Zm5.8 3.5c-.8.7-4.4.7-5.2 0a.7.7 0 0 1 1-.9c.5.4 2.7.4 3.2 0a.7.7 0 0 1 1 .9Zm.6-1.3a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" focusable="false"><path d="M14 8.6V7.1c0-.7.2-1.1 1.1-1.1H17V3h-2.8C11.4 3 10 4.6 10 7v1.6H7.8V12H10v9h4v-9h2.7l.5-3.4H14Z"/></svg>',
      x: '<svg viewBox="0 0 24 24" focusable="false"><path d="M14.3 10.4 21 3h-2.4l-5.4 6-4.3-6H3l7 9.7L3.3 21h2.4l5.5-6.6 4.8 6.6h5.9l-7.6-10.6Zm-2 2.4-.9-1.2-4-5.8h1.8l3.3 4.7.9 1.2 4.3 6.4h-1.8l-3.6-5.3Z"/></svg>'
    };
    return icons[name] || '';
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {}
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('copy failed');
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }
})();
