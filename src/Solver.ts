import { Board } from "./Board";
import { GRID_SIZE } from "./constants";

export type CellPosition = {
  row: number;
  col: number;
};

export type Puzzle = {
  solution: Board;
  puzzle: Board;
};

export class Solver {
  solve(board: Board): boolean {
    const emptyCell = this.findEmpty(board);

    if (emptyCell === null) return true;

    const randomGrid = this.randomize(
      Array.from({ length: GRID_SIZE }, (_, i) => i + 1),
    );

    for (let i of randomGrid) {
      const { row, col } = emptyCell;

      if (board.isCellValid(i, row, col)) {
        board.grid[row][col].value = i;

        if (this.solve(board)) {
          return true;
        } else {
          board.grid[row][col].value = 0;
        }
      }
    }

    return false;
  }

  private findEmpty(board: Board): CellPosition | null {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board.grid[i][j].value === 0 || !board.grid[i][j].value) {
          return {
            row: i,
            col: j,
          };
        }
      }
    }

    return null;
  }

  private randomize(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      // i inicia con el valor del último elemento de array, y se va restando hasta llegar a 0
      const j: number = Math.floor(Math.random() * (i + 1)); // se genera un index random que sea igual o mayor que, e igual o menor que i
      [array[i], array[j]] = [array[j], array[i]]; //se cambian los elementos en array
    }

    return array;
  }

  generatePuzzle(): Puzzle {
    const board = new Board();

    this.solve(board);

    const clone = board.clone();

    for (let i = 0; i < 40; ) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);

      if (clone.grid[row][col].value !== 0) {
        clone.grid[row][col].value = 0;
        i++;
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (clone.grid[r][c].value !== 0) {
          clone.grid[r][c].fixed = true;
        }
      }
    }

    return { solution: board, puzzle: clone };
  }

  isSolved(board: Board): boolean {
    const isEmpty = this.findEmpty(board);
    return !isEmpty;
  }
}
