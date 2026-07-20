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
        var copyKind = button.getAttribute('data-copy-kind') || 'narration';
        var list = document.querySelector('.script-prompt-list[data-narration-format="' + format + '"]');
        if (!list) return;
        var text = collectCopyText(list, copyKind);
        if (!text) return;
        try {
          await copyPlainText(text);
          showCreatorToast(copyMessage(format, copyKind));
        } catch (error) {
          showCreatorToast('Copy failed. Please select the text manually.');
        }
      });
    });

    document.querySelectorAll('.narration-part-copy-button').forEach(function (button) {
      button.addEventListener('click', async function () {
        var part = button.closest('.narration-part');
        if (!part) return;
        var text = collectPartText(part);
        if (!text) return;
        try {
          await copyPlainText(text);
          showCreatorToast('Narration Part copied.');
        } catch (error) {
          showCreatorToast('Copy failed. Please select the part manually.');
        }
      });
    });
  }

  function collectCopyText(list, copyKind) {
    if (copyKind === 'creator-notes') {
      return Array.from(list.querySelectorAll('.narration-part-note'))
        .map(function (item) {
          return cleanFieldText(item, 'Creator Note');
        })
        .filter(Boolean)
        .join('\n\n');
    }

    if (copyKind === 'image-prompts') {
      return Array.from(list.querySelectorAll('.visual-beat p:first-child'))
        .map(function (item) {
          return cleanBeatText(item);
        })
        .filter(Boolean)
        .join('\n\n');
    }

    return Array.from(list.querySelectorAll('.scene-narration-copy-source, .scene-narration-single .scene-narration'))
      .map(function (item) {
        return cleanFieldText(item, 'Narration');
      })
      .filter(Boolean)
      .join('\n\n');
  }

  function collectPartText(part) {
    var chunks = [];
    var narration = part.querySelector('.narration-part-script');
    var note = part.querySelector('.narration-part-note');
    var beats = Array.from(part.querySelectorAll('.visual-beat'));
    if (narration) chunks.push('Narration:\n' + cleanFieldText(narration, 'Narration'));
    if (note) chunks.push('Creator Note:\n' + cleanFieldText(note, 'Creator Note'));
    if (beats.length) {
      chunks.push('Visual Beats:\n' + beats.map(function (beat, index) {
        return 'Image Prompt ' + (index + 1) + ':\n' + cleanBeatText(beat.querySelector('p:first-child'));
      }).join('\n\n'));
    }
    return chunks.filter(Boolean).join('\n\n');
  }

  function cleanFieldText(item, label) {
    return item.textContent.replace(new RegExp('^\\s*' + label + ':\\s*', 'i'), '').trim();
  }

  function cleanBeatText(item) {
    if (!item) return '';
    return item.textContent.replace(/^\s*(Image Prompt \d+|Visual Beat \d+|[^:]+):\s*/i, '').trim();
  }

  function copyMessage(format, copyKind) {
    if (copyKind === 'creator-notes') return 'Creator Notes copied.';
    if (copyKind === 'image-prompts') return 'Image Prompts copied.';
    return format === 'long' ? 'Long-form narration copied.' : 'Short-form narration copied.';
  }

  bindAdvancedToggles();
  bindNarrationCopy();
})();
