(function () {
  const articleType = document.querySelector('meta[property="og:type"][content="article"]');
  const article = document.querySelector('.article-layout > article');
  if (!articleType || !article) return;

  const canonical = getCanonicalShareUrl();
  const title = document.querySelector('.article-title')?.textContent.trim() || document.title.replace(/\s*\|.*$/, '');
  const description = getShareDescription();
  const slug = new URL(canonical, window.location.origin).pathname.split('/').filter(Boolean).pop() || 'article';
  const isStoryPage = new URL(canonical, window.location.origin).pathname.startsWith('/stories/');
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
        <a class="engagement-button icon-button" href="https://twitter.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(composeShareText(title, description))}" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
          <span class="engagement-icon brand-icon" aria-hidden="true">${icon('x')}</span><span class="sr-only">X</span>
        </a>
        ${isStoryPage ? `
          <button class="community-kit-trigger engagement-button icon-button" type="button" aria-label="Create community share post" title="Create community share post">
            <span class="engagement-icon" aria-hidden="true">${icon('filePen')}</span><span class="sr-only">Create community share post</span>
          </button>
        ` : ''}
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
  setupShare(section, title, canonical, description);
  if (isStoryPage) setupCommunityKit(section, title, canonical, tagNames, description);

  function getCanonicalShareUrl() {
    const canonicalHref = document.querySelector('link[rel="canonical"]')?.href;
    const source = canonicalHref || window.location.href;
    try {
      const url = new URL(source, window.location.origin);
      url.search = '';
      url.hash = '';
      return url.href;
    } catch (_) {
      const fallback = new URL(window.location.href);
      fallback.search = '';
      fallback.hash = '';
      return fallback.href;
    }
  }

  function getShareDescription() {
    return document.querySelector('meta[name="description"]')?.content.trim()
      || document.querySelector('meta[property="og:description"]')?.content.trim()
      || document.querySelector('.deck')?.textContent.trim()
      || '';
  }

  function composeShareText(shareTitle, shareDescription) {
    if (!shareDescription) return shareTitle;
    return `${shareTitle} - ${shareDescription}`;
  }

  function getArticleTags() {
    const labels = Array.from(article.querySelectorAll('.article-meta-grid dt'));
    const picked = labels
      .filter((dt) => /^(tag|tags|topic|topics)$/i.test(dt.textContent.trim()))
      .map((dt) => dt.nextElementSibling?.textContent.trim())
      .flatMap((value) => value ? value.split(/[,;]+/).map((tag) => tag.trim()) : [])
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

  function setupShare(root, shareTitle, shareUrl, shareDescription) {
    const copyButton = root.querySelector('.copy-link');
    const nativeButton = root.querySelector('.share-native');
    const status = root.querySelector('.share-status');

    if (navigator.share) {
      nativeButton.hidden = false;
      nativeButton.addEventListener('click', async () => {
        pulse(nativeButton);
        try {
          await navigator.share({ title: shareTitle, text: shareDescription || shareTitle, url: shareUrl });
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

  function setupCommunityKit(root, articleTitle, articleUrl, articleTags, articleDescription) {
    const trigger = root.querySelector('.community-kit-trigger');
    if (!trigger) return;

    let modal = null;
    let previouslyFocused = null;

    trigger.addEventListener('click', () => {
      pulse(trigger);
      openModal();
    });

    function openModal() {
      previouslyFocused = document.activeElement;
      modal = buildModal(articleTitle, articleUrl, articleTags, articleDescription);
      document.body.appendChild(modal);
      document.body.classList.add('community-kit-open');
      hydratePlatformFields(modal);
      bindModal(modal);
      modal.querySelector('.community-kit-close')?.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.remove();
      modal = null;
      document.body.classList.remove('community-kit-open');
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    }

    function bindModal(dialog) {
      const backdrop = dialog.querySelector('.community-kit-backdrop');
      const closeButton = dialog.querySelector('.community-kit-close');
      const platform = dialog.querySelector('[data-kit-field="platform"]');
      const status = dialog.querySelector('.community-kit-status');

      backdrop.addEventListener('click', closeModal);
      closeButton.addEventListener('click', closeModal);
      platform.addEventListener('change', () => hydratePlatformFields(dialog));
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
      });

      dialog.querySelectorAll('[data-copy-kit]').forEach((button) => {
        button.addEventListener('click', async () => {
          const target = button.getAttribute('data-copy-kit');
          const value = getCopyValue(dialog, target);
          try {
            await copyText(value);
            status.textContent = 'Copied';
          } catch (_) {
            status.textContent = 'Copy failed';
          }
          window.setTimeout(() => {
            status.textContent = '';
          }, 1400);
        });
      });

      dialog.querySelector('.community-kit-open-platform')?.addEventListener('click', () => {
        const url = platformUrl(platform.value);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      });
    }
  }

  function buildModal(articleTitle, articleUrl, articleTags, articleDescription) {
    const dialog = document.createElement('div');
    dialog.className = 'community-kit-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'community-kit-title');
    const tags = articleTags.length ? articleTags.slice(0, 6).join(', ') : 'Urban Legends, Folklore, Mystery';
    dialog.innerHTML = `
      <div class="community-kit-backdrop" aria-hidden="true"></div>
      <div class="community-kit-panel">
        <div class="community-kit-header">
          <div>
            <p class="engagement-kicker">Operator tool</p>
            <h2 id="community-kit-title">Community Share Kit</h2>
          </div>
          <button class="community-kit-close engagement-button icon-button" type="button" aria-label="Close Community Share Kit">
            <span class="engagement-icon" aria-hidden="true">${icon('close')}</span>
          </button>
        </div>
        <label class="community-kit-field">
          <span>Platform</span>
          <select data-kit-field="platform">
            <option value="reddit">Reddit</option>
            <option value="threads">Threads</option>
            <option value="facebook">Facebook</option>
            <option value="x">X</option>
            <option value="generic">Generic</option>
          </select>
        </label>
        <label class="community-kit-field">
          <span>Share Title</span>
          <input data-kit-field="title" type="text" value="${escapeAttr(articleTitle)}">
        </label>
        <label class="community-kit-field">
          <span>Community Body</span>
          <textarea data-kit-field="body" rows="5"></textarea>
        </label>
        <label class="community-kit-field">
          <span>Discussion Question</span>
          <textarea data-kit-field="question" rows="3"></textarea>
        </label>
        <label class="community-kit-field">
          <span>Recommended Tags</span>
          <textarea data-kit-field="tags" rows="2">${escapeHtml(tags)}</textarea>
        </label>
        <label class="community-kit-field">
          <span>URL</span>
          <input data-kit-field="url" type="url" value="${escapeAttr(articleUrl)}">
        </label>
        <input data-kit-field="description" type="hidden" value="${escapeAttr(articleDescription || '')}">
        <div class="community-kit-actions">
          <button class="engagement-button" type="button" data-copy-kit="full">Copy Full Post</button>
          <button class="engagement-button" type="button" data-copy-kit="title">Copy Title</button>
          <button class="engagement-button" type="button" data-copy-kit="body">Copy Body</button>
          <button class="engagement-button" type="button" data-copy-kit="tags">Copy Tags</button>
          <button class="engagement-button" type="button" data-copy-kit="url">Copy URL</button>
          <button class="engagement-button community-kit-open-platform" type="button">Open Platform</button>
          <span class="community-kit-status" aria-live="polite"></span>
        </div>
      </div>
    `;
    return dialog;
  }

  function hydratePlatformFields(dialog) {
    const platform = fieldValue(dialog, 'platform');
    const title = field(dialog, 'title').value;
    const url = field(dialog, 'url').value;
    const tags = field(dialog, 'tags').value;
    const description = fieldValue(dialog, 'description');
    const templates = kitTemplates(title, url, tags, description);
    field(dialog, 'body').value = templates[platform].body;
    field(dialog, 'question').value = templates[platform].question;
  }

  function kitTemplates(title, url, tags, description) {
    const summary = description ? `\n\n${description}` : '';
    return {
      reddit: {
        body: `I found this Kyunolab Mystery Archive piece and liked how it treats the subject as folklore rather than confirmed fact.\n\n${title}${summary}`,
        question: 'What detail in this legend makes it feel believable enough to keep retelling?'
      },
      threads: {
        body: `${title}${summary}\n\nA quiet folklore/mystery read from Kyunolab Mystery Archive. The interesting part is how ordinary the setting feels before the story turns strange.`,
        question: 'Would this kind of story feel stronger as a legend, a memory, or a warning?'
      },
      facebook: {
        body: `${title}${summary}\n\nThis one is written as a source-aware mystery/folklore record, so it keeps the atmosphere without claiming the story is verified.`,
        question: 'Have you heard a similar version of this kind of story?'
      },
      x: {
        body: `${title}${summary}\n\nA source-aware mystery archive read.`,
        question: 'What makes this motif stick?'
      },
      generic: {
        body: `${title}${summary}\n\nA quiet mystery and folklore article from Kyunolab Mystery Archive, with the source limits kept visible.`,
        question: 'Which part of this story feels most memorable, and why?'
      }
    };
  }

  function getCopyValue(dialog, target) {
    const title = fieldValue(dialog, 'title');
    const body = fieldValue(dialog, 'body');
    const question = fieldValue(dialog, 'question');
    const tags = fieldValue(dialog, 'tags');
    const url = fieldValue(dialog, 'url');
    if (target === 'title') return title;
    if (target === 'body') return body;
    if (target === 'tags') return tags;
    if (target === 'url') return url;
    return `${title}\n\n${body}\n\nDiscussion question:\n${question}\n\nRecommended tags:\n${tags}\n\n${url}`;
  }

  function platformUrl(platform) {
    const urls = {
      reddit: 'https://www.reddit.com/submit',
      threads: 'https://www.threads.net/',
      facebook: 'https://www.facebook.com/',
      x: 'https://x.com/compose/post',
      generic: ''
    };
    return urls[platform] || '';
  }

  function field(dialog, name) {
    return dialog.querySelector(`[data-kit-field="${name}"]`);
  }

  function fieldValue(dialog, name) {
    return field(dialog, name)?.value.trim() || '';
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
      x: '<svg viewBox="0 0 24 24" focusable="false"><path d="M14.3 10.4 21 3h-2.4l-5.4 6-4.3-6H3l7 9.7L3.3 21h2.4l5.5-6.6 4.8 6.6h5.9l-7.6-10.6Zm-2 2.4-.9-1.2-4-5.8h1.8l3.3 4.7.9 1.2 4.3 6.4h-1.8l-3.6-5.3Z"/></svg>',
      filePen: '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 3h8.2L19 7.8V12h-2V9h-4V5H6v14h6v2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm9 2.4V7h1.6L15 5.4Zm5.7 9.9-1-1a1 1 0 0 0-1.4 0l-5 5V22h2.7l5-5a1 1 0 0 0 0-1.4l-.3-.3Zm-5.5 4.9 3.8-3.8.6.6-3.8 3.8h-.6v-.6Z"/></svg>',
      close: '<svg viewBox="0 0 24 24" focusable="false"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z"/></svg>'
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
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
