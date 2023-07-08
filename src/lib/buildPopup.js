export default class buildPopup {
  /**
   * @param {String} str htmlString
   * @param {Number} typeno build type number.
   * @param {Boolean=} afterParse parse element after submit.
   * @param {Boolean=} isDND is drag Drop.
   * @param {CallableFunction=} onbuild fires form element on append.
   * @returns {Promise<HTMLFormElement|Object>}
   */
  constructor(str, typeno, afterParse, isDND, onbuild) {
    this.afterParse = afterParse;
    this.#htmlStr = str;
    this.#typeno = typeno && !isNaN(typeno) ? typeno : this.#types.Form;
    this.isDND = isDND;
    this.#build();
    if (onbuild) onbuild(this.#elm);
    return this.#regGlobalFn();
  }
  #types = {
    Form: 0,
    Prompt: 1,
  };
  #typeno = 0;
  #htmlStr = null;
  /** @type {HTMLElement?} */
  #elm = null;
  overlaySty = `
    position:absolute;
    top:0;
    bottom:0;
    left:0;
    right:0;
    z-index:10;
  `;
  #addDND() {
    const fileInput = document.querySelector('.fdrop_zone input#file')

    function dropHandler(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      //console.log("File(s) dropped");
      // Prevent default behavior (Prevent file from being opened)
      if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...ev.dataTransfer.items].forEach((item, i) => {
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            console.log(`file[${i}].name = ${file.name}`);
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        [...ev.dataTransfer.files].forEach((file, i) => {
          console.log(`file[${i}].name = ${file.name}`);
        });
      }
      fileInput.files = ev.dataTransfer.files;
    }
    function dragOverHandler(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      this.style.backgroundColor = '#b8ffb8';
    }
    document.querySelector('.fdrop_zone').addEventListener('drop', dropHandler, false);
    document.querySelector('.fdrop_zone').addEventListener('dragover', dragOverHandler)
  }
  #build() {
    const ov = document.createElement('div');
    ov.classList.add("overlay");
    ov.style = this.overlaySty;
    const f = document.createElement("form");

    const isTypeOfForm = this.#typeno == this.#types.Form;
    console.log(isTypeOfForm)
    let content = this.#htmlStr;

    const lastBtn = ((b) => {
      const r = document.createElement('input');
      r.type = 'submit';
      r.innerText = 'submit';
      if (!b) r.style.display = "none";
      return r.outerHTML;
    })(isTypeOfForm)
    f.innerHTML = `
      ${content}
      ${lastBtn}
    `;
    ov.appendChild(f);
    this.#elm = ov;
    document.body.appendChild(ov);
    if (this.isDND) this.#addDND();
  }
  #parse() {
    const opt = {};
    for (const [index, elm] of this.#elm.querySelectorAll('input,input[type=file],select').entries()) {

      switch (elm.type) {
        case 'file':
          // let checkNotZeros = Array.from(elm.files).every(e => e.size > 0);
          // if (!checkNotZeros) throw new ReferenceError('Cannot uploaded Folder.')
          opt.data = elm.files;
          break;
        case 'checkbox':
          opt[elm.name] = elm.checked;
          break;
        case 'select-one':
          opt[elm.name] = [
            elm.options[elm.selectedIndex].value,
            elm.options[elm.selectedIndex].text
          ];
          break;
        case 'number':
        case 'password':
        case 'color':
        case 'text':
          opt[elm.name] = elm.value ?? elm.placeholder ?? null;
          break;
        case 'radio':
          if (elm.checked) opt[elm.name] = elm.id;
          break;
        default:
          //console.log(elm.type)
          break;
      }
    }
    return opt;
  }
  /** 
   * regist form action callback to global.
   * @returns {Promise<HTMLFORMElement|Object>}
   */
  #regGlobalFn() {
    const p = new Promise((resolve, reject) => {
      const f = this.#elm.querySelector('form');
      window._FormAct = () => {
        f.removeAttribute('action');
        delete window._FormAct;
        this.#elm.remove();
        resolve(f);
      };
      //f.action = './oru.html';
      f.action = 'javascript:_FormAct()';
    });
    if (this.afterParse) return p.then(this.#parse.bind(this));
    return p;
  }
}