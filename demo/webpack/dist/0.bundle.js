(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./a.js":
/*!**************!*\
  !*** ./a.js ***!
  \**************/
/*! exports provided: count, add */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"count\", function() { return count; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"add\", function() { return add; });\nlet count = 0;//输出的是值的引用，指向同一块内存\nconst add = ()=>{\n    count++;//此时引用指向的内存值发生改变\n}\n\n\n//# sourceURL=webpack:///./a.js?");

/***/ })

}]);