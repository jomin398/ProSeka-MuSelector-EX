import Lyric from "lrc-file-parser";
/**
 * Lyric Display. 
 * @export
 * @class LyricDisp
 * @extends {Lyric}
 */
export class LyricDisp extends Lyric {
  /**
   * @constructor
   * @param {String} data lrcRawText
   * @param {WaveSurfer} ws wavesurfer
   * @param {Object} option
   * @param {Number?} option.offset a offset delay in milliseconds
   * @param {Boolean?} option.ignorePron Ignore the pronunciation notation?
   * @param {Boolean?} option.ForceMultiLine Force to set Multi line?
   * @param {Boolean?} option.isMiku set theme to miku
   * @param {CSSStyleDeclaration?} option.style cssstyle to set lyric text.
   * @param {CallableFunction|String?} option.anime anime function or name.
   * @param {Boolean?} option.isRemoveBlankLine Force to Notupdates when the lyrics is Blank(empty).
   * @param {Boolean?} option.debug debug mode.
   * @returns {this}
   */
  constructor(data, ws, option) {
    super({
      isRemoveBlankLine: option?.isRemoveBlankLine ?? false,
      offset: option?.offset ?? 0,
    });
    this.#processData.option = option;
    this.wavesurfer = ws;
    this.dom = option?.domElement ?? document.querySelector('.lyrics');
    if (option?.isMiku) {
      this.dom.style.color = 'var(--miku-text-color)';
      this.dom.style.textShadow = 'var(--miku-text-shadow)';
    }
    if (option?.style) Object.assign(this.dom.style, option.style);
    this.#processData.data = data;
    this.appendLyricDom();
    this.dom.innerHTML = 'click the waveform to play';
    this.onSetLyric = lines => {
      this.#processData.lrcLines = lines;
    };
    this.onPlay = (line, text) => {
      this.#onRefresh(line, text);
      if (this.#processData.option?.anime && typeof this.#processData.option?.anime == 'function') this.#processData.option.anime(line, text);
      if (this.#processData.option?.anime && typeof this.#processData.option?.anime == 'string') this.animes[this.#processData.option.anime](line, text);
      //(line, text);
    };
    return this;
  }
  #processData = {
    data: null,
    match: [],
    d2: [],
    prevText: '',
    lrcLines: null,
    option: null
  };
  #onRefresh(line, text) {
    const exLyrics = this.#processData.lrcLines[line].extendedLyrics;
    this.dom.innerHTML = `
    <span class='ja'>${text ?? ''}</span>
    <span class='pron'>${exLyrics[0] ?? ''}</span>
    <span class='ko'>${exLyrics[1] ?? ''}</span>
    `;
  }
  resetElem() {
    if (this.dom) {
      this.dom.remove();
    }
  }
  appendLyricDom() {
    //this.resetElem();
    //console.log(this)
    // let t = document.body;
    this.dom = document.querySelector('.lyrics');
    // if (!isMobile()) {
    //   lyricSetup.fontWightLv = 5;
    // }
    let fontSize = 1.25;
    switch (this.#processData.option?.fontWightLv) {
      default:
      case 0:
      case 3:
        fontSize = 1.25;
        break;
      case 1:
        //h4
        fontSize = 1;
        break;
      case 2:
        //h3
        fontSize = 1.17;
        break;
      case 4:
        //h2
        fontSize = 1.5;
        break;
      case 5:
        //h1
        fontSize = 2;
        break;
    }

    Object.assign(this.dom.style, {
      fontSize: `${fontSize}rem`
    });
    this.dom.innerHTML = 'loading lyrics.';
    // t.appendChild(lywEl)
  };
  animes = {
    wave: function (line, text) {
      const wave = document.querySelector('.wave');
      if (wave) {
        wave.classList.add("show");
        setTimeout(() => {
          wave.className = "wave";
        }, 800);
      }
    },
    waveR: function (line, text) {
      const wave = document.querySelector('.wave.right');
      if (wave) {
        wave.classList.add("show");
        setTimeout(() => {
          wave.className = "wave right";
        }, 800);
      }
    }
  };
  #checkLyricSupport() {
    if (!this.#processData.data || !this.#processData.data.match(/^\[[\d:.]*\](.*)$/gm)) {
      this.dom.innerHTML = "Sorry, Unsupported song to display the Lyrics";
      console.warn(new ReferenceError('NoLyricData'));
      setTimeout(() => {
        this.dom.innerHTML = '';
      }, 5000);
    }
  }
  render() {
    this.#checkLyricSupport();
    if (!this.#processData.data) return;
    this.#processData.match = this.#processData.data.match(/^\[[\d:.]*\](.*)$/gm);
    const mat = this.#processData.match;
    if (!mat) this.setLyric(this.#processData.data);
    if (mat) {
      for (let i in mat) {
        if (this.#processData.prevText != mat[i].match(/\[([\d:.]*)\]/gm)[0]) {
          this.#processData.prevText = mat[i].match(/\[([\d:.]*)\]/gm)[0];
          this.#processData.d2.push(mat[i]);
        }
      }
      //console.log("test :",al.join('\n'));
      let trns = undefined;
      let l = mat.length;


      let isEven = (number) => ((number % 2) == 0) ? true : false;
      let x = Math.round(l * 0.25);
      // 1/4 == 홀수?
      let y = !isEven(x) ? x + 1 : x; //select point of 1/4 of song.
      let z = y + 1;
      let regTime = /\d{2}\:\d{2}\.\d{2,3}/g;
      let isMultiLine = mat[0].match(regTime)[0] == mat[2].match(regTime)[0];
      if (this.#processData.option?.ForceMultiLine) {
        isMultiLine = true;
      }
      if (this.#processData.option.debug) {
        console.log("check is MultiLine? :", isMultiLine);
        console.log("debugging the check :", {
          length: l,
          is_even: isEven(x),
          is_overriden: this.#processData.option?.ForceMultiLine ?? false,
          '1/4 part Num': x,
          y,
          z,
          ab: ["A : " + mat[y], "B : " + mat[z]],
        });
      }

      if (isMultiLine) trns = this.#processData.d2.join('\n');

      this.setLyric(this.#processData.data, trns);
      if (this.#processData.option.ignorePron) {
        console.warn('Ignored pronunciation notation')
        this.lines.map(e => {
          e.extendedLyrics[0] = '';
          return e;
        })
      }
    }

    console.log("RenderingLyrics :", "Ready!");
    this.wavesurfer.once('play', () => {
      this.play(this.wavesurfer.getCurrentTime() * 1000);
    });
    this.wavesurfer.on("pause", function () {
      this.pause();
    }.bind(this));
    this.wavesurfer.on('seeking', () => {
      this.pause();
      this.play(this.wavesurfer.getCurrentTime() * 1000);
    });
  }
}
