(function () {
  function initPublishingCenter() {
  var root = document.querySelector('[data-publishing-center]');
  if (!root) return;

  root.setAttribute('data-publishing-ready', 'true');
  var status = root.querySelector('.publishing-status');

  function setStatus(message) {
    if (status) {
      status.textContent = message || '';
    }
  }

  function copyPlainText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

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

  function buildNaverText(button) {
    var title = button.getAttribute('data-title') || '';
    var url = button.getAttribute('data-url') || '';
    var description = button.getAttribute('data-description') || '';
    var category = button.getAttribute('data-category') || '';
    return [
      'Naver Blog Conversion Source',
      '',
      'Title:',
      title,
      '',
      'Category:',
      category,
      '',
      'Description:',
      description,
      '',
      'Kyunolab original article:',
      url
    ].join('\n').trim();
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
      var title = shareButton.getAttribute('data-title') || '';
      var url = shareButton.getAttribute('data-url') || '';
      var shareData = { title: title, url: url };

      if (navigator.share) {
        navigator.share(shareData).then(function () {
          flash(shareButton, 'Shared');
        }).catch(function () {
          copyPlainText(url).then(function () {
            flash(shareButton, 'Copied');
          }).catch(function () {
            flash(shareButton, 'Failed');
          });
        });
        return;
      }

      copyPlainText(url).then(function () {
        flash(shareButton, 'Copied');
      }).catch(function () {
        flash(shareButton, 'Failed');
      });
      return;
    }

    if (naverButton) {
      event.preventDefault();
      copyPlainText(buildNaverText(naverButton)).then(function () {
        flash(naverButton, 'Copied Naver text');
      }).catch(function () {
        flash(naverButton, 'Failed');
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
