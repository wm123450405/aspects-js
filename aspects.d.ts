declare namespace Aspects {
    type Class = { new(...args: any[]): any; };

    export class Context {
        readonly type: Class;
        readonly fun: Function;
        readonly args: any[];
    }

    export class Pointcut {
        constructor(pointcut: string | ((context: Context) => boolean));

        matches(context: Context): boolean;
    }

    export interface Aspect {
        readonly pointcut: Pointcut | string | ((context: Context) => boolean);

        after(joinPoint: JoinPoint, result: any, error: Error): void;
        afterReturn(joinPoint: JoinPoint, result: any): any;
        afterThrow(joinPoint: JoinPoint, error: Error): void;
        before(joinPoint: JoinPoint):void;
        around(joinPoint: JoinPoint): any;
    }

    export class JoinPoint {
        readonly type: Class;
        readonly fun: Function;
        readonly thisArg: any;
        readonly target: any;
        readonly args: any[];

        proceed(...args: any[]): any;
    }
}

export = Aspects;
export as namespace Aspects;
