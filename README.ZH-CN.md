# aspects-js
aspects-js

[英文](readme.md)

在nodejs中使用面向切面的变成

## 1.安装
只需要使用NPM进行安装
```
$ npm install --save aspects-js
```

## 2.使用
需要在你的入口文件的最开始的位置引入aspects-js
```javascript
require('aspects-js');
```

## 3.添加切面
添加一个切面,这个切面的定义将写在一个新的文件中
首先,需要在这个切面定义文件的最开始的位置引入aspects-js中的`Aspect`接口
```javascript
//文件: testAspect.js
const { Aspect } = require('aspects-js');
```
其次,在文件中声明自定义的切面类继承`Aspect`接口,并重写`pointcut`属性的get方法返回切面表达式,同时可以重写面向切点处理的一些方法
```javascript
//文件: testAspect.js
class TestAspect extends Aspect {
    get pointcut() { return '*.do*()' },
    before() { console.log('this is for before join point') },
    after() { console.log('this is for after join point') }
}
````
然后,需要将这个自定义的切面类的实例导出
```javascript
//文件: testAspect.js
module.exports = new TestAspect();
```
最后,在项目的入口文件(在需要被切面类加载之前)加载指定的切面类实例
```javascript
//文件: entry.js
require('./testAspect.js');
```
现在,所有的后续加载的类在执行起方法时将会被自定义的切面类进行切面

## 4.API(提供的接口/类)
### `Aspect`接口
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

### `JoinPoint`类
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

### `Pointcut`类
```typescript
class Pointcut {
    constructor(pointcut: string);

    matches(type: Class | Function): boolean;
}
```

## 5.切面表达式
### 1.标准表达式
```javascript
"ClassName.FunctionName()"
```
### 2.`execution`关键字
```javascript
"execution(ClassName.FunctionName())"
```
### 3.`within`关键字
```javascript
"within(ClassName)"
```
### 4.参数表达式
```javascript
"FunctionName(..)"
"FunctionName(Type1,Type2)"
"FunctionName(Type1,..,Type2)"
```

### 4.运算符与通配符
#### > `*` 匹配多个字符 *`通配符`*
```javascript
"*Service.do*()"
```
匹配所有以`Service`结尾的类型中的以`do`开头的方法
#### > `?` 匹配一个字符 *`通配符`*
```javascript
"you?.do?()"
```
#### > `+` 针对名称的 或 运算
```javascript
"within(Test1+Test2)"
```
匹配`Test1`或`Test2`中所有的方法
#### > `|`,`||` 逻辑 或 运算符
```javascript
"within(Test1)|within(Test2)"
```
匹配`Test1`或`Test2`中所有的方法
#### > `&`,`&&` 逻辑 且 运算符
```javascript
"within(Test1)&abc"
```
匹配`Test1`中的`abc`方法
#### > `!` 逻辑 非 运算符
```javascript
"!within(Test)"
```
匹配所有不在`Test`类中的方法
#### > `()` 括号运算符 (用于逻辑)
提升括号内部表达式的优先级
#### > `()` 方法调用 运算符
```javascript
"abc()"
"abc(..)"
```
匹配所有的名称为`abc`的方法
```javascript
"abc(Type1)"
```
匹配所有的名称为`abc`且在执行时只传入了一个类型为`Type1`的参数的方法
#### > `,` 参数分割 运算符
```javascript
"*(Type1,Type2)"
```
匹配所有执行时传入类型依次为`Type1`与`Type2`两个参数的所有方法
#### > `.` 属性 运算符
```javascript
"Test.abc()"
```
匹配`Test`类中的`abc`方法
#### > `..` Multiple arguments operator for arguments
匹配连续的多个参数类型
