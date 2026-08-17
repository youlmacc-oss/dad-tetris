import java.awt.Color;

/**
 * 7종 미노의 모양·색·위치·회전. 충돌 판정은 {@link Board}가 한다.
 */
public final class Tetromino {

    public enum Type {
        I(new Color(0x00E8E8)),
        J(new Color(0x3B82FF)),
        L(new Color(0xFF8A00)),
        O(new Color(0xFFD400)),
        S(new Color(0x3DDC64)),
        T(new Color(0xC44DFF)),
        Z(new Color(0xFF3B3B));

        private final Color color;

        Type(Color color) {
            this.color = color;
        }

        public Color color() {
            return color;
        }

        public int id() {
            return ordinal() + 1;
        }

        public static Type fromId(int id) {
            return values()[id - 1];
        }
    }

    /** [type][rotation 0-3][cell 0-3][x or y] */
    private static final int[][][][] SHAPES = {
            { // I
                    {{0, 1}, {1, 1}, {2, 1}, {3, 1}},
                    {{2, 0}, {2, 1}, {2, 2}, {2, 3}},
                    {{0, 2}, {1, 2}, {2, 2}, {3, 2}},
                    {{1, 0}, {1, 1}, {1, 2}, {1, 3}}
            },
            { // J
                    {{0, 0}, {0, 1}, {1, 1}, {2, 1}},
                    {{1, 0}, {2, 0}, {1, 1}, {1, 2}},
                    {{0, 1}, {1, 1}, {2, 1}, {2, 2}},
                    {{1, 0}, {1, 1}, {0, 2}, {1, 2}}
            },
            { // L
                    {{2, 0}, {0, 1}, {1, 1}, {2, 1}},
                    {{1, 0}, {1, 1}, {1, 2}, {2, 2}},
                    {{0, 1}, {1, 1}, {2, 1}, {0, 2}},
                    {{0, 0}, {1, 0}, {1, 1}, {1, 2}}
            },
            { // O
                    {{1, 0}, {2, 0}, {1, 1}, {2, 1}},
                    {{1, 0}, {2, 0}, {1, 1}, {2, 1}},
                    {{1, 0}, {2, 0}, {1, 1}, {2, 1}},
                    {{1, 0}, {2, 0}, {1, 1}, {2, 1}}
            },
            { // S
                    {{1, 0}, {2, 0}, {0, 1}, {1, 1}},
                    {{1, 0}, {1, 1}, {2, 1}, {2, 2}},
                    {{1, 1}, {2, 1}, {0, 2}, {1, 2}},
                    {{0, 0}, {0, 1}, {1, 1}, {1, 2}}
            },
            { // T
                    {{1, 0}, {0, 1}, {1, 1}, {2, 1}},
                    {{1, 0}, {1, 1}, {2, 1}, {1, 2}},
                    {{0, 1}, {1, 1}, {2, 1}, {1, 2}},
                    {{1, 0}, {0, 1}, {1, 1}, {1, 2}}
            },
            { // Z
                    {{0, 0}, {1, 0}, {1, 1}, {2, 1}},
                    {{2, 0}, {1, 1}, {2, 1}, {1, 2}},
                    {{0, 1}, {1, 1}, {1, 2}, {2, 2}},
                    {{1, 0}, {0, 1}, {1, 1}, {0, 2}}
            }
    };

    /** SRS 월킥. Guideline Y-up 값을 이 보드(Y 아래+)에 맞게 부호 변환. */
    private static final int[][][] JLSTZ_CW = {
            {{0, 0}, {-1, 0}, {-1, -1}, {0, 2}, {-1, 2}},
            {{0, 0}, {1, 0}, {1, 1}, {0, -2}, {1, -2}},
            {{0, 0}, {1, 0}, {1, -1}, {0, 2}, {1, 2}},
            {{0, 0}, {-1, 0}, {-1, 1}, {0, -2}, {-1, -2}}
    };
    private static final int[][][] I_CW = {
            {{0, 0}, {-2, 0}, {1, 0}, {-2, 1}, {1, -2}},
            {{0, 0}, {-1, 0}, {2, 0}, {-1, -2}, {2, 1}},
            {{0, 0}, {2, 0}, {-1, 0}, {2, -1}, {-1, 2}},
            {{0, 0}, {1, 0}, {-2, 0}, {1, 2}, {-2, -1}}
    };
    private static final int[][] O_KICKS = {{0, 0}};

    private Type type;
    private int rotation;
    private int col;
    private int row;

    public Tetromino(Type type) {
        this.type = type;
        this.rotation = 0;
        this.col = 3;
        this.row = 0;
    }

    public Tetromino copy() {
        Tetromino copy = new Tetromino(type);
        copy.rotation = rotation;
        copy.col = col;
        copy.row = row;
        return copy;
    }

    public void moveLeft() {
        col--;
    }

    public void moveRight() {
        col++;
    }

    public void moveDown() {
        row++;
    }

    public void moveBy(int dc, int dr) {
        col += dc;
        row += dr;
    }

    public void rotateClockwise() {
        rotation = (rotation + 1) & 3;
    }

    public void rotateCounterClockwise() {
        rotation = (rotation + 3) & 3;
    }

    public void setPosition(int col, int row) {
        this.col = col;
        this.row = row;
    }

    public void apply(Tetromino other) {
        this.type = other.type;
        this.rotation = other.rotation;
        this.col = other.col;
        this.row = other.row;
    }

    public Type type() {
        return type;
    }

    public int rotation() {
        return rotation;
    }

    public int col() {
        return col;
    }

    public int row() {
        return row;
    }

    public Color color() {
        return type.color();
    }

    /** 보드 절대 좌표 4칸. [i][0]=col, [i][1]=row */
    public int[][] occupiedCells() {
        int[][] local = SHAPES[type.ordinal()][rotation];
        int[][] abs = new int[4][2];
        for (int i = 0; i < 4; i++) {
            abs[i][0] = col + local[i][0];
            abs[i][1] = row + local[i][1];
        }
        return abs;
    }

    public int[][] localCells() {
        int[][] local = SHAPES[type.ordinal()][rotation];
        int[][] copy = new int[4][2];
        for (int i = 0; i < 4; i++) {
            copy[i][0] = local[i][0];
            copy[i][1] = local[i][1];
        }
        return copy;
    }

    public static int[][] kicks(Type type, int from, int to) {
        if (type == Type.O) {
            return O_KICKS;
        }
        boolean clockwise = to == ((from + 1) & 3);
        int index = clockwise ? from : to;
        int[][] table = type == Type.I ? I_CW[index] : JLSTZ_CW[index];
        if (clockwise) {
            return table;
        }
        int[][] negated = new int[table.length][2];
        for (int i = 0; i < table.length; i++) {
            negated[i][0] = -table[i][0];
            negated[i][1] = -table[i][1];
        }
        return negated;
    }
}
