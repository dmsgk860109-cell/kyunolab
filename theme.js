(function () {
  var storageKey = "kyunolab-theme";
  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function savedTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function setSavedTheme(value) {
    try {
      if (value) {
        localStorage.setItem(storageKey, value);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      return;
    }
  }

  function activeTheme() {
    var saved = savedTheme();
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    return media.matches ? "dark" : "light";
  }

  function applyTheme(mode) {
    if (mode === "light" || mode === "dark") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme");
    }
    updateToggle(mode || "auto");
  }

  function updateToggle(mode) {
    if (!toggle) return;
    var current = mode === "auto" ? "Auto" : mode.charAt(0).toUpperCase() + mode.slice(1);
    toggle.textContent = "Theme: " + current;
    toggle.setAttribute("aria-label", "Theme setting: " + current + ". Activate to change theme.");
    toggle.setAttribute("aria-pressed", activeTheme() === "dark" ? "true" : "false");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = savedTheme();
      var next = current === "light" ? "dark" : current === "dark" ? null : "light";
      setSavedTheme(next);
      applyTheme(next);
    });
  }

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", function () {
      if (!savedTheme()) {
        applyTheme(null);
      }
    });
  }

  applyTheme(savedTheme());
})();
