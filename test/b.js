const A = require('./a');
//测试重复引用
const test = require('./test');

class B extends A {
	get a() {
		console.log('属性不能切面');
		return 0;
	}

	doA() {
		console.log(this.a);
	}
}

module.exports = B;