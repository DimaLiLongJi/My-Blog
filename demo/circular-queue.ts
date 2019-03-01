class CircularQueue {
  queue: any[];
  head: number = -1;
  tail: number = -1;
  size: number = 0;

  constructor(length: number) {
    this.queue = new Array(length);
  }

  enQueue(value: any): boolean {
    if (this.isFull()) return false;
    if (this.isEmpty()) this.head = 0;
    this.tail = (this.tail + 1) % this.queue.length;
    this.queue[this.tail] = value;
    this.size ++;
    return true;
  }

  deQueue(): boolean {
    if (this.isEmpty()) return false;
    if (this.head === this.tail) {
      this.head = -1;
      this.tail = -1;
      this.size --;
      return true;
    }
    this.head = (this.head + 1) % this.queue.length;
    this.size --;
    return true;
  }

  Front(): any {
    return this.isEmpty() ? -1 : this.queue[this.head];
  }

  Rear(): any {
    return this.isEmpty() ? -1 : this.queue[this.tail];
  }

  isEmpty(): boolean {
    return !this.size;
  }

  isFull(): boolean {
    return this.size === this.queue.length;
  }
}


class CircularQueue1 {
  queue: any[];
  head: number = 0;
  tail: number = 0;
  size: number = 0;

  constructor(length: number) {
    this.queue = new Array(length);
  }

  enQueue(value: any): boolean {
    if (this.isFull()) return false;
    if (!this.isEmpty()) {
      if (this.tail === this.queue.length - 1) this.tail = 0;
      else this.tail ++;
    }
    this.queue[this.tail] = value;
    this.size ++;
    return true;
  }

  deQueue(): boolean {
    if (this.isEmpty()) return false;
    this.queue[this.head] = null;
    this.size --;
    if (this.head === this.queue.length - 1) this.head = 0;
    else if (this.head !== this.tail) this.head ++;
    return true;
  }

  Front(): any {
    return this.isEmpty() ? -1 : this.queue[this.head];
  }

  Rear(): any {
    return this.isEmpty() ? -1 : this.queue[this.tail];
  }

  isEmpty(): boolean {
    return !this.size;
  }

  isFull(): boolean {
    return this.size === this.queue.length;
  }
}
