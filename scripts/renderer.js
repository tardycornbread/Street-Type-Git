// scripts/renderer.js
// Assumes p5 is loaded globally via a <script> tag before this module.

export default class VisualRenderer {
  /**
   * @param {string} containerId — ID of the DOM element to mount the canvas into
   */
  constructor(containerId) {
    this.containerId   = containerId;
    this.letterSpacing = 5;
    this.lineHeight    = 80;
    this.canvas        = null;
    this.p5Instance    = null;

    // Will be wired up in initP5()
    this._updateLetters = () => {};

    // Hidden link for export
    this.downloadLink = this._createDownloadLink();

    // Keep responsive
    window.addEventListener('resize', () => this._handleResize());

    // Kick off p5
    this.initP5();
  }

  _createDownloadLink() {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.download = 'streettype.png';
    document.body.appendChild(a);
    return a;
  }

  initP5() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container "${this.containerId}" not found`);
      return;
    }

    this.p5Instance = new p5(p => {
      // Our working array of letter-objects { type, value, url?, img? }
      let letters = [];

      // 1) Standard canvas setup
      p.setup = () => {
        this.canvas = p
          .createCanvas(container.offsetWidth, 400)
          .parent(this.containerId);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.noLoop(); // only redraw on demand
      };

      // 2) Main draw loop
      p.draw = () => {
        p.clear();
        p.background(255);

        if (letters.length === 0) {
          // placeholder
          p.fill(150);
          p.text('Generated text will appear here…', 20, p.height / 2);
          return;
        }

        let x = 10, y = 20;
        const maxW = p.width - 20;

        for (const lt of letters) {
          if (lt.type === 'space') {
            x += this.letterSpacing + p.textWidth(' ');
          } else if (lt.type === 'letter' && lt.img) {
            // now lt.img is guaranteed to be a p5.Image
            p.image(lt.img, x, y);
            x += lt.img.width + this.letterSpacing;
          } else {
            // fallback to text
            p.fill(200);
            p.text(lt.value, x, y);
            x += p.textWidth(lt.value) + this.letterSpacing;
          }
          if (x > maxW) {
            x = 10;
            y += this.lineHeight;
          }
        }

        // expand height if needed
        const neededH = y + this.lineHeight;
        if (neededH > p.height) {
          p.resizeCanvas(p.width, neededH);
        }
      };

      // 3) The function we’ll call from outside
      //    It takes an array of {type, value, url?}, loads each url into a p5.Image, then redraws.
      this._updateLetters = async raw => {
        const loaded = [];
        for (const lt of raw) {
          if (lt.type === 'letter' && lt.url) {
            try {
              // wrap p.loadImage in a promise
              const img = await new Promise(res => 
                p.loadImage(
                  lt.url,
                  img => res(img),
                  _  => res(null)
                )
              );
              loaded.push({ type: 'letter', value: lt.value, img });
            } catch {
              loaded.push({ type: 'letter', value: lt.value });
            }
          } else {
            loaded.push({ type: lt.type, value: lt.value });
          }
        }
        letters = loaded;
        p.redraw();
      };
    });
  }

  /**
   * Call this with an array of plain letter-objects:
   *   [{ type:'letter'|'space', value: string, url?: string }, …]
   */
  renderLetters(letterData) {
    if (!this.p5Instance) {
      console.error('P5 not initialized');
      return;
    }
    this._updateLetters(letterData);
  }

  /**
   * Export canvas as PNG.
   */
  exportAsImage() {
    if (!this.canvas) {
      console.error('Canvas not ready');
      return;
    }
    const dataURL = this.canvas.elt.toDataURL('image/png');
    this.downloadLink.href = dataURL;
    this.downloadLink.click();
  }

  _handleResize() {
    if (!this.p5Instance || !this.canvas) return;
    const container = document.getElementById(this.containerId);
    const newW = container.offsetWidth;
    const newH = this.canvas.height;
    this.p5Instance.resizeCanvas(newW, newH);
    this.p5Instance.redraw();
  }

  setLetterSpacing(n) { this.letterSpacing = n; }
  setLineHeight(n)    { this.lineHeight    = n; }
}

