---
layout:     post
title:      "淘宝flexible手动增加页面缩放"
subtitle:   "使用案例：react"
date:       2018-03-01
author:     "本人"
header-img: "img/2018/03/meta.jpg"
tags:
    - 前端开发
    - JavaScript
    - React
---


最近在做一个项目，在项目的一个关卡玩一个大家一起来找茬这种的游戏。在pc端一点问题都没有，但是在手机端，因为简历过于小，所以看不清导致点错，因此需要在给定页面使用缩放。

一开始的想法是使用手势缩放，但是其实相当麻烦，最后想到`meta`标签中能设置缩放。但是也遇到一点问题，因为淘宝的flexible会自动设置meta的content，所以使用了一些既不优雅但hack的方法。

### 分析

HTML`meta`标签中，当设置标签name为`viewport`时候，可以手动设置缩放的最大最小和禁止手势缩放。

```js
  content: {
    initial-scale: '初始的缩放比例 一般为1',
    minimum-scale: '表示最小的缩放比例',
    maximum-scale: '最大的缩放比例',
    user-scalable: 'yes / no 是否可以手动缩放'
  }
```

所以具体来说，大概就是......

进入这个route的时候，手动设置缩放权限，而route销毁的时候则自动还原。
由于使用了react,则能够很方便的利用它的生命周期了。


### 上代码

```js
class Index extends React.Component {
  componentWillMount() {
    if (this.context.isMobile) {
      this.metaContent = document
        .querySelector('meta[name=viewport]')
        .content;
    }
  }

  componentDidMount() {
    if (this.context.isMobile) {
      const content = this.metaContent;
      const newContent = content
        .replace(/maximum-scale=(\d*(\.\d*)?),/g, 'maximum-scale=10,')
        .replace(/user-scalable=no/g, 'user-scalable=yes');
      document
        .querySelector('meta[name=viewport]')
        .content = newContent;
    }
  }

  componentWillUnmount() {
    if (this.context.isMobile) {
      document
        .querySelector('meta[name=viewport]')
        .content = this.metaContent;
    }
  }
}
```

1. 在页面开始mount时，手动获取未改变的content内容，这里使用了`document.querySelector('meta[name=viewport]').content;`

2. 在页面挂载完毕之后，手动改变meta的内容

3. 在页面写在时，主动还原为willMount存的meta的content值

完毕(*^__^*)
