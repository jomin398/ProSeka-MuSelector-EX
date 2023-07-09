import i18next from 'i18n';
import { default as I18nBackend } from 'i18n-backend';
import LocalStorageBackend from 'i18n-exLocalStor';
import LanguageDetector from 'i18n-langdetect';
import { default as I18nFetchApi } from 'i18n-fetch';
import { ImgSearch } from '../lib/ImgSearch/index.js';
import { SongSearch } from '../lib/SongSearch/beta.js';
function buildRegx(folderName) {
    return [new RegExp(`(?<=${folderName}\/).*`, "gm"), new RegExp(`${folderName}\/`, "gm")]
};
async function getRepoTree(repoUrl) { return await (await (await fetch(repoUrl)).json()).tree; };
function treeFilter(treeObject, tfolder) {
    let regexs = buildRegx(tfolder);
    let fileList = treeObject.filter(e => e.path.startsWith(tfolder));
    fileList = fileList
        .filter(e => e.path.match(regexs[0]) != null)
        .map(e => e.path.replace(regexs[1], ''));
    return fileList;
}
//const paths = treeFilter(await getRepoTree(`${host}repos/${repoUser}/${repoName}/git/trees/master?recursive=true`), 'audios');
function createDB(paths) {
    const folders = [];

    for (const path of paths) {
        const pathParts = path.split('/');
        const folderName = pathParts[0];
        let currentFolder = folders.find(e => e.f == folderName) ?? null;
        let match = path.match(/\.\w{3}$/gm) && !path.match(/(.*\/){2,3}/gm);
        let isReadme = path.match(/\.txt$/gm);
        if (isReadme) continue;
        const doEvery = (p) => {
            let isLrc = p.match(/.*\.lrc/gm);
            let isMotion = p.match(/\.vmd$/gm);
            let isCam = (p.toLowerCase().includes("cam") || (p.includes("カメラ")));
            if (isLrc) currentFolder.lrc = true;
            if (isMotion && isCam) currentFolder.cam = true;
            if (isMotion && !isCam) currentFolder.motion = true;
            // if (isMotion) console.log(p, `cam:${isMotion && isCam},motion:${isMotion && !isCam}`);
        }
        if (!currentFolder) {
            currentFolder = {
                f: folderName,
                m: [],
                raw: true,
                r: 3
            };
            doEvery(path);
            currentFolder.m.push(path);
            folders.push(currentFolder);
        }
        if (currentFolder && match) {
            doEvery(path);
            //서브
            currentFolder.m.push(path)
        };
    }
    return folders;
};

const musicItemTemplate = `
<img class="lvImg">
<div class="infoWrap">
  <div class="title maqree">
    <span></span>
  </div>
  <div class="album">
    <span></span>
  </div>
  <div class="artist maqree_cont">
  </div>
  <div class="bottom">
    <div class="tagWrap">
      <div class="tags maqree_cont"></div>
    </div>
  </div>
  <input type="text" name="audioUrl" hidden>
</div>`;

export default class PJSK {
    constructor() {
        this.musicData = null;
        this.imageList = null;
        this.musicTags = null;
        this.i18next = null;
        this.#treeData = null;
        this.musicListElm = null;
        this.lastLVDataRead = 0;
        this.fullLoadedLv = false;
        console.log('loading data....');
        return new Promise(async function (res) {
            this.#treeData = await getRepoTree(`${this.#repoRoot}?recursive=true`);
            this.#cdnHost = 'https://raw.githubusercontent.com/';
            this.#repoRoot = `${this.#cdnHost}${this.#repoUser}/${this.#repoName}/master/`;
            this.musicData = await (await fetch(`${this.#repoRoot}info.json`)).json();
            this.musicTags = [...new Set(this.musicData.d.map(e => e.tags?.flat() ?? null).flat().filter(e => e))];
            this.imageList = treeFilter(this.#treeData, 'images');
            this.searchElm = document.querySelector('.bottomTab .search input');
            this.levelData = null;
            console.log('loading Translate data....')
            await i18next.use(I18nBackend).use(LanguageDetector).init({
                fallbackLng: 'ja',
                partialBundledLanguages: true,
                debug: true,
                backend: {
                    backends: [LocalStorageBackend, I18nFetchApi],
                    backendOptions: [{}, {
                        loadPath: `${this.#repoRoot}locales/{{ns}}/{{lng}}.json`
                    }]
                },
                ns: ["musicTags", "songNames", "gui"]
            });

            window.i18next = i18next;
            this.i18next = i18next;
            this.searchElm.placeholder = this.i18next.t("gui:option.searchhint");
            document.querySelector('.bottomTab .random button').innerText = this.i18next.t("gui:button.random");
            document.querySelector('.bottomTab .confirm button').innerText = this.i18next.t("gui:button.decidesubmit");
            window.PJSK = this;
            res(this);

        }.bind(this))
    }
    #cdnHost = 'https://api.github.com/';
    #repoUser = 'jomin398';
    #repoName = 'mySongDB';
    #repoRoot = `${this.#cdnHost}repos/${this.#repoUser}/${this.#repoName}/git/trees/master`;
    #treeData = null;
    #searchEngine = null;
    #genItemElem(isEmpty) {
        const item = document.createElement('li');
        item.className = "level";
        if (!isEmpty) Array.from(new DOMParser().parseFromString(musicItemTemplate, 'text/html').body.children).map(el => item.append(el));
        return item;
    };
    /**
     * @param {Number} start 
     */
    async addlevel(start) {
        const e = document.querySelector(".listCont");
        const ls = e.firstElementChild;
        const reflashLastAnotionElm = () => {
            const list = e.querySelector('ul#list');
            const latestItem = list.querySelector(".latest");
            if (latestItem) {
                latestItem.remove();
                list.appendChild(latestItem);
            }
        };
        start ??= this.lastLVDataRead;
        let levels = this.levelData;
        this.lastLVDataRead += 20;
        if (this.lastLVDataRead > levels.length || this.lastLVDataRead - 10 < start) {
            levels = levels.slice(start, 0);
        } else {
            levels = levels.slice(start, this.lastLVDataRead);
        }
        levels.map(song => {
            song = ((o, temp) => {
                const level = temp.cloneNode(true);

                let { n, f, lrc, atrys, tags, artist, maker, m, album, another, image } = o;
                const elems = {
                    img: level.querySelector('img'),
                    title: level.querySelector('.title span'),
                    album: level.querySelector('.album span'),
                    artist: level.querySelector('.artist'),
                    tags: level.querySelector('.tagWrap .tags'),
                    audioUrl: level.querySelector('input[name=audioUrl]')
                };
                let songName = n ?? f;
                if (image) elems.img.src = image;
                if (songName) {
                    elems.title.innerText = songName;
                }
                if (album) {
                    elems.album.innerText = album;
                    elems.album.parentElement.classList.add('maqree');
                };
                if (artist) {
                    if (!Array.isArray(artist)) artist = [artist];
                    artist.map(e => {
                        let tagElm = document.createElement('span');
                        tagElm.innerText = e;
                        elems.artist.append(tagElm);

                        elems.audioUrl.value += `&ar=${e}`;
                    })
                }
                if (tags) {
                    tags.map(e => {
                        let tagElm = document.createElement('span');
                        tagElm.className = 'sekai-button';
                        tagElm.innerText = e;
                        tagElm.onclick = () => {
                            this.searchElm.value = e;
                            this.#searchEngine.handleSearch();
                        };
                        elems.tags.append(tagElm);
                    })
                }
                if (another) {
                    another.map((e, i) => {
                        elems.audioUrl.value += `&an${i}=${this.i18next.t(`musicTags:${e}`)}`;
                    })
                }

                if (lrc) {
                    let tagElm = document.createElement('span');
                    tagElm.className = 'sekai-button lrc';
                    tagElm.innerText = this.i18next.t(`gui:option.lrc`);
                    tagElm.onclick = () => {
                        this.searchElm.value = tagElm.innerText;
                        this.#searchEngine.handleSearch();
                    };
                    elems.tags.append(tagElm);
                }
                if (m && m.filter(e => e.endsWith('.mp3'))) {
                    let aurls = m.filter(e => e.endsWith('.mp3'))
                    aurls = aurls.map((e, i) => `&au${i}=https://cdn.jsdelivr.net/gh/jomin398/mySongDB@master/audios/${e}`);
                    elems.audioUrl.value += aurls.join("");
                }
                return level;
            })(song, this.#genItemElem())
            ls.appendChild(song)
        });

        reflashLastAnotionElm();
        return this.lastLVDataRead;
    }
    async #preScrollEv() {
        const e = document.querySelector(".listCont");
        const ls = e.firstElementChild;
        let db = this.musicData.d;
        const replacer = s => { return s.replace(/[\!\?\s\.]/gm, '') };
        const images = this.imageList;
        db = db.map(o => {
            let { n, f, lrc, atrys, tags, artist, maker, m, album, another } = o;
            let origName = f ??= n;
            atrys ??= [];
            atrys = atrys.concat(n, f, origName);
            let name = 'unknown';
            let image = new ImgSearch(images).retrySearch(atrys).filter(e => e);
            if (origName == "Dear") image = ["Dear.jpg"];
            if (image) {
                if (Array.isArray(image)) {
                    let r = image.map(e => e.replace(/\.\w{3}$/gm, ''));
                    let s = r.find(e => e == origName);
                    image = s ? `${s}.jpg` : r[0] ? `${r[0]}.jpg` : r[1] ? `${r[1]}.jpg` : null ?? null;
                    if (image) image = `${this.#repoRoot}images/${image}`;
                } else {
                    let r = image.replace(/\.\w{3}$/gm, '');
                    image = `${r[0]}.jpg`;
                    if (image) image = `${this.#repoRoot}images/${image}`;
                }
            };
            //maker = this.i18next.t(`musicTags:${maker}`);
            maker = maker ? this.i18next.t(`musicTags:${maker}`) : maker ?? 'unknown';

            if (artist) {
                artist = artist.replace(' ', '');
                artist = artist.includes(',') ? artist.split(',').map(e => this.i18next.t(`musicTags:${e}`)) : this.i18next.t(`musicTags:${artist}`);
            }
            name = this.i18next.t(`songNames:${replacer(origName)}`);
            tags = tags?.map(e => e ? e : null).filter(e => e) ?? null;
            if (tags) tags = tags.map(e => this.i18next.t(`musicTags:${e}`));
            if (!lrc) lrc = m?.find(e => e.includes('.lrc')) != null ?? false;
            return { n: name, f, lrc, atrys, tags, artist, maker, m, album, another, image };
        });
        this.levelData = db;
        ls.appendChild(this.#genItemElem(true))
        this.addlevel();
        console.log(this.lastLVDataRead)
        this.musicTags = [...new Set(db.map(e => e.tags?.flat() ?? null).flat().filter(e => e))];
        this.musicTags.map(tagKey => {
            let tagElm = document.createElement('span');
            tagElm.innerText = tagKey;
            tagElm.onclick = () => {
                this.searchElm.value = tagKey;
                this.#searchEngine.handleSearch();
            };
            document.querySelector('.tagsContainer').append(tagElm)
        })
        let taile = this.#genItemElem(true);
        taile.classList.add('latest');
        ls.appendChild(taile)
    };
    /**
    * @callback onScrollCallBack
    * @param {Number} idx list index
    * @param {Number} top scroll px
    * @param {HTMLDivElement} elm selected elem
    */

    /**
     * @type {onScrollCallBack?}
     */
    #onScroll = null;
    #scrollHandleEnable = false;
    #onScrolltoTop() {
        this.fullLoadedLv = this.lastLVDataRead == this.levelData.length;
        const e = document.body.querySelector(".listCont");
        if (!this.fullLoadedLv) {
            this.addlevel();
            this.#resetScroll(null, true);
            e.scrollTop = 3;
        } else {
            e.scrollTop = 3;
            this.#resetScroll(null, true);
        }
    }
    #resetScroll(search, called) {
        const e = document.body.querySelector(".listCont");
        let t = e.querySelector("#list").getElementsByTagName("li");
        if (search) t = document.querySelectorAll('.searchHighlight.match');
        //console.log(t.length)
        let cb = this.#onScroll;
        let l = 0,
            o = !1,
            read = !1;
        const g2t = () => {
            if (!called)
                this.#onScrolltoTop();
        }
        const g2b = () => e.scrollTo(0, e.scrollHeight - e.clientHeight * 1.15);
        function scroll() {
            const top = Math.round(e.scrollTop) + e.clientHeight;
            read = e.scrollHeight === top;
            const s = e.offsetHeight,
                c = t[0]?.offsetHeight,
                n = Math.floor(s / c);
            let r = 0,
                a = 0,
                d = 1,
                i = 0,
                idx = 0;
            if (l < d) {
                //console.log('init')
                r = o ? e.scrollTop : e.scrollTop + c;
                a = r + s;
                d = Math.floor(r / c);
                i = d + n - 1;
                l = d;
            } else if (l > i) {
                o = !0;
                r = o ? e.scrollTop - 10 : e.scrollTop + c;
                a = r + s;
                d = Math.floor(r / c);
                i = d + n - 1;
                l = i;
            }

            for (let e = 0; e < t.length; e++) {
                t[e].classList.remove("selected");
                if (e === l && t[e].innerHTML != '') {
                    t[e].classList.add("selected");
                    idx = e;
                    if (cb) cb(idx, top, t[e]);
                }
            }

            if (read) g2t();
            if (e.scrollTop == 0) {
                g2b();
                return;
            }
        };
        if (this.#scrollHandleEnable) e.removeEventListener('scroll', scroll);
        e.addEventListener("scroll", scroll);
        this.#scrollHandleEnable = true;
        g2t();
    }
    #rngScroll() {
        const list = document.querySelector(".listCont #list");  // Get the element with the ID "list"
        const items = list.children;  // Get all child elements of the "list" container
        const itemheight = items[0].clientHeight;
        const max = list.clientHeight - (itemheight * 3);
        let rng = Math.floor(Math.random() * max);
        list.parentElement.scrollTo(0, rng);
    }
    openPlayer() {
        console.log(document.querySelector('.cover input[type=text]').value);
        // var queryString = "?a0=abcd.mp3";
        // var url = "newpage.html" + queryString;
        // window.open(url, "_blank");
    }
    async init() {
        await this.#preScrollEv();
        this.#searchEngine = new SongSearch(document.querySelector('.listCont #list'), this.searchElm, this.#resetScroll.bind(this));
        this.#onScroll = (idx, top, elm) => {
            const coverWrap = document.querySelector('.cover');
            const album = elm.querySelector('.album span');
            let artist = elm.querySelector('.artist');
            const img = elm.querySelector('img');
            coverWrap.querySelector('img').src = img ? img.src : '';
            if (elm.innerHTML != '') {
                const selectedUrl = elm.querySelector('input[name=audioUrl]').value;
                coverWrap.querySelector('.album span').innerText = album.innerText;
                coverWrap.querySelector('.artist').innerHTML = '';
                artist = artist.cloneNode(true);
                coverWrap.querySelector('.artist').replaceWith(artist);
                coverWrap.querySelector('input[name=audioUrl]').value = selectedUrl;
            }
        };
        this.#resetScroll();

        document.querySelector('.bottomTab .random button').onclick = this.#rngScroll;
        document.querySelector('.bottomTab .confirm button').onclick = this.openPlayer;
    }
}