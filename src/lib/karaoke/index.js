import Lyric from "lrc-file-parser";
export class Karaoke extends Lyric {
    constructor(lrcPath, option) {
        let html = false;
        console.log('init');
        if (document) html = true;
        if (!lrcPath) lrcPath = document.getElementById('lrcPath')?.value;
        if (!lrcPath) throw new ReferenceError('no Lrc path');
        console.log('init', lrcPath)
        super({
            isRemoveBlankLine: option?.isRemoveBlankLine ?? false,
            offset: option?.offset ?? 0,
        });

        this.dom = option?.domElement ?? document.querySelector('.lyrics');
        this.#appendLyricDom();
        this.dom.innerHTML = 'click the waveform to play';
        this.onSetLyric = lines => {
            this.#processData.lrcLines = lines;
        };
        this.onPlay = (line, text) => this.#onRefresh(line, text);
        // this.lrcPath = lrcPath;
        return this;
    }
    #processData = {
        lrcLines: [],
        extraLines: {}
    };
    #commonData = `
[00:00.000]
[00:19.934] 終(おわり)ない海(たび)路(じ)を映(うつ)す
[00:22.955] 蒼(そう)穹(きゅう)の光(ひかり)が
    `;
    #testData = `
    [00:00.000]
[00:19.934] 終(おわり)
[00:20.538] な
[00:20.866] い
[00:21.172] 海(たび)
[00:21.588] 路(じ)
[00:21.690] を
[00:22.083] 映(うつ)
[00:22.508] す
[00:22.955] 蒼(そう)
[00:23.235] 穹(きゅう)
[00:23.605] の
[00:23.926] 光(ひかり)
[00:24.674] が
    `;
    #appendLyricDom() {
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
    #onRefresh(line, text) {
        const exLyrics = this.#processData.lrcLines[line].extendedLyrics;
        this.dom.innerHTML = `
        <span class='ja'>${text ?? ''}</span>
        <span class='pron'>${exLyrics[0] ?? ''}</span>
        <span class='ko'>${exLyrics[1] ?? ''}</span>
        `;
    }
    #updateLrcDisp = (time) => {
        this.play(time);
    };
    #updateSubLrcDisp = (time) => {
        const lines = this.#processData.extraLines;
        let match = lines[time];
        console.log(match)

    };
    async init() {
        const audioElem = document.querySelector('audio');
        // this.setLyric(await (await fetch(this.lrcPath)).text())
        this.setLyric(this.#testData);


        // this.#processData.extraLines = this.lines.map(e => e);

        this.lines.map((line) => {
            this.#processData.extraLines[line.time] = line.text;
        });
        console.log(this.#processData.extraLines)
        this.setLyric(this.#commonData);
        const normal = this.lines;

        audioElem.addEventListener('play', () => this.#updateLrcDisp(audioElem.currentTime * 1000), true);
        audioElem.addEventListener('timeupdate', () => this.#updateSubLrcDisp(this, audioElem.currentTime * 1000));
        audioElem.addEventListener('seeked', () => this.#updateLrcDisp(audioElem.currentTime * 1000));
        //this.#updateSubLrcDisp(audioElem.currentTime * 1000)
    }
}

(async () => {
    let html = false;
    if (window && document) html = true;
    if (html) {
        await new Promise(fin => window.onload = () => fin(true));
        new Karaoke().init();
    };
})()
