(function () {
  function initPublishingCenter() {
  var root = document.querySelector('[data-publishing-center]');
  if (!root) return;

  root.setAttribute('data-publishing-ready', 'true');
  var status = root.querySelector('.publishing-status');
  var naverPromptCache = {};

  function setStatus(message) {
    if (status) {
      status.textContent = message || '';
    }
  }

  function copyPlainText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return new Promise(function (resolve, reject) {
        var settled = false;
        var timer = window.setTimeout(function () {
          if (settled) return;
          settled = true;
          reject(new Error('copy failed'));
        }, 1500);

        navigator.clipboard.writeText(text).then(function () {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          resolve();
        }).catch(function () {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          reject(new Error('copy failed'));
        });
      }).catch(function () {
        return fallbackCopyPlainText(text);
      });
    }

    return fallbackCopyPlainText(text);
  }

  function fallbackCopyPlainText(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    var copied = document.execCommand('copy');
    textarea.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  function flash(button, message) {
    var original = button.textContent;
    button.textContent = message;
    setStatus(message);
    window.setTimeout(function () {
      button.textContent = original;
    }, 1200);
  }

  function showManualCopy(text, message) {
    var textarea = root.querySelector('.publishing-manual-copy');
    if (!textarea) {
      textarea = document.createElement('textarea');
      textarea.className = 'publishing-manual-copy';
      textarea.setAttribute('readonly', '');
      if (status && status.parentNode) {
        status.parentNode.insertBefore(textarea, status.nextSibling);
      } else {
        root.insertBefore(textarea, root.firstChild);
      }
    }

    textarea.value = text;
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    setStatus(message);
  }

  function getNaverCopyBuilder() {
    if (!window.KyunolabNaverCopy || typeof window.KyunolabNaverCopy.buildPrompt !== 'function') {
      throw new Error('Article copy builder is unavailable');
    }
    return window.KyunolabNaverCopy.buildPrompt;
  }

  function getArticleUrl(button) {
    var url = button.getAttribute('data-url') || '';
    if (!url) throw new Error('Missing article URL');
    return url;
  }

  function parseArticleDocument(html) {
    var parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  function findArticleElement(doc) {
    var article = doc.querySelector('.article-layout > article');
    if (!article || !article.querySelector('.story-body')) {
      throw new Error('Article content not found');
    }
    return article;
  }

  function buildNaverTextFromArticle(doc, article, url) {
    var buildPrompt = getNaverCopyBuilder();
    var prompt = buildPrompt({ canonical: url }, article, doc);
    if (!prompt || !prompt.trim()) {
      throw new Error('Article content not found');
    }
    return prompt;
  }

  function fetchNaverText(button) {
    var url = getArticleUrl(button);
    if (naverPromptCache[url]) {
      return Promise.resolve(naverPromptCache[url]);
    }

    return fetch(url, {
      credentials: 'same-origin',
      cache: 'no-cache'
    }).then(function (response) {
      if (!response.ok) throw new Error('Failed to load article');
      var contentType = response.headers.get('content-type') || '';
      if (contentType && contentType.indexOf('text/html') === -1) {
        throw new Error('Failed to load article');
      }
      return response.text();
    }).then(function (html) {
      var doc = parseArticleDocument(html);
      var article = findArticleElement(doc);
      var prompt = buildNaverTextFromArticle(doc, article, url);
      naverPromptCache[url] = prompt;
      return prompt;
    });
  }

  function formatNaverError(error) {
    var message = error && error.message ? error.message : '';
    if (message === 'Missing article URL') return 'Missing article URL';
    if (message === 'Article content not found') return 'Article content not found';
    if (message === 'Copy failed' || message === 'copy failed') return 'Copy failed';
    return 'Failed to load article';
  }

  function resetButton(button, originalText) {
    window.setTimeout(function () {
      button.textContent = originalText;
      button.disabled = false;
      button.removeAttribute('data-busy');
    }, 1200);
  }

  function failButton(button, originalText, message) {
    button.textContent = originalText;
    button.disabled = false;
    button.removeAttribute('data-busy');
    setStatus(message);
  }

  function readStoredValue(key) {
    try {
      if (!window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStoredValue(key, value) {
    try {
      if (!window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeStoredValue(key) {
    try {
      if (!window.localStorage) return false;
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  root.addEventListener('click', function (event) {
    var shareButton = event.target.closest('.publishing-share');
    var naverButton = event.target.closest('.publishing-naver-copy');

    if (shareButton) {
      event.preventDefault();
      var url = shareButton.getAttribute('data-url') || '';
      copyPlainText(url).then(function () {
        flash(shareButton, 'Copied');
      }).catch(function () {
        flash(shareButton, 'Copy manually');
        showManualCopy(url, 'Copy is blocked. Press Ctrl+C to copy the selected URL.');
      });
      return;
    }

    if (naverButton) {
      event.preventDefault();
      if (naverButton.getAttribute('data-busy') === 'true') return;

      var originalText = naverButton.textContent;
      naverButton.setAttribute('data-busy', 'true');
      naverButton.disabled = true;
      naverButton.textContent = 'Loading...';
      setStatus('Loading...');

      var generatedNaverText = '';
      fetchNaverText(naverButton).then(function (naverText) {
        generatedNaverText = naverText;
        naverButton.textContent = 'Copying...';
        setStatus('Copying...');
        return copyPlainText(naverText);
      }).then(function () {
        naverButton.textContent = 'Copied';
        setStatus('Naver Copy Complete');
        resetButton(naverButton, originalText);
      }).catch(function (error) {
        var message = formatNaverError(error);
        if (message === 'Copy failed' && generatedNaverText) {
          showManualCopy(generatedNaverText, 'Copy failed. Press Ctrl+C to copy the selected Naver text.');
        }
        failButton(naverButton, originalText, message);
      });
    }
  });

  root.querySelectorAll('.publishing-published').forEach(function (input) {
    var key = input.getAttribute('data-storage-key');
    if (!key) return;

    input.checked = readStoredValue(key) === 'true';
    input.addEventListener('change', function () {
      if (input.checked) {
        var saved = writeStoredValue(key, 'true');
        setStatus(saved ? 'Marked as published' : 'Published checked for this session');
      } else {
        var removed = removeStoredValue(key);
        setStatus(removed ? 'Marked as unpublished' : 'Published unchecked for this session');
      }
    });
  });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPublishingCenter);
  } else {
    initPublishingCenter();
  }
})();
