export let count = 0;//输出的是值的引用，指向同一块内存
export const add = ()=>{
    count++;//此时引用指向的内存值发生改变
}
