
class Utils {
    // Max is a percentage of screen size
    static getRes(aspect, max) {
        let res = min(window.innerWidth, window.innerHeight);
        return { "x": res * aspect * max, "y": res * max };
    }

    static array2D(x, y) {
        return Array.from(Array(x), () => new Array(y));
    }

    static getCoords(x, y, max, sz) {
        return {
            "x": Math.floor(x * sz / max) % sz,
            "y": Math.floor(y * sz / max) % sz
        };
    }

    // Well this got out of hand...
    // maybe have a variable that determines what will be 
    // returned from the raycast function
    // itll do for now tho
    // TODO: refactor raycast functions into one

    // Returns all possible moves, capture inclusive
    static rayCastA(pos, angles, tiles, maxDist, currentSide) {
        let result = [];
        angleMode(DEGREES);
        let Dx, Dy;
        let sz = 8;
        let side;
        for (const angle of angles) {
            let emptyPos = [];
            for (let i = 1; i <= maxDist; i++) {
                // The flooring might mess something up
                Dx = Math.round(pos.x + i * cos(angle));
                Dy = Math.round(pos.y + i * sin(angle));
                if (Dx >= sz || Dy >= sz || Dx < 0 || Dy < 0) break;

                // damn shawty ok
                if (tiles[pos.y][pos.x].side == null) side = currentSide;
                else side = tiles[pos.y][pos.x].side;

                if (tiles[Dy][Dx].type != Piece.types.empty) {
                    if (side != tiles[Dy][Dx].side) {
                        emptyPos.push(Dx + Dy * sz);
                    }
                    break;
                }
                emptyPos.push(Dx + Dy * sz);
            }
            result = result.concat(emptyPos);
        }

        return result;
    }

    // Returns opponents visible by cast rays
    static rayCastB(pos, angles, tiles, maxDist, currentSide) {
        let result = [];
        angleMode(DEGREES);
        let Dx, Dy;
        let sz = 8;
        let side;
        for (const angle of angles) {
            let emptyPos = [];
            for (let i = 1; i <= maxDist; i++) {
                // The flooring might mess something up
                Dx = Math.round(pos.x + i * cos(angle));
                Dy = Math.round(pos.y + i * sin(angle));
                if (Dx >= sz || Dy >= sz || Dx < 0 || Dy < 0) break;
                if (tiles[Dy][Dx].type != Piece.types.empty) {
                    // damn shawty ok
                    if (tiles[pos.y][pos.x].side == null) side = currentSide;
                    else side = tiles[pos.y][pos.x].side;
                    if (side != tiles[Dy][Dx].side) {
                        emptyPos.push(Dx + Dy * sz);
                    }
                    break;
                }
            }
            result = result.concat(emptyPos);
        }

        return result;
    }

    // Returns angles that contain pieces of other side
    static rayCastC(pos, angles, tiles, maxDist, currentSide) {
        let result = [];
        angleMode(DEGREES);
        let Dx, Dy;
        let sz = 8;
        let side;
        for (const angle of angles) {
            let hitAngles = [];
            for (let i = 1; i <= maxDist; i++) {
                // The flooring might mess something up
                Dx = Math.round(pos.x + i * cos(angle));
                Dy = Math.round(pos.y + i * sin(angle));
                if (Dx >= sz || Dy >= sz || Dx < 0 || Dy < 0) break;
                if (tiles[Dy][Dx].type != Piece.types.empty) {
                    // damn shawty ok watch for side null
                    side = tiles[pos.y][pos.x].side;
                    if (side != tiles[Dy][Dx].side) {
                        hitAngles.push(angle);
                    }
                    break;
                }
            }
            result = result.concat(hitAngles);
        }

        return result;
    }

    // https://en.wikipedia.org/wiki/Algebraic_notation_(chess)#Notation_for_moves
    // TODO: add promotions, check, checkmate
    static toAlgebraic(piece, src, dst, capture) {
        // Castling
        if (piece.type == Piece.types.king) {
            if (src.x - dst.x < -1) {
                return "0-0";
            } else if (src.x - dst.x > 1) {
                return "0-0-0";
            }
        }

        let positionsX = "abcdefgh";
        let srcName = positionsX.charAt(src.x) + abs(src.y - 8);
        let dstName = positionsX.charAt(dst.x) + abs(dst.y - 8);
        let algebraic = "";
        if (piece.shorthand.toLowerCase() != "p") {
            algebraic += piece.shorthand.toUpperCase();
        } else {
            if (capture) algebraic += srcName.charAt(0);
        }
        algebraic += capture ? "x" : "";
        algebraic += dstName;
        return algebraic;
    }

    // TODO: make it handle takes and other stuff
    static fromAlgebraic(string) {
        let x = string.charCodeAt(0) - "a".charCodeAt(0);
        let y = abs(Number(string.charAt(1)) - 8);
        return { "x": x, "y": y };
    }
}