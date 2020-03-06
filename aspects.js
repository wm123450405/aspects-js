const isClass = type => typeof type === 'function' && type.toString().startsWith('class');

const registeredAspects = [];

const normalReg = /^(?<typeNames>([_\w\*][_\w\d\*]*)(?:\+[_\w\*][_\w\d\*]*)*)(?:\.(?<funNames>([_\w\*][_\w\d\*]*)(?:\+[_\w\*][_\w\d\*]*)*)(?:\(\))?)?$/ig;
const executionReg = /^execution\((?<typeNames>([_\w\*][_\w\d\*]*)(?:\+[_\w\*][_\w\d\*]*)*)(?:\.(?<funNames>([_\w\*][_\w\d\*]*)(?:\+[_\w\*][_\w\d\*]*)*)(?:\(\))?)?\)$/ig;
const withinReg = /^within\((?<typeNames>([_\w\*][_\w\d\*]*)(?:\+[_\w\*][_\w\d\*]*)*)\)$/ig;

const originType = Symbol.for('originType');

class Matcher {
    constructor(name) {
        this.name = new RegExp('^' + name.replace(/\*/ig, '[_\\w\\d]+').replace(/\?/ig, '[_\\w\\d]') + '$', 'ig');
    }

    matches(value) {
        this.name.lastIndex = 0;
        return this.name.test(typeof value === 'function' ? value.name : value);
    }
}

class Pointcut {
    constructor(pointcut) {
        normalReg.lastIndex = 0;
        let match = normalReg.exec(pointcut);
        if (match) {
            this.typeMatchers = (match.groups.typeNames || '*').split(/\+/ig).map(typeName => new Matcher(typeName));
            this.funMatchers = (match.groups.funNames || '*').split(/\+/ig).map(funName => new Matcher(funName));
        } else {
            executionReg.lastIndex = 0;
            match = executionReg.exec(pointcut);
            if (match) {
                this.typeMatchers = (match.groups.typeNames || '*').split(/\+/ig).map(typeName => new Matcher(typeName));
                this.funMatchers = (match.groups.funNames || '*').split(/\+/ig).map(funName => new Matcher(funName));
            } else {
                withinReg.lastIndex = 0;
                match = withinReg.exec(pointcut);
                if (match) {
                    this.typeMatchers = (match.groups.typeNames || '*').split(/\+/ig).map(typeName => new Matcher(typeName));
                    this.funMatchers = [new Matcher('*')];
                } else {
                    throw new TypeError('Not a valid pointcut:' + pointcut);
                }
            }
        }
    }

    matches(type, fun) {
        return this.typeMatchers.some(typeMatcher => typeMatcher.matches(type)) && this.funMatchers.some(funMatcher => funMatcher.matches(fun));
    }
}

class Aspects {
    get pointcut() {
        return "*.*"
    }

    after(joinPoint, result, error) {

    }

    afterReturn(joinPoint, result) {
        return result;
    }

    afterThrow(joinPoint, error) {

    }

    before(joinPoint) {

    }

    around(joinPoint) {
        return joinPoint.proceed();
    }
}

class AspectDelegate {
    constructor(aspect) {
        this.delegate = aspect;
        this.pointcut = aspect.pointcut instanceof Pointcut ? aspect.pointcut : new Pointcut(aspect.pointcut);
    }

    after(joinPoint, result, error) {
        this.delegate.after(joinPoint, result, error);
    }

    afterReturn(joinPoint, result) {
        this.delegate.afterReturn(joinPoint, result);
    }

    afterThrow(joinPoint, error) {
        this.delegate.afterThrow(joinPoint, error);
    }

    before(joinPoint) {
        this.delegate.before(joinPoint);
    }

    around(joinPoint) {
        return this.delegate.around(joinPoint);
    }
}

class JoinPoint {
    constructor(type, fun, thisArg, target, args, next) {
        Object.defineProperties(this, {
            type: {
                configurable: true, enumerable: true, get() {
                    return type
                }
            },
            fun: {
                configurable: true, enumerable: true, get() {
                    return fun
                }
            },
            thisArg: {
                configurable: true, enumerable: true, get() {
                    return thisArg
                }
            },
            target: {
                configurable: true, enumerable: true, get() {
                    return target
                }
            },
            args: {
                configurable: true, enumerable: true, get() {
                    return args
                }
            },
            proceed: {
                configurable: true,
                enumerable: true,
                value: function (args) {
                    args = args || this.args;
                    return next(args);
                }
            },
        })
    }
}

const findAspects = (type, fun) => {
    return registeredAspects.filter(aspect => aspect.pointcut.matches(type, fun));
};

const executeChain = (type, fun, proxy, thisArg, args, aspects, index) => {
    if (index === aspects.length) {
        // fun.apply(thisArg, args);
        Reflect.apply(fun, thisArg, args);
    } else {
        let aspect = aspects[index];
        let joinPoint = new JoinPoint(type, fun, thisArg, proxy, args, args => executeChain(type, fun, proxy, thisArg, args, aspects, ++index));
        let error, result;
        try {
            aspect.before(joinPoint);
            result = aspect.around(joinPoint);
            let resultTemp = aspect.afterReturn(joinPoint, result);
            result = typeof resultTemp === 'undefined' ? result : resultTemp;
            return result;
        } catch (e) {
            error = e;
            try {
                aspect.afterThrow(joinPoint, e);
            } catch (ie) {
                error = ie;
                throw ie;
            }
        } finally {
            aspect.after(joinPoint, result, error);
        }
    }
};

const initClass = type => {
    if (type[originType] === type) {
        return type;
    } else if ([Aspects, JoinPoint, Pointcut].includes(type)) {
        return type;
    } else {
        let proxyType = new Proxy(type, {
            construct(target, args, newTarget) {
                if (target.name === newTarget.name) {
                    let proxy = new Proxy(Reflect.construct(target, args, newTarget), {
                        get(target, prop) {
                            let value = target[prop];
                            if (typeof value === 'function') {
                                let aspects = findAspects(type, value);
                                return (...args) => {
                                    if (aspects.length) {
                                        return executeChain(type, value, proxy, target, args, aspects, 0);
                                    } else {
                                        return Reflect.apply(value, target, args);
                                    }
                                }
                            } else {
                                return value;
                            }
                        }
                    });
                    return proxy;
                } else {
                    return Reflect.construct(target, args, newTarget);
                }
            }
        });
        proxyType[originType] = type;
        return proxyType;
    }
};

const initValue = value => {
    if (isClass(value)) {
        value = initClass(value);
    } else {
        if (value instanceof Aspects) {
            registeredAspects.push(new AspectDelegate(value));
        } else if (typeof value === 'object') {
            for (let [prop, sub] of Object.entries(value)) {
                value[prop] = initValue(sub);
            }
        }
    }
    return value;
};

const initRequire = moduleParent => {
    let requireTemp = moduleParent.require;
    moduleParent.require = moduleName => initValue(requireTemp.call(moduleParent, moduleName));
    if (!moduleParent.children) moduleParent.children = [];
    let childrenPush = moduleParent.children.push;
    moduleParent.children.push = (...children) => {
        children.forEach(child => initRequire(child));
        childrenPush.apply(moduleParent.children, [...children]);
    }
};
initRequire(process.mainModule);

module.exports = {Aspect: Aspects, JoinPoint, Pointcut};