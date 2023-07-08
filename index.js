import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from 'wavesurfer/plugins/timeline.js';
import { LyricDisp } from "lib/LyricDisp.js";
import { MetaDataExtract } from "lib/MetaDataExtract.js";
import Stats from "lib/stats.js";
import { themeSetting } from "./themeSetting.js";
import { default as Reverb } from "reverb";
// Event listener for file input change
await new Promise(r => window.onload = () => r(true));

class Player {
  /**
   * @param {Object} option
   * @param {String|Array<String>} option.musicName a song name to find from file list.
   * @param {String?} option.musicRootPath for list Looping
   * @param {String?} option.lrcRootPath for list Looping
   * @param {String?} option.lrcFileName for find lrc file manaualy.
   * @param {Object} option.metaData for display.
   * @param {Object} option.wavesurfer wavesurfer option
   * @param {String?} option.theme theme
   * @param {Object} option.timeLine TimelinePlugin option
   * @param {Boolean?} option.mix set to play random from list.
   * @param {Boolean?} option.loop set to loop or not
   */
  constructor(option) {
    this.wavesurfer = null;
    this.audioCtx = null;
    this.lyricDisp = null;
    this.stats = null;
    this.userOption = option;

    // console.log(this.option)
  };

  #isDarkMode = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  };
  #isMobLand = (() => {
    return window.matchMedia && window.matchMedia('(orientation: landscape), (max-height:426px)').matches
  })();
  option = {
    /** @type {String} a song name to find from file list. */
    musicName: null,
    /** @type {String?} for list Looping */
    musicRootPath: null,
    /** @type {String?} for list Looping */
    lrcRootPath: null,
    /** @type {String?} for find lrc file manaualy */
    lrcFileName: null,
    /** @type {import("wavesurfer.js/types/params").WaveSurferParams} */
    wavesurfer: {
      url: null,
      container: '#waveform',
      waveColor: '#4F4A85',
      progressColor: '#383351',
      minPxPerSec: 600,
      fillParent: true,
      hideScrollbar: true,
      autoScroll: true,
      autoCenter: true,
      responsive: true,
      plugins: null,
      backend: 'MediaElement',
    },
    /** @type {String?} theme */
    theme: null,
    /** @type {Boolean} set to play random from list. */
    mix: false,
    /** @type  {Boolean} set to loop or not */
    loop: false,
    metaData: null,
    timeLine: {
      height: 24,
      insertPosition: null,
      timeInterval: 0.2,
      primaryLabelInterval: 5,
      secondaryLabelInterval: 1,
      insertTop: false,
      /** @type {CSSStyleDeclaration} */
      style: {
        fontSize: '20px',
        color: '#2D5B88'
      }
    }
  };
  themeData = null;
  setTheme(name, mode) {
    name ??= 'wave';
    if (name && this.option) this.option.theme = name;
    this.themeData = themeSetting[this.option?.theme] ?? null;
    this.#setThemeColor(mode ?? (this.#isDarkMode() ? 'dark' : null))
  }
  #setThemeColor(mode) {
    const themeConfig = this.themeData;
    //create LinearGradient
    /*const grad = (color, offset, size) => {
      console.log(color, offset, size)
      const ctx = document.createElement('canvas');
      const g = ctx.getContext("2d").createLinearGradient(0, 0, 0, size ?? 150);
      g.addColorStop(offset ? offset[0] : 0, color ? color[0] : '#000');
      g.addColorStop(offset ? offset[1] : 0.5, color ? color[1] : '#000');
      g.addColorStop(offset ? offset[2] : 1, color ? color[2] : '#000');
      return g;
    }*/
    const waveElem = document.querySelector('#waveform');
    if (waveElem) waveElem.style.backgroundColor = 'transparent';
    if (themeConfig && themeConfig.background) waveElem.style.backgroundColor = themeConfig.background;
    let colorArray = themeConfig ? themeConfig.color[mode ?? 'light'] : [];

    console.log(colorArray)
    this.option.wavesurfer.waveColor = colorArray[0] ?? '#132029';
    this.option.wavesurfer.progressColor = colorArray[1] ?? '#5180b0';
    this.option.wavesurfer.cursorColor = colorArray[2] ?? '#74c5fb';
    this.option.timeLine.style.color = colorArray[3] ?? '#d7f7fa';
  }
  #appendStatsModule(stats) {
    ((stats) => {
      //In addition to adding stats by Override the render function of Wavesurfer
      WaveSurfer.prototype.initTimerEvents = function () {
        console.log('initFpsLogger')
        // The timer fires every 16ms for a smooth progress animation
        this.subscriptions.push(this.timer.on('tick', () => {
          stats.begin();
          const currentTime = this.getCurrentTime();
          this.renderer.renderProgress(currentTime / this.getDuration(), true);
          this.emit('timeupdate', currentTime);
          this.emit('audioprocess', currentTime);
          stats.end();
        }));
      }
    })(stats);
  }
  #statInit(appendElemetTarget) {
    const stats = new Stats();
    stats.dom.className = 'statJS';
    stats.showPanel(0);
    appendElemetTarget ??= document.body;
    const searchElement = appendElemetTarget.querySelector('.statJS');
    if (searchElement) searchElement.remove();
    appendElemetTarget.appendChild(stats.dom);
    return stats;
  }
  #titleParser() {
    const extractInfo = (line) => {
      let artistRegex = /(?<=\[)(.*?)(?=\])/; // Matches text within square brackets
      let titleRegex = /(?<=\[.*?\]\s)(.*?)(?=\s\()/; // Matches text after square brackets and before the opening parenthesis
      let makerRegex = /(?<=by\s)(.*?)(?=\))/; // Matches text after "by" and before the closing parenthesis
      let versionRegex = /(?<=\()\w+(?=\s\.?v?Ver)/; // Matches text within parentheses
      let title = "", artist = "", maker = "", version = "";
      if (!line.match(/.*\-.*/)) {
        title = line.match(titleRegex)?.[0] || ""; // Extract the title
        artist = line.match(artistRegex)?.[0] || ""; // Extract the artist
        maker = line.match(makerRegex)?.[0] || ""; // Extract the creator
        version = line.match(versionRegex)?.[0] || ""; // Extract the version
      } else {
        artistRegex = /(?<=\-).*/;
        titleRegex = /.*(?=\s?\-)/;
        title = line.match(titleRegex)?.[0].trim() || "";
        artist = line.match(artistRegex)?.[0].trim() || "";
      }
      return { title, artist, maker, version, album: maker ?? artist };
    };
    return extractInfo(this.option.musicName);
  }
  #dispMetaData(tagData) {
    const imgElm = document.querySelector('.info img');
    const imageCradit = document.querySelector('.info_item:nth-child(6)');
    const dispElems = [...document.querySelectorAll('.info_item')].slice(0, -1);
    let { title, artist, album, comp, maker, trackNum } = tagData ?? {};
    if (!tagData) title = '', artist = '', album = '', comp = '', maker = '', trackNum = 0;
    imgElm.classList.remove('hide');
    imageCradit.classList.remove('hide');


    if (imgElm) imgElm.removeAttribute('src');
    if (imgElm && tagData && tagData.imageUrl) imgElm.src = tagData.imageUrl;
    if (!tagData.imageUrl) {
      imgElm.classList.add('hide');
      imageCradit.classList.add('hide');
    }
    this.option.metaData = tagData;
    if (this.lyricDisp.tags && !this.lyricDisp.tags?.title) this.lyricDisp.tags = this.#titleParser();

    if (this.lyricDisp.tags && this.lyricDisp.tags.title) {
      title = this.lyricDisp.tags.title;
    }

    if (this.lyricDisp.tags && this.lyricDisp.tags.artist) {
      if (!this.lyricDisp.tags.artist.startsWith("VARIOUS")) {
        artist = this.lyricDisp.tags.artist;
      }
    }

    if (this.lyricDisp.tags && this.lyricDisp.tags.album) {
      album = this.lyricDisp.tags.album;
    }
    if (album) album = album.replace('TVアニメ', '');

    if (maker && maker.startsWith("VARIOUS") || maker == '') maker = 'unknown';
    if (artist.length > 10) artist = maker;
    // console.log(title, artist, album, comp, maker, trackNum)
    if (this.lyricDisp.tags) {
      // artist = "";
      album = "";
    }
    const replaceArr = [trackNum, title, artist, album, maker];
    for (let i = 0; i < dispElems.length; i++) {
      switch (i) {
        case 0:
        case 4:
          dispElems[i].children[1].innerHTML = replaceArr[i];
          break;
        case 1:
        case 2:
        case 3:
          dispElems[i].children[0].innerHTML = replaceArr[i];
          break;
        default:
          break;
      }
    }
  }
  /**
   * @param {string|Object} setting 
   * @param {String} setting.musicName
   * @param {String?} setting.musicRootPath
   * @param {String?} setting.lrcRootPath
   * @param {String?} setting.lrcFileName
   * @param {String?} theme
   * @returns 
   */
  async replaceSong(setting, theme) {
    console.log(setting);
    const config = {
      musicName: null,
      musicRootPath: './assets/audiocommon/',
      lrcRootPath: './assets/lrcs/',
      lrcFileName: null,
      theme: null
    };
    if (typeof setting != 'object') { console.warn(new ReferenceError('setting is not Object.')); };

    // let { musicName, musicRoot, lrcRoot, lrcFileName } = setting;
    if (typeof setting == 'string') config.musicName = setting;
    if (typeof setting == 'object') Object.assign(config, setting);
    if (!config.musicName) { console.warn(new ReferenceError('songName is cannot be null.')); return; };
    // this.option.musicRootPath = musicRoot ?? './assets/audiocommon/';
    // this.option.lrcRootPath = lrcRoot ?? './assets/lrcs/';
    // this.option.lrcFileName = lrcFileName ?? null;
    // this.option.musicName = musicName;
    Object.assign(this.option, config);

    let reload = false;
    const audioPath = `${this.option.musicRootPath}${this.option.musicName}.mp3`;
    let lyricParh = `${this.option.lrcRootPath}${this.option.lrcFileName ?? this.option.musicName}.lrc`;
    let lyricData = null;


    if (this.lyricDisp) reload = true;
    console.log(reload, this.option.lrcFileName, this.option.musicName)
    if (reload) {
      this.lyricDisp.pause();
    }
    if (reload && this.wavesurfer) {
      this.wavesurfer.pause();
      this.wavesurfer.renderer.parent.firstChild.remove();
      this.wavesurfer.renderer.parent.classList.remove('focus');
    }
    this.option.wavesurfer.url = audioPath;
    this.stats = this.#statInit();
    this.#appendStatsModule(this.stats);
    this.setTheme(theme);
    this.wavesurfer = new WaveSurfer(this.option.wavesurfer);
    try { lyricData = await (await fetch(lyricParh)).text(); } catch (error) { };

    this.lyricDisp = new LyricDisp(lyricData, this.wavesurfer, { ignorePron: 0, anime: this.themeData?.anime });
    this.lyricDisp.render();

    new MetaDataExtract(this.option.wavesurfer.url).parse()
      .then(d => this.#dispMetaData(d)).catch(e => {
        console.warn(e)
        this.#dispMetaData()
      })

    //resize;
    window.dispatchEvent(new Event('resize'));
    if (reload) {
      // 
      setTimeout(() => {
        this.wavesurfer.play();
      }, 2000)
      // this.lyricDisp.play(this.wavesurfer.getCurrentTime() * 1000);
    }
    return true;
  }
  async EQZ() {
    console.log('inited')
    let AudioCtx = new AudioContext();
    this.audioCtx = AudioCtx;
    let el = this.wavesurfer.media;
    let AudioSrc = AudioCtx.createMediaElementSource(el);
    //AudioSrc.connect(AudioCtx.destination);
    // var source = context.createMediaElementSource(el);
    // console.log(source)


    AudioSrc.disconnect();
    var reverb = new Reverb(AudioCtx, {
      noise: 'pink',
      time: 5,
      decay: 18,
      delay: 2,
      filterType: 'lowpass',
      filterFreq: 4000,
      filterQ: 1,
      mix: 0.65
    });
    await reverb.ready;
    reverb.connect(AudioSrc);
    AudioSrc.connect(AudioCtx.destination);

    console.log(reverb)
    //source.connect(context.destination);



  }
  async init() {
    if (this.userOption.wavesurfer) {
      Object.assign(this.option.wavesurfer, this.userOption.wavesurfer)
      delete this.userOption.wavesurfer;
    }
    Object.assign(this.option, this.userOption);
    if (this.option.timeLine.insertTop) this.option.timeLine.insertPosition = 'beforebegin';
    // Create a timeline plugin instance with custom options
    const timeline = TimelinePlugin.create(this.option.timeLine);
    this.themeData = themeSetting[this.option?.theme] ?? null;
    if (this.option?.theme.includes('R')) {
      document.querySelector('.info_item.container .wave').classList.add('right');
      document.querySelector('.info_item.container .lyrics').classList.add('right');
    };
    this.option.wavesurfer.plugins = [timeline];
    // this.#setThemeColor('light')
    // if (this.#isDarkMode()) this.#setThemeColor('dark');
    this.setTheme();
    const { musicName, musicRootPath, lrcRootPath, lrcFileName } = this.option;

    await this.replaceSong({ musicName, musicRootPath, lrcRootPath, lrcFileName }, this.option.theme);





    this.wavesurfer.renderer.parent.classList.toggle('focus');
    this.wavesurfer.once('interaction', () => {
      this.wavesurfer.renderer.parent.classList.toggle('focus');
      try {
        this.EQZ();
        this.wavesurfer.play();
      } catch (error) { }
    });
    this.wavesurfer.on('finish', () => {
      if (this.option.loop) {
        this.wavesurfer.play(0);
        this.lyricDisp.play(0);
      } else {
        //TODO REPLAY BUTTON.
      }
      if (this.stats && this.stats.reset) this.stats.reset(true);
    })
    window.addEventListener('resize', () => {
      const isMobLand = window.matchMedia('(orientation: landscape)').matches && window.matchMedia('(max-height:426px)').matches;
      let value = 128;
      //if mobile is land, set wave height to -20% then default;
      if (isMobLand) { value = Math.round(128 - (128 * 0.35)) } else { value = 128 };
      this.wavesurfer.options.height = value;
      this.wavesurfer.renderer.canvasWrapper.style.minHeight = `${value}px`;
      // this.wavesurfer.renderer.canvasWrapper.style.height = `${value}px`;
      // this.wavesurfer.renderer.cursor.style.height = `${value}px`;
    });
    window.dispatchEvent(new Event('resize'));
    window.Player = this;
    return this;
  }
  shuffle() {

  }
};
/*
Player.replaceSong({
  musicName:'Ray',
  musicRootPath:'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/Ray/',
  lrcRootPath:'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/Ray/',
  lrcFileName: 'Ray'
})

Player.replaceSong({
    musicName:'[Miku] ポジティブ・パレード (by Deco27)',
    musicRootPath:'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/ポジティブパレード/',
    lrcFileName:'[初音ミク] ポジティブ・パレード'
})
*/
await new Player({
  musicName: '悠久のカタルシス (4スターズ Ver)',
  musicRootPath: 'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/悠久のカタルシス/',
  lrcRootPath: 'https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/悠久のカタルシス/',
  theme: 'wave',
  wavesurfer: {
    container: '#waveform',
    waveColor: '#4F4A85',
    progressColor: '#383312',
  },
  mix: true,
}).init();

// const json = window.json = await (await fetch('https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/info.json')).json();
// console.log(json)