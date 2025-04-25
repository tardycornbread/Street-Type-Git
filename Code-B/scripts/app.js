// scripts/app.js

import LetterDatabase from './database.js';
import VisualRenderer from './renderer.js';

document.addEventListener('DOMContentLoaded', () => {
  // Grab your form controls
  const userTextInput     = document.getElementById('user-text');
  const fontStyleSelect   = document.getElementById('font-style');
  const locationSelect    = document.getElementById('location');
  const caseOptionSelect  = document.getElementById('case-option');
  const generateBtn       = document.getElementById('generate-btn');
  const exportBtn         = document.getElementById('export-btn');
  const shareBtn          = document.getElementById('share-btn');

  // Instantiate your database and renderer
  const database = new LetterDatabase();
  const renderer = new VisualRenderer('p5-canvas-container');

  // When “Generate Typography” is clicked…
  generateBtn.addEventListener('click', async () => {
    const rawText    = userTextInput.value || '';
    let   text       = rawText;
    const caseOption = caseOptionSelect.value;
    const style      = fontStyleSelect.value;
    const location   = locationSelect.value;

    // Apply uppercase/lowercase if requested
    if (caseOption === 'upper') text = rawText.toUpperCase();
    else if (caseOption === 'lower') text = rawText.toLowerCase();

    try {
      // Build an array of letter‐objects
      const letterArray = [];
      for (const char of text) {
        if (char.trim() === '') {
          // Spaces
          letterArray.push({ type: 'space', value: char });
        } else {
          // Try loading up to 5 variants; pick the first one
          const variants = await database.getLetterVariants(char, style, location);
          const url      = variants[0];
          let   img      = null;
          if (url) {
            img = await database.loadImage(url);
          }
          letterArray.push({
            type:  'letter',
            value: char,
            image: img
          });
        }
      }

      // Hand off to your p5 renderer
      renderer.renderLetters(letterArray);

    } catch (err) {
      console.error('Error generating typography:', err);
    }
  });

  // Export button
  exportBtn.addEventListener('click', () => {
    renderer.exportAsImage();
  });

  // Simple “share” that opens the PNG in a new window/tab
  shareBtn.addEventListener('click', () => {
    if (!renderer.canvas) return;
    const dataURL = renderer.canvas.elt.toDataURL('image/png');
    const win = window.open();
    win.document.body.innerHTML = `<img src="${dataURL}" alt="Shared Typography" />`;
  });
});

