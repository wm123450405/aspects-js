const { applicationContext } = require('./aop.js');

const B = require('./b');

let b = applicationContext.getBeanByType(B);
b.doA();