//import KnobInput from './KnobInput.js';
//import getTransformProperty from './getTransformProperty.js';
import KnobElementInitlizer from './knobElementInitlizer.js';
export default class FLStudioKnob {
    /**
     * @constructor
     * @param {Array<{v:Number,type:String,n:String}>} array
     */
    constructor(array) {
        if (!array) throw new ReferenceError('\"array\" is cannot be null');
        if (!array.every(e => typeof e === 'object')) throw new ReferenceError('\"array\" is not list of Object.');
        console.log(array)
        return array.map(e => new KnobElementInitlizer(e));
    }
}