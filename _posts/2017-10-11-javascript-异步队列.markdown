---
layout:     post
title:      "javascript-异步队列"
subtitle:   "macrotask queue 和 microtask queue"
date:       2017-10-11
author:     "本人"
header-img: "img/2017/10/promise.png"
tags:
    - 前端开发
    - JavaScript
---

有这样的一个面试题：问输出结果

```javascript
setTimeout(() => {console.log(4)},0);
new Promise(function(resolve, reject){
    console.log(1)
    for( var i=0 ; i<10000 ; i++ ){
        i==9999 && resolve()
    }
    console.log(2)
}).then(function(){
    console.log(5)
});
console.log(3);
1
2
3
5
4
```

还有有这样的一个面试题：问输出结果

```javascript
setTimeout(() => {console.log(4)},0);
new Promise(function(resolve, reject){
    console.log(1)
    setTimeout(() => {
		    resolve()
    } ,0);
    console.log(2)
}).then(function(){
    console.log(5)
});
console.log(3);
1
2
3
4
5
```

结果怎么样？为什么两个的结果4 5的顺序完全不同？

在网上查了下，才知道答案：

### 正文

js是一种单线程异步的语言。（这么说没错吧？）它的异步是由运行环境来实现的。js会将所有需要异步执行的东西，放到异步队列中，等到同步结束后，再进行一个事件循环。
当异步队列中有任务完成后，会放一个事件，告诉环境，"我，异步，执行完了!"。

虽然事件循环只能有一个，但是任务队列可以有多个 **这个我也是才知道**

1. 异步队列分为两种： macrotask 和 microtask
2. 整个script是属于一个macrotask, `setTimeout` 也是属于macrotask, `Promise`是一个同步任务,而`promise.then的回调`则属于miacrotask
3. 此时`setTimeout`已经被推入macrotask,根据顺序，所以接下来会顺序执行所有的 microtask, 也就是 `promise.then` 的回调函数，从而打印出5
4. 当miacrotask队列中的任务已经完成后，去执行macrotask中的`setTimeout`,所以打印出 4

第二道题也是类似，所以就不多说了
