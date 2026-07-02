import { Game } from './Game';
import { UI } from './UI';

const game = new Game();
const ui = new UI(game);

ui.init();
