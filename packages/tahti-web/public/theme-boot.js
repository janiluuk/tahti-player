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
    if (!themeId) {
      themeId = localStorage.getItem('tahti-nuclear-theme-id');
    }
    var darkRaw = localStorage.getItem('tahti-nuclear-dark');
    if (darkRaw != null) {
      dark = darkRaw === '1';
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
    if (!themeId) {
      themeId = 'nuclear:default';
    } else if (themeId.indexOf('custom:') === 0) {
      var css = localStorage.getItem('tahti-theme-css');
      if (css) {
        var style = document.createElement('style');
        style.id = 'advanced-theme-boot';
        style.textContent = css
          .replace(/(^|\n):root\{/, '$1html:root{')
          .replace(
            /(^|\n)\[data-theme='dark'\]\{/,
            "$1html[data-theme='dark']{",
          );
        document.head.appendChild(style);
      }
      themeId = 'nuclear:default';
    }
    document.documentElement.setAttribute('data-theme-id', themeId);
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch {
    void 0;
  }
})();
