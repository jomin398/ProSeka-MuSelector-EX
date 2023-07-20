import { default as Reverb } from '@logue/reverb';
import FlStudioKnob from 'FlStudioKnob';
import { EQPresets } from './EQPresets.js';

const eqElementHtml = `<div class="eqmodule reverb">
<header>
  <span>Reverb</span>
  <input type="checkbox" name="power" id="power">
  <span>preset</span>

  <div class="dropdown dropdown-dark" id="preset">
    <select name="preset" class="dropdown-select">
    </select>
  </div>
</header>
<div class="controls"></div>
<details>
    <summary>Credit</summary>
    <p>Powered by <code>Reverb.js</code> by <a href="https://github.com/logue/Reverb.js">logue</a></p>
    <p>Reverb Module is Coded by <a href="http://github.com/jomin398">jomin398</a></p>
    <p>Knobs are cloned from FLSTUDIO® by <a href="https://codepen.io/jhnsnc">jhnsnc</a></p>
    <small>FLSTUDIO® is Trade Mark of Image Line Software.</small>
    <small>© 2023 Image Line Software</small>
</details>
</div>`;

/**
 * @export
 * @class ReverbEQ
 * @author jomin398
 * @extends {Reverb}
 */
export default class ReverbEQ extends Reverb {
    /**
     * @constructor
     * @param {AudioContext} AudioCtx
     */
    constructor(AudioCtx) {
        if (!AudioCtx) throw new ReferenceError('AudioCtx is undefined.');
        super(AudioCtx);
        this.element = new DOMParser().parseFromString(eqElementHtml, 'text/html').body.firstChild;
        this.audioElm = null;
        this.presetSelElm = null;
        this.powerElm = null;
        this.audioSrc = null;
        this.knobs = null;
        this.knobs = this.#initKnobs();
        this.knobs.map((e, i) => {
            let el = e._container;
            e._input.onchange = ev => {
                const keys = ['delay', 'decay', 'time'];
                if (i == 0) this.delay(parseFloat(ev.target.value));
                if (i == 1) this.decay(parseFloat(ev.target.value));
                if (i == 2) this.time(parseFloat(ev.target.value));
            }
            this.element.querySelector('.controls').appendChild(el);
        });
        // this.#addCssOnHeader();
        return this;
    }
    #reverbCssUrl = './src/lib/ReverbEQ/reverb.css';
    #knobCssUrl = './src/lib/flstudioKnob/knob.min.css';
    #addCssOnHeader() {
        function urlOnhead(url) {
            return document.head.querySelector(`link[href="${url}"]`) != null;
        }
        function addCss(url) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        }
        if (!urlOnhead(this.#reverbCssUrl)) addCss(this.#reverbCssUrl);
        if (!urlOnhead(this.#knobCssUrl)) addCss(this.#knobCssUrl);
    }
    get isEnable() {
        return this.powerElm?.checked ?? false;
    }
    #knobSettups = [
        { v: 10, n: 'pre-delay', step: 0.1 },
        { v: 2, n: 'delay', max: 50 },
        { v: 1.2, n: 'time', max: 25, min: 0, step: 0.1 }
    ];
    #initKnobs() {
        return new FlStudioKnob(this.#knobSettups);
    }
    #getsel = elm => {
        return elm.options[elm.selectedIndex].value;
    };
    #preSetOnchage() {
        if (!this.#getsel(this.presetSelElm) || !this.knobs) return;
        const select = EQPresets.find(e => e.n == this.#getsel(this.presetSelElm));
        const { n, noise, decay, delay, time, mix, filterType, filterFreq, filterQ } = select;
        for (let i in this.knobs) {
            this.knobs[i]._input.value = [delay, decay, time][i];
            this.knobs[i]._handlers.inputChange();
        }

        if (time) this.time(time);
        if (decay) this.decay(decay);
        if (delay) this.delay(delay);
        if (filterType) this.filterType(filterType);
        if (filterFreq) this.filterFreq(filterFreq);
        if (filterQ) this.filterQ(filterQ);
        if (mix) this.mix(mix);
        this.setNoise(noise ?? 'white');
    }

    /**
     * Module initialization
     * @param {HTMLAudioElement} audioElm
     * @param {MediaElementAudioSourceNode} audioSrc
     */
    init(audioElm, audioSrc) {
        if (!audioElm) throw new ReferenceError('Audio Element is undefined.');
        this.audioElm = audioElm;

        if (audioSrc && !audioSrc instanceof MediaElementAudioSourceNode) throw new ReferenceError('AudioSourceNode not instanceof AudioSourceNode');
        this.audioSrc = audioSrc;

        this.presetSelElm = this.element.querySelector('div#preset select');
        this.powerElm = document.getElementById('power');

        EQPresets.map((e, i) => {
            const op = document.createElement('option');
            if (i == 0) op.selected = true;
            op.value = e.n;
            op.innerText = e.n;
            this.presetSelElm.appendChild(op)
        });

        this.presetSelElm.addEventListener('change', this.#preSetOnchage.bind(this))

        //Power button toggle detection.
        this.powerElm.onchange = () => this.toggle();

        //Detect every time the audio starts
        this.audioElm.addEventListener('play', () => {
            if (this.ctx.state === "suspended") this.ctx.resume();
            this.toggle();
        });
        this.#preSetOnchage();
    }

    /**
     * toggle Enable amd Disable.
     */
    toggle() {
        this.audioSrc.disconnect();
        if (this.isEnable) {
            // Connect Reverb
            this.connect(this.audioSrc).connect(this.ctx.destination);
        } else {
            this.disconnect(this.audioSrc)
            this.audioSrc.connect(this.ctx.destination);
        }
    }
}