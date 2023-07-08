export default class ParseLRC {
  /** 
   * @param {String} a string of lrc file path or data.
   * @param {Boolean} ignoreEmpty ignore Empty line at parsing?
   * @returns {this}
   */
  constructor(string, ignoreEmpty) {
    /** @type {String} a string of lrc file path or data.*/
    this.raw = string;
    /**
     * @type {Object?} save parsed data.
     */
    this.lyrics = null;
    this.ignoreEmpty = ignoreEmpty;
    return this;
  }
  /** @typedef {Object} data temporarily save data.
   * @prop {Number} currentTime
   * @prop {Array?} currentLyrics
   * @prop {Number} newTime
   */
  data = {
    currentTime: -1,
    currentLyrics: null,
    newTime: -1
  };
  /** 
   * @param {String} line
   * @returns {Boolean}
   */
  #isLineMetaData = line => line.startsWith('[ar:') || line.startsWith('[ti:') || line.startsWith('[al:') || line.startsWith('[length:');
  #isLineLyricData = line => line.match(/\[(\d+:\d+\.\d+)\]/);
  #isPath = line => !this.#isLineLyricData(line) && !this.#isLineMetaData(line);
  #updateTime(newTime) {
    this.data.currentTime = newTime;
    this.data.currentLyrics = [];
  };
  /** parse timestamp to milliseconds */
  #parseTime(timeString) {

    const timePattern = /\[(\d{2}):(\d{2})\.(\d{3})\]/;

    const [, minutes, seconds, milliseconds] = timeString.match(timePattern);

    const totalMilliseconds =
      parseInt(minutes, 10) * 60 * 1000 +
      parseInt(seconds, 10) * 1000 +
      parseInt(milliseconds, 10);
    return (totalMilliseconds);
  };
  async #process(data) {
    if (!data) throw new ReferenceError('Cannot be null.');
    this.raw = data.split('\n');
    for (const line of this.raw) {
      const timeMatch = this.#isLineLyricData(line);
      // make Ignore meta data lines
      if (this.#isLineMetaData(line)) continue;
      if (!timeMatch) continue;
      this.data.newTime = this.#parseTime(line);
      if (this.data.currentTime != this.data.newTime) this.#updateTime(this.data.newTime);
      let lyric = line.replace(timeMatch[0], '').trim();

      this.data.currentLyrics.push(lyric);
      this.lyrics[this.data.currentTime] = this.data.currentLyrics;

    }
    return this.lyrics;
  };
  init() {
    this.lyrics = {};
    this.data.lines = [];
    this.#updateTime(0)
    //bypass or fetch data.
    let p = !this.#isPath(this.raw) ? Promise.resolve(this.raw) : fetch(this.raw).then(d => d.text());
    return p.then(d => this.#process(d))
  };
}