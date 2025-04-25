// scripts/database.js

export default class LetterDatabase {
  constructor() {
    this.letterCache = {};       // Cache loaded Image objects
    this.loadingPromises = {};   // Ongoing load promises
  }

  /**
   * Test whether an image URL actually exists by letting the browser try to load it.
   * @param {string} path
   * @returns {Promise<boolean>}
   */
  async pathExists(path) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src     = path;
    });
  }

  /**
   * Map your UI style values → actual folder names on disk.
   */
  static styleFolderMap = {
    sans:       'sans',       // maps UI "sans" → folder "sans"
    serif:      'serif',      // "serif" → "serif"
    mono:       'monospace',  // "mono" → "monospace"
    script:     'script',     // "script" → "script"
    decorative: 'decorative'  // if you add "decorative"
  };

  /**
   * Build the path for a character’s numbered JPG variant.
   * Returns null for unsupported characters.
   *
   * @param {string} character    A single alphanumeric character
   * @param {string} styleKey     One of: "sans", "serif", "mono", "script", etc.
   * @param {string} location     City code (e.g. "NYC")
   * @param {number} variantIndex 1-based index to pick 01.jpg → 05.jpg
   * @returns {string|null} URL relative to web root
   */
  getLetterPath(character, styleKey, location, variantIndex = 1) {
    if (!/^[a-zA-Z0-9]$/.test(character)) return null;

    const letter   = character.toUpperCase();                    // "A"
    const caseType = character === letter ? 'upper' : 'lower';   // "upper" or "lower"
    const idx      = String(variantIndex).padStart(2, '0');      // "01", "02", …
    const styleDir = LetterDatabase.styleFolderMap[styleKey];

    if (!styleDir) {
      console.error(`Unknown style key: ${styleKey}`);
      return null;
    }

    // e.g. assets/Alphabet/cities/NYC/alphabet/A/sans-upper/01.jpg
    return [
      'assets',
      'Alphabet',
      'cities',
      location,
      'alphabet',
      letter,
      `${styleDir}-${caseType}`,
      `${idx}.jpg`
    ].join('/');
  }

  /**
   * Gather up to 5 numbered variants (01–05). Only returns those that actually exist.
   *
   * @param {string} character
   * @param {string} styleKey
   * @param {string} location
   * @returns {Promise<string[]>} Array of existing URLs
   */
  async getLetterVariants(character, styleKey, location) {
    const found = [];

    for (let i = 1; i <= 5; i++) {
      const path = this.getLetterPath(character, styleKey, location, i);
      if (path && await this.pathExists(path)) {
        found.push(path);
      }
    }

    return found;
  }

  /**
   * Load an image (or previously found variant) and cache it.
   * @param {string} path
   * @returns {Promise<HTMLImageElement|null>}
   */
  async loadImage(path) {
    if (!path) return null;
    if (this.letterCache[path]) {
      return this.letterCache[path];
    }
    if (this.loadingPromises[path]) {
      return this.loadingPromises[path];
    }

    this.loadingPromises[path] = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.letterCache[path] = img;
        delete this.loadingPromises[path];
        resolve(img);
      };
      img.onerror = () => {
        delete this.loadingPromises[path];
        reject(new Error(`Failed to load image: ${path}`));
      };
      img.src = path;
    });

    return this.loadingPromises[path];
  }
}

