class Piece {
    static types = {
        "king": 0,
        "queen": 1,
        "bishop": 2,
        "knight": 3,
        "rook": 4,
        "pawn": 5,
        "empty": 6
    };
    static sides = {
        "white": 0,
        "black": 1
    };
    type;
    side;
    image;

    constructor(type, side, sprite) {
        this.type = type;
        this.side = side;

        this.getImage(sprite);
    }

    // this should be edited to fit your sprite
    getImage(sprite) {
        if (this.type == Piece.types.empty) {
            this.image = null;
            return;
        }

        let w = sprite.width; let h = sprite.height;
        let sz = Math.floor((h > w ? h : w) / 6);

        this.image = sprite.get(this.type * sz, this.side * sz, sz, sz);
    }

    get shorthand() {
        let shortName = "";
        switch (this.type) {
            case Piece.types.empty:
            case Piece.types.pawn:
                shortName += "p";
                break;
            case Piece.types.knight:
                shortName += "n";
                break;
            case Piece.types.bishop:
                shortName += "b";
                break;
            case Piece.types.rook:
                shortName += "r";
                break;
            case Piece.types.queen:
                shortName += "q";
                break;
            case Piece.types.king:
                shortName += "k";
                break;
        }

        if (this.side == Piece.sides.white) {
            return shortName.toUpperCase();
        }

        return shortName;
    }
}