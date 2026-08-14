import type {DsaProblem} from './types';

export const ISLAND_SENTENCE =
  'An island is a connected component of land. Flood-fill it with DFS or BFS, mark visited, count or measure, never revisit a cell.';

export const ISLAND_MAP = `flowchart TB
  GRID[Grid of land and water]
  GRID --> COMP[Connected component of 1s]
  COMP --> DFS[DFS recursion or stack]
  COMP --> BFS[BFS queue]
  DFS --> MARK[Mark visited 0 or seen]
  BFS --> MARK
  MARK --> COUNT[Count islands]
  MARK --> AREA[Max area / fish]
  MARK --> SHAPE[Distinct shape]
  MARK --> MULTI[Multi-source BFS distance]`;

export const ISLAND_WHEN: {need: string; problem: string; tool: string}[] = [
  {need: 'How many land blobs?', problem: 'Number of Islands', tool: 'DFS or BFS flood-fill, count starts'},
  {need: 'Biggest blob?', problem: 'Max Area of Island', tool: 'Return size of each flood-fill'},
  {need: 'Land touching border?', problem: 'Closed islands / enclaves', tool: 'Flood from border first, then count interior'},
  {need: 'Shortest water gap?', problem: 'Shortest Bridge', tool: 'DFS paint one island, BFS until the other'},
  {need: 'Distance from land?', problem: '01 Matrix / rotting oranges', tool: 'Multi-source BFS from all land/rotten cells'},
  {need: 'Online land adds?', problem: 'Number of Islands II', tool: 'Union-Find on cells, not DFS per query'},
];

export const ISLAND_PROBLEMS: DsaProblem[] = [
  {
    id: 'num-islands',
    lc: '200',
    title: 'Number of Islands',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Given an m×n grid of \'1\' (land) and \'0\' (water), count how many islands there are. An island is a group of land cells connected 4-directionally (up/down/left/right). Cells outside the grid are water.',
    example:
      "grid = [[1,1,0,0],[1,0,0,1],[0,0,1,1]] → 3 islands (top-left blob, bottom-right blob, and the single 1).",
    idea:
      'Scan every cell. When you see unvisited land, that is a new island: increment the answer and flood-fill (DFS or BFS) to mark the whole component visited. Each cell is processed once.',
    java: `static final int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};

int numIslands(char[][] g) {
  int islands = 0;
  for (int r = 0; r < g.length; r++) {
    for (int c = 0; c < g[0].length; c++) {
      if (g[r][c] == '1') {
        islands++;
        dfs(g, r, c);          // or bfs(g, r, c)
      }
    }
  }
  return islands;
}

void dfs(char[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') return;
  g[r][c] = '0';               // mark visited
  for (int[] d : D) dfs(g, r + d[0], c + d[1]);
}

void bfs(char[][] g, int sr, int sc) {
  ArrayDeque<int[]> q = new ArrayDeque<>();
  g[sr][sc] = '0';
  q.add(new int[]{sr, sc});
  while (!q.isEmpty()) {
    int[] p = q.poll();
    for (int[] d : D) {
      int r = p[0] + d[0], c = p[1] + d[1];
      if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != '1') continue;
      g[r][c] = '0';
      q.add(new int[]{r, c});
    }
  }
}`,
    time: 'O(R·C) — each cell enters DFS/BFS at most once',
    space: 'O(R·C) worst recursion/queue if the grid is one giant island',
    pitfalls: [
      '8-direction connectivity is a different problem — default is 4-dir.',
      'Do not count a cell of an already-marked island again.',
      'DFS on a 1000×1000 full-land grid can blow the Java stack; prefer BFS or an explicit stack.',
    ],
    remember: 'New island = unseen land. Flood the whole blob, then keep scanning.',
  },
  {
    id: 'max-area',
    lc: '695',
    title: 'Max Area of Island',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Same grid as Number of Islands, but return the area of the largest island. Area is the number of land cells in that connected component. Return 0 if there is no land.',
    example: 'A blob of 6 connected 1s and a blob of 2 → answer 6.',
    idea: 'Flood-fill returns the size of the component. Track the max size across starts.',
    java: `int maxAreaOfIsland(int[][] g) {
  int best = 0;
  for (int r = 0; r < g.length; r++)
    for (int c = 0; c < g[0].length; c++)
      if (g[r][c] == 1) best = Math.max(best, dfs(g, r, c));
  return best;
}

int dfs(int[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != 1) return 0;
  g[r][c] = 0;
  return 1 + dfs(g, r + 1, c) + dfs(g, r - 1, c) + dfs(g, r, c + 1) + dfs(g, r, c - 1);
}`,
    time: 'O(R·C)',
    space: 'O(R·C) recursion',
    pitfalls: ['Forgetting to add 1 for the current cell. Returning count of starts instead of size.'],
    remember: 'Number of Islands counts starts. Max Area returns the size of each flood.',
  },
  {
    id: 'island-perimeter',
    lc: '463',
    title: 'Island Perimeter',
    difficulty: 'Easy',
    pattern: 'DFS or BFS',
    statement:
      'The grid contains exactly one island (possibly with lakes of water inside? usually no holes in the easy version). Return the perimeter: each land cell contributes 4 edges minus 2 for every adjacent land-land neighbor pair.',
    example: 'A single cell → 4. Two cells sharing a side → 6.',
    idea:
      'Either iterate all land and count water/out-of-bounds neighbors, or use 4*land - 2*horizontal/vertical land-land edges. DFS is optional; a linear scan is enough.',
    java: `int islandPerimeter(int[][] g) {
  int peri = 0;
  for (int r = 0; r < g.length; r++) {
    for (int c = 0; c < g[0].length; c++) {
      if (g[r][c] == 0) continue;
      peri += 4;
      if (r > 0 && g[r - 1][c] == 1) peri -= 2;
      if (c > 0 && g[r][c - 1] == 1) peri -= 2;
    }
  }
  return peri;
}`,
    time: 'O(R·C)',
    space: 'O(1)',
    pitfalls: ['Subtract 2 per shared edge, not 1. Do not double-count if you check all 4 neighbors without care.'],
    remember: 'Perimeter = 4×land − 2×shared sides.',
  },
  {
    id: 'flood-fill',
    lc: '733',
    title: 'Flood Fill',
    difficulty: 'Easy',
    pattern: 'DFS or BFS',
    statement:
      'You are given an image grid, a start pixel (sr, sc), and a new color. Recolor the connected component of pixels that have the same original color as the start pixel (4-direction). Return the image.',
    example: 'Start on a blob of 1s, newColor=2 → that blob becomes 2, other colors unchanged.',
    idea: 'Classic flood-fill. Guard against newColor == oldColor or you infinite-loop.',
    java: `int[][] floodFill(int[][] img, int sr, int sc, int color) {
  int old = img[sr][sc];
  if (old != color) dfs(img, sr, sc, old, color);
  return img;
}

void dfs(int[][] img, int r, int c, int old, int color) {
  if (r < 0 || c < 0 || r >= img.length || c >= img[0].length || img[r][c] != old) return;
  img[r][c] = color;
  dfs(img, r + 1, c, old, color);
  dfs(img, r - 1, c, old, color);
  dfs(img, r, c + 1, old, color);
  dfs(img, r, c - 1, old, color);
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['If new color equals old color, DFS never stops unless you check equality first.'],
    remember: 'Paint bucket tool. Same as Number of Islands, one start, recolor instead of count.',
  },
  {
    id: 'surrounded-regions',
    lc: '130',
    title: 'Surrounded Regions',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'A board of O and X. Capture all regions of O that are fully surrounded by X: flip those O to X. Any O connected to the border cannot be captured.',
    example: 'Interior OOO surrounded by X becomes XXX. An O on the edge keeps its whole connected group as O.',
    idea:
      'Do not start from interior. Flood-fill from every border O and mark them safe (e.g. T). Then flip remaining O → X and T → O.',
    java: `void solve(char[][] b) {
  int R = b.length, C = b[0].length;
  for (int r = 0; r < R; r++) {
    dfs(b, r, 0);
    dfs(b, r, C - 1);
  }
  for (int c = 0; c < C; c++) {
    dfs(b, 0, c);
    dfs(b, R - 1, c);
  }
  for (int r = 0; r < R; r++) {
    for (int c = 0; c < C; c++) {
      if (b[r][c] == 'O') b[r][c] = 'X';
      else if (b[r][c] == 'T') b[r][c] = 'O';
    }
  }
}

void dfs(char[][] b, int r, int c) {
  if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] != 'O') return;
  b[r][c] = 'T';
  dfs(b, r + 1, c); dfs(b, r - 1, c); dfs(b, r, c + 1); dfs(b, r, c - 1);
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['Starting DFS from every O captures the wrong set. Border-first is the trick.'],
    remember: 'Save the border-connected O first. Everything else drowns.',
  },
  {
    id: 'closed-islands',
    lc: '1254',
    title: 'Number of Closed Islands',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Grid of 0 (land) and 1 (water). A closed island is land completely surrounded by water — it does not touch the border. Count closed islands.',
    example: 'A land blob in the middle with water on all sides counts. A blob that touches row 0 does not.',
    idea: 'Same as Surrounded Regions: flood-fill all border land so it cannot be counted, then count remaining land components.',
    java: `int closedIsland(int[][] g) {
  int R = g.length, C = g[0].length;
  for (int r = 0; r < R; r++) { dfs(g, r, 0); dfs(g, r, C - 1); }
  for (int c = 0; c < C; c++) { dfs(g, 0, c); dfs(g, R - 1, c); }
  int n = 0;
  for (int r = 0; r < R; r++)
    for (int c = 0; c < C; c++)
      if (g[r][c] == 0) { n++; dfs(g, r, c); }
  return n;
}

void dfs(int[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != 0) return;
  g[r][c] = 1;
  dfs(g, r + 1, c); dfs(g, r - 1, c); dfs(g, r, c + 1); dfs(g, r, c - 1);
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['Land is 0 here, water is 1 — opposite of Number of Islands. Read the legend.'],
    remember: 'Closed = not touching the frame. Paint the frame first.',
  },
  {
    id: 'enclaves',
    lc: '1020',
    title: 'Number of Enclaves',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Grid of 0 water and 1 land. An enclave is a land cell that cannot walk to the border (4-dir). Return how many such land cells there are (the total area, not the number of blobs).',
    example: 'Interior island of 3 cells that cannot reach the edge → 3.',
    idea: 'Flood-fill from the border to sink all escapable land. Count remaining 1s.',
    java: `int numEnclaves(int[][] g) {
  int R = g.length, C = g[0].length;
  for (int r = 0; r < R; r++) { dfs(g, r, 0); dfs(g, r, C - 1); }
  for (int c = 0; c < C; c++) { dfs(g, 0, c); dfs(g, R - 1, c); }
  int cells = 0;
  for (int[] row : g) for (int v : row) if (v == 1) cells++;
  return cells;
}

void dfs(int[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != 1) return;
  g[r][c] = 0;
  dfs(g, r + 1, c); dfs(g, r - 1, c); dfs(g, r, c + 1); dfs(g, r, c - 1);
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['This asks for cell count, not island count. Closed Islands asks for blob count.'],
    remember: 'Enclaves = leftover land area after washing the border.',
  },
  {
    id: 'sub-islands',
    lc: '1905',
    title: 'Count Sub Islands',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Two grids grid1 and grid2 of the same size. A sub-island is an island in grid2 whose every land cell is also land in grid1. Count how many islands of grid2 are sub-islands.',
    example: 'grid2 has an island that sticks out onto water in grid1 → that island is not a sub-island.',
    idea:
      'DFS each island in grid2. If any of its cells is water in grid1, the whole island fails. Still visit the whole island so you do not double-count.',
    java: `int countSubIslands(int[][] a, int[][] b) {
  int n = 0;
  for (int r = 0; r < b.length; r++)
    for (int c = 0; c < b[0].length; c++)
      if (b[r][c] == 1 && dfs(a, b, r, c)) n++;
  return n;
}

boolean dfs(int[][] a, int[][] b, int r, int c) {
  if (r < 0 || c < 0 || r >= b.length || c >= b[0].length || b[r][c] == 0) return true;
  b[r][c] = 0;
  boolean ok = a[r][c] == 1;
  ok &= dfs(a, b, r + 1, c);
  ok &= dfs(a, b, r - 1, c);
  ok &= dfs(a, b, r, c + 1);
  ok &= dfs(a, b, r, c - 1);
  return ok;
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['Returning false early without finishing the flood leaves leftover 1s that spawn fake extra islands.'],
    remember: 'Walk the whole grid2 island. One mismatch fails the island, not one cell.',
  },
  {
    id: 'distinct-islands',
    lc: '694',
    title: 'Number of Distinct Islands',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Count islands that have unique shapes. Two islands are the same if you can translate one onto the other (same relative geometry). Rotation/reflection do not count as the same in this problem.',
    example: 'An L of three cells and another L shifted right are the same shape. A mirrored L is different.',
    idea:
      'During flood-fill, record each cell as (r - r0, c - c0) relative to the start, or record the move path (D/U/L/R plus backtrack). Put the signature in a HashSet.',
    java: `int numDistinctIslands(int[][] g) {
  Set<String> shapes = new HashSet<>();
  for (int r = 0; r < g.length; r++)
    for (int c = 0; c < g[0].length; c++)
      if (g[r][c] == 1) {
        StringBuilder sig = new StringBuilder();
        dfs(g, r, c, r, c, sig);
        shapes.add(sig.toString());
      }
  return shapes.size();
}

void dfs(int[][] g, int r, int c, int r0, int c0, StringBuilder sig) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != 1) return;
  g[r][c] = 0;
  sig.append(r - r0).append(',').append(c - c0).append(';');
  dfs(g, r + 1, c, r0, c0, sig);
  dfs(g, r - 1, c, r0, c0, sig);
  dfs(g, r, c + 1, r0, c0, sig);
  dfs(g, r, c - 1, r0, c0, sig);
}`,
    time: 'O(R·C)',
    space: 'O(R·C) for signatures',
    pitfalls: ['Must canonicalize origin. Path signatures need a backtrack marker or two different DFS orders collide.'],
    remember: 'Normalize coordinates to the first cell. Hash the shape, not the absolute position.',
  },
  {
    id: 'shortest-bridge',
    lc: '934',
    title: 'Shortest Bridge',
    difficulty: 'Medium',
    pattern: 'BFS then DFS',
    statement:
      'The grid contains exactly two islands. You may flip 0s to 1s. Return the smallest number of 0s you must flip to connect the two islands (the water distance between them).',
    example: 'Islands separated by a single water cell → 1. Adjacent islands would be 0, but the problem guarantees two islands.',
    idea:
      'DFS/BFS paint island A and push all of its cells into a queue. Multi-source BFS outward through water until you hit island B. The distance is the number of water steps.',
    java: `int shortestBridge(int[][] g) {
  int R = g.length, C = g[0].length;
  ArrayDeque<int[]> q = new ArrayDeque<>();
  boolean found = false;
  for (int r = 0; r < R && !found; r++)
    for (int c = 0; c < C && !found; c++)
      if (g[r][c] == 1) { paint(g, r, c, q); found = true; }

  int dist = 0;
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty()) {
    for (int k = q.size(); k > 0; k--) {
      int[] p = q.poll();
      for (int[] d : D) {
        int r = p[0] + d[0], c = p[1] + d[1];
        if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] == -1) continue;
        if (g[r][c] == 1) return dist;
        g[r][c] = -1;
        q.add(new int[]{r, c});
      }
    }
    dist++;
  }
  return -1;
}

void paint(int[][] g, int r, int c, ArrayDeque<int[]> q) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] != 1) return;
  g[r][c] = -1;
  q.add(new int[]{r, c});
  paint(g, r + 1, c, q); paint(g, r - 1, c, q); paint(g, r, c + 1, q); paint(g, r, c - 1, q);
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['BFS levels: increment distance once per layer, not per neighbor. Do not paint both islands first.'],
    remember: 'Paint one island, then BFS across water until you bump the other.',
  },
  {
    id: 'large-island',
    lc: '827',
    title: 'Making A Large Island',
    difficulty: 'Hard',
    pattern: 'DFS or BFS',
    statement:
      'You may change at most one 0 into 1. Return the size of the largest possible island after that change (or the current max if the grid is already all land).',
    example: 'Two islands of size 3 separated by one 0 that touches both → flipping that 0 yields 7.',
    idea:
      'Label every island with an id and store id → area. For each 0, look at unique neighboring island ids and sum those areas + 1.',
    java: `int largestIsland(int[][] g) {
  int n = g.length, id = 2, best = 0;
  Map<Integer, Integer> area = new HashMap<>();
  for (int r = 0; r < n; r++)
    for (int c = 0; c < n; c++)
      if (g[r][c] == 1) {
        int a = dfs(g, r, c, id);
        area.put(id, a);
        best = Math.max(best, a);
        id++;
      }
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  for (int r = 0; r < n; r++) {
    for (int c = 0; c < n; c++) {
      if (g[r][c] != 0) continue;
      Set<Integer> seen = new HashSet<>();
      int extra = 1;
      for (int[] d : D) {
        int nr = r + d[0], nc = c + d[1];
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        int i = g[nr][nc];
        if (i > 1 && seen.add(i)) extra += area.get(i);
      }
      best = Math.max(best, extra);
    }
  }
  return best == 0 ? n * n : best;
}

int dfs(int[][] g, int r, int c, int id) {
  if (r < 0 || c < 0 || r >= g.length || c >= g.length || g[r][c] != 1) return 0;
  g[r][c] = id;
  return 1 + dfs(g, r + 1, c, id) + dfs(g, r - 1, c, id) + dfs(g, r, c + 1, id) + dfs(g, r, c - 1, id);
}`,
    time: 'O(N²)',
    space: 'O(N²)',
    pitfalls: ['Neighboring the same island twice must not double-count — use a Set of ids.'],
    remember: 'Paint ids first. A water cell is a zipper between unique neighboring islands.',
  },
  {
    id: 'pacific-atlantic',
    lc: '417',
    title: 'Pacific Atlantic Water Flow',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Heights grid. Rain flows to a neighbor if neighbor height ≤ current. Pacific touches top and left borders; Atlantic touches bottom and right. Return all cells from which water can reach both oceans.',
    example: 'A high cell in the middle that can run downhill to both borders is in the answer.',
    idea:
      'Reverse the flow: DFS/BFS inland from Pacific borders and from Atlantic borders, only walking to equal-or-higher cells. Intersect the two reachable sets.',
    java: `List<List<Integer>> pacificAtlantic(int[][] h) {
  int R = h.length, C = h[0].length;
  boolean[][] pac = new boolean[R][C], atl = new boolean[R][C];
  for (int r = 0; r < R; r++) { dfs(h, pac, r, 0); dfs(h, atl, r, C - 1); }
  for (int c = 0; c < C; c++) { dfs(h, pac, 0, c); dfs(h, atl, R - 1, c); }
  List<List<Integer>> ans = new ArrayList<>();
  for (int r = 0; r < R; r++)
    for (int c = 0; c < C; c++)
      if (pac[r][c] && atl[r][c]) ans.add(List.of(r, c));
  return ans;
}

void dfs(int[][] h, boolean[][] seen, int r, int c) {
  seen[r][c] = true;
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  for (int[] d : D) {
    int nr = r + d[0], nc = c + d[1];
    if (nr < 0 || nc < 0 || nr >= h.length || nc >= h[0].length) continue;
    if (seen[nr][nc] || h[nr][nc] < h[r][c]) continue; // reverse: climb up
    dfs(h, seen, nr, nc);
  }
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['Simulating from every cell is O((RC)²). Reverse DFS from oceans is the intended solution.'],
    remember: 'Do not pour from every cell. Climb uphill from both oceans and take the intersection.',
  },
  {
    id: 'rotting-oranges',
    lc: '994',
    title: 'Rotting Oranges',
    difficulty: 'Medium',
    pattern: 'BFS',
    statement:
      'Grid: 0 empty, 1 fresh orange, 2 rotten. Every minute, rotten oranges rot 4-dir adjacent fresh ones. Return minutes until no fresh orange remains, or -1 if impossible.',
    example: 'One rotten next to two fresh in a line → 2 minutes. A fresh orange in a closed empty corner → -1.',
    idea: 'Multi-source BFS: enqueue all initially rotten. Level-order minutes. Count fresh; if leftover fresh at the end, -1.',
    java: `int orangesRotting(int[][] g) {
  int R = g.length, C = g[0].length, fresh = 0, minutes = 0;
  ArrayDeque<int[]> q = new ArrayDeque<>();
  for (int r = 0; r < R; r++)
    for (int c = 0; c < C; c++) {
      if (g[r][c] == 2) q.add(new int[]{r, c});
      if (g[r][c] == 1) fresh++;
    }
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty() && fresh > 0) {
    minutes++;
    for (int k = q.size(); k > 0; k--) {
      int[] p = q.poll();
      for (int[] d : D) {
        int r = p[0] + d[0], c = p[1] + d[1];
        if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] != 1) continue;
        g[r][c] = 2;
        fresh--;
        q.add(new int[]{r, c});
      }
    }
  }
  return fresh == 0 ? minutes : -1;
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['Start minutes at 0; increment per layer. If already no fresh, return 0 not -1.'],
    remember: 'All rotten oranges tick together. That is multi-source BFS, not one DFS per orange.',
  },
  {
    id: 'zero-one-matrix',
    lc: '542',
    title: '01 Matrix',
    difficulty: 'Medium',
    pattern: 'BFS',
    statement:
      'Grid of 0s and 1s. For each cell, return the distance to the nearest 0 (4-dir). Distance of a 0 to itself is 0.',
    example: 'A 1 next to a 0 has distance 1. A 1 boxed by other 1s walks until a 0.',
    idea: 'Multi-source BFS from every 0. First time you reach a 1, that distance is minimal.',
    java: `int[][] updateMatrix(int[][] mat) {
  int R = mat.length, C = mat[0].length;
  int[][] dist = new int[R][C];
  ArrayDeque<int[]> q = new ArrayDeque<>();
  boolean[][] seen = new boolean[R][C];
  for (int r = 0; r < R; r++)
    for (int c = 0; c < C; c++)
      if (mat[r][c] == 0) { q.add(new int[]{r, c}); seen[r][c] = true; }
      else dist[r][c] = Integer.MAX_VALUE;
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty()) {
    int[] p = q.poll();
    for (int[] d : D) {
      int r = p[0] + d[0], c = p[1] + d[1];
      if (r < 0 || c < 0 || r >= R || c >= C || seen[r][c]) continue;
      dist[r][c] = dist[p[0]][p[1]] + 1;
      seen[r][c] = true;
      q.add(new int[]{r, c});
    }
  }
  return dist;
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['BFS from each 1 separately is too slow. Always invert: start from all zeros.'],
    remember: 'Nearest 0 = multi-source BFS from every 0. Same skeleton as rotting oranges.',
  },
  {
    id: 'far-from-land',
    lc: '1162',
    title: 'As Far from Land as Possible',
    difficulty: 'Medium',
    pattern: 'BFS',
    statement:
      'Grid of 0 water and 1 land. Find a water cell whose distance to the nearest land is maximized. Return that distance, or -1 if the grid is all water or all land.',
    example: 'A water cell in the opposite corner from a single land cell is the farthest.',
    idea: 'Multi-source BFS from all land. The last water cell you reach has the maximum nearest-land distance.',
    java: `int maxDistance(int[][] g) {
  int n = g.length;
  ArrayDeque<int[]> q = new ArrayDeque<>();
  for (int r = 0; r < n; r++)
    for (int c = 0; c < n; c++)
      if (g[r][c] == 1) q.add(new int[]{r, c});
  if (q.isEmpty() || q.size() == n * n) return -1;
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  int dist = -1;
  while (!q.isEmpty()) {
    dist++;
    for (int k = q.size(); k > 0; k--) {
      int[] p = q.poll();
      for (int[] d : D) {
        int r = p[0] + d[0], c = p[1] + d[1];
        if (r < 0 || c < 0 || r >= n || c >= n || g[r][c] != 0) continue;
        g[r][c] = 1;
        q.add(new int[]{r, c});
      }
    }
  }
  return dist;
}`,
    time: 'O(N²)',
    space: 'O(N²)',
    pitfalls: ['Return -1 for all-water and all-land. Last BFS layer distance is the answer.'],
    remember: 'Farthest water = last layer of multi-source BFS from land.',
  },
  {
    id: 'binary-matrix-path',
    lc: '1091',
    title: 'Shortest Path in Binary Matrix',
    difficulty: 'Medium',
    pattern: 'BFS',
    statement:
      'n×n grid of 0 (open) and 1 (blocked). Walk 8-direction from (0,0) to (n-1,n-1) through 0s. Return the length of the shortest clear path (number of cells), or -1.',
    example: 'All zeros 2×2 → 2 cells. Start cell blocked → -1.',
    idea: 'BFS on a grid with 8 neighbors. Mark visited when enqueueing. Path length is cells, so start at 1.',
    java: `int shortestPathBinaryMatrix(int[][] g) {
  int n = g.length;
  if (g[0][0] == 1 || g[n - 1][n - 1] == 1) return -1;
  ArrayDeque<int[]> q = new ArrayDeque<>();
  q.add(new int[]{0, 0, 1});
  g[0][0] = 1;
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1},{1,1},{1,-1},{-1,1},{-1,-1}};
  while (!q.isEmpty()) {
    int[] p = q.poll();
    if (p[0] == n - 1 && p[1] == n - 1) return p[2];
    for (int[] d : D) {
      int r = p[0] + d[0], c = p[1] + d[1];
      if (r < 0 || c < 0 || r >= n || c >= n || g[r][c] == 1) continue;
      g[r][c] = 1;
      q.add(new int[]{r, c, p[2] + 1});
    }
  }
  return -1;
}`,
    time: 'O(N²)',
    space: 'O(N²)',
    pitfalls: ['This one is 8-direction, unlike Number of Islands. Length counts cells including start.'],
    remember: 'Unweighted shortest path on a grid is BFS, never DFS.',
  },
  {
    id: 'walls-gates',
    lc: '286',
    title: 'Walls and Gates',
    difficulty: 'Medium',
    pattern: 'BFS',
    statement:
      'Grid: -1 wall, 0 gate, INF empty room. Fill each empty room with the distance to the nearest gate. Walls stay -1. If a room cannot reach a gate, leave INF.',
    example: 'A room next to a gate becomes 1. A room two steps away becomes 2.',
    idea: 'Multi-source BFS from all gates. Same pattern as 01 Matrix.',
    java: `void wallsAndGates(int[][] rooms) {
  int INF = Integer.MAX_VALUE, R = rooms.length, C = rooms[0].length;
  ArrayDeque<int[]> q = new ArrayDeque<>();
  for (int r = 0; r < R; r++)
    for (int c = 0; c < C; c++)
      if (rooms[r][c] == 0) q.add(new int[]{r, c});
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  while (!q.isEmpty()) {
    int[] p = q.poll();
    for (int[] d : D) {
      int r = p[0] + d[0], c = p[1] + d[1];
      if (r < 0 || c < 0 || r >= R || c >= C || rooms[r][c] != INF) continue;
      rooms[r][c] = rooms[p[0]][p[1]] + 1;
      q.add(new int[]{r, c});
    }
  }
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['DFS from each gate can overwrite with a worse distance unless you check min — BFS is cleaner.'],
    remember: 'Gates are zeros. Multi-source BFS fills INF rooms.',
  },
  {
    id: 'islands-ii',
    lc: '305',
    title: 'Number of Islands II',
    difficulty: 'Hard',
    pattern: 'Union-Find',
    statement:
      'Start with an empty sea. You are given a list of positions where land is added one cell at a time. After each add, return how many islands currently exist.',
    example: 'Add (0,0) → 1. Add a 4-adjacent cell → still 1 (they merge). Add a far cell → 2.',
    idea:
      'Union-Find on R·C cells. Adding land increments the count, then union with 4-dir land neighbors and decrement once per successful merge.',
    java: `List<Integer> numIslands2(int m, int n, int[][] positions) {
  int[] parent = new int[m * n];
  Arrays.fill(parent, -1);
  int[][] D = {{1,0},{-1,0},{0,1},{0,-1}};
  int islands = 0;
  List<Integer> ans = new ArrayList<>();
  for (int[] p : positions) {
    int id = p[0] * n + p[1];
    if (parent[id] != -1) { ans.add(islands); continue; } // duplicate add
    parent[id] = id;
    islands++;
    for (int[] d : D) {
      int r = p[0] + d[0], c = p[1] + d[1];
      if (r < 0 || c < 0 || r >= m || c >= n) continue;
      int nid = r * n + c;
      if (parent[nid] == -1) continue;
      int a = find(parent, id), b = find(parent, nid);
      if (a != b) { parent[a] = b; islands--; }
    }
    ans.add(islands);
  }
  return ans;
}

int find(int[] p, int x) {
  return p[x] == x ? x : (p[x] = find(p, p[x]));
}`,
    time: 'O(K · α(R·C)) for K positions',
    space: 'O(R·C)',
    pitfalls: ['Re-running DFS after every insert is O(K·R·C). Duplicates in positions must not increment twice.'],
    remember: 'Online islands = Union-Find. Offline snapshot = DFS flood-fill.',
  },
  {
    id: 'max-fish',
    lc: '2658',
    title: 'Maximum Number of Fish in a Grid',
    difficulty: 'Medium',
    pattern: 'DFS or BFS',
    statement:
      'Grid of non-negative integers. 0 is land you cannot fish. A positive cell is water with that many fish. Start at any water cell and walk 4-dir through water, collecting all fish in that connected component. Return the maximum you can collect in one start.',
    example: 'A pond with cells 4, 5, 0 nearby land → 9 if those 4 and 5 connect.',
    idea: 'Max Area of Island, but cell values add instead of +1.',
    java: `int findMaxFish(int[][] g) {
  int best = 0;
  for (int r = 0; r < g.length; r++)
    for (int c = 0; c < g[0].length; c++)
      if (g[r][c] > 0) best = Math.max(best, dfs(g, r, c));
  return best;
}

int dfs(int[][] g, int r, int c) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0].length || g[r][c] == 0) return 0;
  int fish = g[r][c];
  g[r][c] = 0;
  return fish + dfs(g, r + 1, c) + dfs(g, r - 1, c) + dfs(g, r, c + 1) + dfs(g, r, c - 1);
}`,
    time: 'O(R·C)',
    space: 'O(R·C)',
    pitfalls: ['Zero is blocked, not a zero-fish water cell you can cross.'],
    remember: 'Max area, but sum the cell values. Same flood-fill.',
  },
];
