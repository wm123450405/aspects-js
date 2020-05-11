module.exports = {
    isClass(type) { return typeof type === 'function' && type.toString().startsWith('class'); }
}
