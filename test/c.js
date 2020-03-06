const A = require('./a');
const index = require('./test');

class C extends A {
	get a() { }

	doC() {
		console.log('do C');
	}

	doSuper() {
		console.log('do Super');
	}
}
class D extends C {

    get a() { }

    doD() {
        console.log('do D');
    }

    doSuper() {
    	super.doSuper();
        console.log('do Sub');
	}
	notDo() {
    	console.log('not do');
	}
}

module.exports = { C, D };