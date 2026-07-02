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
      <button class="engagement-button interesting-button" type="button" aria-label="Mark this article as interesting">
        <span class="interesting-label">Interesting</span><span class="interesting-count" hidden></span>
      </button>
    </div>
    ${tagNames.length ? `
      <div class="article-tags" aria-label="Article tags">
        <p class="engagement-kicker">Tags</p>
        <div class="tag-list">
          ${tagNames.map((tag) => `<a href="/tags/${slugify(tag)}.html" rel="tag">${escapeHtml(tag)}</a>`).join('')}
        </div>
      </div>
    ` : ''}
    <div class="article-share" aria-label="Share this article">
      <p class="engagement-kicker">Share</p>
      <div class="share-actions">
        <button class="share-native engagement-button" type="button" aria-label="Share this article" hidden>Share</button>
        <button class="copy-link engagement-button" type="button" aria-label="Copy article link">Copy Link</button>
        <a class="engagement-button" href="https://www.reddit.com/submit?url=${encodeURIComponent(canonical)}&title=${encodeURIComponent(title)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit">Reddit</a>
        <a class="engagement-button" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">Facebook</a>
        <a class="engagement-button" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(title)}" target="_blank" rel="noopener noreferrer" aria-label="Share on X">X</a>
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
    const labelEl = root.querySelector('.interesting-label');
    const votedKey = `kyunolab:interesting:${articleSlug}`;
    const isVoted = readStorage(votedKey) === '1';

    if (isVoted) setVoted();
    fetchCount(articleSlug);

    button.addEventListener('click', async () => {
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
      labelEl.textContent = 'Interesting ✓';
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
      countEl.textContent = ` ${count}`;
      countEl.hidden = false;
    }
  }

  function setupShare(root, shareTitle, shareUrl) {
    const copyButton = root.querySelector('.copy-link');
    const nativeButton = root.querySelector('.share-native');

    if (navigator.share) {
      nativeButton.hidden = false;
      nativeButton.addEventListener('click', async () => {
        try {
          await navigator.share({ title: shareTitle, url: shareUrl });
        } catch (_) {}
      });
    }

    copyButton.addEventListener('click', async () => {
      const original = copyButton.textContent;
      try {
        await copyText(shareUrl);
        copyButton.textContent = 'Copied';
      } catch (_) {
        copyButton.textContent = 'Copy failed';
      }
      window.setTimeout(() => {
        copyButton.textContent = original;
      }, 1400);
    });
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
