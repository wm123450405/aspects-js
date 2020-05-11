const { isClass } = require('./utils');

const SPLITS = {
    '(': '',
    ')': '',
    '+': '',
    '.': '.',
    '?': ''
}
const SPECIAL_TYPE = {
    'string': 'String',
    'String': 'String',
    'number': 'Number',
    'Number': 'Number',
    'function': 'Function',
    'Function': 'Function',
    'class': 'Class',
    'Class': 'Class',
    'RegExp': 'RegExp',
    'boolean': 'Boolean',
    'Boolean': 'Boolean',
    'array': 'Array',
    'Array': 'Array',
    'object': 'Object',
    'Object': 'Object',
    'undefined': 'Undefined',
    'Undefined': 'Undefined',
    'NaN': 'NaN'
}

class ASTError extends Error {
    constructor(message) {
        super(message);
    }
}

const namesByType = type => {
    let names = [];
    do {
        names.push(type.name);
        type = type['__proto__'];
    } while (type.name);
    return names;
}
const namesByObject = object => {
    if (typeof object === 'string') return ['String'];
    if (typeof object === 'number') {
        if (isNaN(object)) return ['NaN', 'Number'];
        else return ['Number'];
    }
    if (typeof object === 'boolean') return ['Boolean'];
    if (typeof object === 'undefined') return ['Undefined'];
    if (typeof object === 'function') {
        if (isClass(object)) return ['Class'];
        else return ['Function'];
    }
    return namesByType(object.constructor);
}

class ASTCompiler {
    constructor(exp) {
        this.exp = exp;
        this.position = 0;
    }
    nextToken() {
        let value = '', position = this.position;
        if (this.position < this.exp.length) {
            value += this.exp.charAt(this.position);
            this.position++;
        }
        while (this.position < this.exp.length) {
            let letter = this.exp.charAt(this.position);
            switch (value) {
                case '(':
                case ')':
                case '+':
                case ',':
                case '..':
                case '!':
                case '&&':
                case '||':
                    return { value, position };
                case '.':
                    switch (letter) {
                        case '.': break;
                        default: return { value, position };
                    }
                    break;
                case '|':
                    switch (letter) {
                        case '|': break;
                        default: return { value, position };
                    }
                    break;
                case '&':
                    switch (letter) {
                        case '&': break;
                        default: return { value, position };
                    }
                    break;
                default:
                    switch (letter) {
                        case '(':
                        case ')':
                        case '+':
                        case ',':
                        case '.':
                        case '&':
                        case '|':
                        case '!':
                            return { value, position };
                    }
            }
            value += letter;
            this.position++;
        }
        return { value, position };
    }
    compile() {
        let token;
        let stacks = [];
        let operatorStack = [];
        let valueStack = [];
        stacks.push(operatorStack);
        stacks.push(valueStack);
        let inCall = false, inProperty = false;
        const compute = () => {
            let operator = operatorStack.shift();
            if (valueStack.length) {
                operator.fill(valueStack.shift());
                if (operator.completed) {
                    valueStack.unshift(operator);
                } else {
                    operatorStack.unshift(operator);
                }
                if (valueStack[0] instanceof ASTCall) {
                    inCall = false;
                } else if (valueStack[0] instanceof ASTProperty) {
                    inProperty = false;
                }
            } else {
                showError(operator);
                throw new ASTError('invalid exp:' + this.exp);
            }
        }
        const unshift = operator => {
            //console.debug('unshift', operator.toString());
            if (operator.completed) {
                valueStack.unshift(operator);
            } else {
                while (operatorStack.length && operator.priority <= operatorStack[0].priority) {
                    compute();
                }
                if (valueStack.length) {
                    if (!operator.init(valueStack.shift())) {
                        showError(operator);
                        throw new ASTError('invalid exp:' + this.exp);
                    }
                }

                operatorStack.unshift(operator);
            }
        }
        const showError = (operator) => {
            console.error(this.exp);
            console.error(new Array(operator.token.position).fill(' ').join('') + '^');
        }
        while ((token = this.nextToken()).value) {
            //console.debug('token', token);
            switch (token.value) {
                case '+':
                    unshift(new ASTNameOr(token));
                    break;
                case '(':
                    if (valueStack.length && valueStack[0] instanceof ASTValue) {
                        unshift(new ASTCall(token));
                        inCall = true;
                    } else {
                        unshift(new ASTBracket(token));
                    }
                    operatorStack = valueStack;
                    valueStack = [];
                    stacks.push(valueStack);
                    break;
                case ')':
                    while (operatorStack.length && !(operatorStack[0] instanceof ASTBracket) && !(operatorStack[0] instanceof ASTCall)) {
                        compute();
                    }
                    //console.debug('stocks---')
                    //console.debug(stacks.map(stack => stack.join(' , ')).join('\r\n'))
                    //console.debug('---stocks')
                    while (operatorStack.length) {
                        compute();
                    }
                    //console.debug('stocks---')
                    //console.debug(stacks.map(stack => stack.join(' , ')).join('\r\n'))
                    //console.debug('---stocks')
                    if (valueStack.length > 1) {
                        if (valueStack.length) {
                            showError(valueStack[0]);
                            //console.debug('error valueStack', valueStack.join(' , '));
                        }
                        throw new ASTError('invalid exp:' + this.exp);
                    } else {
                        if (valueStack.length === 0 && inCall) {
                            unshift(new ASTDefaultEllipses(token));
                        }
                        operatorStack.unshift(valueStack.shift());
                        stacks.pop();
                        valueStack = operatorStack;
                        operatorStack = stacks[stacks.length - 2];
                    }
                    break;
                case '.':
                    unshift(new ASTProperty(token));
                    inProperty = true;
                    break;
                case ',':
                    unshift(new ASTComma(token));
                    break
                case '|':
                case '||':
                    unshift(new ASTOr(token));
                    break;
                case '&':
                case '&&':
                    unshift(new ASTAnd(token));
                    break;
                case '!':
                    unshift(new ASTNot(token));
                    break;
                case '..':
                    unshift(new ASTEllipses(token));
                    break;
                default:
                    if (inCall) {
                        if (SPECIAL_TYPE[token.value]) {
                            unshift(new ASTSpecialArgument(Object.assign(token, { value: SPECIAL_TYPE[token.value] })));
                        } else {
                            unshift(new ASTArgument(token));
                        }
                    } else if (inProperty) {
                        unshift(new ASTFunction(token));
                    } else {
                        unshift(new ASTValue(token));
                    }
            }
            //console.debug('stocks---')
            //console.debug(stacks.map(stack => stack.join(' , ')).join('\r\n'))
            //console.debug('---stocks')
        }
        while (operatorStack.length) {
            compute();
        }
        //console.debug('stocks---')
        //console.debug(stacks.map(stack => stack.join(' , ')).join('\r\n'))
        //console.debug('---stocks')
        if (valueStack.length !== 1) {
            if (valueStack.length) {
                showError(valueStack[0]);
                //console.debug('error valueStack', valueStack.join(' , '));
            }
            throw new ASTError('invalid exp:' + this.exp);
        } else {
            //console.debug(valueStack[0]);
            return valueStack[0];
        }
    }
}

const PRIORITIES = [',', '..', '|', '&', '!', '.', '+', '()'];


class ASTOperator {
    constructor(token) {
        this.token = token;
        this[PROPERTY_VARIABLES] = new Array(this.count).fill(false).map(_ => NONE_OPERATOR);
    }
    fill(operator) {
        for (let i = this.count - 1; i >= 0; i--) {
            if (this[PROPERTY_VARIABLES][i] === NONE_OPERATOR) {
                this[PROPERTY_VARIABLES][i] = operator;
                return true;
            }
        }
        return false;
    }
    init(operator) {
        if (this[PROPERTY_VARIABLES][0] === NONE_OPERATOR) {
            this[PROPERTY_VARIABLES][0] = operator;
            return true;
        } else {
            return false;
        }
    }
    get completed() {
        return this[PROPERTY_VARIABLES].every(v => v !== NONE_OPERATOR);
    }
    get variables() {
        return this[PROPERTY_VARIABLES];
    }
    get count() {
        return 1;
    }
    get priority() {
        return 0;
    }
    execute(context) {
        return false;
    }
}

class ASTNoneOperator extends ASTOperator {
    constructor(token) {
        super(token);
    }
    get count() {
        return 0;
    }
    toString() {
        return '#'
    }
    execute(context) {
        return false;
    }
}
class ASTEllipses extends ASTOperator {
    constructor(token) {
        super(token);
    }
    get completed() {
        return true;
    }
    get count() {
        return 0;
    }
    get priority() {
        return PRIORITIES.indexOf('..');
    }
    toString() {
        return `..`;
    }
    execute(context) {
        return true;
    }
}
class ASTDefaultEllipses extends ASTEllipses {
    toString() {
        return ``;
    }
}

class ASTUnaryOperator extends ASTOperator {
    constructor(token) {
        super(token);
    }
    get value() {
        return this.variables[0];
    }
    get count() {
        return 1;
    }
    execute(context) {
        return false;
    }
}

class ASTValue extends ASTUnaryOperator {
    constructor(token) {
        super(token);
        this.fill(token.value);
        if (token.value.startsWith('?')) {
            this.reg = new RegExp('^[_\\w]' + token.value.substring(1).replace(/\?/ig, '[_\\w\\d]').replace(/\*/ig, '[_\\w\\d]*') + '$', 'g');
        } else if (token.value.startsWith('*')) {
            this.reg = new RegExp('^([_\\w]?|[_\\w][_\\w\\d]*)' + token.value.substring(1).replace(/\?/ig, '[_\\w\\d]').replace(/\*/ig, '[_\\w\\d]*') + '$', 'g');
        } else {
            this.reg = new RegExp('^' + token.value.replace(/\?/ig, '[_\\w\\d]').replace(/\*/ig, '[_\\w\\d]*') + '$', 'g');
        }
    }
    get priority() {
        return PRIORITIES.indexOf('()');
    }
    toString() {
        return this.value;
    }
    inner(context) {
        if (context instanceof String || typeof context === 'string') {
            this.reg.lastIndex = 0;
            return this.reg.test(context);
        } else if (context instanceof Array) {
            return context.some(name => {
                this.reg.lastIndex = 0;
                return this.reg.test(name)
            });
        } else {
            this.reg.lastIndex = 0;
            return this.reg.test(context.fun.name);
        }
    }
    execute(context) {
        let result = this.inner(context);
        //console.debug('value check', this.reg, context, result);
        return result;
    }
}
class ASTFunction extends ASTValue {
    constructor(token) {
        super(token);
    }
    execute(context) {
        return super.execute(context.fun.name);
    }
}
class ASTArgument extends ASTValue {
    constructor(token) {
        super(token);
    }
    execute(context) {
        if (context.length !== 1) return false;
        let result = super.execute(namesByObject(context[0]));
        //console.debug('execute arg', this.reg, namesByObject(context[0]).join('|'), result);
        return result;
    }
}
class ASTSpecialArgument extends ASTValue {
    constructor(token) {
        super(token);
        this.special = token.value;
    }
    execute(context) {
        if (context.length !== 1) return false;
        let types = namesByObject(context[0]);
        let result = types.includes(this.special);
        //console.debug('execute special arg', this.special, namesByObject(context[0]).join('|'), result);
        return result;
    }
}
class ASTBracket extends ASTUnaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('()');
    }
    toString() {
        return `(${this.value})`;
    }
    execute(context) {
        return this.value.execute(context);
    }
}
class ASTNot extends ASTUnaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('!');
    }
    toString() {
        return `!${this.value}`;
    }
    execute(context) {
        return !this.value.execute(context);
    }
}

class ASTBinaryOperator extends ASTOperator {
    constructor(token) {
        super(token);
    }
    get left() {
        return this.variables[0];
    }
    get right() {
        return this.variables[1];
    }
    get count() {
        return 2;
    }
}

class ASTNameOr extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('+');
    }
    toString() {
        return `${this.left}+${this.right}`;
    }
    execute(context) {
        return this.left.execute(context) || this.right.execute(context);
    }
}
class ASTComma extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf(',');
    }
    toString() {
        return `${this.left},${this.right}`;
    }
    execute(context) {
        if (context instanceof Array) {
            for (let i = 0; i <= context.length; i++) {
                let leftResult = this.left.execute(context.slice(0, i));
                let rightResult = this.right.execute(context.slice(i));
                //console.debug(this.toString(), i, context.slice(0, i), context.slice(i), leftResult, rightResult);
                if (leftResult && rightResult) return true;
            }
            return false;
        } else {
            if (typeof context.args === 'undefined') {
                return true;
            } else {
                return this.execute(context.args);
            }
        }
    }
}
class ASTProperty extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('.');
    }
    toString() {
        return `${this.left}.${this.right}`;
    }
    execute(context) {
        return this.left.execute(namesByType(context.type)) && this.right.execute(context);
    }
}
class ASTCall extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('()');
    }
    toString() {
        return `${this.left}(${this.right})`;
    }
    execute(context) {
        return this.left.execute(context) && this.right.execute(context.args);
    }
}
class ASTOr extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('|');
    }
    toString() {
        return `${this.left}|${this.right}`;
    }
    execute(context) {
        return this.left.execute(context) || this.right.execute(context);
    }
}
class ASTAnd extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('&');
    }
    toString() {
        return `${this.left}&${this.right}`;
    }
    execute(context) {
        return this.left.execute(context) && this.right.execute(context);
    }
}

class AST {
    static compile(exp) {
        return new ASTCompiler(exp).compile();
    }
}

const PROPERTY_VARIABLES = Symbol.for("variables");
const NONE_OPERATOR = new ASTNoneOperator();

module.exports = {
    AST,
    ASTError
}
