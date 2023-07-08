import getSupportedPropertyName from "./getSupportedPropertyName.js";
export default function getTransformProperty() {
    return getSupportedPropertyName([
        'transform', 'msTransform', 'webkitTransform', 'mozTransform', 'oTransform'
    ]);
}

