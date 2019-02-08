// 三种状态
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

type PromiseState = 'pending' | 'resolved' | 'rejected';
type PromiseResolve = (value?: any) => void;
type PromiseReject = (reason?: any) => void;
type PromiseThen = (onResolved?: PromiseResolve, onRejected?: PromiseReject) => MyPromise;
type PromiseFn = (resolve?: PromiseResolve, reject?: PromiseReject) => any;

class MyPromise {
  value: any;
  currentState: PromiseState = PENDING;
  // 用于保存 then 中的回调，只有当 promise
  // 状态为 pending 时才会缓存，并且每个实例至多缓存一个
  resolvedCallbacks: PromiseResolve[] = [];
  rejectedCallbacks: PromiseReject[] = [];

  constructor(fn: PromiseFn) {
    try {
      fn(this.resolve, this.reject);
    } catch (e) {
      this.reject(e);
    }
  }

  resolve: PromiseResolve = (value?: any) => {
    if (value instanceof MyPromise) {
      // 如果 value 是个 Promise，递归执行
      return value.then(this.resolve, this.reject);
    }
    // 异步执行，保证执行顺序
    setTimeout(() => {
      if (this.currentState === PENDING) {
        this.currentState = RESOLVED;
        this.value = value;
        this.resolvedCallbacks.forEach(cb => cb());
      }
    });
  }

  reject: PromiseReject = (reason?: any) => {
    // 异步执行，保证执行顺序
    setTimeout(() => {
      if (this.currentState === PENDING) {
        this.currentState = REJECTED;
        this.value = reason;
        this.rejectedCallbacks.forEach(cb => cb());
      }
    })
  }

  then: PromiseThen = (onResolved?: PromiseResolve, onRejected?: PromiseReject) => {
    const that = this;
    // 规范 2.2.7，then 必须返回一个新的 promise
    let newMyPromise: MyPromise;
    // 规范 2.2.onResolved 和 onRejected 都为可选参数
    // 如果类型不是函数需要忽略，同时也实现了透传
    // Promise.resolve(4).then().then((value) => console.log(value))
    onResolved = typeof onResolved === 'function' ? onResolved : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : r => r;
  
    if (this.currentState === RESOLVED) {
      newMyPromise = new MyPromise(function (resolve, reject) {
        // 规范 2.2.4，保证 onFulfilled，onRjected 异步执行
        // 所以用了 setTimeout 包裹下
        setTimeout(function () {
          try {
            var x = onResolved(this.value);
            resolutionProcedure(newMyPromise, x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      });
      return newMyPromise;
    }
  
    if (this.currentState === REJECTED) {
      newMyPromise =  new MyPromise(function (resolve, reject) {
        setTimeout(function () {
          // 异步执行onRejected
          try {
            var x = onRejected(this.value);
            resolutionProcedure(newMyPromise, x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      });
      return newMyPromise;
    }
  
    if (this.currentState === PENDING) {
      newMyPromise = new MyPromise(function (resolve, reject) {
        that.resolvedCallbacks.push(function () {
          // 考虑到可能会有报错，所以使用 try/catch 包裹
          try {
            var x = onResolved(that.value);
            resolutionProcedure(newMyPromise, x, resolve, reject);
          } catch (r) {
            reject(r);
          }
        });
  
        that.rejectedCallbacks.push(function () {
          try {
            var x = onRejected(that.value);
            resolutionProcedure(newMyPromise, x, resolve, reject);
          } catch (r) {
            reject(r);
          }
        });
      });
      return newMyPromise;
    }
  }

}

// 规范 2.3
function resolutionProcedure(promise2: MyPromise, x: any, resolve: PromiseResolve, reject: PromiseReject) {
  // 规范 2.3.1，x 不能和 promise2 相同，避免循环引用
  if (promise2 === x) {
    return reject(new TypeError("Error"));
  }
  // 规范 2.3.2
  // 如果 x 为 Promise，状态为 pending 需要继续等待否则执行
  if (x instanceof MyPromise) {
    if (x.currentState === PENDING) {
      x.then(function (value: any) {
        // 再次调用该函数是为了确认 x resolve 的
        // 参数是什么类型，如果是基本类型就再次 resolve
        // 把值传给下个 then
        resolutionProcedure(promise2, value, resolve, reject);
      }, reject);
    } else {
      x.then(resolve, reject);
    }
    return;
  }
  // 规范 2.3.3.3.3
  // reject 或者 resolve 其中一个执行过得话，忽略其他的
  let called = false;
  // 规范 2.3.3，判断 x 是否为对象或者函数
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    // 规范 2.3.3.2，如果不能取出 then，就 reject
    try {
      // 规范 2.3.3.1
      let then = x.then;
      // 如果 then 是函数，调用 x.then
      if (typeof then === "function") {
        // 规范 2.3.3.3
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            // 规范 2.3.3.3.1
            resolutionProcedure(promise2, y, resolve, reject);
          },
          e => {
            if (called) return;
            called = true;
            reject(e);
          }
        );
      } else {
        // 规范 2.3.3.4
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    // 规范 2.3.4，x 为基本类型
    resolve(x);
  }
}

const promisex = new MyPromise((resolve, reject) => {
  resolve(1);
  console.log(24444444);
});
promisex.then((value) => {
  console.log(4444444, value);
});