// 三种状态
enum PromiseState {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}
type PromiseResolve<T = any> = (value?: T) => void;
type PromiseReject<T = any> = (reason?: T) => void;
type PromiseThen<T = any> = (onResolved?: PromiseResolve<T>, onRejected?: PromiseReject<T | any>) => MyPromise<T | any>;
type PromiseCatch<T = any> = (onRejected?: PromiseReject<T | any>) => MyPromise<T | any>;
type PromiseExecutor<T = any> = (resolve?: PromiseResolve<T>, reject?: PromiseReject<T | any>) => any;

class MyPromise<T = any> {
  value: T;
  currentState: PromiseState = PromiseState.PENDING;
  resolvedCallbacks: PromiseResolve[] = []; // then成功回调
  rejectedCallbacks: PromiseReject[] = []; // then失败回调

  constructor(fn: PromiseExecutor<T>) {
    try {
      fn(this.resolve, this.reject);
    } catch (e) {
      this.reject(e);
    }
  }

  resolve: PromiseResolve<T> = (value?: T) => {
    if (value instanceof MyPromise) {
      // 传入 Promise 实例的话，要向继续下传递
      // 如果该值 value 是一个 Promise 对象，则直接返回该对象
      return value.then(this.resolve, this.reject);
    }
    // 宏任务代替微任务执行
    setTimeout(() => {
      if (this.currentState === PromiseState.PENDING) {
        this.currentState = PromiseState.RESOLVED;
        this.value = value;
        this.resolvedCallbacks.forEach(cb => cb());
      }
    });
  }

  reject: PromiseReject<T> = (reason?: T) => {
    // 宏任务代替微任务执行
    setTimeout(() => {
      if (this.currentState === PromiseState.PENDING) {
        this.currentState = PromiseState.REJECTED;
        this.value = reason;
        this.rejectedCallbacks.forEach(cb => cb());
      }
    })
  }

  then: PromiseThen<T> = (onResolved?: PromiseResolve<T>, onRejected?: PromiseReject<T>): MyPromise<T> => {
    const that = this;
    // 规范 2.2.7，then 必须返回一个新的 promise
    let newMyPromise: MyPromise;
    // 规范 2.2.onResolved 和 onRejected 都为可选参数
    // 如果 onResolved 和 onRejected 不是函数则要自行生成新的函数，保证了透传
    const _onResolved: any = typeof onResolved === 'function' ? onResolved : v => v;
    const _onRejected: any = typeof onRejected === 'function' ? onRejected : r => { throw r };

    // 初始状态
    if (this.currentState === PromiseState.PENDING) {
      newMyPromise = new MyPromise<T>(function (resolve, reject) {
        that.resolvedCallbacks.push(function () {
          // 使用 try/catch 如果有报错的话，直接 reject(r)
          try {
            var returnValue = _onResolved(that.value);
            // resolve(returnValue) 本次 Promise 继续 returnValue
            resolutionProcedure(newMyPromise, returnValue, resolve, reject);
          } catch (r) {
            reject(r);
          }
        });
  
        that.rejectedCallbacks.push(function () {
          try {
            var returnValue = _onRejected(that.value);
            // resolve(returnValue) 本次 Promise 继续 returnValue
            resolutionProcedure(newMyPromise, returnValue, resolve, reject);
          } catch (r) {
            reject(r);
          }
        });
      });
      return newMyPromise;
    }
    // resolved状态
    if (this.currentState === PromiseState.RESOLVED) {
      newMyPromise = new MyPromise<T>(function (resolve, reject) {
        // 规范 2.2.4，为了保证 onFulfilled，onRjected 异步执行 所以用了 setTimeout 包裹下
        setTimeout(function () {
          try {
            var returnValue = _onResolved(this.value);
            // resolve(returnValue) 本次 Promise 继续 returnValue
            resolutionProcedure(newMyPromise, returnValue, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      });
      return newMyPromise;
    }
    // rejected状态
    if (this.currentState === PromiseState.REJECTED) {
      newMyPromise =  new MyPromise<T>(function (resolve, reject) {
        setTimeout(function () {
          // 异步执行onRejected
          try {
            var returnValue = _onRejected(this.value);
            // resolve(returnValue) 本次 Promise 继续 returnValue
            resolutionProcedure(newMyPromise, returnValue, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      });
      return newMyPromise;
    }
  }

  catch: PromiseCatch<T> = (onRejected: PromiseReject<T>) => {
    return this.then(null, onRejected);
  }
}

// 规范 2.3
function resolutionProcedure<T = any>(newMyPromise: MyPromise<T>, returnValue: any, resolve: PromiseResolve<T>, reject: PromiseReject<T | any>) {
  // 规范 2.3.1，returnValue 不能和 newMyPromise 相同，避免循环引用
  if (newMyPromise === returnValue) {
    return reject(new TypeError("Error"));
  }
  // 规范 2.3.2 如果 returnValue 为 Promise，状态为 pending 需要继续等待否则执行
  if (returnValue instanceof MyPromise) {
    if (returnValue.currentState === PromiseState.PENDING) {
      returnValue.then(function (value: any) {
        // 再次调用该函数是为了确认 returnValue resolve 的 参数是什么类型，如果是基本类型就再次 resolve 把值传给下个 then
        resolutionProcedure(newMyPromise, value, resolve, reject);
      }, reject);
    } else {
      // 规范 2.3.2.2 规范 2.3.2.3  如果 returnValue 为 Promise，状态为 fulfilled 或 rejected ，原因用于相同的状态
      returnValue.then(resolve, reject);
    }
    return;
  }
  // 规范 2.3.3.3.3 reject 或者 resolve 其中一个执行过得话，忽略其他的
  // 所以使用 hasCalled 来标记是否执行过
  let hasCalled = false;
  // 规范 2.3.3，判断 returnValue 是否为对象或者函数
  if (returnValue !== null && (typeof returnValue === "object" || typeof returnValue === "function")) {
    // 规范 2.3.3.2，如果不能取出 then，就 reject
    try {
      // 规范 2.3.3.1
      let then = returnValue.then;
      // 如果 then 是函数，调用 returnValue.then，传入新的 resolvePromise 和 rejectPromise 方法
      if (typeof then === "function") {
        // 规范 2.3.3.3
        then.call(
          returnValue,
          y => {
            if (hasCalled) return;
            hasCalled = true;
            // 规范 2.3.3.3.1  当 resolvePromise 被以 y 为参数调用, 执行 [[Resolve]](promise, y)
            resolutionProcedure(newMyPromise, y, resolve, reject);
          },
          e => {
            if (hasCalled) return;
            hasCalled = true;
            reject(e);
          }
        );
      } else {
        // 规范 2.3.3.4
        resolve(returnValue);
      }
    } catch (e) {
      if (hasCalled) return;
      hasCalled = true;
      reject(e);
    }
  } else {
    // 规范 2.3.4，x 为基本类型，则以 x 为值 fulfill promise
    resolve(returnValue);
  }
}

const promisex = new MyPromise<number>((resolve, reject) => {
  setTimeout(() => {
    resolve(1);
    reject(33333);
  }, 200);
});
console.log(888888, promisex.currentState);
promisex.then((value) => {
  console.log('first then resolve', value, promisex.currentState);
  return value;
}).then((value) => {
  console.log('second then resolve', value, promisex.currentState)
}).catch(e => console.log('last catch', e));
console.log(222222, promisex.currentState);