---
layout:     post
title:      "浅谈angularJs中bindings的使用"
subtitle:   "angularJs中component的bindings用法总结"
date:       2018-03-19
author:     "本人"
header-img: "img/2018/03/angularJs.jpeg"
tags:
    - 前端开发
    - JavaScript
    - Angular
---


angularJs1.5之后，component和directive中用于双向绑定单向绑定的API总结。

### 分类

按照分类一共有4中：`'@', '<', '=', '&'`。让我们分别来探索下四种attributes的用法。

```javascript
  bindings: {
    attr1: '@',
    attr2: '<',
    attr3: '=',
    attr4: '&'
  }
```

具体来说，大概就是......

学习如何传递字符串（@）
学习如何设置双向数据绑定（=）
学习如何捕获输出（＆）
学习如何传递动态表达式（<）


#### 以文本形式读取属性`'@'` 单向绑定 父=>子

让我们从`@`开始，这是四个中最直接的，因为它只是将属性作为文本读取。 换句话说，我们将一个字符串传递给组件。

```javascript
// component
app.component("readingstring", {
  bindings: { text: '@' },
  template: '<p>text: <strong>{{$ctrl.text}}</strong></p>'
});

// template
<readingstring text="hello"></readingstring>
```

使用`@`会创建一个填充了命名属性的字符串内容的内部变量。 你可以说它作为组件的`$oninit`。


#### 属性为表达式`'='` 双向绑定 父=>子 子=>父

属性为表达式，并在表达式改变时重新评估它。 其实就是动态输入然后双向绑定传给父组件

```javascript
// component
app.component("dynamicinput",{
  bindings: { in: '=' },
  template: '<p>dynamic input: <strong>{{$ctrl.in}}</strong></p>'
});

// template
<dynamicinput in="this.text"></dynamicinput>
```

`'='`的缺点是它创建了一个双向数据绑定，尽管我们只需要一个单向的数据绑定。 这也意味着我们传入的表达式必须是一个变量。

但是对于AngularJS 1.5，我们得到了`'<'`，这意味着单向数据绑定。 这允许我们使用任何表达式作为输入。


#### 对外输出`'&'` 单向传输 子=>父

```javascript
// component
app.component("output",{
  bindings: { out: '&' },
  template: `
    <button ng-click="$ctrl.out({amount: 1})">buy one</button>
    <button ng-click="$ctrl.out({amount: 5})">buy many</button> `
});

// template
Outer value: {{count}}
<output out="count = count + amount"></output>
```

`'&'`这就是“output”的地方。它将该属性解释为一个语句并将其包装在一个函数中。 然后该组件可以随意调用该函数，并在语句中填充变量。 输出到父组件中！**不过我更喜欢用`'`<`'`**


#### 对外输出`'<'` 通过一个函数表达式单向传输 子=>父

比上述所有更好的解决方案是使用`'<'`通过传递回调来创建输出！

```javascript
// component
app.component("output",{
  bindings: { out: '<' },
  template: `
    <button ng-click="$ctrl.out(1)">buy one</button>
    <button ng-click="$ctrl.out(5)">buy many</button>`
});

// template
$scope.out = function(amount){
  $scope.count += amount;
}
<output out="out"></output>
```

与`'＆'`非常相似，但没有令人费解的问题！

作为一个有趣的事情，这种模式恰恰是组件的输出在React中的工作原理。
**其实ng2 4 5中也是，只不过是用过事件emit传输一个function**
