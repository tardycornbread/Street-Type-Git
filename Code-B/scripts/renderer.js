// scripts/renderer.js
// Assumes p5 is loaded globally via a <script> tag before this module
// and that you have a LetterDatabase class available.

export default class VisualRenderer {
  /**
   * @param {string} containerId — ID of the DOM element to mount the canvas into
   * @param {LetterDatabase} db — your database instance
   * @param {string} letter — single character to render (e.g. "A")
   * @param {string} style — one of your style keys, e.g. "sans"
   * @param {string} city — location code, e.g. "NYC"
   * @param {number} width — initial canvas width (px)
   * @param {number} height — initial canvas height (px)
   */
  constructor(containerId, db, letter, style, city, width = 400, height = 400) {
    this.containerId = containerId;
    this.db          = db;
    this.letter      = letter;
    this.style       = style;
    this.city        = city;
    this.canvasW     = width;
    this.canvasH     = height;
    this.canvas      = null;
    this.img         = null;

    // create hidden link for exporting
    this.downloadLink = this._createDownloadLink();

    // re-size handling
    window.addEventListener('resize', () => this._handleResize());

    // actually spin up the p5 sketch
    this.initP5();
  }

  _createDownloadLink() {
    const link = document.createElement('a');
    link.style.display = 'none';
    link.download = 'streettype.png';
    document.body.appendChild(link);
    return link;
  }

  initP5() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container "${this.containerId}" not found`);
      return;
    }

    this.p5Instance = new p5(p => {
      // 1) preload: fetch the first existing variant URL and load it
      p.preload = () => {
        // Note: this.db.getLetterVariants must have been awaited
        // before instantiating this renderer, so this.db.getLetterVariants
        // here should return synchronously or be removed in favor of passing
        // in a URL directly.
        const variants = this.db.getLetterVariants(
          this.letter,
          this.style,
          this.city
        );
        const url = variants[0];
        this.img = p.loadImage(
          url,
          () => {},                         // success
          err => console.error(err, url)   // failure
        );
      };

      // 2) setup: build the canvas once preload is done
      p.setup = () => {
        this.canvas = p
          .createCanvas(container.offsetWidth, this.canvasH)
          .parent(this.containerId);
        p.noLoop();  // we'll redraw only when needed
      };

      // 3) draw: either show the loaded image or fallback text
      p.draw = () => {
        p.clear();
        p.background(255);

        if (this.img?.width) {
          // center the letter image
          const x = (p.width  - this.img.width)  / 2;
          const y = (p.height - this.img.height) / 2;
          p.image(this.img, x, y);
        } else {
          // not loaded yet or failed — show the raw character
          p.fill(200);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(48);
          p.text(this.letter, p.width / 2, p.height / 2);
        }
      };
    });
  }

  _handleResize() {
    if (!this.p5Instance || !this.canvas) return;
    const container = document.getElementById(this.containerId);
    const newW = container.offsetWidth;
    const newH = this.canvas.height;
    this.p5Instance.resizeCanvas(newW, newH);
    this.p5Instance.redraw();
  }

  /**
   * Export current canvas as PNG.
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
}


