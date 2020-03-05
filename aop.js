const isClass = type => typeof type === 'function' && type.toString().startsWith('class');
const isExtends = type => true;

const registedAspects = [];

class Pointcut {
	constructor(className, functionName, parameters) {
		this.className = className;
		this.functionName = functionName;
		this.parameters = parameters;
	}
	match(type, fun) {
		return false;
	}
}

class Aspect {
	get pointcut() { return "*" }
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

class ProceedingJoinPoint {
	constructor(type, fun, thisArg, target, args, next) {
		this.type = type;
		this.fun = fun;
		this.thisArg = thisArg;
		this.target = target;
		this.args = args;
		this.next = next;
	}
	proceed(args) {
		args = args || this.args;
		this.next(args);
	}
}

const findAspects(type, fun) {
	return registedAspects.filter(aspect => aspect.match(type, fun));
}

const executeChain = (type, fun, proxy, thisArg, args, aspects, index) {
	if (index === aspects.length) {
		fun.apply(thisArg, args);
	} else {
		let aspect = aspects[index];
		let joinPoint = new ProceedingJoinPoint(type, fun, thisArg, proxy, args, args => executeChain(type, fun, proxy, thisArg, args, aspects, index++));
		let error, result;
		try {
			aspect.before(joinPoint);
			result = aspect.around(joinPoint);
			let resultTemp = aspect.afterReturn(joinPoint, result);
			result = typeof resultTemp === 'undefined' ? result : resultTemp;
			return result;
		} catch(e) {
			error = e;
			try {
				aspect.afterThrow(joinPoint, e);
			} catch(ie) {
				error = ie;
				throw ie;
			}
		} finally {
			aspect.after(joinPoint, result, error);
		}
	}
}

const initClass = (type) {
	return new Proxy(type, {
		construct(type, args) {
			let proxy = new Proxy(new type(...args), {
				apply(fun, thisArg, arguments) {
					let aspects = findAspects(type, fun);
					if (aspects.length) {
						return executeChain(type, fun, proxy, thisArg, arguments, aspects, 0);
					} else {
						return Reflect.apply(fun, thisArg, arguments);
					}
				}
			});
			return proxy;
		}
	})
}

const initRequire = (moduleParent) => {
	console.log(moduleParent);
	let requireTemp = moduleParent.require;
	moduleParent.require = (moduleName) => {
		let module = requireTemp.call(moduleParent, moduleName);
		if (isClass(module)) {
			// applicationContext.addBeanFactory(module.name, new TypeBeanFactory(module));
			if (isExtends(Aspect)) {
				registedAspects.push(module);
			} else {
				module = initClass(module);
			}
		}
		return module;
	}
	if (!moduleParent.children) moduleParent.children = [];
	let childrenPush = moduleParent.children.push;
	moduleParent.children.push = (...children) => {
		children.forEach(child => initRequire(child));
		childrenPush.apply(moduleParent.children, [...children]);
	}
}
initRequire(process.mainModule);

module.exports = { Aspect, JoinPoint }