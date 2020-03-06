# aspects-js
aspects-js

Use aspect in node js

## 1.Install
Just install by npm
```
$ npm install --save aspects-js
```

## 2.Usage
You need require aspects-js at first of entry js file
```javascript
require('aspects-js');
```

## 3.Add aspect
Add a js file to write a aspect.
First, you should require class `Aspect` from aspects-js.
```javascript
//file: testAspect.js
const { Aspect } = require('aspects-js');
```
Secondly, you should declare a class extends Aspect and implements property `pointcut` and functions for join point.
```javascript
//file: testAspect.js
class TestAspect extends Aspect {
    get pointcut() { return '*.do*()' },
    before() { console.log('this is for before join point') },
    after() { console.log('this is for after join point') }
}
````
Then, you should exports a instance of your class which is extends `Aspect`
```javascript
//file: testAspect.js
module.exports = new TestAspect();
```
At last, require your aspects at entry.js file
```javascript
//file: entry.js
require('./testAspect.js');
```
Now, all classes when you required will be cut by all your aspects.

## 4.Classes and Interfaces
### Interface Aspect
```typescript
interface Aspect {
    readonly pointcut: Pointcut | string;

    after(joinPoint: JoinPoint, result: any, error: Error);
    afterReturn(joinPoint: JoinPoint, result: any): any;
    afterThrow(joinPoint: JoinPoint, error: Error): void;
    before(joinPoint: JoinPoint):void;
    around(joinPoint: JoinPoint): any;
}
```

### Class JoinPoint
```typescript
class JoinPoint {
    readonly type: Class;
    readonly fun: Function;
    readonly thisArg: any;
    readonly target: any;
    readonly args: any[];

    proceed(...args: any[]): any;
}
```

### Class Pointcut
```typescript
class Pointcut {
    constructor(pointcut: string);

    matches(type: Class | Function): boolean;
}
```

## 5.Pointcut expression
### 1.Normal
```javascript
"ClassName.FunctionName()"
```
### 2.Execution
```javascript
"execution(ClassName.FunctionName())"
```
### 3.Within
```javascript
"within(ClassName)"
```

### 4.Wildcards
#### > `*` Match all word
```javascript
"*Service.do*()"
```
Match all methods which's name is start with "do" and in classes which's name is end with "Service"
#### > `?` Match one word
```javascript
"you?.do?()"
```
#### > `+` Or operate
```javascript
"within(Test1+Test2)"
```
Just match all methods in classes which's name is "Test1" or "Test2"