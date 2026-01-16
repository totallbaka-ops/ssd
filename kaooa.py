"""
Kaooa Board Game - REBUILT FROM SCRATCH
A traditional Indian strategy game where 7 crows try to trap 1 vulture.
"""

import turtle
import math
from typing import Set, Optional

# Game Constants
POINT_RADIUS = 15
CROW_COLOR = "black"
VULTURE_COLOR = "red"
BOARD_COLOR = "brown"
BG_COLOR = "lightgray"
HIGHLIGHT_COLOR = "yellow"

class KaooaBoard:
    """Simple star board with equal edge lengths."""
    
    def __init__(self):
        # Create a 10-point star with equal edges
        # 5 outer points (tips) + 5 inner points
        self.points = {}
        
        # Outer pentagon points (tips of star)
        outer_radius = 200
        for i in range(5):
            angle = math.radians(-90 + i * 72)  # Start from top
            x = outer_radius * math.cos(angle)
            y = outer_radius * math.sin(angle)
            self.points[i] = (x, y)
        
        # Inner pentagon points (calculated to make star)
        inner_radius = outer_radius * 0.382  # Golden ratio for regular star
        for i in range(5):
            angle = math.radians(-90 + 36 + i * 72)  # Offset by 36 degrees
            x = inner_radius * math.cos(angle)
            y = inner_radius * math.sin(angle)
            self.points[i + 5] = (x, y)
        
        # Connections - star pattern
        # Each outer point connects to its 2 adjacent inner points
        # Inner points form a pentagon
        # Outer points form star by connecting across
        self.connections = {
            # Outer points
            0: [5, 9, 2, 3],  # top
            1: [5, 6, 3, 4],  # top-right
            2: [6, 7, 4, 0],  # bottom-right
            3: [7, 8, 0, 1],  # bottom-left
            4: [8, 9, 1, 2],  # top-left
            # Inner points
            5: [0, 1, 6, 9],
            6: [1, 2, 5, 7],
            7: [2, 3, 6, 8],
            8: [3, 4, 7, 9],
            9: [4, 0, 8, 5],
        }
        
        # Calculate edge length (all edges should be equal now)
        x1, y1 = self.points[0]
        x2, y2 = self.points[5]
        self.edge_length = math.sqrt((x2-x1)**2 + (y2-y1)**2)
        print(f"Board initialized with edge length: {self.edge_length:.2f}")
    
    def draw(self, screen):
        """Draw the star board."""
        drawer = turtle.Turtle()
        drawer.speed(0)
        drawer.hideturtle()
        drawer.pensize(3)
        drawer.color(BOARD_COLOR)
        
        # Draw all connections
        drawn = set()
        for p1, neighbors in self.connections.items():
            for p2 in neighbors:
                edge = tuple(sorted([p1, p2]))
                if edge not in drawn:
                    drawer.penup()
                    drawer.goto(self.points[p1])
                    drawer.pendown()
                    drawer.goto(self.points[p2])
                    drawn.add(edge)
        
        # Draw nodes
        for point_id, (x, y) in self.points.items():
            drawer.penup()
            drawer.goto(x, y)
            drawer.dot(POINT_RADIUS * 2, "white")
            drawer.dot(POINT_RADIUS * 1.6, BG_COLOR)
    
    def get_point_at_click(self, x, y):
        """Get point ID from click coordinates."""
        for point_id, (px, py) in self.points.items():
            dist = math.sqrt((x - px)**2 + (y - py)**2)
            if dist <= POINT_RADIUS * 1.5:
                return point_id
        return None
    
    def are_connected(self, p1, p2):
        """Check if two points are connected by an edge."""
        return p2 in self.connections.get(p1, [])
    
    def are_collinear(self, p1, p2, p3):
        """Check if 3 points form a straight line using cross product."""
        x1, y1 = self.points[p1]
        x2, y2 = self.points[p2]
        x3, y3 = self.points[p3]
        
        # Cross product of vectors (p1->p2) and (p1->p3)
        cross = abs((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1))
        
        # If cross product is near 0, points are collinear
        is_line = cross < 1.0
        
        if is_line:
            print(f"    Points {p1}-{p2}-{p3} are COLLINEAR (cross={cross:.4f})")
        
        return is_line


class KaooaGame:
    """Main game logic."""
    
    def __init__(self):
        self.board = KaooaBoard()
        
        # Game state
        self.crows = set()  # Set of crow positions
        self.vulture = None  # Vulture position (or None)
        self.crow_coins_left = 7  # Crows have 7 coins to place
        self.vulture_placed = False  # Vulture has 1 coin to place
        self.crows_captured = 0  # Count of captured crows
        self.current_turn = "crow"  # Strict alternation: "crow" or "vulture"
        self.selected = None  # Currently selected piece for movement
        self.game_over = False
        self.winner = None
        
        # Setup screen
        self.screen = turtle.Screen()
        self.screen.setup(900, 900)
        self.screen.bgcolor(BG_COLOR)
        self.screen.title("Kaooa - Crows vs Vulture")
        self.screen.tracer(0)
        
        # Drawer for pieces
        self.drawer = turtle.Turtle()
        self.drawer.hideturtle()
        self.drawer.speed(0)
        
        # Info text
        self.info = turtle.Turtle()
        self.info.hideturtle()
        self.info.penup()
        self.info.goto(0, -350)
        
        # Draw board
        self.board.draw(self.screen)
        self.update_display()
        
        # Bind click
        self.screen.onclick(self.on_click)
        
        print("\n" + "="*60)
        print("GAME START - Crow goes first!")
        print("="*60)
    
    def draw_piece(self, pos, color, highlight=False):
        """Draw a piece at position."""
        x, y = self.board.points[pos]
        self.drawer.penup()
        self.drawer.goto(x, y)
        if highlight:
            self.drawer.dot(POINT_RADIUS * 3, HIGHLIGHT_COLOR)
        self.drawer.dot(POINT_RADIUS * 2.5, color)
    
    def update_display(self):
        """Redraw all pieces and info."""
        self.drawer.clear()
        
        # Draw crows
        for pos in self.crows:
            highlight = (self.selected == pos and self.current_turn == "crow")
            self.draw_piece(pos, CROW_COLOR, highlight)
        
        # Draw vulture
        if self.vulture is not None:
            highlight = (self.selected == self.vulture and self.current_turn == "vulture")
            self.draw_piece(self.vulture, VULTURE_COLOR, highlight)
        
        # Update info
        self.info.clear()
        if self.game_over:
            self.info.write(f"GAME OVER! {self.winner} WINS!", 
                          align="center", font=("Arial", 28, "bold"))
        else:
            # Determine action
            if self.current_turn == "crow":
                if self.crow_coins_left > 0:
                    action = f"PLACE crow ({self.crow_coins_left} coins left)"
                else:
                    action = "MOVE a crow"
            else:
                if not self.vulture_placed:
                    action = "PLACE vulture"
                else:
                    action = "MOVE/CAPTURE"
            
            msg = (f"{self.current_turn.upper()}'s Turn - {action}\n"
                   f"Crows on board: {len(self.crows)} | Captured: {self.crows_captured} | "
                   f"Need {4 - self.crows_captured} more to win")
            self.info.write(msg, align="center", font=("Arial", 16, "normal"))
        
        self.screen.update()
    
    def on_click(self, x, y):
        """Handle click events."""
        if self.game_over:
            return
        
        point = self.board.get_point_at_click(x, y)
        if point is None:
            return
        
        print(f"\nClicked on point {point}")
        
        if self.current_turn == "crow":
            self.handle_crow_turn(point)
        else:
            self.handle_vulture_turn(point)
    
    def handle_crow_turn(self, point):
        """Handle crow's turn."""
        # PLACEMENT MODE
        if self.crow_coins_left > 0:
            if point not in self.crows and point != self.vulture:
                self.crows.add(point)
                self.crow_coins_left -= 1
                print(f"✓ Crow placed at {point}. Coins left: {self.crow_coins_left}")
                self.switch_turn()
            else:
                print("✗ Point occupied!")
        
        # MOVEMENT MODE
        else:
            if self.selected is None:
                # Select a crow
                if point in self.crows:
                    self.selected = point
                    print(f"✓ Crow at {point} selected")
                    self.update_display()
            else:
                # Move selected crow
                if point == self.selected:
                    # Deselect
                    self.selected = None
                    print("✓ Crow deselected")
                    self.update_display()
                elif point in self.crows:
                    # Select different crow
                    self.selected = point
                    print(f"✓ Different crow at {point} selected")
                    self.update_display()
                elif point == self.vulture:
                    print("✗ Cannot move to vulture!")
                elif self.board.are_connected(self.selected, point):
                    # Valid move
                    print(f"✓ Crow moved from {self.selected} to {point}")
                    self.crows.remove(self.selected)
                    self.crows.add(point)
                    self.selected = None
                    self.switch_turn()
                else:
                    print("✗ Not connected!")
    
    def handle_vulture_turn(self, point):
        """Handle vulture's turn."""
        # PLACEMENT MODE
        if not self.vulture_placed:
            if point not in self.crows and point != self.vulture:
                self.vulture = point
                self.vulture_placed = True
                print(f"✓ Vulture placed at {point}")
                self.switch_turn()
            else:
                print("✗ Point occupied!")
        
        # MOVEMENT MODE
        else:
            if self.selected is None:
                # Select vulture
                if point == self.vulture:
                    self.selected = point
                    print(f"✓ Vulture at {point} selected")
                    
                    # Check mandatory capture
                    if self.has_capture_available():
                        print("  ⚠ MUST CAPTURE! A capture is available.")
                    
                    self.update_display()
            else:
                # Move/capture vulture
                if point == self.vulture:
                    # Deselect
                    self.selected = None
                    print("✓ Vulture deselected")
                    self.update_display()
                elif point in self.crows:
                    print("✗ Cannot move to crow!")
                else:
                    # Check if this is a capture or regular move
                    crow_captured = self.find_capturable_crow(self.vulture, point)
                    
                    if crow_captured is not None:
                        # CAPTURE!
                        print(f"✓ CAPTURE! Vulture jumped from {self.vulture} over crow {crow_captured} to {point}")
                        self.vulture = point
                        self.crows.remove(crow_captured)
                        self.crows_captured += 1
                        self.selected = None
                        self.switch_turn()
                    elif self.board.are_connected(self.selected, point):
                        # Regular move
                        if self.has_capture_available():
                            print("✗ MUST CAPTURE! Cannot do regular move when capture is available.")
                            return
                        
                        print(f"✓ Vulture moved from {self.vulture} to {point}")
                        self.vulture = point
                        self.selected = None
                        self.switch_turn()
                    else:
                        print("✗ Invalid move!")
    
    def find_capturable_crow(self, vulture_pos, landing_pos):
        """Check if vulture can capture a crow by jumping to landing_pos.
        Returns crow position if valid capture, None otherwise."""
        
        print(f"  Checking capture: vulture {vulture_pos} -> landing {landing_pos}")
        
        # Find crows adjacent to vulture
        for crow_pos in self.board.connections[vulture_pos]:
            if crow_pos in self.crows:
                print(f"    Crow at {crow_pos} is adjacent to vulture")
                
                # Check if landing is adjacent to crow
                if landing_pos in self.board.connections[crow_pos]:
                    print(f"    Landing {landing_pos} is adjacent to crow {crow_pos}")
                    
                    # Check collinearity: vulture->crow->landing
                    if self.board.are_collinear(vulture_pos, crow_pos, landing_pos):
                        print(f"    ✓✓✓ VALID CAPTURE FOUND! ✓✓✓")
                        return crow_pos
        
        return None
    
    def has_capture_available(self):
        """Check if vulture has any capture available (mandatory capture rule)."""
        if self.vulture is None:
            return False
        
        # Check all crows adjacent to vulture
        for crow_pos in self.board.connections[self.vulture]:
            if crow_pos in self.crows:
                # Check all empty positions adjacent to crow
                for landing in self.board.connections[crow_pos]:
                    if landing != self.vulture and landing not in self.crows:
                        # Check if forms straight line
                        if self.board.are_collinear(self.vulture, crow_pos, landing):
                            return True
        
        return False
    
    def can_vulture_move(self):
        """Check if vulture can move at all (to detect trap)."""
        if self.vulture is None:
            return False
        
        # Check regular moves
        for neighbor in self.board.connections[self.vulture]:
            if neighbor not in self.crows:
                return True
        
        # Check captures
        if self.has_capture_available():
            return True
        
        return False
    
    def switch_turn(self):
        """Switch turn and check game over."""
        # Switch turn
        if self.current_turn == "crow":
            self.current_turn = "vulture"
        else:
            self.current_turn = "crow"
        
        print(f"→ Turn switched to {self.current_turn.upper()}")
        
        # Check game over
        self.check_game_over()
        
        # Update display
        self.update_display()
    
    def check_game_over(self):
        """Check win conditions."""
        # Vulture wins if 4 crows captured
        if self.crows_captured >= 4:
            self.game_over = True
            self.winner = "VULTURE"
            print("\n" + "="*60)
            print("VULTURE WINS! Captured 4 crows!")
            print("="*60)
            return
        
        # Crows win if vulture is trapped
        if self.vulture_placed and not self.can_vulture_move():
            self.game_over = True
            self.winner = "CROWS"
            print("\n" + "="*60)
            print("CROWS WIN! Vulture is trapped!")
            print("="*60)
            return
    
    def run(self):
        """Start game loop."""
        print("\n📜 RULES:")
        print("  • Strict alternation: Crow → Vulture → Crow → Vulture...")
        print("  • Crow: Place 7 coins, then move")
        print("  • Vulture: Place 1 coin, then move/capture")
        print("  • Capture: Vulture-Crow-Empty in straight line → jump & remove crow")
        print("  • Vulture MUST capture if available")
        print("  • Win: Vulture captures 4 crows OR Crows trap vulture")
        print()
        
        self.screen.mainloop()


if __name__ == "__main__":
    game = KaooaGame()
    game.run()