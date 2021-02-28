var debug = false;
var board;

// TODO: improve game appearance

function preload() {
    let style = Board.style;

    // Light theme
    //style.tileBlack = [228, 187, 151, 255];
    //style.tileWhite = [254, 245, 239, 255];
    // Dark theme
    style.tileBlack = [77, 99, 106, 255];
    style.tileWhite = [94, 122, 130, 255];

    // loadImage is async
    style.pieceSprite = loadImage("./media/pieces.png", () => {
        board = new Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", style);
    });
}

function setup() {
    let sz = Utils.getRes(1 / 1, 0.75)
    let canvas = createCanvas(sz.x, sz.y);
    canvas.parent("#canvas-container");

    translate(0, 0);
}

// Previous x and y
var mouse = {
    "down": false,
    "pX": 0,
    "pY": 0,
}

var selected = {
    "x": 0,
    "y": 0,
    "piece": null
}

// debug only for now
var moves = [];

function draw() {
    // Draw board tiles
    image(board.tileImage, 0, 0, width, height);

    let sz = board.style.size;
    let tileWidth = min(width, height) / sz;

    if (board.isInCheck.white || board.isInCheck.black) {
        let side = board.currentTurn == Piece.sides.white ? Piece.sides.white : Piece.sides.black;
        let kingPos = board.getPiecePos(Piece.types.king, side)[0];
        //fill([150, 50, 0, 170]);
        fill([0, 0, 0, 0]);
        stroke([255, 40, 40, 255]);
        strokeCap(ROUND);
        strokeWeight(2);
        square(kingPos.x * tileWidth + 4, kingPos.y * tileWidth + 4, tileWidth - 8);

        // let center = tileWidth / 2;
        // circle(kingPos.x * tileWidth + center, kingPos.y * tileWidth + center, tileWidth);
    }

    for (let y = 0; y < sz; y++) {
        for (let x = 0; x < sz; x++) {
            let pos = { "x": x * width / sz, "y": y * height / sz };
            let piece = board.tiles[y][x];

            if (piece.type != Piece.types.empty) {
                if (piece != selected.piece) {
                    image(piece.image, pos.x, pos.y, tileWidth, tileWidth);
                }
            }

            noStroke();

            if (debug) {
                // Show square numbers
                textAlign(LEFT, TOP);
                fill([130, 130, 130, 255]);
                textSize(width / 40);
                text(String(x + y * sz), pos.x + 4, pos.y + 4);
            }
        }
    }

    if (debug) {
        if (mouse.down) {
            noStroke();
            fill([0, 0, 255, 60]);
            square(selected.x * tileWidth, selected.y * tileWidth, tileWidth);

            let coords = Utils.getCoords(mouseX, mouseY, width, sz);

            fill([0, 255, 0, 60]);
            square(coords.x * tileWidth, coords.y * tileWidth, tileWidth);

            stroke(0);
            fill([0, 0, 255, 60]);
            circle(mouse.pX, mouse.pY, width / 20);

            fill([0, 255, 0, 60]);
            circle(mouseX, mouseY, width / 20);
        }
    }

    noStroke();
    for (const move of moves) {
        let x = move % 8;
        let y = (move - (move % 8)) / 8;
        fill([150, 150, 150, 255]);
        let center = tileWidth / 2;
        circle(x * tileWidth + center, y * tileWidth + center, tileWidth / 6);
    }

    if (mouse.down && selected.piece.type != Piece.types.empty) {
        imageMode(CENTER);
        image(selected.piece.image, mouseX, mouseY, tileWidth, tileWidth);
        imageMode(CORNER);
    }
}

function mousePressed() {
    if (mouseX > width || mouseY > height) return;
    if (mouseX < 0 || mouseY < 0) return;

    mouse.down = true;
    mouse.pX = mouseX;
    mouse.pY = mouseY;

    let sz = board.style.size;
    selected = Utils.getCoords(mouseX, mouseY, width, sz);
    selected.piece = board.tiles[selected.y][selected.x];

    moves = board.listMovesLegal(selected.piece, { "x": selected.x, "y": selected.y });

    return;
}

function mouseReleased() {
    mouse.down = false;

    if (mouseX > width || mouseY > height) {
        selected.piece = null;
        return;
    }
    if (mouseX < 0 || mouseY < 0) {
        selected.piece = null;
        return;
    }

    if (selected.piece.type != Piece.types.empty) {
        let sz = board.style.size;
        let hovering = { "x": 0, "y": 0, "piece": null };
        hovering.x = Math.floor(mouseX * sz / width) % sz;
        hovering.y = Math.floor(mouseY * sz / width) % sz;
        hovering.piece = board.tiles[hovering.y][hovering.x];
        if (hovering.x != selected.x || hovering.y != selected.y) {
            let move = board.validateMove(selected, hovering);
            if (move) {
                moves = [];
                // Current turn is not the previous turn (wow)
                let moveColor = board.currentTurn == Piece.sides.white ? "m-black" : "m-white";
                document.getElementById("debug-text").innerHTML += "<span class=\"" + moveColor + "\">" + move + "</span> ";
                if (debug) {
                    // TODO: implement capturing and check notation
                    let fenString = board.writeFen();
                    console.log(move);
                    console.log(fenString);
                }
            }
        }
    }

    selected.piece = null;

    return;
}

function windowResized() {
    let sz = Utils.getRes(1 / 1, 0.75);
    resizeCanvas(sz.x, sz.y);
}