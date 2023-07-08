/**
 * @class songSearch
 * @typedef {SongSearch}
 */
export class SongSearch {
    /**
     * @constructor
     * @param {HTMLDivElement} container
     * @param {HTMLInputElement?} searchInput
     * @param {function} scrollResetter
     */
    constructor(container, searchInput, scrollResetter) {
        if (!container || !searchInput) throw new ReferenceError('parem is cannot be null.');
        //console.log(...arguments)
        this.container = container;
        this.searchInput = searchInput;
        this.scrollResetter = scrollResetter;
        if (this.searchInput) this.searchInput.addEventListener('input', this.handleSearch.bind(this));
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        const listItems = this.container.getElementsByTagName('li');
        //console.log(listItems)
        //console.log(listItems)
        Array.from(listItems).forEach((li) => {
            if (li.innerHTML != '') {
                const text = li.querySelector('.title span').innerText.toLocaleLowerCase();
                let tags = li.querySelector('.tags');
                let tagMatch = false;
                if (tags) {
                    tags = [...tags.children].map(e => e.innerText);
                    tagMatch = tags.some(e => e.includes(searchTerm));
                }
                const match = text.includes(searchTerm);
                if (text && (match || tagMatch)) {
                    li.classList.add('searchHighlight', 'match');
                    li.classList.remove('mismatch');
                } else if (text && !match) {
                    li.classList.add('searchHighlight', 'mismatch');
                    li.classList.remove('match');
                }
            }
        });
        this.scrollResetter(true);
    }
}