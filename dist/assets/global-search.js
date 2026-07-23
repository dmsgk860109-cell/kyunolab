(function () {
  var placeholders = {
    archive: 'Search stories, legends, and mysteries...',
    library: 'Search Creator Library...'
  };

  function normalizeType(value) {
    return value === 'library' ? 'library' : 'archive';
  }

  document.querySelectorAll('form.site-search, form.search-page-form').forEach(function (form) {
    var select = form.querySelector('[data-search-type]');
    var input = form.querySelector('[data-search-input]');
    if (!select || !input) return;

    function updatePlaceholder() {
      input.setAttribute('placeholder', placeholders[normalizeType(select.value)]);
    }

    select.addEventListener('change', updatePlaceholder);
    updatePlaceholder();

    form.addEventListener('submit', function (event) {
      if (!input.value.trim()) {
        event.preventDefault();
        input.focus();
      }
    });
  });
})();
