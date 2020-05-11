const { Aspect } = require('../aspects.js');

class TestAspect extends Aspect {
    get pointcut() { return '*.do*()' }
    before(joinPoint) {
        console.log('这里是前置切面:' + joinPoint.toString());
    }
    after(joinPoint, result, error) {
        console.log('这里是后置切面:' + joinPoint.toString() + ', 返回结果为:' + result);
    }
}

module.exports = new TestAspect();
