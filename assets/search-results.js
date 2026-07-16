(function () {
  var root = document.querySelector('[data-search-page]');
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var type = normalizeType(params.get('type'));
  var query = (params.get('q') || '').trim();
  var form = root.querySelector('.search-page-form');
  var select = root.querySelector('[data-search-type]');
  var input = root.querySelector('[data-search-input]');
  var summary = root.querySelector('[data-search-summary]');
  var heading = root.querySelector('[data-search-heading]');
  var count = root.querySelector('[data-search-count]');
  var resultsRoot = root.querySelector('[data-search-results]');

  if (select) select.value = type;
  if (input) input.value = query;
  if (form) form.setAttribute('data-active-type', type);

  if (!query) {
    setSummary('Enter a search term to find Archive records or Creator Library pages.');
    setHeading('Search results');
    setCount('');
    resultsRoot.innerHTML = '<p class="empty-state">Enter a title, legend, category, motif, or keyword to begin.</p>';
    return;
  }

  setSummary((type === 'library' ? 'Creator Library' : 'Archive') + ' results for "' + query + '"');
  setHeading(type === 'library' ? 'Creator Library results' : 'Archive results');
  setCount('Searching...');

  fetch(type === 'library' ? '/data/creator-library-search-index.json' : '/data/archive-search-index.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    })
    .then(function (items) {
      var results = search(items, query);
      renderResults(results, query, type);
    })
    .catch(function () {
      setCount('');
      resultsRoot.innerHTML = '<p class="empty-state">Search is temporarily unavailable. Try again in a moment.</p>';
    });

  function renderResults(results, searchQuery, searchType) {
    setCount(results.length + (results.length === 1 ? ' result' : ' results'));

    if (!results.length) {
      var label = searchType === 'library' ? 'Creator Library pages' : 'records';
      resultsRoot.innerHTML = '<p class="empty-state">No ' + label + ' found for "' + escapeText(searchQuery) + '".</p><p class="empty-state muted">Try another title, legend, category, motif, or keyword.</p>';
      return;
    }

    resultsRoot.innerHTML = results.map(function (result) {
      return '<article class="story-row search-result-row">' +
        '<span class="tag">' + escapeText(result.category || result.scriptType || 'Kyunolab') + '</span>' +
        '<h3><a href="' + escapeAttr(result.url) + '">' + escapeText(result.title) + '</a></h3>' +
        '<p>' + escapeText(result.summary || result.description || '') + '</p>' +
        '<div class="meta">' + escapeText(resultMeta(result)) + '</div>' +
      '</article>';
    }).join('');
  }

  function search(items, searchQuery) {
    var terms = tokenize(searchQuery);
    var normalizedQuery = normalize(searchQuery);
    var seen = Object.create(null);

    return (Array.isArray(items) ? items : [])
      .map(function (item) {
        return { item: item, score: scoreItem(item, normalizedQuery, terms) };
      })
      .filter(function (entry) {
        if (entry.score <= 0) return false;
        var key = entry.item.url || entry.item.slug || entry.item.id;
        if (seen[key]) return false;
        seen[key] = true;
        return true;
      })
      .sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.item.title || '').localeCompare(String(b.item.title || ''));
      })
      .slice(0, 60)
      .map(function (entry) {
        return entry.item;
      });
  }

  function scoreItem(item, normalizedQuery, terms) {
    var title = normalize(item.title);
    var category = normalize(item.category || item.scriptType);
    var tags = normalize((item.tags || []).join(' ') + ' ' + (item.motif || ''));
    var summaryText = normalize([item.summary, item.description, (item.topics || []).join(' ')].join(' '));
    var score = 0;

    if (title === normalizedQuery) score += 120;
    if (title.indexOf(normalizedQuery) === 0) score += 80;
    if (title.indexOf(normalizedQuery) !== -1) score += 60;
    if (tags.indexOf(normalizedQuery) !== -1) score += 36;
    if (category.indexOf(normalizedQuery) !== -1) score += 28;
    if (summaryText.indexOf(normalizedQuery) !== -1) score += 14;

    terms.forEach(function (term) {
      if (title.indexOf(term) !== -1) score += 18;
      if (tags.indexOf(term) !== -1) score += 12;
      if (category.indexOf(term) !== -1) score += 8;
      if (summaryText.indexOf(term) !== -1) score += 4;
    });

    if (terms.length > 1 && terms.every(function (term) {
      return (title + ' ' + tags + ' ' + category + ' ' + summaryText).indexOf(term) !== -1;
    })) {
      score += 20;
    }

    return score;
  }

  function resultMeta(item) {
    return [item.category || item.scriptType, (item.tags || []).slice(0, 3).join(' - ')].filter(Boolean).join(' - ');
  }

  function tokenize(value) {
    return normalize(value).split(' ').filter(function (term) {
      return term.length > 1;
    });
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function normalizeType(value) {
    return value === 'library' ? 'library' : 'archive';
  }

  function setSummary(value) {
    if (summary) summary.textContent = value;
  }

  function setHeading(value) {
    if (heading) heading.textContent = value;
  }

  function setCount(value) {
    if (count) count.textContent = value;
  }

  function escapeText(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function escapeAttr(value) {
    return escapeText(value);
  }
})();
