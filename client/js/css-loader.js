/**
 * Progressive CSS Loader
 * Handles loading of non-critical CSS files after DOM ready
 */

class CSSLoader {
  constructor() {
    this.loadedFiles = new Set();
    this.loadStartTime = performance.now();
  }

  /**
   * Load a CSS file asynchronously
   * @param {string} href - Path to the CSS file
   * @param {string} id - Optional ID for the link element
   * @returns {Promise} - Resolves when CSS is loaded
   */
  loadCSS(href, id = null) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (this.loadedFiles.has(href)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      if (id) link.id = id;

      // Add load event listener
      link.onload = () => {
        this.loadedFiles.add(href);
        console.log(`✓ CSS loaded: ${href}`);
        resolve();
      };

      // Add error event listener
      link.onerror = () => {
        console.error(`✗ Failed to load CSS: ${href}`);
        reject(new Error(`Failed to load CSS: ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Load multiple CSS files in sequence
   * @param {Array} cssFiles - Array of CSS file paths
   * @returns {Promise} - Resolves when all files are loaded
   */
  async loadMultiple(cssFiles) {
    for (const file of cssFiles) {
      try {
        await this.loadCSS(file);
      } catch (error) {
        console.error(`Failed to load ${file}:`, error);
        // Continue loading other files even if one fails
      }
    }

    const loadTime = performance.now() - this.loadStartTime;
    console.log(`🎨 All CSS files loaded in ${loadTime.toFixed(2)}ms`);
  }

  /**
   * Preload CSS files for faster subsequent loads
   * @param {Array} cssFiles - Array of CSS file paths
   */
  preloadCSS(cssFiles) {
    cssFiles.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });
  }
}

// Initialize the CSS loader
const cssLoader = new CSSLoader();

// CSS files to load progressively (in order of importance)
const CSS_FILES = [
  './css/backgrounds.css',
  './css/panels.css',
  './css/responsive.css',
];

// Load CSS files when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 Starting progressive CSS loading...');

  // Start loading CSS files
  cssLoader.loadMultiple(CSS_FILES).then(() => {
    // Dispatch custom event when all styles are loaded
    document.dispatchEvent(
      new CustomEvent('allStylesLoaded', {
        detail: { loadedFiles: Array.from(cssLoader.loadedFiles) },
      })
    );
  });
});

// Optional: Listen for the custom event in your main script
document.addEventListener('allStylesLoaded', function (event) {
  console.log('🎉 All styles have been loaded:', event.detail.loadedFiles);
  // You can add any post-load styling logic here
});
