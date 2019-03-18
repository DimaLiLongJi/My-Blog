function* generator() {
  yield 1
  yield 2
  return 3
}
const myIterator = generator()
// 当调用iterator的next方法时，函数体开始执行，
myIterator.next() // {value: 1, done: false}
myIterator.next() // {value: 2, done: false}
myIterator.next() // {value: 3, done: true}
