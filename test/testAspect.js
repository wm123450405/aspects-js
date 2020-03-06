const { Aspect } = require('../aspects.js');

class TestAspect extends Aspect {
    get pointcut() { return '*.do*()' }
    before() {
        console.log('这里是前置切面');
    }
    after() {
        console.log('这里是后置切面');
    }
}

module.exports = new TestAspect();