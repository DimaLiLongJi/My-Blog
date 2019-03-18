class MyIterator {
  private point: number = 0;
  private params: any[] | Object;
  private keys: any[];
  private length: number;

  constructor(params: any[] | Object) {
    this.params = params;
    this.keys = Object.keys(params);
    this.length = this.keys.length;
  }

  public next() {
    const done = this.point >= this.length;
    const value = done? undefined : this.params[this.keys[this.point]];
    if (!done) this.point++;
    return {
      done,
      value,
    }
  }
}

const iterator = new MyIterator([1,2,3]);

console.log(1, iterator.next());
console.log(2, iterator.next());
console.log(3, iterator.next());
console.log(4, iterator.next());