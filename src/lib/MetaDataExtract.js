// const isDarkMode = (() => {
//   return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
// })();
/**
 * music Meta Data Extractor.
 * @class MetaDataExtract
 * @typedef {MetaDataExtract}
 */
export class MetaDataExtract {
  /**
   * Creates an instance of MetaDataExtract.
   * @constructor
   * @param {String} url a media url.
   */
  constructor(url) {
    /** @type {String} a media url. */
    this.url = url;
    /** @type {String?} a image data url. */
    this.imageUrl = null;
    /** @type {String} a song title */
    this.title = 'unknown';
    /** @type {String} a song artist */
    this.artist = 'unknown';
    /** @type {String} a song album title */
    this.album = 'unknown';
    /** @type {String} a song composer */
    this.comp = 'unknown';
    /** @type {Number} track number */
    this.trackNum = 0;
    /** @type {Number} disk(Package) number */
    this.diskNum = 0;
    /** @type {String} a song maker */
    this.maker = 'unknown';
  }
  errors = {
    NOMetaDataError: class NOMetaDataError extends Error {
      constructor(message) {
        super(message ?? 'No metadata found.');
        this.name = 'NOMetaDataError';
      }
    }
  }
  async parse() {
    const self = this;
    this.url = await (await fetch(this.url)).blob();
    const result = await new Promise((resolve, reject) => {
      jsmediatags.read(this.url, {
        onSuccess: function (tagData) {
          // console.log(tag);
          resolve({ tagData, url: this.url });
        },
        onError: function (error) {
          //console.log('here?')
          reject(new self.errors.NOMetaDataError());
        }
      });
    }).catch(error => { throw error; });
    const { tagData, url } = result;
    URL.revokeObjectURL(url);
    if (tagData.tags?.picture) {
      const { data: imageData, format } = tagData.tags.picture;
      // const imageData = tagData.tags.picture.data;
      // const imageFormat = tagData.tags.picture.format;
      let base64String = "";
      if (imageData.length > 0) for (let i = 0; i < imageData.length; i++) {
        base64String += String.fromCharCode(imageData[i]);
      };
      this.imageUrl = base64String != "" ? `data:${format};base64,${window.btoa(base64String)}` : null;
    }

    const { title, artist, album, track } = tagData.tags;
    this.title = title;
    this.artist = artist;
    this.album = album;
    this.comp = tagData.tags.TCOM?.data ?? 'unknown';
    this.trackNum = parseInt(track ?? 0) ?? 0;
    this.diskNum = parseInt(tagData.tags.TPOS?.data) ?? 0;
    this.maker = tagData.tags.TPE2?.data ?? 'unknown';
    return this;
  }
}
