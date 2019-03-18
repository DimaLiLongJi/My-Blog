import('./a').then(({ count, add }) => {
  console.log(count) //0
  add();
  onsole.log(count)//1
})