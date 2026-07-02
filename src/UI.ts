import { Game } from "./Game";
import { ERROR_LIMIT, GRID_SIZE } from "./constants";

export class UI {
  private game: Game;
  private selectedRow: number | null = null;
  private selectedCol: number | null = null;
  private timerInterval: number | null = null;
  private seconds: number = 0;
  private paused: boolean = false;

  private $grid = document.getElementById("grid")!;
  private $errorsDisplay = document.getElementById("errors-display")!;
  private $timer = document.getElementById("timer")!;
  private $overlay = document.getElementById("overlay")!;
  private $overlayTitle = document.getElementById("overlay-title")!;
  private $overlayMsg = document.getElementById("overlay-msg")!;
  private $overlayBtn = document.getElementById("overlay-btn")!;
  private $announcer = document.getElementById("announcer")!;
  private $pauseBtn = document.getElementById("btn-pause")!;

  constructor(game: Game) {
    this.game = game;
  }

  init() {
    this.buildGrid();
    this.bindNumpad();
    this.bindControls();
    this.bindKeyboard();
    this.startTimer();
    this.render();
  }

  // Build the 81 cell divs once
  private buildGrid() {
    this.$grid.innerHTML = "";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("tabindex", r === 0 && c === 0 ? "0" : "-1");
        cell.addEventListener("click", () => this.onCellClick(r, c));
        this.$grid.appendChild(cell);
      }
    }
  }

  // Re-render the entire board state
  render() {
    const { board } = this.game;

    // Compute highlighted cells (same row, col, box as selected)
    const highlighted = new Set<string>();
    if (this.selectedRow !== null && this.selectedCol !== null) {
      const sr = this.selectedRow;
      const sc = this.selectedCol;
      const boxR = Math.floor(sr / 3) * 3;
      const boxC = Math.floor(sc / 3) * 3;
      for (let i = 0; i < GRID_SIZE; i++) {
        highlighted.add(`${sr}-${i}`);
        highlighted.add(`${i}-${sc}`);
      }
      for (let r = boxR; r < boxR + 3; r++) {
        for (let c = boxC; c < boxC + 3; c++) {
          highlighted.add(`${r}-${c}`);
        }
      }
    }

    const selectedValue =
      this.selectedRow !== null && this.selectedCol !== null
        ? board.grid[this.selectedRow][this.selectedCol].value
        : 0;

    document.querySelectorAll<HTMLElement>(".cell").forEach((el) => {
      const r = Number(el.dataset.row);
      const c = Number(el.dataset.col);
      const cell = board.grid[r][c];

      el.className = "cell";
      if (cell.fixed) el.classList.add("given");
      if (cell.error) el.classList.add("error");
      if (r === this.selectedRow && c === this.selectedCol) {
        el.classList.add("selected");
      } else if (highlighted.has(`${r}-${c}`)) {
        el.classList.add("highlighted");
      }
      if (selectedValue !== 0 && cell.value === selectedValue) {
        el.classList.add("same-number");
      }

      el.textContent = cell.value !== 0 ? String(cell.value) : "";

      // Keep tabindex in sync with selected cell
      el.setAttribute(
        "tabindex",
        r === this.selectedRow && c === this.selectedCol ? "0" : "-1",
      );

      // Describe cell for screen readers
      const row = r + 1,
        col = c + 1;
      const valueDesc = cell.value !== 0 ? `${cell.value}` : "vacía";
      const stateDesc = cell.fixed
        ? ", dada"
        : cell.error
          ? ", incorrecta"
          : "";
      el.setAttribute(
        "aria-label",
        `Fila ${row}, columna ${col}: ${valueDesc}${stateDesc}`,
      );
      el.setAttribute(
        "aria-selected",
        String(r === this.selectedRow && c === this.selectedCol),
      );
    });

    // Errors display
    this.$errorsDisplay.textContent = `Errores: ${this.game.errors}/${ERROR_LIMIT}`;
    this.$errorsDisplay.setAttribute(
      "aria-label",
      `Errores: ${this.game.errors} de ${ERROR_LIMIT}`,
    );

    // Disable numpad buttons for completed numbers
    const counts = new Array(10).fill(0);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const v = this.game.board.grid[r][c].value;
        if (v !== 0) counts[v]++;
      }
    }
    document.querySelectorAll<HTMLButtonElement>(".num-btn").forEach((btn) => {
      const num = Number(btn.dataset.num);
      const complete = counts[num] >= GRID_SIZE;
      btn.disabled = complete;
      btn.classList.toggle("completed", complete);
    });
  }

  private togglePause() {
    if (this.game.status !== "playing") return;
    this.paused = !this.paused;

    if (this.paused) {
      this.stopTimer();
      this.$grid.classList.add("paused");
      this.$pauseBtn.textContent = "▶️";
      this.$pauseBtn.setAttribute("aria-label", "Reanudar partida");
      this.$pauseBtn.setAttribute("aria-pressed", "true");
    } else {
      this.startTimer();
      this.$grid.classList.remove("paused");
      this.$pauseBtn.textContent = "⏸️";
      this.$pauseBtn.setAttribute("aria-label", "Pausar partida");
      this.$pauseBtn.setAttribute("aria-pressed", "false");
    }
  }

  private onCellClick(row: number, col: number) {
    if (this.game.status !== "playing" || this.paused) return;
    this.selectedRow = row;
    this.selectedCol = col;
    this.render();
  }

  private bindNumpad() {
    document.querySelectorAll<HTMLButtonElement>(".num-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.enterNumber(Number(btn.dataset.num));
      });
    });
  }

  private bindControls() {
    document.getElementById("btn-undo")!.addEventListener("click", () => {
      this.game.undoMove();
      this.render();
    });

    document.getElementById("btn-pause")!.addEventListener("click", () => {
      this.togglePause();
    });

    document.getElementById("btn-new-game")!.addEventListener("click", () => {
      this.newGame();
    });

    this.$overlayBtn.addEventListener("click", () => {
      this.$overlay.classList.add("hidden");
      this.newGame();
    });
  }

  private bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (this.game.status !== "playing" || this.paused) return;

      if (/^[1-9]$/.test(e.key)) {
        this.enterNumber(Number(e.key));
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        this.game.undoMove();
        this.render();
      }

      // Arrow key navigation
      if (this.selectedRow !== null && this.selectedCol !== null) {
        const moves: Record<string, [number, number]> = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        };
        if (moves[e.key]) {
          e.preventDefault();
          const [dr, dc] = moves[e.key];
          this.selectedRow = Math.max(0, Math.min(8, this.selectedRow + dr));
          this.selectedCol = Math.max(0, Math.min(8, this.selectedCol + dc));
          this.render();
        }
      }
    });
  }

  private enterNumber(num: number) {
    if (this.selectedRow === null || this.selectedCol === null) return;
    const cell = this.game.board.grid[this.selectedRow][this.selectedCol];
    if (cell.fixed) return;

    const result = this.game.makeMove({
      row: this.selectedRow,
      col: this.selectedCol,
      value: num,
    });

    this.render();

    if (result.status === "won") {
      this.stopTimer();
      this.announce("¡Ganaste!");
      this.showOverlay("¡Ganaste! 🎉", `Tiempo: ${this.$timer.textContent}`);
    } else if (result.status === "lost") {
      this.stopTimer();
      this.announce("Juego terminado. Demasiados errores.");
      this.showOverlay(
        "Game Over 😞",
        "Demasiados errores. ¡Intentalo de nuevo!",
      );
    } else if (!result.correct) {
      this.announce(
        `Número incorrecto. Errores: ${result.errors} de ${ERROR_LIMIT}`,
      );
    }
  }

  private newGame() {
    this.selectedRow = null;
    this.selectedCol = null;
    this.game = new Game();
    this.seconds = 0;
    this.$timer.textContent = '00:00';
    this.startTimer();
    this.render();
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.seconds++;
      const m = String(Math.floor(this.seconds / 60)).padStart(2, "0");
      const s = String(this.seconds % 60).padStart(2, "0");
      this.$timer.textContent = `${m}:${s}`;
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private announce(msg: string) {
    this.$announcer.textContent = "";
    requestAnimationFrame(() => {
      this.$announcer.textContent = msg;
    });
  }

  private showOverlay(title: string, msg: string) {
    this.$overlayTitle.textContent = title;
    this.$overlayMsg.textContent = msg;
    this.$overlay.classList.remove("hidden");
  }
}
