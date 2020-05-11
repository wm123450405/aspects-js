const { AST } = require('../ast');
const assert = require('assert');

class Test {
    abc() { }
    bce() { }
    args(a, c, d) { }
}
class SubTest extends Test { }
let test = new Test();
let supTest = new SubTest();

class Arg { }
class SubArg extends Arg { }
let arg = new Arg();
let subArg = new SubArg();
let strArg = '';
let numberArg = 1;
let boolArg = true;
let objArg = { };
let arrayArg = [];
let funArg = () => { };

//function name
assert.strictEqual(true, AST.compile('abc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('abc').execute({
    type: Test,
    fun: test.bce,
    args: []
}));
//function name with ?
assert.strictEqual(true, AST.compile('a?c').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('?bc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('?abc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('ab?c').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
//function name with *
assert.strictEqual(true, AST.compile('a*c').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('*bc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('*abc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('ab*c').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('a*').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('*c').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('*abc').execute({
    type: Test,
    fun: test.bce,
    args: []
}));
assert.strictEqual(false, AST.compile('ab*c').execute({
    type: Test,
    fun: test.bce,
    args: []
}));
//function name with +
assert.strictEqual(true, AST.compile('ab?+bce').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('abc+bc?').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('bcd+bce').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
//function name with ()
assert.strictEqual(true, AST.compile('abc()').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('abc(..)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('abc(..,..)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('?abc()').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
//function name with args
assert.strictEqual(true, AST.compile('abc(..)').execute({
    type: Test,
    fun: test.abc,
    args: [arg, subArg, strArg, numberArg, boolArg, objArg, arrayArg, funArg]
}));
assert.strictEqual(true, AST.compile('abc(Arg,..)').execute({
    type: Test,
    fun: test.abc,
    args: [arg, subArg, strArg, numberArg, boolArg, objArg, arrayArg, funArg]
}));
assert.strictEqual(true, AST.compile('abc(*,SubArg,..)').execute({
    type: Test,
    fun: test.abc,
    args: [arg, subArg, strArg, numberArg, boolArg, objArg, arrayArg, funArg]
}));
assert.strictEqual(true, AST.compile('abc(*,Arg,..)').execute({
    type: Test,
    fun: test.abc,
    args: [arg, subArg, strArg, numberArg, boolArg, objArg, arrayArg, funArg]
}));

//type name
assert.strictEqual(true, AST.compile('Test.*').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('Tes.*').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('Test2.*').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('within(Test)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('within(Tes)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('within(Test2)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));

//type name and function name
assert.strictEqual(true, AST.compile('Test.abc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
//type name and function name with +
assert.strictEqual(true, AST.compile('Test.abc+bcd').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('Test+Test2.abc+bcd').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(true, AST.compile('Test+Test2.abc').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('Test.bce+bcd').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('Test+Test2.bcd').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('Test1+Test2.abc+bcd').execute({
    type: Test,
    fun: test.abc,
    args: []
}));

//execution
assert.strictEqual(false, AST.compile('execution(Test+Test2.bcd)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
assert.strictEqual(false, AST.compile('execution(Test1+Test2.abc+bcd)').execute({
    type: Test,
    fun: test.abc,
    args: []
}));
