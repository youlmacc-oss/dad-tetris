/**
 * 10x20 보드. 충돌, 고정, 줄 삭제.
 */
public final class Board {

    public static final int COLS = 10;
    public static final int ROWS = 20;

    /** 0 = 빈 칸, 1-7 = {@link Tetromino.Type#id()} */
    private final int[][] cells = new int[ROWS][COLS];

    public int get(int col, int row) {
        return cells[row][col];
    }

    public void set(int col, int row, int value) {
        cells[row][col] = value;
    }

    public boolean inBounds(int col, int row) {
        return col >= 0 && col < COLS && row >= 0 && row < ROWS;
    }

    public boolean isEmpty(int col, int row) {
        return inBounds(col, row) && cells[row][col] == 0;
    }

    public boolean fits(Tetromino piece) {
        for (int[] cell : piece.occupiedCells()) {
            int col = cell[0];
            int row = cell[1];
            if (!inBounds(col, row) || cells[row][col] != 0) {
                return false;
            }
        }
        return true;
    }

    public boolean tryMove(Tetromino piece, int dc, int dr) {
        piece.moveBy(dc, dr);
        if (fits(piece)) {
            return true;
        }
        piece.moveBy(-dc, -dr);
        return false;
    }

    /** dir +1 시계, -1 반시계. SRS 월킥. */
    public boolean tryRotate(Tetromino piece, int dir) {
        int from = piece.rotation();
        Tetromino test = piece.copy();
        if (dir > 0) {
            test.rotateClockwise();
        } else {
            test.rotateCounterClockwise();
        }
        int to = test.rotation();
        int originCol = piece.col();
        int originRow = piece.row();
        for (int[] kick : Tetromino.kicks(piece.type(), from, to)) {
            test.setPosition(originCol + kick[0], originRow + kick[1]);
            if (fits(test)) {
                piece.apply(test);
                return true;
            }
        }
        return false;
    }

    public int dropDistance(Tetromino piece) {
        Tetromino probe = piece.copy();
        int distance = 0;
        while (true) {
            probe.moveDown();
            if (!fits(probe)) {
                return distance;
            }
            distance++;
        }
    }

    public void lock(Tetromino piece) {
        int id = piece.type().id();
        for (int[] cell : piece.occupiedCells()) {
            if (inBounds(cell[0], cell[1])) {
                cells[cell[1]][cell[0]] = id;
            }
        }
    }

    public int clearFullLines() {
        int cleared = 0;
        int writeRow = ROWS - 1;
        for (int readRow = ROWS - 1; readRow >= 0; readRow--) {
            if (isFull(readRow)) {
                cleared++;
                continue;
            }
            if (writeRow != readRow) {
                System.arraycopy(cells[readRow], 0, cells[writeRow], 0, COLS);
            }
            writeRow--;
        }
        while (writeRow >= 0) {
            for (int col = 0; col < COLS; col++) {
                cells[writeRow][col] = 0;
            }
            writeRow--;
        }
        return cleared;
    }

    public void clear() {
        for (int row = 0; row < ROWS; row++) {
            for (int col = 0; col < COLS; col++) {
                cells[row][col] = 0;
            }
        }
    }

    private boolean isFull(int row) {
        for (int col = 0; col < COLS; col++) {
            if (cells[row][col] == 0) {
                return false;
            }
        }
        return true;
    }
}
