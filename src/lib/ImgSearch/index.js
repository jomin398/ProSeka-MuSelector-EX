export class ImgSearch {
    /**
     * @param {Array<string>} targetData 
     */
    constructor(targetData) {
        this.data = targetData;
    }
    /**
     * @param {Array<string>} searchQueries 
     */
    retrySearch(searchQueries) {
        const result = searchQueries.map(q => this.search(q)) ?? null;
        return result;
    }
    /**
     * @param {String} query 
     */
    search(query) {
        if(!query) return;
        let exactMatch = null;
        let partialMatch = null;
        for (let i = 0; i < this.data.length; i++) {
            let data = this.data[i].toLowerCase().replace(/\.\w{3}$/gm,'');
            query = query.toLowerCase();
            if (data == query) {
                
                exactMatch = this.data[i];
                break;
            }
        }
        if (exactMatch !== null)  return exactMatch;
        for (let i = 0; i < this.data.length; i++) {
            let data = this.data[i].toLowerCase().replace(/\.\w{3}$/gm,'');
            query = query?.toLowerCase();

            if (data.includes(query)) {
                partialMatch = this.data[i];
                break;
            }
        }
        return partialMatch;
    }
};