const A = require('./a');
const index = require('./index');

class B extends A {
	get a() { }

	doA() {
		console.log(this.a);
	}
}

module.exports = B;