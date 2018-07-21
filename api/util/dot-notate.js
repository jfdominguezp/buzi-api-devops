function dotNotate(obj, target = { }, prefix = '') {
    Object.keys(obj).forEach(key => {
        if ( typeof(obj[key]) === "object" ) {
            dotNotate(obj[key], target, `${prefix}${key}.`);
        } else {
            return target[prefix + key] = obj[key];
        }
    });

    return target;
}

module.exports = dotNotate;