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
type PromiseFinally<T = any> = (handler?: (value?: any) => any) => MyPromise<T | any>;
type PromiseStaticAll = (iterable: MyPromise<any>[]) => MyPromise<any[]>;
type PromiseStaticRace = (iterable: MyPromise<any>[]) => MyPromise<any>;
type PromiseStaticResolve<T = any> = (value: T) => MyPromise<T>;
type PromiseStaticReject<T = any> = (value: T) => MyPromise<T>;
type PromiseExecutor<T = any> = (resolve?: PromiseResolve<T>, reject?: PromiseReject<T | any>) => any;

class MyPromise<T = any> {
  /**
   * Promise 的值
   *
   * @type {T}
   * @memberof MyPromise
   */
  value: T;

  /**
   * 当前状态
   *
   * @type {PromiseState}
   * @memberof MyPromise
   */
  currentState: PromiseState = PromiseState.PENDING;

  /**
   * 保存 then 中 onResolved 成功回调的队列
   *
   * @type {PromiseResolve[]}
   * @memberof MyPromise
   */
  resolvedCallbacks: PromiseResolve[] = [];

  /**
   * 保存 then 中 onRejected 失败回调的队列
   *
   * @type {PromiseReject[]}
   * @memberof MyPromise
   */
  rejectedCallbacks: PromiseReject[] = [];

  /**
   * 处理新旧2个 Promise 的封装方法
   *
   * @static
   * @memberof MyPromise
   */
  static resolutionPromiseState = <T = any>(newMyPromise: MyPromise<T>, returnValue: any, resolve: PromiseResolve<T>, reject: PromiseReject<T | any>) => {
    // 规范 2.3.1，returnValue 不能和 newMyPromise 相同，避免循环引用
    if (newMyPromise === returnValue) {
      return reject(new TypeError("Error"));
    }
    // 规范 2.3.2 如果 returnValue 为 Promise，状态为 pending 需要继续等待否则执行
    if (returnValue instanceof MyPromise) {
      if (returnValue.currentState === PromiseState.PENDING) {
        returnValue.then(function (value: any) {
          // 再次调用该函数是为了确认 returnValue resolve 的 参数是什么类型，如果是基本类型就再次 resolve 把值传给下个 then
          MyPromise.resolutionPromiseState(newMyPromise, value, resolve, reject);
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
              MyPromise.resolutionPromiseState(newMyPromise, y, resolve, reject);
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

  /**
   * 静态方法 Promise.all
   * 
   * 返回一个 Promise 实例
   * 当参数数组的 Promise 全部完成时，返回一个顺序的值的数组
   * 当有一个 Promise 失败，执行 reject，整个返回的 Promise 的状态为 失败
   *
   * @static
   * @type {PromiseStaticAll}
   * @memberof MyPromise
   */
  static all: PromiseStaticAll = (iterable: MyPromise<any>[]) => {
    return new MyPromise<any[]>((resolve, reject) => {
      const result: any[] = [];
      iterable.forEach((promiseInstance, index) => {
        promiseInstance.then((value) => {
          result[index] = value;
          if (result.length === iterable.length) {
            resolve(result);
          }
        }, reject);
      });
    });
  }

  /**
   * 静态方法 Promise.race
   * 
   * 当迭代器有一个更改了状态，则更改整个返回值的状态
   *
   * @static
   * @type {PromiseStaticRace}
   * @memberof MyPromise
   */
  static race: PromiseStaticRace = (iterable: MyPromise<any>[]) => {
    return new MyPromise<any[]>((resolve, reject) => {
      iterable.forEach((promiseInstance) => {
        promiseInstance.then((value) => resolve(value), reject);
      });
    });
  }

  /**
   * 静态方法 Promise.resolve
   * 
   * 直接返回一个成功状态的 Promise
   *
   * @template T
   * @param {T} value
   * @returns
   */
  static resolve: PromiseStaticResolve = <T>(value: T) => {
    const newMyPromise = new MyPromise<T>((resolve, reject) => {
      // resolve(value);
      MyPromise.resolutionPromiseState(newMyPromise, value, resolve, reject);
    });
    return newMyPromise;
  }

  /**
   * 静态方法 Promise.resolve
   * 
   * 直接返回一个失败状态的 Promise
   *
   * @static
   * @type {PromiseStaticReject}
   * @memberof MyPromise
   */
  static reject: PromiseStaticReject = <T>(value: T) => {
    return new MyPromise<T>((resolve, reject) => {
      reject(value);
    });
  }

  /**
   * Creates an instance of MyPromise.
   * 
   * 传入函数接收2个方法，
   * 分别是 this.resolve 和 this.reject 来更改状态
   * 
   * @param {PromiseExecutor<T>} fn
   * @memberof MyPromise
   */
  constructor(fn: PromiseExecutor<T>) {
    try {
      fn(this.resolve, this.reject);
    } catch (e) {
      this.reject(e);
    }
  }

  /**
   * 变更 Promise 状态为 resolved
   * 
   * 如果 value 是个 promise的话，返回 value.then 向下继续传递
   * 如果不是，则用 setTimeout 异步更改状态并遍历触发回调
   *
   * @param {T} [value]
   * @returns
   */
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

  /**
   * 变更 Promise 状态为 rejected
   * 
   * 异步变更状态并触发回调
   *
   * @param {T} [reason]
   */
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

  /**
   * then 方法，返回 初始状态 或 成功状态 的 Promise
   * 
   * 接收2个值：
   * onResolved 成功状态回调
   * onRejected 失败状态回调
   * 
   * 1. 如果 不穿参数，则自行拟值，保证透传
   * 2. 初始状态：返回等待状态的 Promise，并把 then 的两个参数 加入回调队列
   * 3. 成功状态：返回成功状态的 Promise，并异步执行 onResolved 变更新旧2个promise的状态
   * 4. 失败状态：返回成功状态的 Promise，并异步执行 onRejected 变更新旧2个promise的状态
   *
   * @param {PromiseResolve<T>} [onResolved]
   * @param {PromiseReject<T>} [onRejected]
   * @returns {MyPromise<T>}
   */
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
            MyPromise.resolutionPromiseState(newMyPromise, returnValue, resolve, reject);
          } catch (r) {
            reject(r);
          }
        });

        that.rejectedCallbacks.push(function () {
          try {
            var returnValue = _onRejected(that.value);
            // resolve(returnValue) 本次 Promise 继续 returnValue
            MyPromise.resolutionPromiseState(newMyPromise, returnValue, resolve, reject);
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
            MyPromise.resolutionPromiseState(newMyPromise, returnValue, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      });
      return newMyPromise;
    }
    // rejected状态
    if (this.currentState === PromiseState.REJECTED) {
      newMyPromise = new MyPromise<T>(function (resolve, reject) {
        setTimeout(function () {
          // 异步执行onRejected
          try {
            var returnValue = _onRejected(this.value);
            // resolve(returnValue) 本次 Promise 继续 returnValue
            MyPromise.resolutionPromiseState(newMyPromise, returnValue, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      });
      return newMyPromise;
    }
  }

  /**
   * catch 方法 
   * 
   * 捕获错误并返回一个成功状态的 Promise
   * 
   * @param {PromiseReject<T>} onRejected
   * @returns
   */
  catch: PromiseCatch<T> = (onRejected: PromiseReject<T>) => {
    return this.then(null, onRejected);
  }

  /**
   * finally 方法
   * 
   * 无论成功失败都会执行 handler 并返回一个 Promise
   *
   * @type {PromiseFinally<T>}
   * @memberof MyPromise
   */
  finally: PromiseFinally<T> = (handler?: (value?: any) => any) => {
    return this.then((value) => {
      handler(value);
      return value;
    }, r => {
      handler(r);
      throw r;
    });
  }
}

// const promisex = new MyPromise<number>((resolve, reject) => {
//   setTimeout(() => {
//     resolve(1);
//     reject(33333);
//   }, 200);
// });
// console.log(888888, promisex.currentState);
// promisex.then((value) => {
//   console.log('first then resolve', value, promisex.currentState);
//   return value;
// }).then((value) => {
//   console.log('second then resolve', value, promisex.currentState)
// }).catch(e => console.log('last catch', e)).finally((v) => {
//   console.log('third then finally', v, promisex.currentState)
// });
// console.log(222222, promisex.currentState);

// MyPromise.all([
//   new MyPromise<number>((r, j) => {
//     setTimeout(() => {
//       j(1);
//     }, 200);
//   }),
//   new MyPromise<number>((r, j) => {
//     setTimeout(() => {
//       r(2);
//     }, 100);
//   }),
//   new MyPromise<number>((r, j) => {
//     setTimeout(() => {
//       r(3);
//     }, 500);
//   }),
// ]).then((values: any[]) => {
//   console.log(44444444, values);
// }, (e) => console.error(22222, e));

// MyPromise.race([
//   new MyPromise<number>((r, j) => {
//     setTimeout(() => {
//       j(1);
//     }, 200);
//   }),
//   new MyPromise<number>((r, j) => {
//     setTimeout(() => {
//       r(2);
//     }, 100);
//   }),
//   new MyPromise<number>((r, j) => {
//     setTimeout(() => {
//       r(3);
//     }, 500);
//   }),
// ]).then((values: any[]) => {
//   console.log(44444444, values);
// }, (e) => console.error(22222, e));

// MyPromise.resolve(1).then(
//   (value: number) => {console.log(44444, value)},
//   (error: number) => {console.error(66666, error)},
// );
// MyPromise.reject(2).then(
//   (value: number) => {console.log(44444, value)},
//   (error: number) => {console.error(66666, error)},
// );
