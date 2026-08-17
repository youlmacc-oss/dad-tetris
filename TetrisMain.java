import javax.swing.JFrame;
import javax.swing.SwingUtilities;
import javax.swing.WindowConstants;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.GraphicsEnvironment;
import java.awt.Rectangle;

/**
 * 앱 진입점. 창 크기·위치를 잡고, 게임 루프는 {@link GamePanel}에 맡긴다.
 */
public final class TetrisMain {

    private static final Color WINDOW_BG = new Color(0x0B0D10);

    public static void main(String[] args) {
        SwingUtilities.invokeLater(TetrisMain::createAndShow);
    }

    private static void createAndShow() {
        JFrame frame = new JFrame("Dad Tetris");
        frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        frame.setResizable(false);
        frame.getContentPane().setBackground(WINDOW_BG);

        GamePanel panel = new GamePanel();
        frame.add(panel);
        frame.pack();
        centerOnScreen(frame);
        frame.setVisible(true);
        panel.requestFocusInWindow();
    }

    /** 작업 표시줄을 제외한 영역 기준으로 창을 화면 정중앙에 둔다. */
    private static void centerOnScreen(JFrame frame) {
        Rectangle screen = GraphicsEnvironment.getLocalGraphicsEnvironment().getMaximumWindowBounds();
        Dimension size = frame.getSize();
        int x = screen.x + (screen.width - size.width) / 2;
        int y = screen.y + (screen.height - size.height) / 2;
        frame.setLocation(Math.max(screen.x, x), Math.max(screen.y, y));
    }

    private TetrisMain() {
    }
}
