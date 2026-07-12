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
          <button class="naver-prompt-trigger engagement-button naver-prompt-button" type="button" aria-label="네이버 블로그 원고 프롬프트 복사" title="네이버 블로그 원고 프롬프트 복사">
            <span class="engagement-icon" aria-hidden="true">${icon('clipboardEdit')}</span><span class="naver-prompt-label">Naver</span>
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
  if (isStoryPage) {
    setupCommunityKit(section, title, canonical, tagNames, description);
    setupNaverPromptCopy(section, { title, canonical, description, tags: tagNames });
  }

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

  function getArticleCategory() {
    const labels = Array.from(article.querySelectorAll('.article-meta-grid dt'));
    const picked = labels
      .find((dt) => /^category$/i.test(dt.textContent.trim()))
      ?.nextElementSibling?.textContent.trim();
    return picked || article.querySelector('.archive-article-header .label')?.textContent.trim() || '';
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
        showTransientStatus(status, 'Copied');
      } catch (_) {
        showTransientStatus(status, 'Copy failed');
      }
    });
  }

  function showTransientStatus(status, value, duration = 1400) {
    if (!status) return;
      status.textContent = value;
      window.setTimeout(() => {
        status.textContent = '';
    }, duration);
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

  function setupNaverPromptCopy(root, articleData) {
    const trigger = root.querySelector('.naver-prompt-trigger');
    const status = root.querySelector('.share-status');
    if (!trigger) return;

    trigger.addEventListener('click', async () => {
      pulse(trigger);
      try {
        const prompt = buildNaverBlogPrompt(articleData);
        await copyText(prompt);
        showTransientStatus(status, '네이버 블로그 원고용 프롬프트를 복사했습니다.', 2200);
      } catch (_) {
        showTransientStatus(status, '복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해주세요.', 2600);
      }
    });
  }

  function buildNaverBlogPrompt(articleData) {
    const articleTitle = articleData.title || '';
    const articleCategory = getArticleCategory();
    const articleDescription = articleData.description || '';
    const articleUrl = articleData.canonical || getCanonicalShareUrl();
    const articleBody = extractArticleBodyText();

    const fields = [];
    if (articleTitle) fields.push(`제목:\n${articleTitle}`);
    if (articleCategory) fields.push(`카테고리:\n${articleCategory}`);
    if (articleDescription) fields.push(`설명:\n${articleDescription}`);
    if (articleUrl) fields.push(`원문 주소:\n${articleUrl}`);
    if (articleBody) fields.push(`원문:\n\n${articleBody}`);

    const instructions = [
      naverPromptInstructions(),
      naverCopySpacingInstructions()
    ].join('\n\n');

    return `${instructions}\n\nKyunolab 글 정보:\n\n${fields.join('\n\n')}`.trim();
  }

  function naverPromptInstructions() {
    return `아래 Kyunolab의 영문 원문을 바탕으로 네이버 블로그에 게시할 자연스러운 한국어 글을 작성해줘.

단순한 직역이나 문장별 번역이 아니라, 원문의 사실관계와 핵심 내용을 유지하면서 한국 독자가 편하게 읽을 수 있는 독립적인 한국어 블로그 글로 재구성해야 한다.

작성 구조:

1. 제목
2. 흥미를 끄는 도입부
3. 원문에서 중요한 내용만 선별한 본문
4. 자연스러운 마무리
5. Kyunolab 원문 안내와 현재 글 링크
6. 네이버 블로그용 해시태그

작성 조건:

- 제목은 한국어 검색 사용자가 내용을 쉽게 이해할 수 있도록 작성한다.
- 제목에 지나친 과장, 낚시성 표현, 확인되지 않은 단정은 사용하지 않는다.
- 도입부는 2~4문단 정도로 작성한다.
- 본문은 원문의 핵심 사건, 배경, 특징, 의미를 중심으로 구성한다.
- 원문에서 같은 표현이나 문장이 반복되더라도 단순히 삭제하는 데 그치지 말고, 그 반복이 전달하려는 의미를 하나의 자연스러운 설명으로 정리한다.
- 핵심 내용을 지나치게 축약하지 말고, 한국 독자가 맥락을 충분히 이해할 수 있도록 필요한 배경과 의미를 풀어서 설명한다.
- 원문에 근거가 있는 내용은 단순 요약만 하지 말고, 서로 자연스럽게 연결하여 독립적인 블로그 글로 재구성한다.
- 한국인이 읽기에 자연스러운 문장과 문단 흐름으로 재작성한다.
- 영어식 문장 구조와 번역투를 사용하지 않는다.
- 원문에 없는 사실, 인물, 날짜, 장소, 주장, 해석을 임의로 추가하지 않는다.
- 사실과 전설, 주장, 추측이 구분되어 있다면 그 구분을 유지한다.
- 미스터리나 괴담을 사실로 단정하지 않는다.
- 소제목을 적절히 사용해 읽기 쉽게 구성한다.
- 동일한 내용을 문장만 바꾸어 반복하지 않는다.
- 원문이 길다면 불필요한 중복은 정리하되, 사건의 구조와 의미를 이해하는 데 필요한 정보는 충분히 유지한다.
- 원문에서 반복되는 용어나 개념은 한 번만 언급하고 끝내지 말고, 그 개념이 이야기에서 어떤 역할을 하는지 한국 독자가 이해하기 쉽게 풀어서 설명한다.
- 사실관계와 핵심 의미를 유지하는 범위 안에서 설명의 맥락을 충분히 제공한다.
- 원문에 없는 사실이나 해석을 추가해서 분량을 늘리지 않는다.
- 전체 분량은 공백 포함 약 1,800~2,800자를 목표로 한다.
- 원문에 충분한 정보가 있다면 1,800자보다 짧게 축약하지 않는다.
- 분량을 채우기 위해 원문에 없는 내용을 추가하지 말고, 원문 안의 사건 배경, 전승 구조, 반복되는 장면의 의미, 기록의 한계를 충분히 풀어서 설명한다.
- 원문 자체가 매우 짧거나 정보가 부족한 경우에만 목표 분량보다 짧게 작성할 수 있다.
- 이모지는 사용하지 않는다.
- 표는 사용하지 않는다.
- 링크는 임의로 만들지 않는다.
- 최종 결과에는 작성 과정이나 설명을 붙이지 말고, 게시할 완성 원고만 출력한다.
- 문장의 길이를 다양하게 작성한다.
- 모든 문단을 비슷한 길이로 맞추지 않는다.
- 짧은 문장과 긴 문장을 자연스럽게 섞어 글의 리듬을 만든다.
- 같은 연결어와 접속 표현을 반복하지 않는다.
- "중요한 것은", "반대로", "또한", "이러한" 등의 표현이 반복되지 않도록 한다.
- 지나치게 교과서적이거나 모범답안처럼 보이는 문체를 피한다.
- GPT가 작성한 것처럼 느껴지는 반복적인 문장 패턴을 피한다.
- 실제 사람이 네이버 블로그에 작성한 것처럼 자연스러운 호흡과 흐름으로 작성한다.
- 소제목은 설명문처럼 딱딱하게 작성하지 말고, 독자의 흥미를 자연스럽게 유도할 수 있는 표현으로 작성한다.
- Kyunolab 소개는 광고처럼 길게 작성하지 말고 글의 흐름 안에서 자연스럽게 녹여낸다.
- 원문의 핵심 내용은 유지하되 한국 독자가 읽기 편하도록 자연스럽게 재구성한다.
- 본문에는 내용에 맞는 자연스러운 소제목을 3~5개 사용한다.
- 각 소제목 아래에는 단순한 한두 문장 요약이 아니라, 가능하면 2개 이상의 자연스러운 문단으로 내용을 전개한다.
- 도입부와 마무리보다 본문 설명이 글의 중심이 되도록 한다.
- FAQ에 포함된 유용한 설명도 본문 흐름에 자연스럽게 통합한다.
- FAQ의 질문과 답변 형식을 그대로 복사하지 말고, 필요한 내용을 일반 본문 형태로 재구성한다.
- 사용자가 별도의 수정 없이 바로 게시할 수 있는 수준의 완성도를 목표로 작성한다.

마무리에는 아래 의미가 자연스럽게 포함되어야 한다.

“더 자세한 이야기와 전체 기록은 Kyunolab Mystery Archive에서 확인할 수 있습니다.”

그 바로 아래에 제공된 원문 주소를 그대로 표시한다.

해시태그는 글 내용과 직접 관련된 한국어 태그를 8~12개 작성한다.

최종 결과물은 사용자가 그대로 복사하여 네이버 블로그에 붙여넣을 수 있도록 작성한다.

반드시 아래 순서대로 출력한다.

1. 제목
2. 본문
3. Kyunolab 원문 안내 및 링크
4. 해시태그

다음 사항을 반드시 지킨다.

- 추가 설명, 분석, 작성 과정, 안내 문구는 출력하지 않는다.
- 코드블록(\`\`\`)을 사용하지 않는다.
- 제목부터 해시태그까지 하나의 완성된 블로그 원고 형태로 작성한다.
- 제목부터 해시태그까지 하나의 연속된 완성 원고로 출력한다.
- 답변 전체를 그대로 선택해 복사할 수 있도록 불필요한 설명, 분석, 작성 과정, 안내 문구를 넣지 않는다.
- 사용자가 한 번에 전체를 복사할 수 있도록 제작한다.
- 결과물 전체를 하나의 연속된 완성 원고로 출력한다.
- 중간에 AI의 설명이나 부가 안내를 삽입하지 않는다.`;
  }

  function naverCopySpacingInstructions() {
    return `네이버 블로그 붙여넣기용 출력 간격 규칙:

- 기존 글 작성 방식, 문체, 구조, SEO, 제목 생성 방식은 변경하지 않는다.
- 이번 규칙은 최종 출력 형식만 보완한다.
- 제목 아래에는 실제 빈 줄을 출력한다.
- 모든 문단 사이에는 반드시 실제 빈 줄, 즉 빈 줄 하나가 보이는 개행을 출력한다.
- 소제목 위와 아래에도 실제 빈 줄을 출력한다.
- Kyunolab 원문 안내 및 링크와 해시태그 사이에도 실제 빈 줄을 출력한다.
- Markdown에서만 보이는 줄바꿈이 아니라 실제 개행 문자로 문단 간격을 만든다.
- Ctrl+A 또는 복사 버튼으로 결과물을 복사해 네이버 블로그에 붙여넣어도 문단 간격이 유지되도록 작성한다.
- 문단을 한 줄씩 붙여 쓰지 않는다.
- 제목, 본문, Kyunolab 원문 안내 및 링크, 해시태그는 서로 실제 빈 줄로 분리한다.`;
  }

  function extractArticleBodyText() {
    const source = article.querySelector('.story-body');
    if (!source) return '';
    const clone = source.cloneNode(true);
    clone.querySelectorAll('script, style, iframe, noscript, button, input, select, textarea, [hidden], [aria-hidden="true"]').forEach((node) => node.remove());

    const blocks = [];
    clone.querySelectorAll('h2, h3, h4, p, li, blockquote').forEach((node) => {
      const text = normalizeText(node.textContent);
      if (!text || /^advertisement$/i.test(text)) return;
      blocks.push(text);
    });
    return dedupeSequential(blocks).join('\n\n');
  }

  function normalizeText(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t\r\f\v]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function dedupeSequential(values) {
    const result = [];
    values.forEach((value) => {
      if (result[result.length - 1] !== value) result.push(value);
    });
    return result;
  }

  function buildModal(articleTitle, articleUrl, articleTags, articleDescription) {
    const dialog = document.createElement('div');
    dialog.className = 'community-kit-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'community-kit-title');
    const sourceTags = articleTags.length ? articleTags.slice(0, 6).join(', ') : 'folklore, urban legend, mystery, short fiction';
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
        <div class="community-kit-content">
          <div class="community-kit-top-fields">
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
            <label class="community-kit-field community-kit-url-field">
              <span>URL</span>
              <input data-kit-field="url" type="url" value="${escapeAttr(articleUrl)}">
            </label>
          </div>
          <label class="community-kit-field">
            <span>Community Body</span>
            <textarea data-kit-field="body" rows="3"></textarea>
          </label>
          <label class="community-kit-field">
            <span>Discussion Question</span>
            <textarea data-kit-field="question" rows="2"></textarea>
          </label>
          <label class="community-kit-field">
            <span>Recommended Tags</span>
            <textarea data-kit-field="tags" rows="2"></textarea>
          </label>
          <input data-kit-field="description" type="hidden" value="${escapeAttr(articleDescription || '')}">
          <input data-kit-field="source-tags" type="hidden" value="${escapeAttr(sourceTags)}">
        </div>
        <div class="community-kit-actions">
          <button class="engagement-button" type="button" data-copy-kit="full">Copy Full Post</button>
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
    const description = fieldValue(dialog, 'description');
    const sourceTags = fieldValue(dialog, 'source-tags');
    const templates = kitTemplates(title, url, sourceTags, description);
    field(dialog, 'body').value = templates[platform].body;
    field(dialog, 'question').value = templates[platform].question;
    field(dialog, 'tags').value = templates[platform].tags;
  }

  function kitTemplates(title, url, tags, description) {
    const summary = firstSentence(description) || 'A quiet mystery record where folklore, memory, and source limits matter more than easy certainty.';
    const naturalTags = formatNaturalTags(tags);
    const hashtagTags = formatHashtags(tags);
    return {
      reddit: {
        body: `I found this Kyunolab Mystery Archive piece interesting because it treats the subject as folklore instead of pretending every detail is verified.\n\n${summary}`,
        question: 'What detail in this story makes it feel believable enough to keep being retold?',
        tags: naturalTags
      },
      threads: {
        body: `A quiet folklore/mystery read from Kyunolab Mystery Archive.\n\n${summary}`,
        question: 'Does this work better as a legend, a memory, or a warning?',
        tags: hashtagTags
      },
      facebook: {
        body: `This one keeps the atmosphere without treating an uncertain legend as confirmed fact.\n\n${summary}`,
        question: 'Have you heard a similar version of this kind of story?',
        tags: naturalTags
      },
      x: {
        body: `${summary}`,
        question: 'What makes this motif stick?',
        tags: hashtagTags
      },
      generic: {
        body: `A quiet mystery and folklore article from Kyunolab Mystery Archive.\n\n${summary}`,
        question: 'Which part of this story feels most memorable, and why?',
        tags: naturalTags
      }
    };
  }

  function getCopyValue(dialog, target) {
    const body = fieldValue(dialog, 'body');
    const question = fieldValue(dialog, 'question');
    const tags = fieldValue(dialog, 'tags');
    const url = fieldValue(dialog, 'url');
    if (target === 'body') return body;
    if (target === 'tags') return tags;
    if (target === 'url') return url;
    return `${body}\n\n${question}\n\n${url}\n\n${tags}`;
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

  function firstSentence(value) {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    const match = cleaned.match(/^(.+?[.!?])(?:\s|$)/);
    return match ? match[1].trim() : cleaned;
  }

  function formatNaturalTags(value) {
    return tagParts(value).join(', ');
  }

  function formatHashtags(value) {
    return tagParts(value)
      .map((tag) => `#${tag.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '')}`)
      .filter((tag) => tag.length > 1)
      .join(' ');
  }

  function tagParts(value) {
    const raw = String(value || 'folklore, urban legend, mystery, short fiction')
      .split(/[,;]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    const tags = raw.length ? raw : ['folklore', 'urban legend', 'mystery', 'short fiction'];
    return Array.from(new Set(tags)).slice(0, 6);
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
      clipboardEdit: '<svg viewBox="0 0 24 24" focusable="false"><path d="M9 3h6a2 2 0 0 1 2 2h1.2A1.8 1.8 0 0 1 20 6.8V12h-2V7h-2.2A2 2 0 0 1 14 8H10a2 2 0 0 1-1.8-1H6v13h6v2H5.8A1.8 1.8 0 0 1 4 20.2V6.8A1.8 1.8 0 0 1 5.8 5H7a2 2 0 0 1 2-2Zm0 2a1 1 0 0 0 1 1h4a1 1 0 1 0 0-2h-4a1 1 0 0 0-1 1Zm11.7 10.3-1-1a1 1 0 0 0-1.4 0l-5 5V22H16l5-5a1 1 0 0 0 0-1.4l-.3-.3Zm-5.5 4.9 3.8-3.8.6.6-3.8 3.8h-.6v-.6Z"/></svg>',
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
