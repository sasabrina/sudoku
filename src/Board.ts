import { Cell } from "./Cell";
import { BOX_SIZE, GRID_SIZE } from "./constants";

export class Board {
  public grid: Array<Array<Cell>>;

  constructor() {
    this.grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => new Cell(0, false)),
    );
  }

  getRow(rowNumber: number): Cell[] {
    return this.grid[rowNumber];
  }

  getColumn(colNumber: number): Cell[] {
    const column: Cell[] = [];

    this.grid.forEach((box) => {
      column.push(box[colNumber]);
    });

    return column;
  }

  getBox(rowNumber: number, colNumber: number): Cell[] {
    const box: Cell[] = [];

    const initRow = Math.floor(rowNumber / BOX_SIZE) * BOX_SIZE;
    const initCol = Math.floor(colNumber / BOX_SIZE) * BOX_SIZE;

    for (let i = initRow; i < initRow + BOX_SIZE; i++) {
      for (let j = initCol; j < initCol + BOX_SIZE; j++) {
        box.push(this.grid[i][j]);
      }
    }

    return box;
  }

  isCellValid(value: number, row: number, col: number): boolean {
    const currentRow = this.getRow(row);
    const currentCol = this.getColumn(col);
    const currentBox = this.getBox(row, col);

    const isValidRow = !currentRow.some((cell) => cell.value === value);
    const isValidCol = !currentCol.some((cell) => cell.value === value);
    const isValidBox = !currentBox.some((cell) => cell.value === value);

    return isValidRow && isValidCol && isValidBox;
  }

  clone() {
    const board = new Board();
    const ogGrid = this.grid;

    for (let i = 0; i < ogGrid.length; i++) {
      for (let j = 0; j < ogGrid.length; j++) {
        board.grid[i][j].value = ogGrid[i][j].value;
      }
    }

    return board;
  }
}
