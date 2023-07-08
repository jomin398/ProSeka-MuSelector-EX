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
        // Perform your search logic here
        // This could involve searching through the data array
        // and returning the desired result if found, otherwise returning null
        for (let i = 0; i < this.data.length; i++) {
            let data = this.data[i];
            try {
                data = data.toLowerCase()
            } catch (error) { };
            try {
                query = query.toLowerCase()
            } catch (error) { };
            if (data == query || data.includes(query)) {
                return this.data[i];
            }
        }
        return null;
    }
};