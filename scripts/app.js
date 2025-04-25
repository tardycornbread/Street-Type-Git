// scripts/app.js

import LetterDatabase from './database.js';
import VisualRenderer from './renderer.js';
import LetterSelector from './letterSelector.js';

document.addEventListener('DOMContentLoaded', () => {
  // Grab your form controls
  const userTextInput     = document.getElementById('user-text');
  const fontStyleSelect   = document.getElementById('font-style');
  const locationSelect    = document.getElementById('location');
  const caseOptionSelect  = document.getElementById('case-option');
  const generateBtn       = document.getElementById('generate-btn');
  const exportBtn         = document.getElementById('export-btn');
  const shareBtn          = document.getElementById('share-btn');

  // Instantiate your classes
  const database = new LetterDatabase();
  const selector = new LetterSelector(database);
  const renderer = new VisualRenderer('p5-canvas-container');

  // When "Generate Typography" is clicked…
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
      // Use the LetterSelector to handle all letter selection logic
      const letterArray = await selector.selectLettersForText(text, style, location);
      
      // Transform the data structure to match what the renderer expects
      const rendererData = letterArray.map(letter => {
        if (letter.type === 'letter' && letter.path) {
          return {
            type: 'letter',
            value: letter.value,
            url: letter.path
          };
        }
        return letter;
      });

      // Hand off to your p5 renderer
      renderer.renderLetters(rendererData);
      
    } catch (err) {
      console.error('Error generating typography:', err);
    }
  });

  // Export button
  exportBtn.addEventListener('click', () => {
    renderer.exportAsImage();
  });

  // Simple "share" that opens the PNG in a new window/tab
  shareBtn.addEventListener('click', () => {
    if (!renderer.canvas) return;
    const dataURL = renderer.canvas.elt.toDataURL('image/png');
    const win = window.open();
    win.document.body.innerHTML = `<img src="${dataURL}" alt="Shared Typography" />`;
  });
});

