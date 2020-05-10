const AST = require('../ast');

let exp = AST.compile("(abc+bcd)");
console.log(exp);
