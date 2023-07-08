
/**
 * @class songSearch
 * @typedef {SongSearch}
 */
export class SongSearch {
    /**
     * @constructor
     * @param {HTMLDivElement} container
     * @param {Array<string>} songList
     * @param {boolean?} dbug enable debugmode?
     * @param {HTMLInputElement?} searchInput
     * @param {CallableFunction?} onselect
     * @example
     * const container = document.getElementById('container'); // Replace 'container' with the actual container ID
     * const songList = ['Song 1', 'Song 2', 'Song 3']; // Replace with your actual song list
     * const dbug = document.getElementById('dbug'); // Replace 'dbug' with the actual debug element ID
     * const searchInput = document.getElementById('searchInput'); // Replace 'searchInput' with the actual search input element ID
     * const readingChecker = new ReadingChecker(container, songList, dbug, searchInput);
     */
    constructor(container, songList, dbug, searchInput, onselect) {
        //console.log(...arguments)
        this.container = container;
        this.dbug = dbug;
        this.searchInput = searchInput;
        this.itemHeight = 0;
        this.origElm = document.createElement('ul');
        this.onselect = onselect;
        this.#songList = songList;
    }
    #ImageRootUrl = `https://raw.githack.com/jomin398/mySongDB/master/images/`;
    #songList = null;
    async init() {
        if (!this.#songList || !this.#checkData(this.#songList)) throw new ReferenceError('songList is not object array.');
        console.log(this.#songList)
        this.#songList.forEach((data) => {
            const li = document.createElement('li');
            const iurl = data?.iurl ? data.iurl.length != 0 ? data.iurl : null : null;
            const tags = data?.tags ? ((tgs) => {
                //console.log(tgs)
                const elCon = document.createElement('div');
                elCon.className = 'tags hide';
                elCon.append(...
                    tgs.map(e => {
                        let el = document.createElement('span')
                        el.innerText = e;
                        return el;
                    }))
                return elCon.outerHTML;
            }

            )(data.tags) : null;


            // console.log(iurl)
            li.innerHTML = `
            <img ${iurl ? `src="${this.#ImageRootUrl}${iurl[0]}"` : ""}>
            <span>${data.f ?? data.n}</span>
            ${tags ? tags : ''}
            `;
            if (this.onselect) {
                li.onclick = () => {
                    this.selectItem(li);
                };
            }
            this.origElm.append(li);
        });
        if (this.dbug) {
            this.dbug = document.createElement('span');
            Object.assign(this.dbug.style, {
                position: 'fixed',
                border: '1px solid white',
                top: 0,
                right: '1em',
                zIndex: 10,
                padding: '5px',
                width: '6em'
            })
            this.container.append(this.dbug);
        };
        this.origElm.onscroll = this.checkReading.bind(this);
        this.checkReading();
        this.container.append(this.origElm);
        this.itemHeight = this.origElm.firstChild.getBoundingClientRect().height;
        this.gotoTop();
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
    }
    #checkData(arr) {
        return arr.every(function (item) {
            return typeof item === 'object';
        });
    }
    gotoTop() {
        this.origElm.scrollTop = this.itemHeight;
    }
    checkReading() {
        const top = Math.round(this.origElm.scrollTop) + this.origElm.clientHeight;
        const gotoBottom = () => this.origElm.scrollTo(0, this.origElm.scrollHeight - this.origElm.clientHeight * 1.25);

        if (this.dbug) this.dbug.innerText = `scrPos: ${top}`;
        this.checkReading.read = false;
        this.checkReading.read = this.origElm.scrollHeight === top;

        if (this.origElm.scrollTop === 0) {
            gotoBottom();
            return;
        }
        if (this.origElm.scrollHeight === 0) {
            this.checkReading.read = false;
        }
        if (this.checkReading.read) {
            this.gotoTop();
        }

    }

    handleSearch() {
        const searchTerm = this.searchInput.value.trim().toLowerCase();
        const listItems = this.origElm.getElementsByTagName('li');
        //console.log(listItems)
        Array.from(listItems).forEach((li) => {
            const text = li.innerText.toLowerCase();
            let tags = li.querySelector('.tags');
            if (tags) tags = [...tags.children].map(e => e.innerText);
            // console.log(tags)
            const match = text.includes(searchTerm) || tags && tags.includes(text);
            if (text && match) {
                li.classList.add('searchHighlight', 'match');
                li.classList.remove('mismatch');
            } else if (text && !match) {
                li.classList.add('searchHighlight', 'mismatch');
                li.classList.remove('match');
            }
        });
    }

    selectItem(li) {
        if (this.selectedLi) {
            this.selectedLi.classList.remove('select');
        }

        this.selectedLi = li;
        this.selectedLi.classList.add('select');//.style.border = '1px solid red';

        if (this.onselect) {
            this.onselect(this.selectedLi.innerText);
        }
    }
}