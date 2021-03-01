"use strict";

var debug = false;
var board;
var audio = [];
var modalOpen = false;
var curMove; // TODO: allow for drawable arrows in board
// TODO: first piece audio sound is lower than normal
// This is so scuffed damn

function getPromotionPiece() {
  return new Promise(resolve => {
    $("#promotionButton").on("click", () => {
      let proPiece = $("#promotionChoices input:radio:checked").val();

      switch (proPiece.toLowerCase()) {
        case "q":
          resolve(Piece.types.queen);

        case "n":
          resolve(Piece.types.knight);

        case "r":
          resolve(Piece.types.rook);

        case "b":
          resolve(Piece.types.bishop);
      }

      resolve(null);
    });
  });
}

async function promotionHandler() {
  let promotionModal = new bootstrap.Modal(document.getElementById("promotionModal"), {
    keyboard: false,
    backdrop: "static"
  });
  promotionModal.show();
  modalOpen = true;
  let p = await getPromotionPiece();
  modalOpen = false;
  return p;
}

function preload() {
  let style = Board.style; // Light theme

  style.tileBlack = [228, 187, 151, 255];
  style.tileWhite = [254, 245, 239, 255]; // Dark theme

  style.tileBlack = [77, 99, 106, 255];
  style.tileWhite = [94, 122, 130, 255]; // White at bottom

  style.inverted = false;
  style.boardRes = 4096; // loadImage is async

  style.pieceSprite = loadImage("./media/pieces.png", () => {
    board = new Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", style);
    curMove = board.fullmoves;
  }); // Sounds
  // 0 for piece capture
  // 1 for check
  // 2 for game over

  audio[0] = loadSound("./media/move_success.wav");
  audio[1] = loadSound("./media/piece_check.wav");
  audio[2] = loadSound("./media/game_over.wav");

  for (const file of audio) {
    file.setVolume(1.0);
  }
}

function canvasPressed() {
  getAudioContext().resume();
}

function setup() {
  let sz = Utils.getRes(1 / 1, 0.75);
  let ctWidth = $("#canvasContainer").width();

  if (sz.x > ctWidth) {
    sz.x = ctWidth;
    sz.y = ctWidth;
  }

  let canvas = createCanvas(sz.x, sz.y);
  canvas.parent("#canvasContainer");
  translate(0, 0);
} // Previous x and y


var mouse = {
  "down": false,
  "sel": false,
  "pX": 0,
  "pY": 0
};
var selected = {
  "x": 0,
  "y": 0,
  "piece": null
};
var selectedPrev = {
  "x": null,
  "y": null,
  "piece": null
}; // debug only for now

var moves = [];

function draw() {
  // Draw board tiles
  image(board.tileImage, 0, 0, width, height);
  let sz = board.style.size;
  let tileWidth = min(width, height) / sz;

  if (board.isInCheck.white || board.isInCheck.black) {
    let side = board.currentTurn == Piece.sides.white ? Piece.sides.white : Piece.sides.black;
    let kingPos = board.getPiecePos(Piece.types.king, side)[0];
    fill([255, 50, 0, 170]);
    noStroke();
    let center = tileWidth / 2;
    circle(kingPos.x * tileWidth + center, kingPos.y * tileWidth + center, tileWidth - tileWidth / 10);
  }

  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      let pos = {
        "x": x * width / sz,
        "y": y * height / sz
      };
      let piece = board.tiles[y][x]; // let color;
      // Drawing text every frame might be a bit too inefficient...

      if (y == 7) {
        textSize(width * 0.02); // color = x % 2 == 0 ? board.style.tileWhite : board.style.tileBlack;
        // fill(color);

        fill([0, 0, 0, 130]);
        let vert = "abcdefgh".charAt(x);
        text(vert, tileWidth * (x + 1) - 0.115 * tileWidth, 8 * tileWidth - 0.05 * tileWidth);
      }

      if (x == 0) {
        textSize(width * 0.02); // color = y % 2 == 1 ? board.style.tileWhite : board.style.tileBlack;
        // fill(color);

        fill([0, 0, 0, 130]);
        text(abs(y - 8), 0.025 * tileWidth, y * tileWidth + 0.15 * tileWidth);
      }

      if (piece.type != Piece.types.empty) {
        if (selected.piece != null) {
          if (selected.piece.type == Piece.types.king) {
            if (board.isCheckmated.white) {
              if (selected.piece.side == Piece.sides.white) {
                image(piece.image, pos.x, pos.y, tileWidth, tileWidth);
              }
            }

            if (board.isCheckmated.black) {
              if (selected.piece.side == Piece.sides.black) {
                image(piece.image, pos.x, pos.y, tileWidth, tileWidth);
              }
            }
          }
        }

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
    let y = (move - move % 8) / 8;
    fill([150, 150, 150, 255]);
    let center = tileWidth / 2;
    circle(x * tileWidth + center, y * tileWidth + center, tileWidth / 6);
  }

  if (mouse.down && selected.piece.type != Piece.types.empty) {
    if (selected.piece.type == Piece.types.king) {
      if (board.isCheckmated.white) {
        if (selected.piece.side == Piece.sides.white) {
          return;
        }
      }

      if (board.isCheckmated.black) {
        if (selected.piece.side == Piece.sides.black) {
          return;
        }
      }
    }

    imageMode(CENTER);
    image(selected.piece.image, mouseX, mouseY, tileWidth, tileWidth);
    imageMode(CORNER);
  }
}

function mousePressed() {
  // For debouncing
  // if (event.type != "touchstart") return true;
  if (modalOpen) return; // Check screen bounds

  if (mouseX > width || mouseY > height) return true;
  if (mouseX < 0 || mouseY < 0) return true;
  mouse.down = true;
  mouse.pX = mouseX;
  mouse.pY = mouseY;
  let sz = board.style.size;
  selected = Utils.getCoords(mouseX, mouseY, width, sz);
  selected.piece = board.tiles[selected.y][selected.x]; // BUG: init will set piece even if it belongs to wrong side
  // init

  if (selectedPrev.x == null) {
    selectedPrev.x = selected.x;
    selectedPrev.y = selected.y;
    selectedPrev.piece = selected.piece;
  } // update
  else if (selected.piece.type != Piece.types.empty && selected.piece.side == board.currentTurn) {
      selectedPrev.x = selected.x;
      selectedPrev.y = selected.y;
      selectedPrev.piece = selected.piece;
    } else {
      selectedPrev.piece = null;
    }

  if (selectedPrev.piece != null) {
    moves = board.listMovesLegal(selectedPrev.piece, {
      "x": selectedPrev.x,
      "y": selectedPrev.y
    });
  }
}

function mouseReleased() {
  // For debouncing
  // if (event.type != "touchend") return true;
  if (modalOpen) return; // Check screen bounds

  if (mouseX > width || mouseY > height) {
    mouse.down = false;
    selected.piece = null;
    return;
  }

  if (mouseX < 0 || mouseY < 0) {
    mouse.down = false;
    selected.piece = null;
    return;
  }

  let sz = board.style.size; // src and dst must contain x, y and piece

  function makeMove(src, dst) {
    if (src.x != dst.x || src.y != dst.y) {
      board.validateMove(src, dst, promotionHandler).then(move => {
        if (move) {
          audio[0].play();

          if (board.isCheckmated.white || board.isCheckmated.black) {
            audio[2].play();
          } else if (board.isInCheck.white || board.isInCheck.black) {
            audio[1].play();
          }

          moves = [];

          if (curMove == board.fullmoves) {
            $("#moveList tr:last").after("<tr><th scope=\"row\">" + curMove + "</th></tr>");
          } // Current turn is not the previous turn (wow)


          if (board.currentTurn == Piece.sides.black) {
            $("#moveList th:last").after("<td>" + move + "</td>");
          } else {
            $("#moveList td:last").after("<td>" + move + "</td>");
          }

          if (debug) {
            // TODO: implement capturing and check notation
            let fenString = board.writeFen();
            console.log(move);
            console.log(fenString);
          }

          curMove = board.fullmoves;
          return true;
        }

        return false;
      });
    }
  }

  let hovering = {
    "x": 0,
    "y": 0,
    "piece": null
  };
  hovering.x = Math.floor(mouseX * sz / width) % sz;
  hovering.y = Math.floor(mouseY * sz / width) % sz;
  hovering.piece = board.tiles[hovering.y][hovering.x];

  if (hovering.x != selected.x || hovering.y != selected.y) {
    makeMove(selected, hovering);
  } else {
    if (makeMove(selectedPrev, selected)) {
      selectedPrev.piece = null;
    }
  }

  mouse.down = false;
  selected.piece = null;
}

function windowResized() {
  let sz = Utils.getRes(1 / 1, 0.75);
  let ctWidth = $("#canvasContainer").width();

  if (sz.x > ctWidth) {
    sz.x = ctWidth;
    sz.y = ctWidth;
  }

  resizeCanvas(sz.x, sz.y);
}