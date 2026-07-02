import { Board } from "./Board";
import { ERROR_LIMIT } from "./constants";
import { Solver, type CellPosition } from "./Solver";

type GameStatus = "playing" | "won" | "lost";

type Cell = CellPosition & {
  value: number;
};

type Move = {
  correct: boolean;
  errors: number;
  status: GameStatus;
};

export class Game {
  private solver: Solver;
  public board: Board;
  public solution: Board;
  public status: GameStatus;
  public errors: number;
  public history: Cell[];

  constructor() {
    this.solver = new Solver();
    const { solution, puzzle } = this.solver.generatePuzzle();
    this.board = puzzle;
    this.solution = solution;
    this.status = "playing";
    this.errors = 0;
    this.history = [];
  }

  makeMove(cell: Cell): Move {
    const { col, row, value } = cell;
    let isCorrect: boolean = false;
    const solutionCell = this.solution.grid[row][col];
    const boardCell = this.board.grid[row][col];

    // Toggle: pressing the same number clears the cell
    if (boardCell.value === value) {
      this.history.push({ row, col, value: boardCell.value });
      boardCell.value = 0;
      boardCell.error = false;
      return { correct: false, errors: this.errors, status: this.status };
    }

    this.history.push({
      row,
      col,
      value: boardCell.value,
    });

    if (solutionCell.value === value) {
      isCorrect = true;
      boardCell.value = value;
      this.status = this.solver.isSolved(this.board) ? "won" : "playing";
    } else {
      isCorrect = false;
      boardCell.value = value;
      boardCell.error = true;
      this.errors++;
      this.status = this.errors === ERROR_LIMIT ? "lost" : "playing";
    }

    return {
      correct: isCorrect,
      errors: this.errors,
      status: this.status,
    };
  }

  undoMove() {
    const lastMove = this.history.pop();

    if (!lastMove) return;

    const { col, row, value } = lastMove;

    this.board.grid[row][col].value = value;
    this.board.grid[row][col].error = false;
  }
}
