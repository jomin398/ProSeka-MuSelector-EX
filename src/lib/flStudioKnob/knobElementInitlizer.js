import KnobInput from "./KnobInput.js";
import getTransformProperty from "./getTransformProperty.js";

export default class KnobElementInitlizer {
  constructor(obj) {
    const initvalue = obj?.v ?? 0;
    const type = obj?.type;
    const label = obj?.n;
    const step = obj?.step ?? 1;
    const max = obj?.max ?? 100;
    const min = obj?.min ?? 0;

    const element = new DOMParser().parseFromString(this.#genKnobHtmlStr(type, label), 'text/html').body.firstChild;
    // this.knob = element;
    const transformProp = getTransformProperty();
    //const transformProp = getTransformProperty();
    let envelopeKnobs = (() => {
      return new KnobInput(element, {
        visualContext: function () {
          this.indicatorRing = this.element.querySelector('.indicator-ring');

          //let {r,strokeWidth} = getComputedStyle(this.element.querySelector('.indicator-ring-bg'));
          let r = this.element.querySelector('.indicator-ring-bg').getAttribute('r');
          let strokeWidth = this.element.querySelector('.indicator-ring-bg').getAttribute('stroke-width') ?? '1';
          this.r = parseFloat(r) - (parseFloat(strokeWidth) / 2);
          this.indicatorDot = this.element.querySelector('.indicator-dot');
          this.indicatorDot.style[`${transformProp}Origin`] = '20px 20px';
        },
        updateVisuals: function (norm) {
          let theta = Math.PI * 2 * norm + 0.5 * Math.PI;
          let endX = this.r * Math.cos(theta) + 20;
          let endY = this.r * Math.sin(theta) + 20;
          // using 2 arcs rather than flags since one arc collapses if it gets near 360deg
          this.indicatorRing.setAttribute('d', `M20,20l0,${this.r}${norm > 0.5 ? `A${this.r},${this.r},0,0,1,20,${20 - this.r}` : ''}A-${this.r},${this.r},0,0,1,${endX},${endY}Z`);
          this.indicatorDot.style[transformProp] = `rotate(${360 * norm}deg)`;
        },
        min,
        max,
        step,
        initial: initvalue,
      });
    })();
    return envelopeKnobs;
  }

  /**
   * @param {String?} type
   * @param {String?} label
   * @returns {string}
   */
  #genKnobHtmlStr(type, label) {
    return `<div class="knob-input fl-studio-knob ${type ?? 'envelope'}-knob">
    <svg class="knob-input__visual" viewBox="0 0 40 40">
      <defs>
        <radialGradient id="grad-dial-soft-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="85%" stop-color="#242a2e" stop-opacity="0.4"></stop>
          <stop offset="100%" stop-color="#242a2e" stop-opacity="0"></stop>
        </radialGradient>
        <linearGradient id="grad-dial-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#52595f"></stop>
          <stop offset="100%" stop-color="#2b3238"></stop>
        </linearGradient>
        <linearGradient id="grad-dial-highlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#70777d" stop-opacity="1"></stop>
          <stop offset="40%" stop-color="#70777d" stop-opacity="0"></stop>
          <stop offset="55%" stop-color="#70777d" stop-opacity="0"></stop>
          <stop offset="100%" stop-color="#70777d" stop-opacity="0.3"></stop>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="2"></feGaussianBlur>
          <feComposite in="blur" in2="SourceGraphic" operator="over"></feComposite>
        </filter>

      </defs>
      <circle class="focus-indicator" cx="20" cy="20" r="18" fill="#4eccff" filter="url(#glow)"></circle>
      <circle class="indicator-ring-bg" cx="20" cy="20" r="18" fill="#353b3f" stroke="#23292d"></circle>
      <path class="indicator-ring" d="M20,20Z" fill="#4eccff"></path>
      <g class="dial">
        <circle cx="20" cy="20" r="16" fill="url(#grad-dial-soft-shadow)"></circle>
        <ellipse cx="20" cy="22" rx="14" ry="14.5" fill="#242a2e" opacity="0.15"></ellipse>
        <circle cx="20" cy="20" r="14" fill="url(#grad-dial-base)" stroke="#242a2e" stroke-width="1.5"></circle>
        <circle cx="20" cy="20" r="13" fill="transparent" stroke="url(#grad-dial-highlight)" stroke-width="1.5">
        </circle>
        <circle class="dial-highlight" cx="20" cy="20" r="14" fill="#ffffff"></circle>
        <circle class="indicator-dot" cx="20" cy="30" r="1.5" fill="#4eccff"></circle>
      </g>
    </svg>
    ${label ? `<div class="fl-studio-envelope__label">${label}</div>` : ''}
  </div>`;
  }
}