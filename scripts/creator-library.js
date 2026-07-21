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
    var copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy failed');
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
    document.addEventListener('click', function (event) {
      var button = event.target.closest('.narration-copy-button, .narration-field-copy-button');
      if (!button) return;
      if (button.classList.contains('narration-copy-button')) {
        copyFullField(button);
        return;
      }
      copySingleField(button);
    });
  }

  async function copyFullField(button) {
    var format = button.getAttribute('data-narration-target');
    var copyKind = button.getAttribute('data-copy-kind') || 'narration';
    var list = document.querySelector('.script-prompt-list[data-narration-format="' + format + '"]');
    if (!list) return;
    var text = collectCopyText(list, copyKind);
    if (!text) return;
    try {
      await copyPlainText(text);
      flashButton(button, 'Copied');
      showCreatorToast(copyMessage(format, copyKind));
    } catch (error) {
      flashButton(button, 'Copy failed');
      showCreatorToast('Copy failed. Please select the text manually.');
    }
  }

  async function copySingleField(button) {
    var copyField = button.getAttribute('data-copy-field');
    var text = collectSingleFieldText(button, copyField);
    if (!text) return;
    try {
      await copyPlainText(text);
      flashButton(button, 'Copied');
      showCreatorToast(singleCopyMessage(copyField));
    } catch (error) {
      flashButton(button, 'Copy failed');
      showCreatorToast('Copy failed. Please select the text manually.');
    }
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
      return Array.from(list.querySelectorAll('.visual-beat-image-prompt'))
        .map(function (item) {
          return cleanBeatText(item);
        })
        .filter(Boolean)
        .join('\n\n');
    }

    if (copyKind === 'motion-prompts') {
      return Array.from(list.querySelectorAll('.visual-beat-motion-prompt'))
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

  function collectSingleFieldText(button, copyField) {
    if (copyField === 'narration') {
      return cleanClosestPartField(button, '.narration-part-script', 'Narration');
    }
    if (copyField === 'creator-note') {
      return cleanClosestPartField(button, '.narration-part-note', 'Creator Note');
    }
    if (copyField === 'image-prompt') {
      return cleanClosestBeatField(button, '.visual-beat-image-prompt');
    }
    if (copyField === 'motion-prompt') {
      return cleanClosestBeatField(button, '.visual-beat-motion-prompt');
    }
    return '';
  }

  function cleanClosestPartField(button, selector, label) {
    var part = button.closest('.narration-part');
    if (!part) return '';
    var item = part.querySelector(selector);
    return item ? cleanFieldText(item, label) : '';
  }

  function cleanClosestBeatField(button, selector) {
    var beat = button.closest('.visual-beat');
    if (!beat) return '';
    var item = beat.querySelector(selector);
    return item ? cleanBeatText(item) : '';
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
    if (copyKind === 'motion-prompts') return 'Motion Prompts copied.';
    return format === 'long' ? 'Long-form narration copied.' : 'Short-form narration copied.';
  }

  function singleCopyMessage(copyField) {
    if (copyField === 'creator-note') return 'Creator Note copied.';
    if (copyField === 'image-prompt') return 'Image Prompt copied.';
    if (copyField === 'motion-prompt') return 'Motion Prompt copied.';
    return 'Narration copied.';
  }

  function flashButton(button, message) {
    var original = button.getAttribute('data-original-label') || button.textContent;
    button.setAttribute('data-original-label', original);
    button.textContent = message;
    window.clearTimeout(button.copyTimer);
    button.copyTimer = window.setTimeout(function () {
      button.textContent = original;
    }, 1200);
  }

  bindAdvancedToggles();
  bindNarrationCopy();
})();
