// scripts/letterSelector.js

export default class LetterSelector {
    constructor(database) {
      this.database = database;
    }
  
    /**
     * Select a letter-image for each character in `text`.
     * Returns an array of letter-objects describing how to render each character.
     */
    async selectLettersForText(text, style, location) {
      const selected = [];
  
      for (const char of text) {
        // Handle spaces
        if (char === ' ') {
          selected.push({ type: 'space', value: char });
          continue;
        }
  
        // Handle non-alphanumeric characters (punctuation, etc.)
        if (!char.match(/[a-zA-Z0-9]/)) {
          selected.push({ type: 'special', value: char });
          continue;
        }
  
        // Fetch available variants (includes fallback if none numbered)
        let variants = [];
        try {
          variants = await this.database.getLetterVariants(char, style, location);
        } catch (err) {
          console.error(`Error fetching variants for "${char}":`, err);
        }
  
        // If no variants provided, use a placeholder
        if (!variants || variants.length === 0) {
          selected.push({ type: 'placeholder', value: char });
          continue;
        }
  
        // Randomly pick one variant path
        const index = Math.floor(Math.random() * variants.length);
        const path = variants[index];
  
        try {
          const img = await this.database.loadImage(path);
          selected.push({
            type: 'letter',
            value: char,
            path,
            image: img,
            isFallback: path.includes('/fallback/')
          });
        } catch (err) {
          console.error(`Error loading image for "${char}" at ${path}:`, err);
          selected.push({ type: 'placeholder', value: char });
        }
      }
  
      return selected;
    }
  }
  