require('../aspects.js');

require('./testAspect.js');

const B = require('./b');
const { C, D } = require('./c');

let b = new B();
let c = new C();
let d = new D();

b.doA();
c.doC();
d.doD();
d.doSuper();
d.notDo();