(function () {
  try {
    var bag = localStorage.getItem('tahti-web-theme');
    var themeId = null;
    var colorMode = null;
    var dark = null;
    if (bag) {
      var parsed = JSON.parse(bag);
      var state = parsed && parsed.state ? parsed.state : parsed;
      if (state) {
        if (typeof state.themeId === 'string') {
          themeId = state.themeId;
        }
        if (typeof state.colorMode === 'string') {
          colorMode = state.colorMode;
        }
        if (typeof state.dark === 'boolean') {
          dark = state.dark;
        }
      }
    }
    if (!bag) {
      themeId = localStorage.getItem('tahti-nuclear-theme-id');
      var darkRaw = localStorage.getItem('tahti-nuclear-dark');
      if (darkRaw != null) {
        dark = darkRaw === '1';
      }
    }
    if (colorMode === 'light') {
      dark = false;
    } else if (colorMode === 'dark') {
      dark = true;
    } else if (colorMode === 'dynamic') {
      var hour = new Date().getHours();
      dark = hour < 7 || hour >= 19;
    } else if (dark == null) {
      dark = false;
    }
    var root = document.documentElement;
    var style = document.getElementById('advanced-theme-boot');
    if (!themeId) {
      themeId = 'custom:gruvbox';
    }
    if (themeId.indexOf('custom:') === 0) {
      var css = localStorage.getItem('tahti-theme-css');
      if (css) {
        if (!style) {
          style = document.createElement('style');
          style.id = 'advanced-theme-boot';
          document.head.appendChild(style);
        }
        style.textContent = css;
      } else if (style && themeId !== style.getAttribute('data-theme-for')) {
        style.remove();
      }
      root.setAttribute('data-custom-theme-id', themeId);
      themeId = 'nuclear:default';
    } else if (style) {
      style.remove();
    }
    root.setAttribute('data-theme-id', themeId);
    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  } catch {
    void 0;
  }
})();
