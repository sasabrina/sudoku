export class Cell {
  public value: number;
  public fixed: boolean;
  public pencilMarks: Set<number>;
  public error: boolean;

  constructor(value: number, isFixed: boolean) {
    this.value = value;
    this.fixed = isFixed;
    this.pencilMarks = new Set();
    this.error = false;
  }
}
