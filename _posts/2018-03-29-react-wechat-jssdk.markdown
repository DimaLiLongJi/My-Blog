---
layout: post
title: 搞一下微信jssdk的使用
subtitle: 主要用于react v16
date: 2018-03-29T00:00:00.000Z
author: 本人
header-img: img/2018/03/wechat.jpeg
tags:
  - 前端开发
  - JavaScript
  - 微信开发
---

公司的项目，中多处需要分享解锁或是分享新人拉新，所以这次被微信的jssdk折磨得不小。这次就总结了下所有的hack用法

# 问题总结

其实，微信jssdk的问题不少，从浏览器到手机型号都有，下面粗略的总结了下这次遇到的坑。

1. SPA中wx.config失败
2. 部分国产安卓手机，微信打开扫码和分享失败
3. 重复config，导致部分页面无法使用微信的功能

具体来说，大概就是......

微信有bug,安卓手机有问题.....


## 解决

啊，其实这个很多原因。SPA route改变，需要重新config,但是同一个url只能config一次，所以就会造成页面config失败了。

1. 在`componentWillReceiveProps`生命周期中，根据route改变重新configWX
2. 在`configWX`中根据`location.href`判断是否需要更新，并且将更新的func改为异步执行，间隔200毫秒
3. 在具体执行confing的地方，先把事先需要的所有微信调用事件写入`config.jsApiList`
4. 再搞一个数组存储已经config的页面，判断`configedUrlList.indexOf(link)`是不是为-1，**啊其实就是判断是否重复config**
5. angularJs的route 里面有'#', 需要对location做整理`location.href.split('#')[0]`

```javascript
// 在生命周期中，根据route改变重新configWX
componentWillReceiveProps(nextProps) {
  if (nextProps.location) this.configWX();
}

// config微信分享的地方
configWX = () => {
  const href = location.href.split('#')[0]; // 不能带#
  setTimeout(() => {
    if (this.configedUrl === href) return;
    if (location.href.split('#')[0] !== href) return;
    const config = {
      link: location.href.split('#')[0],
      title,
      desc,
      imgUrl,
      onSuccess: this.onShareSuccess,
    };
    setWxShareInfo(config);
    this.configedUrl = location.href.split('#')[0];
  }, 200);
}

// 分享成功回调
onShareSuccess = () => {}
```

```javascript
// 定义config过的url数组
let configedUrlList = [];

export function setWxShareInfo(configObject) {
	reConfig();

  // 通过后端拿去config的信息
	function reConfig() {
    // 判断是否config过
		if (configedUrlList.indexOf(link) !== -1) return;
		const xhr = new XMLHttpRequest();
		imgUrl = encodeURI(imgUrl);
		xhr.addEventListener('load', configWX);
		xhr.open('GET', `url`);
		xhr.send();
	}

	function configWX() {
		const config = JSON.parse(this.responseText);
		const htmlReg = /<\/?[^>]*>/g;
    // 所有需要调用的jsApiList
		config.jsApiList = ['onMenuShareAppMessage', 'onMenuShareTimeline', 'scanQRCode'];
		wx.config(config);
		wx.ready(() => {
			configedUrlList.push(link);
			wx.onMenuShareAppMessage({});

			wx.onMenuShareTimeline({});
		});
	}
}
```
