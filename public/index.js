class Tile {
    constructor(x, y, color) {
        this._infected = false;
        this.getColor = () => {
            return this._color;
        };
        this.setColor = (color) => {
            this._color = color;
            this.color = Color[this._color];
        };
        this.setInfected = () => {
            this._infected = true;
        };
        this.isInfected = () => {
            return this._infected;
        };
        this._x = x;
        this._y = y;
        this._color = color;
    }
}
var Color;
(function (Color) {
    Color[Color["Red"] = 1] = "Red";
    Color[Color["Blue"] = 2] = "Blue";
    Color[Color["Green"] = 3] = "Green";
    Color[Color["Yellow"] = 4] = "Yellow";
    Color[Color["Orange"] = 5] = "Orange";
    Color[Color["Pink"] = 6] = "Pink";
    Color[Color["Brown"] = 7] = "Brown";
    Color[Color["Purple"] = 8] = "Purple";
    Color[Color["Black"] = 9] = "Black";
})(Color || (Color = {}));
const levels = [
    { timeLimit: 60, movesLimit: 20, boardSize: 24, hardness: 8, number: 15 }
];
class Game {
    constructor(level) {
        this.time = 0;
        this.level = 0;
        this.moves = -1;
        this.WIDTH = 0;
        this.HEIGHT = 0;
        this.HARDNESS = 0;
        this.BOARD_SIZE = 0;
        this.TILE_SIZE_X = 0;
        this.TILE_SIZE_Y = 0;
        this._board = [];
        this._canvas = document.getElementById("game");
        this._ctx = this._canvas.getContext("2d");
        // resizing window
        this.resizeThrottled = false;
        this.resizeDelay = 300;
        this.setLevel = (level) => {
            this._currentLevel = levels[level];
            this.HARDNESS = this._currentLevel.hardness;
            this.BOARD_SIZE = this._currentLevel.boardSize;
        };
        this.setHeader = () => {
            this._timeEl = document.getElementById("time");
            this._movesEl = document.getElementById("moves");
            this.updateMoves();
        };
        this.randomizeTiles = () => {
            let tempArr = [];
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                tempArr = [];
                for (let y = 0; y < this.BOARD_SIZE; y++) {
                    tempArr.push(new Tile(x, y, this.getRandomColor()));
                }
                this._board.push(tempArr);
            }
            // color at position 0,0 should be different from any surrounding color
            let color = this._board[0][0].getColor();
            do {
                color = this.getRandomColor();
            } while (color === this._board[1][0].getColor() || color === this._board[0][1].getColor());
            this._board[0][0].setColor(color);
            this._board[0][0].setInfected();
        };
        this.windowResizeEvent = () => {
            if (!this.resizeThrottled) {
                this.resize();
                this.resizeThrottled = true;
                setTimeout(() => {
                    this.resizeThrottled = false;
                }, this.resizeDelay);
            }
        };
        this.bindEvents = () => {
            window.addEventListener("resize", this.windowResizeEvent);
            const buttons = document.getElementsByClassName("button");
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener("click", this.clickEvent);
            }
        };
        this.clickEvent = (e) => {
            e.stopImmediatePropagation();
            this._selectedColor = Number(e.target.dataset.color);
            const color = this._board[0][0].getColor();
            if (color === this._selectedColor) {
                return;
            }
            this.infect(0, 0, color);
            this.updateMoves();
            this.draw();
            // check if completed
            if (this.isCompleted()) {
                clearInterval(this._interval);
                alert(`All tiles are infected. Time: ${this.time}, Moves: ${this.moves}`);
                const bestTime = parseInt(localStorage.getItem("best-time") || "78");
                const bestMoves = parseInt(localStorage.getItem("best-moves") || "128");
                if (this.moves < bestMoves)
                    localStorage.setItem("best-moves", String(this.moves));
                if (this.time < bestTime)
                    localStorage.setItem("best-time", String(this.time));
                this.restart();
            }
        };
        this.resize = () => {
            this.calculateGameWidth();
            this.calculateTileSize();
            this.draw();
        };
        this.calculateGameWidth = () => {
            if (screen.height >= screen.width) {
                this.HEIGHT = this.WIDTH = 0.8 * screen.width;
            }
            else {
                this.HEIGHT = this.WIDTH = 0.4 * screen.height;
            }
            this._canvas.width = this.WIDTH;
            this._canvas.height = this.HEIGHT;
        };
        this.calculateTileSize = () => {
            this.TILE_SIZE_X = Math.floor(this._canvas.width / this._currentLevel.boardSize);
            this.TILE_SIZE_Y = Math.floor(this._canvas.height / this._currentLevel.boardSize);
        };
        this.getRandomColor = () => {
            return (Math.round(Math.random() * (this._currentLevel.hardness - 1) + 1));
        };
        this.getColorFromColorCode = (color) => {
            switch (color) {
                case Color.Red:
                    return "#d75a2e";
                case Color.Blue:
                    return "#4fb2db";
                case Color.Green:
                    return "#8eab2d";
                case Color.Yellow:
                    return "#f0ea30";
                case Color.Orange:
                    return "#edba62";
                case Color.Pink:
                    return "#e27fad";
                case Color.Brown:
                    return "#704545";
                case Color.Purple:
                    return "#6b68ad";
                default:
                    return "#000000";
            }
        };
        this.updateMoves = () => {
            this.moves++;
            this._movesEl.innerHTML = this.moves + "";
        };
        this.updateTimer = () => {
            this.time++;
            this._timeEl.innerHTML = this.time + "";
        };
        this.infect = (x, y, color, adjecent = false) => {
            this._board[x][y].setColor(this._selectedColor);
            this._board[x][y].setInfected();
            if (y < (this.BOARD_SIZE - 1) && this._board[x][y + 1].getColor() === color && !adjecent) {
                this.infect(x, y + 1, color, false);
            }
            else if (y < (this.BOARD_SIZE - 1) && this._board[x][y + 1].getColor() === this._selectedColor && !this._board[x][y + 1].isInfected()) {
                this.infect(x, y + 1, color, true);
            }
            if (y > 0 && this._board[x][y - 1].getColor() === color && !adjecent) {
                this.infect(x, y - 1, color, false);
            }
            else if (y > 0 && this._board[x][y - 1].getColor() === this._selectedColor && !this._board[x][y - 1].isInfected()) {
                this.infect(x, y - 1, color, true);
            }
            if (x < (this.BOARD_SIZE - 1) && this._board[x + 1][y].getColor() === color && !adjecent) {
                this.infect(x + 1, y, color, false);
            }
            else if (x < (this.BOARD_SIZE - 1) && this._board[x + 1][y].getColor() === this._selectedColor && !this._board[x + 1][y].isInfected()) {
                this.infect(x + 1, y, color, true);
            }
            if (x > 0 && this._board[x - 1][y].getColor() === color && !adjecent) {
                this.infect(x - 1, y, color, false);
            }
            else if (x > 0 && this._board[x - 1][y].getColor() === this._selectedColor && !this._board[x - 1][y].isInfected()) {
                this.infect(x - 1, y, color, true);
            }
        };
        this.isCompleted = () => {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                for (let y = 0; y < this.BOARD_SIZE; y++) {
                    if (!this._board[x][y].isInfected()) {
                        return false;
                    }
                }
            }
            return true;
        };
        this.drawTile = (x, y, color) => {
            this._ctx.fillStyle = this._board[x][y].isInfected() ? "#2b2b2b" : this.getColorFromColorCode(color);
            this._ctx.fillRect(x * this.TILE_SIZE_X, y * this.TILE_SIZE_Y, this.TILE_SIZE_X, this.TILE_SIZE_Y);
        };
        this.draw = () => {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                for (let y = 0; y < this.BOARD_SIZE; y++) {
                    this.drawTile(x, y, this._board[x][y].getColor());
                }
            }
        };
        this.step = () => {
            clearInterval(this._interval);
            this.updateTimer();
            this._interval = setInterval(this.step, 1000);
        };
        this.restart = () => {
            window.location.reload();
        };
        this.init(level);
    }
    init(level) {
        this.setScores();
        this.setLevel(level);
        this.randomizeTiles();
        this.resize();
        this.bindEvents();
        this.draw();
        this.setHeader();
        this.step();
    }
    setScores() {
        const timeScore = document.getElementById("best-time");
        const moveScore = document.getElementById("best-moves");
        timeScore.innerHTML = localStorage.getItem("best-time") || "78";
        moveScore.innerHTML = localStorage.getItem("best-moves") || "128";
    }
}
var g;
window.addEventListener("load", () => {
    g = new Game(0);
});
