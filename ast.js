

const SPLITS = {
    '(': '',
    ')': '',
    '+': '',
    '.': '.',
    '?': ''
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
                case '&&':
                case '||':
                    return { value, position };
                case '.':
                    switch (letter) {
                        case '.': break;
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
        let operatorStack = [];
        let valueStack = [];
        const compute = () => {
            let operator = operatorStack.shift();
            if (valueStack.length) {
                operator.fill(valueStack.shift());
                if (operator.completed) {
                    valueStack.unshift(operator);
                } else {
                    operatorStack.unshift(operator);
                }
            } else {
                showError(operator);
                throw new Error('invalid exp:' + this.exp);
            }
        }
        const unshift = operator => {
            console.debug('unshift', operator.toString());
            if (operator.completed) {
                valueStack.unshift(operator);
            } else {
                while (operatorStack.length && operator.priority <= operatorStack[0].priority) {
                    compute();
                }
                if (valueStack.length) {
                    if (!operator.init(valueStack.shift())) {
                        showError(operator);
                        throw new Error('invalid exp:' + this.exp);
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
            console.debug('token', token);
            switch (token.value) {
                case '+':
                    unshift(new AstNameOr(token));
                    break;
                case '(':
                    if (operatorStack.length) {
                        if (operatorStack[0] instanceof ASTValue) {
                            unshift(new ASTCall(token));
                        } else {
                            unshift(new ASTBracket(token));
                        }
                    }
                    break;
                case ')':
                    while (operatorStack.length && !(operatorStack[0] instanceof ASTBracket)) {
                        compute();
                    }
                    break;
                default:
                    unshift(new ASTValue(token));
            }
            console.debug('operatorStack', operatorStack.join(' , '));
            console.debug('valueStack', valueStack.join(' , '));
        }
        while (operatorStack.length) {
            compute();
        }
        if (valueStack.length !== 1) {
            if (valueStack.length) {
                showError(valueStack[0]);
                console.debug('error valueStack', valueStack.join(' , '));
            }
            throw new Error('invalid exp:' + this.exp);
        } else {
            return valueStack[0];
        }
    }
}

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
}

class ASTNoneOperator extends ASTOperator {
    constructor(token) {
        super(token);
    }
    get count() {
        return 0;
    }
    toString() {
        return '#?#'
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
}

const PRIORITIES = [',', '+', '||', '&&', '!', '.', '()'];

class ASTValue extends ASTUnaryOperator {
    constructor(token) {
        super(token);
        this.fill(token.value);
    }
    get priority() {
        return PRIORITIES.indexOf('()');
    }
    toString() {
        return this.value;
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
}
class ASTCall extends ASTUnaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('()');
    }
    toString() {
        return `(${this.value})`;
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

class AstNameOr extends ASTBinaryOperator {
    constructor(token) {
        super(token);
    }
    get priority() {
        return PRIORITIES.indexOf('+');
    }
    toString() {
        return `${this.left}+${this.right}`;
    }
}

class AST {
    constructor(operator) {
        this.operator = operator;
    }
    matches(type, fun) {

    }
    static compile(exp) {
        return new ASTCompiler(exp).compile();
    }
}

const PROPERTY_VARIABLES = Symbol.for("variables");
const NONE_OPERATOR = new ASTNoneOperator();

module.exports = {
    compile(exp) {
        return AST.compile(exp);
    }
}
