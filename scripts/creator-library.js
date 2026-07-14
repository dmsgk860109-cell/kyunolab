(function () {
  function showCreatorToast(message) {
    var toast = document.querySelector('.creator-copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'creator-copy-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showCreatorToast.timer);
    showCreatorToast.timer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 1800);
  }

  async function copyPlainText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
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
    document.execCommand('copy');
    textarea.remove();
  }

  function bindAdvancedToggles() {
    document.querySelectorAll('.scene-advanced-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        var panel = document.getElementById(button.getAttribute('aria-controls'));
        if (!panel) return;
        var isExpanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!isExpanded));
        panel.hidden = isExpanded;
        button.textContent = isExpanded ? 'Show Advanced Production Info' : 'Hide Advanced Production Info';
      });
    });
  }

  function bindNarrationCopy() {
    document.querySelectorAll('.narration-copy-button').forEach(function (button) {
      button.addEventListener('click', async function () {
        var format = button.getAttribute('data-narration-target');
        var list = document.querySelector('.script-prompt-list[data-narration-format="' + format + '"]');
        if (!list) return;
        var narration = Array.from(list.querySelectorAll('.scene-narration'))
          .map(function (item) {
            return item.textContent.replace(/^\s*Narration:\s*/i, '').trim();
          })
          .filter(Boolean)
          .join('\n\n');
        if (!narration) return;
        try {
          await copyPlainText(narration);
          showCreatorToast(format === 'long' ? 'Long-form narration copied.' : 'Short-form narration copied.');
        } catch (error) {
          showCreatorToast('Copy failed. Please select the narration manually.');
        }
      });
    });
  }

  bindAdvancedToggles();
  bindNarrationCopy();
})();