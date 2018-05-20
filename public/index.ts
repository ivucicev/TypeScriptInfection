class Tile {

    public color;

    private _color: Color;
    private _x: number;
    private _y: number;
    private _infected: boolean = false;

    constructor(x: number, y: number, color: Color) {
        this._x = x;
        this._y = y;
        this._color = color;
    }

    public getColor = () : Color => {
        return this._color;
    }

    public setColor = (color: Color) : void => {
        this._color = color;
        this.color = Color[this._color];
    }

    public setInfected = () : void  => {
        this._infected = true;
    }

    public isInfected = () : boolean => {
        return this._infected;
    }

}

enum Color {
    Red = 1,
    Blue,
    Green,
    Yellow,
    Orange,
    Pink,
    Brown,
    Purple,
    Black
}

const levels: Array<ILevel> = [
    { timeLimit: 60, movesLimit: 20, boardSize: 24, hardness: 8, number: 15}
];

interface ILevel {
    boardSize: number;
    hardness: number;
    number: number;
    movesLimit: number | null;
    timeLimit: number | null;
}

class Game {

    public time: number = 0;
    public level: number = 0;
    public moves: number = -1;

    private WIDTH: number = 0;
    private HEIGHT: number = 0;
    private HARDNESS: number = 0;
    private BOARD_SIZE: number = 0;
    private TILE_SIZE_X: number = 0;
    private TILE_SIZE_Y: number = 0;

    private _timeEl: HTMLElement;
    private _movesEl: HTMLElement;
    private _headerEl: HTMLElement;

    private _board: Tile[][] = [];
    private _currentLevel: ILevel;
    private _selectedColor: Color;

    private _interval;
    private _timeout;

    private readonly _canvas: HTMLCanvasElement = document.getElementById("game") as HTMLCanvasElement;
    private readonly _ctx: CanvasRenderingContext2D = this._canvas.getContext("2d");

    // resizing window
    private resizeThrottled: boolean = false;
    private resizeDelay: number = 300;

    constructor(level) {
        this.init(level);
    }

    private init(level: number) {
        this.setLevel(level);
        this.randomizeTiles();
        this.resize();
        this.bindEvents();
        this.draw();
        this.setHeader();
        this.step();
    }

    private setLevel = (level: number): void => {
        this._currentLevel = levels[level];
        this.HARDNESS = this._currentLevel.hardness;
        this.BOARD_SIZE = this._currentLevel.boardSize;
    }

    private setHeader = (): void => {
        this._timeEl = document.getElementById("time");
        this._movesEl = document.getElementById("moves");
        this.updateMoves();
    }

    private randomizeTiles = (): void => {
        let tempArr: Tile[] = [];
        for (let x: number = 0; x < this.BOARD_SIZE; x++) {
            tempArr = [];
            for (let y: number = 0; y < this.BOARD_SIZE; y++) {
                tempArr.push(new Tile(x, y, this.getRandomColor()));
            }
            this._board.push(tempArr);
        }
        // color at position 0,0 should be different from any surrounding color
        let color: Color = this._board[0][0].getColor();
        do {
            color = this.getRandomColor();
        } while(color === this._board[1][0].getColor() || color === this._board[0][1].getColor());
        this._board[0][0].setColor(color);
        this._board[0][0].setInfected();
    }

    private windowResizeEvent = () => {
        if (!this.resizeThrottled) {
            this.resize();
            this.resizeThrottled = true;
            setTimeout(() => {
                this.resizeThrottled = false;
            }, this.resizeDelay);
        }
    }

    private bindEvents = (): void => {
        window.addEventListener("resize", this.windowResizeEvent);
        const buttons: HTMLCollectionOf<Element> = document.getElementsByClassName("button");
        for (let i: number = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", this.clickEvent);
        }
    }

    private clickEvent = (e: Event): void => {
        e.stopImmediatePropagation();
        this._selectedColor = Number((e as any).target.dataset.color) as Color;
        const color: Color = this._board[0][0].getColor();
        if (color === this._selectedColor) {
            return;
        }
        this.infect(0, 0, color);
        this.updateMoves();
        this.draw();
        // check if completed
        if (this.isCompleted()) {
            alert("All tiles are infected");
        }
    }

    private resize = (): void => {
        this.calculateGameWidth();
        this.calculateTileSize();
        this.draw();
    }

    private calculateGameWidth = (): void => {
        if (screen.height >= screen.width) {
            this.HEIGHT = this.WIDTH = 0.8 * screen.width;
        } else {
            this.HEIGHT = this.WIDTH = 0.4 * screen.height;
        }
        this._canvas.width = this.WIDTH;
        this._canvas.height = this.HEIGHT;
    }

    private calculateTileSize = (): void => {
        this.TILE_SIZE_X = Math.floor(this._canvas.width / this._currentLevel.boardSize);
        this.TILE_SIZE_Y = Math.floor(this._canvas.height / this._currentLevel.boardSize);
    }

    private getRandomColor = (): Color => {
        return (Math.round(Math.random() * (this._currentLevel.hardness - 1) + 1)) as Color;
    }

    private getColorFromColorCode = (color: Color): string => {
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
    }

    private updateMoves = (): void => {
        this.moves++;
        this._movesEl.innerHTML = this.moves + "";
    }

    private updateTimer = (): void => {
        this.time++;
        this._timeEl.innerHTML = this.time + "";
    }

    private infect = (x: number, y: number, color, adjecent = false): void => {
        this._board[x][y].setColor(this._selectedColor);
        this._board[x][y].setInfected();
        if (y < (this.BOARD_SIZE - 1) && this._board[x][y + 1].getColor() === color && !adjecent) {
            this.infect(x, y + 1, color, false);
        } else if (y < (this.BOARD_SIZE - 1) && this._board[x][y + 1].getColor() === this._selectedColor && !this._board[x][y + 1].isInfected()) {
            this.infect(x, y + 1, color, true);
        }
        if (y > 0 && this._board[x][y - 1].getColor() === color && !adjecent) {
            this.infect(x, y - 1, color, false);
        } else if (y > 0 && this._board[x][y - 1].getColor() === this._selectedColor && !this._board[x][y - 1].isInfected()) {
            this.infect(x, y - 1, color, true);
        }
        if (x < (this.BOARD_SIZE - 1) && this._board[x + 1][y].getColor() === color && !adjecent) {
            this.infect(x + 1, y, color, false);
        } else if (x < (this.BOARD_SIZE - 1) && this._board[x + 1][y].getColor() === this._selectedColor && !this._board[x + 1][y].isInfected()) {
            this.infect(x + 1, y, color, true);
        }
        if (x > 0 && this._board[x - 1][y].getColor() === color && !adjecent) {
            this.infect(x - 1, y, color, false);
        } else if (x > 0 && this._board[x - 1][y].getColor() === this._selectedColor && !this._board[x - 1][y].isInfected()) {
            this.infect(x - 1, y, color, true);
        }
    }

    private isCompleted = (): boolean => {
        for(let x:number = 0; x < this.BOARD_SIZE; x++) {
            for(let y: number = 0; y < this.BOARD_SIZE; y++) {
                if (!this._board[x][y].isInfected()) {
                    return false;
                }
            }
        }
        return true;
    }

    private drawTile = (x: number, y: number, color: Color): void => {
        this._ctx.fillStyle = this._board[x][y].isInfected() ? "#2b2b2b" : this.getColorFromColorCode(color);
        this._ctx.fillRect(x * this.TILE_SIZE_X, y * this.TILE_SIZE_Y, this.TILE_SIZE_X, this.TILE_SIZE_Y);
    }

    private draw = (): void => {
        for (let x: number = 0; x < this.BOARD_SIZE; x++) {
            for (let y: number = 0; y < this.BOARD_SIZE; y++) {
                this.drawTile(x, y, this._board[x][y].getColor());
            }
        }
    }

    private step = () => {
        clearInterval(this._interval);
        this.updateTimer();
        this._interval = setInterval(this.step, 1000);
    }

    private restart = () => {
        window.location.reload();
    }

}

var g: Game;
window.addEventListener("load", () => {
    g = new Game(0);
});

