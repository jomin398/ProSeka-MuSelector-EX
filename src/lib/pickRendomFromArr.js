/**
 * pick Rendom FromArr
 * @param {Array} array a path list of songs
 * @returns {*} pocked path
 */
export default function pickRendomFromArr(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}