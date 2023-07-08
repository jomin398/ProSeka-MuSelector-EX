/** 
 * @typedef {Object} EQPreset
 * @property {String} n preset Name
 * @property {String} noise  IR (Inpulse Response) colord noise algorithm (BLUE, GREEN, PINK, RED, VIOLET, WHITE)
 * @property {Number} decay IR delay. 0~50 [sec]
 * @property {Number} delay Delay time (pre-delay) 0~100 [sec]
 * @property {Number} time length of IR. 0~25 [sec] 
 * @property {Number} mix Dry (Original Sound) and Wet (Effected sound) raito. 0~1
 * @property {String} filterType Filter type. 'allpass' etc.
 * @property {Number} filterFreq Filter frequency. 20~5000 [Hz]
 * @property {Number} filterQ Filter Q factor. 0~10
 */

/**
 * @type {Array.<EQPreset>}
 */
export const EQPresets = [
    {
        n: "default",
        noise: 'pink',
        time: 1.2,
        decay: 2,
        delay: 0,
        filterType: 'allpass',
    },
    {
        n: "default Hall",
        noise: 'pink',
        time: 20,
        decay: 24,
        delay: 0.6,
        filterQ: 1,
        mix: 0.182
    },
    {
        n: "Large Hall (LP@4k)",
        noise: 'pink',
        time: 5,
        decay: 18,
        delay: 2,
        filterType: 'lowpass',
        filterFreq: 4000,
        filterQ: 1,
        // mix: 0.182
        mix: 0.65
    },
    {
        n: "Live Hall",
        noise: 'pink',
        time: 5,
        decay: 19,
        delay: 0.42,
        mix: 0.2
    }]