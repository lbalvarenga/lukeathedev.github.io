// TODO: implement game history (pretty easy)
// TODO: URGENT implement promotion
// TODO: URGENT 2 castling rules
// 1. The king is not currently in check.
// 2. The king does not pass through a square that is attacked by an enemy piece.

// TODO: implement chronometer
// TODO: implement multiplayer
class Board {
    static style = {
        "size": 8,
        "boardRes": 2048,
        "tileBlack": [0, 0, 0, 255],
        "tileWhite": [255, 255, 255, 255],
        "pieceSprite": null // Must be populated with an image
    };
    fenString = "";
    tileImage = null;
    currentTurn = Piece.sides.white;
    canCastle = {
        "K": false, // White king side
        "Q": false, // White queen side
        "k": false, // Black king side
        "q": false  // Black queen side
    }

    // TODO: validate initial fen to set stuff like this
    isInCheck = {
        "white": false,
        "black": false
    }

    enPassantTarget = { "x": null, "y": null };
    halfmoves = 0;
    fullmoves = 1;

    // 2D array of pieces
    tiles;

    constructor(fenString, style) {
        this.fenString = fenString;
        this.style = style;
        this.tiles = Utils.array2D(this.style.size, this.style.size);
        this.createTiles();
        this.readFen();
    }

    // TODO: check for checkmates
    // TODO: implement promotions
    // Anything that affects pieces goes here
    validateMove(src, dst) {
        let srcPiece = this.tiles[src.y][src.x];
        if (srcPiece.type == Piece.types.empty) return false;

        let dstPiece = this.tiles[dst.y][dst.x];
        let sz = this.style.size;
        let moves = this.listMovesLegal(srcPiece, src);
        let capture = false;
        let enPassantSet = false;

        if (srcPiece.side != this.currentTurn) return false;
        if (!moves.includes(dst.x + dst.y * sz)) return false;

        this.tiles[dst.y][dst.x] = srcPiece;
        this.tiles[src.y][src.x] = new Piece(Piece.types.empty, null, null);

        this.halfmoves++;
        if (srcPiece.side == Piece.sides.black) this.fullmoves++;
        if (dstPiece.type != Piece.types.empty) {
            capture = true;
            this.halfmoves = 0;
        }

        switch (srcPiece.type) {
            case Piece.types.pawn:
                let side;
                // TODO: implement en passant
                if (srcPiece.side == Piece.sides.white) side = 1;
                if (srcPiece.side == Piece.sides.black) side = -1;

                // En Passant target
                if (abs(src.y - dst.y) == 2) {
                    this.enPassantTarget.x = src.x;
                    this.enPassantTarget.y = dst.y + 1 * side;
                    enPassantSet = true;
                }

                // Captures with En Passant
                if (dst.y == this.enPassantTarget.y) {
                    if (dst.x == this.enPassantTarget.x) {
                        this.tiles[dst.y + 1 * side][dst.x] = new Piece(Piece.types.empty, null, null);
                    }
                }

                // Promotion

                this.halfmoves = 0;
                break;

            case Piece.types.king:
                // If king is castling
                // King side
                if (src.x - dst.x == -2) {
                    this.tiles[src.y][src.x + 1] = this.tiles[src.y][src.x + 3];
                    this.tiles[src.y][src.x + 3] = new Piece(Piece.types.empty, null, null);
                }
                // Queen side
                else if (src.x - dst.x == 2) {
                    this.tiles[src.y][src.x - 1] = this.tiles[src.y][src.x - 4];
                    this.tiles[src.y][src.x - 4] = new Piece(Piece.types.empty, null, null);
                }

                // Can't castle after king moves
                if (srcPiece.side == Piece.sides.white) {
                    this.canCastle.K = false;
                    this.canCastle.Q = false;
                }
                else if (srcPiece.side == Piece.sides.black) {
                    this.canCastle.k = false;
                    this.canCastle.q = false;
                }
                break;

            case Piece.types.rook:
                // Castling
                // If at starting position
                if (srcPiece.side == Piece.sides.white) {
                    if (src.x == 7 && src.y == 7) this.canCastle.K = false;
                    if (src.x == 0 && src.y == 7) this.canCastle.Q = false;
                }
                if (srcPiece.side == Piece.sides.black) {
                    if (src.x == 7 && src.y == 0) this.canCastle.k = false;
                    if (src.x == 0 && src.y == 0) this.canCastle.q = false;
                }
        }

        if (!enPassantSet) {
            this.enPassantTarget.x = null;
            this.enPassantTarget.y = null;
        }

        if (this.currentTurn == Piece.sides.white) {
            this.currentTurn = Piece.sides.black;
        }
        else this.currentTurn = Piece.sides.white;

        let algebraic = Utils.toAlgebraic(srcPiece, src, dst, capture);

        let kingPos;
        // Find active king
        for (let y = 0; y < sz; y++) {
            for (let x = 0; x < sz; x++) {
                let curPiece = this.tiles[y][x];
                if (curPiece.type == Piece.types.king) {
                    if (curPiece.side == this.currentTurn) {
                        kingPos = { "x": x, "y": y };
                    }
                }
            }
        }

        if (this.listChecks(kingPos).length > 0) {
            algebraic += "+";
        }

        return algebraic;
    }

    listChecks(kingPos) {
        let moves = [];
        let sz = this.style.size;
        let kingPiece = this.tiles[kingPos.y][kingPos.x];

        // This is a mess right now
        // i just wanted something that worked; will refactor in the future i think

        // We must check for knights as they violate occlusion
        for (let y = 0; y < sz; y++) {
            for (let x = 0; x < sz; x++) {
                let curPiece = this.tiles[y][x];

                // If piece is knight
                if (curPiece.type == Piece.types.knight) {
                    let attMoves = this.listMovesPseudo(curPiece, { "x": x, "y": y });
                    // If knight reaches king
                    for (let i = 0; i < attMoves.length; i++) {
                        if (attMoves[i] == kingPos.x + kingPos.y * sz) {
                            moves.push(x + y * sz);
                            moves.push(attMoves[i]);
                        }
                    }
                }

                // moves.push(0) // knight pos and king pos
            }
        }

        // Find attacking angles
        let angles = [-135, -90, -45, 0, 45, 90, 135, 180];
        
        // BUG: kingPiece.side causes moves not on your turn to not show
        let attAngles = Utils.rayCastC(kingPos, angles, this.tiles, 8, kingPiece.side);

        // for each cast ray at angle
        for (let i = 0; i < attAngles.length; i++) {
            let attPiece = Utils.rayCastB(kingPos, [attAngles[i]], this.tiles, 8, kingPiece.side);
            let attMoves = Utils.rayCastA(kingPos, [attAngles[i]], this.tiles, 8, kingPiece.side);
            // list attacking piece moves
            let piecePos = { "x": attPiece[0] % 8, "y": floor(attPiece[0] / 8) };
            let pieceAttacks = this.listMovesPseudo(this.tiles[piecePos.y][piecePos.x], piecePos);


            // make sure it can reach king at some point
            if (!pieceAttacks.includes(kingPos.x + kingPos.y * sz)) continue;

            moves.push(attPiece[0]);
            for (let i = 0; i < pieceAttacks.length; i++) {
                if (attMoves.includes(pieceAttacks[i])) {
                    moves.push(pieceAttacks[i]);
                }
                if (pieceAttacks[i] == kingPos.x + kingPos.y * sz) {
                    moves.push(pieceAttacks[i]);
                }
            }
        }

        return moves.filter((e, i, s) => {
            // Filter null and repeated elements
            return i == s.indexOf(e);
        });
    }

    listMovesLegal(piece, pos) {
        if (piece.type == Piece.types.empty) return [];

        // castling

        let sz = this.style.size;
        let kingPos;
        // Find active king
        for (let y = 0; y < sz; y++) {
            for (let x = 0; x < sz; x++) {
                let curPiece = this.tiles[y][x];
                if (curPiece.type == Piece.types.king) {
                    if (curPiece.side == piece.side) {
                        kingPos = { "x": x, "y": y };
                    }
                }
            }
        }
        let kingPiece = this.tiles[kingPos.y][kingPos.x];

        let checkPositions = this.listChecks(kingPos);
        let moves = this.listMovesPseudo(piece, pos);

        // TODO: use a single for loop maybe?
        // list pseudo moves
        // remove those that match check positions
        // if in check
        if (checkPositions.length > 0) {
            for (let i = 0; i < moves.length; i++) {
                let newPos = { "x": moves[i] % 8, "y": floor(moves[i] / 8) };

                if (piece.type == Piece.types.king) {
                    kingPos = newPos;
                    if (checkPositions.includes(moves[i])) {
                        // if king is not capturing attacking piece
                        if (this.tiles[newPos.y][newPos.x].type == Piece.types.empty) {
                            // splice seems dodgy maybe im dumb lol
                            delete moves[i];
                        }
                    }
                }
                else if (!checkPositions.includes(moves[i])) {
                    delete moves[i];
                }

                // move piece temporarily for validation purposes
                let pieceAtNewPos = this.tiles[newPos.y][newPos.x];
                this.tiles[newPos.y][newPos.x] = piece;
                this.tiles[pos.y][pos.x] = new Piece(Piece.types.empty, null, null);

                // Test if king gets checked
                let possibleChecks = this.listChecks(kingPos);
                if (possibleChecks.length > 0) delete moves[i];

                // set them back
                this.tiles[newPos.y][newPos.x] = pieceAtNewPos;
                this.tiles[pos.y][pos.x] = piece;
            }
        }
        // if not in check
        else {
            // for every move
            // see if it causes king to get checked
            // disallow that move
            for (let i = 0; i < moves.length; i++) {
                let newPos = { "x": moves[i] % 8, "y": floor(moves[i] / 8) };

                // if king is moving
                if (piece.type == Piece.types.king) {
                    kingPos = newPos;
                    let possibleChecks = this.listChecks(newPos);
                    if (possibleChecks.length > 0) {
                        if (this.tiles[newPos.y][newPos.x].type == Piece.types.empty) {
                            if (piece.side != kingPiece.side) delete moves[i];
                        }
                    }
                }
                // if piece exposes king

                // move piece temporarily for validation purposes
                let pieceAtNewPos = this.tiles[newPos.y][newPos.x];
                this.tiles[newPos.y][newPos.x] = piece;
                this.tiles[pos.y][pos.x] = new Piece(Piece.types.empty, null, null);

                // Test if king gets checked
                let possibleChecks = this.listChecks(kingPos);
                if (possibleChecks.length > 0) delete moves[i];

                // set them back
                this.tiles[newPos.y][newPos.x] = pieceAtNewPos;
                this.tiles[pos.y][pos.x] = piece;
            }
        }

        // TODO: check for checkmates
        // naive idea:
        // list all possible moves on board for each side
        // if there are none well checkmate bro or stalemate if king is not checked

        return moves.filter((e, i, s) => {
            // Filter null and repeated elements
            return i == s.indexOf(e);
        });
    }

    // https://permadi.com/1996/05/ray-casting-tutorial-6/
    // Takes Pos = {"x": a, "y": b}
    // returns possible moves as x + y * this.style.size array
    // TODO: use array splice instead of delete
    listMovesPseudo(piece, pos) {
        let moves = [];
        let angles = [];
        let sz = this.style.size;

        switch (piece.type) {
            case Piece.types.pawn:
                let allowedDist = 1;
                let side;
                // TODO: implement en passant
                if (piece.side == Piece.sides.white) {
                    side = -1;
                    // If at starting position
                    if (pos.y == 6) allowedDist = 2;
                }
                else if (piece.side == Piece.sides.black) {
                    side = 1;
                    // If at starting position
                    if (pos.y == 1) allowedDist = 2;
                }

                angles = [45 * side, 135 * side];
                moves = moves.concat(Utils.rayCastA(pos, angles, this.tiles, allowedDist, piece.side))
                angles = [90 * side];
                moves = moves.concat(Utils.rayCastA(pos, angles, this.tiles, allowedDist, piece.side));
                for (let i = 0; i < moves.length; i++) {
                    // TODO: make this a Utils method
                    let x = moves[i] % 8;
                    let y = floor(moves[i] / 8);

                    // Check for pieces on diagonal
                    if (x != pos.x) {
                        if (this.tiles[y][x].type == Piece.types.empty) {
                            delete moves[i];
                        }
                    }
                    // Check if piece is on same x (can't be captured)
                    else {
                        if (this.tiles[y][x].type != Piece.types.empty) {
                            delete moves[i];
                        }
                    }

                }

                // En Passant
                if (pos.y == this.enPassantTarget.y - 1 * side) {
                    if (abs(pos.x - this.enPassantTarget.x) == 1) {
                        moves.push(this.enPassantTarget.x + this.enPassantTarget.y * sz);
                    }
                }
                break;
            case Piece.types.knight:
                for (let y = 0; y < 5; y++) {
                    for (let x = 0; x < 5; x++) {
                        let movePosX = (x + pos.x - 2);
                        let movePosY = (y + pos.y - 2);
                        if (movePosX < 0 || movePosY < 0) continue;
                        if (movePosX > 7 || movePosY > 7) continue;

                        if (this.tiles[movePosY][movePosX].side == piece.side) continue;

                        if (abs(x - y) == 3) {
                            moves.push(movePosX + movePosY * sz);
                        }
                        if (abs(x - y) == 1 && (abs(x - 2) > 1 || abs(y - 2) > 1)) {
                            moves.push(movePosX + movePosY * sz);
                        }
                    }
                }
                break;
            case Piece.types.bishop:
                angles = [-135, -45, 45, 135];
                moves = moves.concat(Utils.rayCastA(pos, angles, this.tiles, 8, piece.side));
                break;
            case Piece.types.rook:
                angles = [-90, 0, 90, 180];
                moves = moves.concat(Utils.rayCastA(pos, angles, this.tiles, 8, piece.side));
                break;
            case Piece.types.queen:
                angles = [-135, -90, -45, 0, 45, 90, 135, 180];
                moves = moves.concat(Utils.rayCastA(pos, angles, this.tiles, 8, piece.side));
                break;
            case Piece.types.king:
                // TODO: cleanup
                // Castling
                if (piece.side == Piece.sides.white) {
                    // If canCastle and no pieces are on the way
                    // King side
                    let cMoves = Utils.rayCastA(pos, [0], this.tiles, 2, piece.type);
                    if (this.canCastle.K && cMoves.length == 2) {
                        // If rook in is position
                        if (this.tiles[pos.y][pos.x + 3].type == Piece.types.rook) {
                            moves.push((pos.x + 2) + pos.y * sz);
                        }
                    }
                    // Queen side
                    cMoves = Utils.rayCastA(pos, [180], this.tiles, 3, piece.side);
                    if (this.canCastle.Q && cMoves.length == 3) {
                        // If rook is in position
                        if (this.tiles[pos.y][pos.x - 4].type == Piece.types.rook) {
                            moves.push((pos.x - 2) + pos.y * sz);
                        }
                    }
                }

                if (piece.side == Piece.sides.black) {
                    // If canCastle and no pieces are on the way
                    // King side
                    let cMoves = Utils.rayCastA(pos, [0], this.tiles, 2, piece.side);
                    if (this.canCastle.k && cMoves.length == 2) {
                        // If rook exists
                        if (this.tiles[pos.y][pos.x + 3] != undefined) {
                            // If rook in is position
                            if (this.tiles[pos.y][pos.x + 3].type == Piece.types.rook) {
                                moves.push((pos.x + 2) + pos.y * sz);
                            }
                        }
                    }
                    // Queen side
                    cMoves = Utils.rayCastA(pos, [180], this.tiles, 3, piece.side);
                    if (this.canCastle.q && cMoves.length == 3) {
                        // If rook exists
                        if (this.tiles[pos.y][pos.x - 4] != undefined) {
                            // If rook is in position
                            if (this.tiles[pos.y][pos.x - 4].type == Piece.types.rook) {
                                moves.push((pos.x - 2) + pos.y * sz);
                            }
                        }
                    }
                }

                angles = [-135, -90, -45, 0, 45, 90, 135, 180];
                moves = moves.concat(Utils.rayCastA(pos, angles, this.tiles, 1, piece.side));
                break;
        }

        return moves.filter((e, i, s) => {
            // Filter null and repeated elements
            return i == s.indexOf(e);
        });
    }

    readFen() {
        let pos = 0; let row = 0;
        for (const c of this.fenString) {
            let type;
            let side = (c == c.toUpperCase() ? Piece.sides.white : Piece.sides.black);

            if (pos + row * 8 > (this.style.size * this.style.size) - 1) {
                let turn = this.fenString.match(/\s([wb])\s/gm)[0];
                if (turn == " w ") turn = Piece.sides.white;
                else if (turn == " b ") turn = Piece.sides.black;

                let numbers = this.fenString.match(/\s([\d])/gm);
                this.currentTurn = turn;
                this.halfmoves = Number(numbers[0]);
                this.fullmoves = Number(numbers[1]);

                let castling = this.fenString.match(/[KQkq-]{4}/gm)[0];
                for (const c of castling) {
                    switch (c) {
                        case "K":
                            this.canCastle.K = true;
                            break;
                        case "Q":
                            this.canCastle.Q = true;
                            break;
                        case "k":
                            this.canCastle.k = true;
                            break;
                        case "q":
                            this.canCastle.q = true;
                            break;
                    }
                }

                let enPassant = this.fenString.match(/[a-h]{1}[0-9]{1}/gm);
                if (enPassant == null) break;
                this.enPassantTarget = Utils.fromAlgebraic(enPassant[0]);
                break;
            }

            if (Number(c)) {
                for (let i = 0; i < Number(c); i++) {
                    this.tiles[row][pos + i] = new Piece(Piece.types.empty, null, null, null);
                }
                pos += Number(c);
                continue;
            }

            switch (c.toLowerCase()) {
                case "p":
                    type = Piece.types.pawn;
                    this.tiles[row][pos] = new Piece(type, side, this.style.pieceSprite);
                    pos++;
                    break;
                case "n":
                    type = Piece.types.knight;
                    this.tiles[row][pos] = new Piece(type, side, this.style.pieceSprite);
                    pos++;
                    break;
                case "b":
                    type = Piece.types.bishop;
                    this.tiles[row][pos] = new Piece(type, side, this.style.pieceSprite);
                    pos++;
                    break;
                case "r":
                    type = Piece.types.rook;
                    this.tiles[row][pos] = new Piece(type, side, this.style.pieceSprite);
                    pos++;
                    break;
                case "q":
                    type = Piece.types.queen;
                    this.tiles[row][pos] = new Piece(type, side, this.style.pieceSprite);
                    pos++;
                    break;
                case "k":
                    type = Piece.types.king;
                    this.tiles[row][pos] = new Piece(type, side, this.style.pieceSprite);
                    pos++;
                    break;
                case "/":
                    if (pos % this.style.size != 0) {
                        // the FEN is most likely bad, but for
                        // now we just keep going
                    }
                    row++; pos = 0;
                    break;
                default:
                    break;
            }
        }
    }

    // Writes a FEN String based on this.tiles[]
    writeFen() {
        this.fenString = "";
        let emptySpaces = 0;
        for (let y = 0; y < board.tiles.length; y++) {
            for (let x = 0; x <= board.tiles[y].length; x++) {
                let piece = board.tiles[y][x];

                if (x == board.tiles[y].length) {
                    if (emptySpaces != 0) {
                        this.fenString += String(emptySpaces);
                    }
                    emptySpaces = 0;

                    if (y != board.tiles.length - 1) this.fenString += "/";
                    break;
                }

                if (emptySpaces != 0 && piece.type != Piece.types.empty) {
                    this.fenString += String(emptySpaces);
                    emptySpaces = 0;
                }

                switch (piece.type) {
                    case Piece.types.pawn:
                        this.fenString += piece.side ? "p" : "P";
                        break;
                    case Piece.types.knight:
                        this.fenString += piece.side ? "n" : "N";
                        break;
                    case Piece.types.bishop:
                        this.fenString += piece.side ? "b" : "B";
                        break;
                    case Piece.types.rook:
                        this.fenString += piece.side ? "r" : "R";
                        break;
                    case Piece.types.queen:
                        this.fenString += piece.side ? "q" : "Q";
                        break;
                    case Piece.types.king:
                        this.fenString += piece.side ? "k" : "K";
                        break;
                    case Piece.types.empty:
                        emptySpaces++;
                        break;
                }
            }
        }

        this.fenString += this.currentTurn == Piece.sides.white ? " w" : " b";
        // White castling
        this.fenString += this.canCastle.K ? " K" : " -";
        this.fenString += this.canCastle.Q ? "Q" : "-";
        // Black castling
        this.fenString += this.canCastle.k ? "k" : "-";
        this.fenString += this.canCastle.q ? "q" : "-";

        // TODO: add en passant
        if (this.enPassantTarget.x == null || this.enPassantTarget.y == null) {
            this.fenString += " -";
        }
        else {
            let enPassantAlgebraic = Utils.toAlgebraic(
                new Piece(Piece.types.empty, null, null),
                this.enPassantTarget, this.enPassantTarget,
                false
            );
            this.fenString += " " + enPassantAlgebraic;
        }


        this.fenString += " " + this.halfmoves;
        this.fenString += " " + this.fullmoves;
        return this.fenString;
    }

    createTiles() {
        let res = this.style.boardRes;
        this.tileImage = createImage(res, res);
        this.tileImage.loadPixels();

        let sz = this.style.size;
        let white = this.style.tileWhite;
        let black = this.style.tileBlack;
        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                let r = x % (res / sz * 2) / (res / sz * 2);
                let k = y % (res / sz * 2) / (res / sz * 2);
                r = r >= 0.5 ? 0 : 1;
                k = k >= 0.5 ? 1 : 0;
                let color = (r ^ k) ? white : black;

                let i = (x + y * res) * 4;
                this.tileImage.pixels[i + 0] = color[0];
                this.tileImage.pixels[i + 1] = color[1];
                this.tileImage.pixels[i + 2] = color[2];
                this.tileImage.pixels[i + 3] = color[3];
            }
        }
        this.tileImage.updatePixels();
    }
}