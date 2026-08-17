import javax.swing.JPanel;
import javax.swing.Timer;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.Rectangle;
import java.awt.RenderingHints;
import java.awt.event.ActionEvent;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.awt.geom.Rectangle2D;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;

/**
 * 60 FPS 루프, 입력, 렌더. 보드/미노 데이터는 모델 클래스가 가진다.
 */
public final class GamePanel extends JPanel {

    private static final int FPS = 60;
    private static final int FRAME_MS = 1000 / FPS;
    private static final int BASE_GRAVITY_MS = 800;
    private static final int SOFT_DROP_MS = 50;
    private static final int[] LINE_SCORES = {0, 100, 300, 500, 800};

    private static final Color BG = new Color(0x0B0D10);
    private static final Color BOARD_WELL = new Color(0x12151C);
    private static final Color CELL = new Color(0x1C212B);
    private static final Color CELL_INSET = new Color(0x252B36);
    private static final Color GRID = new Color(0x5B6574);
    private static final Color BORDER = new Color(0xE8E0D0);
    private static final Color SHADOW = new Color(0x050608);
    private static final Color HUD = new Color(0xF4EEE4);
    private static final Color HUD_MUTED = new Color(0x9AA3B2);
    private static final Color ACCENT = new Color(0xE07020);
    private static final Color OVERLAY = new Color(10, 12, 16, 180);
    private static final float GHOST_FILL_ALPHA = 0.14f;
    private static final float GHOST_STROKE_ALPHA = 0.18f;

    private final Layout layout;
    private final Board board = new Board();
    private final Timer gameLoop;
    private final Font titleFont;
    private final Font statFont;
    private final Font hintFont;
    private final Font overlayFont;
    private final Deque<Tetromino.Type> bag = new ArrayDeque<>();
    private final boolean[] keyHeld = new boolean[256];

    private Tetromino current;
    private Tetromino next;
    private boolean paused;
    private boolean gameOver;
    private boolean softDropping;
    private int gravityMsLeft = BASE_GRAVITY_MS;
    private int score;
    private int lines;
    private int level = 1;
    private long tick;

    public GamePanel() {
        layout = Layout.fromScreen();
        titleFont = new Font("Malgun Gothic", Font.BOLD, layout.titleSize);
        statFont = new Font("Malgun Gothic", Font.BOLD, layout.statSize);
        hintFont = new Font("Malgun Gothic", Font.PLAIN, layout.hintSize);
        overlayFont = new Font("Malgun Gothic", Font.BOLD, Math.max(40, layout.titleSize + 8));

        setPreferredSize(new Dimension(layout.windowWidth, layout.windowHeight));
        setBackground(BG);
        setFocusable(true);
        setFocusTraversalKeysEnabled(false);

        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                handleKeyPressed(e);
            }

            @Override
            public void keyReleased(KeyEvent e) {
                int code = e.getKeyCode();
                if (code >= 0 && code < keyHeld.length) {
                    keyHeld[code] = false;
                }
                if (code == KeyEvent.VK_DOWN) {
                    softDropping = false;
                }
            }
        });

        startNewGame();
        gameLoop = new Timer(FRAME_MS, this::onFrame);
        gameLoop.start();
    }

    @Override
    public void addNotify() {
        super.addNotify();
        requestFocusInWindow();
    }

    private void startNewGame() {
        board.clear();
        bag.clear();
        score = 0;
        lines = 0;
        level = 1;
        paused = false;
        gameOver = false;
        softDropping = false;
        gravityMsLeft = gravityInterval();
        next = new Tetromino(takeFromBag());
        spawnNext();
    }

    private void onFrame(ActionEvent e) {
        updateGame();
        repaint();
    }

    private void updateGame() {
        tick++;
        if (paused || gameOver || current == null) {
            return;
        }
        gravityMsLeft -= FRAME_MS;
        int interval = softDropping ? SOFT_DROP_MS : gravityInterval();
        while (gravityMsLeft <= 0) {
            gravityMsLeft += interval;
            if (!board.tryMove(current, 0, 1)) {
                lockAndSpawn();
                break;
            }
            if (softDropping) {
                score += 1;
            }
        }
    }

    private int gravityInterval() {
        return Math.max(100, BASE_GRAVITY_MS - (level - 1) * 70);
    }

    private void handleKeyPressed(KeyEvent e) {
        int code = e.getKeyCode();
        boolean repeat = code >= 0 && code < keyHeld.length && keyHeld[code];
        if (code >= 0 && code < keyHeld.length) {
            keyHeld[code] = true;
        }

        if (code == KeyEvent.VK_P) {
            if (!repeat && !gameOver) {
                paused = !paused;
            }
            return;
        }
        if (gameOver) {
            if (code == KeyEvent.VK_ENTER && !repeat) {
                startNewGame();
            }
            return;
        }
        if (paused || current == null) {
            return;
        }

        switch (code) {
            case KeyEvent.VK_LEFT -> board.tryMove(current, -1, 0);
            case KeyEvent.VK_RIGHT -> board.tryMove(current, 1, 0);
            case KeyEvent.VK_DOWN -> {
                softDropping = true;
                if (board.tryMove(current, 0, 1)) {
                    score += 1;
                    gravityMsLeft = gravityInterval();
                }
            }
            case KeyEvent.VK_UP -> {
                if (!repeat) {
                    board.tryRotate(current, 1);
                }
            }
            case KeyEvent.VK_Z -> {
                if (!repeat) {
                    board.tryRotate(current, -1);
                }
            }
            case KeyEvent.VK_SPACE -> {
                if (!repeat) {
                    hardDrop();
                }
            }
            default -> {
            }
        }
    }

    private void hardDrop() {
        int distance = board.dropDistance(current);
        if (distance > 0) {
            current.moveBy(0, distance);
            score += distance * 2;
        }
        lockAndSpawn();
    }

    private void lockAndSpawn() {
        board.lock(current);
        int cleared = board.clearFullLines();
        if (cleared > 0) {
            score += LINE_SCORES[cleared] * level;
            lines += cleared;
            level = 1 + lines / 10;
        }
        spawnNext();
    }

    private void spawnNext() {
        current = next;
        current.setPosition(3, 0);
        next = new Tetromino(takeFromBag());
        gravityMsLeft = gravityInterval();
        if (!board.fits(current)) {
            current = null;
            gameOver = true;
        }
    }

    private Tetromino.Type takeFromBag() {
        if (bag.isEmpty()) {
            List<Tetromino.Type> refill = new ArrayList<>(List.of(Tetromino.Type.values()));
            Collections.shuffle(refill);
            bag.addAll(refill);
        }
        return bag.removeFirst();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);

        drawBoard(g2);
        drawHud(g2);
        drawOverlay(g2);

        g2.dispose();
    }

    private void drawBoard(Graphics2D g2) {
        int originX = layout.boardX;
        int originY = layout.boardY;
        int cell = layout.cellSize;
        int boardW = Board.COLS * cell;
        int boardH = Board.ROWS * cell;

        g2.setColor(SHADOW);
        g2.fillRoundRect(originX + layout.shadowOffset, originY + layout.shadowOffset, boardW, boardH, 4, 4);
        g2.setColor(BOARD_WELL);
        g2.fillRect(originX, originY, boardW, boardH);

        int inset = Math.max(3, cell / 12);
        for (int row = 0; row < Board.ROWS; row++) {
            for (int col = 0; col < Board.COLS; col++) {
                int x = originX + col * cell;
                int y = originY + row * cell;
                int locked = board.get(col, row);
                if (locked != 0) {
                    fillBlock(g2, x, y, cell, Tetromino.Type.fromId(locked).color());
                } else {
                    g2.setColor(CELL);
                    g2.fillRect(x + 1, y + 1, cell - 1, cell - 1);
                    g2.setColor(CELL_INSET);
                    g2.fillRect(x + inset, y + inset, cell - inset * 2, cell - inset * 2);
                }
            }
        }

        if (current != null) {
            drawGhost(g2, originX, originY, cell);
            for (int[] pos : current.occupiedCells()) {
                fillBlock(g2, originX + pos[0] * cell, originY + pos[1] * cell, cell, current.color());
            }
        }

        g2.setColor(GRID);
        g2.setStroke(new BasicStroke(Math.max(2f, cell / 18f)));
        for (int col = 0; col <= Board.COLS; col++) {
            int x = originX + col * cell;
            g2.drawLine(x, originY, x, originY + boardH);
        }
        for (int row = 0; row <= Board.ROWS; row++) {
            int y = originY + row * cell;
            g2.drawLine(originX, y, originX + boardW, y);
        }

        g2.setColor(BORDER);
        g2.setStroke(new BasicStroke(layout.borderThickness, BasicStroke.CAP_SQUARE, BasicStroke.JOIN_MITER));
        float half = layout.borderThickness / 2f;
        g2.draw(new Rectangle2D.Float(
                originX - half,
                originY - half,
                boardW + layout.borderThickness,
                boardH + layout.borderThickness));
    }

    private void drawGhost(Graphics2D g2, int originX, int originY, int cell) {
        int distance = board.dropDistance(current);
        if (distance <= 0) {
            return;
        }
        Color color = current.color();
        int inset = Math.max(4, cell / 8);
        g2.setStroke(new BasicStroke(Math.max(1.25f, cell / 28f)));
        for (int[] pos : current.occupiedCells()) {
            int x = originX + pos[0] * cell + inset;
            int y = originY + (pos[1] + distance) * cell + inset;
            int size = cell - inset * 2;
            g2.setColor(color);
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, GHOST_FILL_ALPHA));
            g2.fillRect(x, y, size, size);
            g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, GHOST_STROKE_ALPHA));
            g2.drawRect(x, y, size - 1, size - 1);
        }
        g2.setComposite(AlphaComposite.SrcOver);
    }

    private void fillBlock(Graphics2D g2, int x, int y, int size, Color color) {
        g2.setColor(color);
        g2.fillRect(x + 1, y + 1, size - 1, size - 1);
        g2.setColor(brighter(color, 1.25f));
        g2.fillRect(x + 2, y + 2, size - 5, Math.max(4, size / 7));
        g2.setColor(color.darker());
        g2.fillRect(x + 2, y + size - Math.max(5, size / 8), size - 4, Math.max(4, size / 10));
    }

    private static Color brighter(Color color, float factor) {
        int r = Math.min(255, (int) (color.getRed() * factor));
        int g = Math.min(255, (int) (color.getGreen() * factor));
        int b = Math.min(255, (int) (color.getBlue() * factor));
        return new Color(r, g, b);
    }

    private void drawHud(Graphics2D g2) {
        int x = layout.hudX;
        int y = layout.boardY + layout.titleSize;

        g2.setColor(HUD);
        g2.setFont(titleFont);
        g2.drawString("DAD TETRIS", x, y);

        g2.setColor(ACCENT);
        g2.fillRect(x, y + 14, layout.cellSize * 3, Math.max(6, layout.cellSize / 7));

        int line = layout.statSize + 26;
        int statsY = y + 36 + layout.statSize;
        g2.setColor(HUD);
        g2.setFont(statFont);
        g2.drawString("SCORE  " + score, x, statsY);
        g2.drawString("LEVEL  " + level, x, statsY + line);
        g2.drawString("LINES  " + lines, x, statsY + line * 2);

        int nextY = statsY + line * 3 + 40;
        g2.setColor(HUD);
        g2.drawString("NEXT", x, nextY);
        drawNextPreview(g2, x, nextY + 20);

        g2.setColor(HUD_MUTED);
        g2.setFont(hintFont);
        int hintY = nextY + layout.cellSize * 6;
        int gap = layout.hintSize + 12;
        g2.drawString("← →  이동", x, hintY);
        g2.drawString("↑ / Z  회전", x, hintY + gap);
        g2.drawString("↓  소프트 드롭", x, hintY + gap * 2);
        g2.drawString("Space  하드드롭", x, hintY + gap * 3);
        g2.drawString("P  일시정지", x, hintY + gap * 4);
    }

    private void drawNextPreview(Graphics2D g2, int x, int y) {
        if (next == null) {
            return;
        }
        int cell = Math.max(28, (int) (layout.cellSize * 0.9));
        int[][] local = next.localCells();
        int minX = 4;
        int minY = 4;
        int maxX = 0;
        int maxY = 0;
        for (int[] pos : local) {
            minX = Math.min(minX, pos[0]);
            minY = Math.min(minY, pos[1]);
            maxX = Math.max(maxX, pos[0]);
            maxY = Math.max(maxY, pos[1]);
        }
        int boxW = (int) (layout.cellSize * 4.4);
        int boxH = (int) (layout.cellSize * 4.4);
        g2.setColor(BOARD_WELL);
        g2.fillRoundRect(x, y, boxW, boxH, 8, 8);
        g2.setColor(BORDER);
        g2.setStroke(new BasicStroke(3f));
        g2.drawRoundRect(x, y, boxW, boxH, 8, 8);

        int pieceW = (maxX - minX + 1) * cell;
        int pieceH = (maxY - minY + 1) * cell;
        int ox = x + (boxW - pieceW) / 2;
        int oy = y + (boxH - pieceH) / 2;
        for (int[] pos : local) {
            fillBlock(g2, ox + (pos[0] - minX) * cell, oy + (pos[1] - minY) * cell, cell, next.color());
        }
    }

    private void drawOverlay(Graphics2D g2) {
        if (!paused && !gameOver) {
            return;
        }
        int originX = layout.boardX;
        int originY = layout.boardY;
        int boardW = Board.COLS * layout.cellSize;
        int boardH = Board.ROWS * layout.cellSize;
        g2.setColor(OVERLAY);
        g2.fillRect(originX, originY, boardW, boardH);

        g2.setFont(overlayFont);
        String title = gameOver ? "게임 오버" : "일시정지";
        String hint = gameOver ? "Enter  다시 시작" : "P  계속하기";
        g2.setColor(HUD);
        int titleW = g2.getFontMetrics().stringWidth(title);
        g2.drawString(title, originX + (boardW - titleW) / 2, originY + boardH / 2 - 10);
        g2.setFont(statFont);
        g2.setColor(HUD_MUTED);
        int hintW = g2.getFontMetrics().stringWidth(hint);
        g2.drawString(hint, originX + (boardW - hintW) / 2, originY + boardH / 2 + layout.statSize + 16);
    }

    private static final class Layout {
        private static final int FRAME_CHROME = 48;

        final int cellSize;
        final int pad;
        final int boardX;
        final int boardY;
        final int hudX;
        final int windowWidth;
        final int windowHeight;
        final int titleSize;
        final int statSize;
        final int hintSize;
        final int borderThickness;
        final int shadowOffset;

        private Layout(int cellSize, int padX, int padY, int hudWidth) {
            this.cellSize = cellSize;
            this.pad = padY;
            this.boardX = padX;
            this.boardY = padY;
            this.hudX = padX + Board.COLS * cellSize + padX;
            this.windowWidth = this.hudX + hudWidth + padX;
            this.windowHeight = padY * 2 + Board.ROWS * cellSize;
            this.titleSize = Math.max(40, (int) (cellSize * 0.95));
            this.statSize = Math.max(30, (int) (cellSize * 0.68));
            this.hintSize = Math.max(22, (int) (cellSize * 0.46));
            this.borderThickness = Math.max(5, cellSize / 8);
            this.shadowOffset = Math.max(8, cellSize / 5);
        }

        /** 작업표시줄·타이틀바를 빼고, 세로 20칸이 화면을 거의 가득 채우게 셀을 키운다. */
        static Layout fromScreen() {
            Rectangle screen = GraphicsEnvironment.getLocalGraphicsEnvironment().getMaximumWindowBounds();
            int padY = 10;
            int cell = (screen.height - FRAME_CHROME - padY * 2) / Board.ROWS;
            cell = Math.max(28, cell);

            int hudWidth = Math.max(cell * 8, 420);
            int padX = Math.max(18, cell / 3);
            int totalW = padX * 3 + Board.COLS * cell + hudWidth;
            if (totalW > screen.width) {
                hudWidth = Math.max(cell * 7, 360);
                padX = Math.max(12, cell / 4);
                totalW = padX * 3 + Board.COLS * cell + hudWidth;
                if (totalW > screen.width) {
                    hudWidth = Math.max(300, screen.width / 5);
                    cell = Math.max(24, (screen.width - padX * 3 - hudWidth) / Board.COLS);
                    hudWidth = Math.max(cell * 7, 300);
                }
            }
            return new Layout(cell, padX, padY, hudWidth);
        }
    }
}
