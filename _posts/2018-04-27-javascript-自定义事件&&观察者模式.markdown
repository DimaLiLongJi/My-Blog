---
layout: post
title: "JavaScript的自定义事件&&观察者模式简单实现"
subtitle: ""
date: 2018-04-27
author: "本人"
header-img: "img/2018/04/Observable.jpg"
tags:
  - 前端开发
  - JavaScript
  - 设计模式
---
最近玩了一下NG5，其中的rx.js，很厉害，顺便直接学习了下观察者模式。

```
观察者模式是软件设计模式的一种。在此种模式中，一个目标对象管理所有相依于它的观察者对象，并且在它本身的状态改变时主动发出通知。这通常透过呼叫各观察者所提供的方法来实现。此种模式通常被用来实时事件处理系统。
```
总而言之就是类似于DOM的事件一样，发布者，接受者，和动作。话不多说搞起来！

1. 自定义事件绑定与触发

```javascript
class EventEmitter {
  constructor() {
    console.log('init Event');
    this.handelFn = {};
  }

  on(eventName, callback) {
    if (this.handelFn[eventName] && this.handelFn[eventName] instanceof Array && callback instanceof Function) {
      this.handelFn[eventName].push(callback);
    } else {
      this.handelFn[eventName] = [];
      this.handelFn[eventName].push(callback);
    }
  }

  emit(eventName, data) {
    if (this.handelFn[eventName] && this.handelFn[eventName] instanceof Array) {
      this.handelFn[eventName].forEach((callback) => {
        if (callback && callback instanceof Function) {
          if (data) {
            callback.call(null, data);
          } else {
            callback();
          }
        }
      });
    } else {
      console.error('emit failed,nonexistent event:', eventName);
    }
  }

  remove(eventName) {
    if (this.handelFn[eventName]) {
      delete this.handelFn[eventName];
    } else {
      console.error('remove failed,nonexistent event:', eventName);
    }
  }

  showEvent(eventName) {
    if (this.handelFn[eventName] && this.handelFn[eventName] instanceof Array) {
      return this.handelFn[eventName];
    } else {
      console.error('show event failed,nonexistent event:', eventName);
    }
  }
}

function el() {
  console.log('222');
}
let event = new EventEmitter();
event.on('chufa', el);
event.emit('chufa', { a: 1 });
event.remove('chufa');
```

其实就是一个类,里面维护一个Object。
`on`就为Object里添加一个`event`和其对应的`callback`，
`emit`就触发一个`event`其对应的`callback`，
`remove`就删除一个`event`其对应的所有`callback`。

哦对了一开始想把`callback`直接给`event`，但是addEventListener可以添加很多个事件，所以我把`callback`维护为一个数组。

2. 简化版的一个观察者(不完成版)

目前只实现了订阅,观察。。。。 取消订阅现在还没搞出来
实例化之后可以订阅一个对象，如果对象更改了属性，就可以触发分发。

```javascript
class Observable {
  constructor() {
    this.handelObj = [];
  }

  subscribe(obj, callback) {
    if (!this.handelObj.find(o => o === obj)) {
      this.handelObj.push(obj);
      this.watcher(obj, callback);
    }
  }

  watcher(obj, callback) {
    if (!obj || typeof obj !== 'object') return;
    const that = this;
    for (let key in obj) {
      let val = obj.key;
      this.watcher(val, callback);
      Object.defineProperty(obj, key, {
        configurable: true,
        enumerable: true,
        get() {
          return val;
        },
        set(newVal) {
          if (newVal === val) return;
          console.log('newVal', newVal);
          val = newVal;
          callback();
          that.watcher(obj.key, callback);
        },
      });
    }
  }
}

function el2() {
  console.log('11132323');
}

let ober = new Observable();
let subjuction = {
  a: 1,
};
ober.subscribe(subjuction, el2);
subjuction.a = {
  ada: 1,
};
// '11132323'
```

关于订阅，其实也不太对，等我研究下rx更深之后再来搞！

。。。未完待续
