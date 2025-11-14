let highScores = JSON.parse(localStorage.getItem('highScores')) || {snake:0, tetris:0, tictactoe:0, flappy:0};

function openGame(game) {
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('game-title').textContent = {
    snake: 'الأفعى', tetris: 'تيتريس', tictactoe: 'X O', flappy: 'فلابي بيرد'
  }[game];
  document.getElementById('game-content').innerHTML = '';
  document.getElementById('game-score').textContent = '';
  document.getElementById('high-score').textContent = `أعلى درجة: ${highScores[game]}`;
  initGame(game);
}

function closeGame() {
  document.getElementById('game-overlay').style.display = 'none';
  if (window.gameLoop) cancelAnimationFrame(window.gameLoop);
}

// === 1. Snake ===
function initSnake() {
  const canvas = document.createElement('canvas');
  canvas.width = 300; canvas.height = 300;
  document.getElement #game-content').appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const grid = 15;
  let snake = [{x:7,y:7}];
  let dx=0, dy=0, food = randomFood(), score = 0, speed = 100;
  let lastTime = 0;

  function randomFood() {
    return {x: Math.floor(Math.random()*20), y: Math.floor(Math.random()*20)};
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && dy !== 1) { dx=0; dy=-1; }
    if (e.key === 'ArrowDown' && dy !== -1) { dx=0; dy=1; }
    if (e.key === 'ArrowLeft' && dx !== 1) { dx=-1; dy=0; }
    if (e.key === 'ArrowRight' && dx !== -1) { dx=1; dy=0; }
  });

  function update(time = 0) {
    if (time - lastTime < speed) { window.gameLoop = requestAnimationFrame(update); return; }
    lastTime = time;

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame('snake', score);
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10; food = randomFood(); speed = Math.max(50, speed-2);
    } else snake.pop();

    ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#0f0'; snake.forEach(p => ctx.fillRect(p.x*grid, p.y*grid, grid-2, grid-2));
    ctx.fillStyle = '#f00'; ctx.fillRect(food.x*grid, food.y*grid, grid-2, grid-2);

    document.getElementById('game-score').textContent = `النقاط: ${score}`;
    window.gameLoop = requestAnimationFrame(update);
  }
  update();
}

// === 2. Tetris ===
function initTetris() {
  const canvas = document.createElement('canvas');
  canvas.width = 240; canvas.height = 400;
  document.getElementById('game-content').appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(20,20);

  const pieces = 'IJLOSTZ';
  const colors = [null, '#0ff','#fa0','#00f','#f80','#0f0','#f00','#a0f'];

  let arena = createMatrix(12,20);
  let player = {pos:{x:5,y:0}, matrix:null, score:0};
  let dropCounter = 0, dropInterval = 1000, lastTime = 0;

  function createMatrix(w,h) {
    const m = []; while(h--) m.push(new Array(w).fill(0)); return m;
  }

  function createPiece(type) {
    if (type==='T') return [[0,0,0],[1,1,1],[0,1,0]];
    if (type==='O') return [[1,1],[1,1]];
    if (type==='L') return [[0,0,1],[1,1,1],[0,0,0]];
    if (type==='J') return [[1,0,0],[1,1,1],[0,0,0]];
    if (type==='I') return [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
    if (type==='S') return [[0,1,1],[1,1,0],[0,0,0]];
    if (type==='Z') return [[1,1,0],[0,1,1],[0,0,0]];
  }

  function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,12,20);
    drawMatrix(arena, {x:0,y:0});
    drawMatrix(player.matrix, player.pos);
  }

  function drawMatrix(m, offset) {
    m.forEach((row,y) => row.forEach((v,x) => {
      if (v) { ctx.fillStyle = colors[v]; ctx.fillRect(x+offset.x, y+offset.y, 1, 1); }
    }));
  }

  function merge(a, p) {
    p.matrix.forEach((row,y) => row.forEach((v,x) => {
      if (v) a[y + p.pos.y][x + p.pos.x] = v;
    }));
  }

  function collide(a, p) {
    return p.matrix.some((row,y) => row.some((v,x) => v && (a[y+p.pos.y] && a[y+p.pos.y][x+p.pos.x]) !== 0));
  }

  function playerReset() {
    const type = pieces[pieces.length * Math.random() | 0];
    player.matrix = createPiece(type);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) endGame('tetris', player.score);
  }

  function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) { player.pos.y--; merge(arena, player); playerReset(); sweep(); }
    dropCounter = 0;
  }

  function sweep() {
    let rowCount = 0;
    outer: for (let y = arena.length-1; y > 0; --y) {
      for (let x = 0; x < arena[y].length; ++x) if (!arena[y][x]) continue outer;
      const row = arena.splice(y,1)[0].fill(0);
      arena.unshift(row); ++y; rowCount++;
    }
    player.score += rowCount ** 2 * 100;
  }

  function update(time=0) {
    const delta = time - lastTime; lastTime = time;
    dropCounter += delta;
    if (dropCounter > dropInterval) playerDrop();
    draw();
    document.getElementById('game-score').textContent = `النقاط: ${player.score}`;
    window.gameLoop = requestAnimationFrame(update);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { player.pos.x--; if (collide(arena, player)) player.pos.x++; }
    if (e.key === 'ArrowRight') { player.pos.x++; if (collide(arena, player)) player.pos.x--; }
    if (e.key === 'ArrowDown') playerDrop();
    if (e.key === 'ArrowUp') rotate(player.matrix, 1);
  });

  function rotate(m, dir) {
    for (let y=0; y<m.length; ++y) {
      for (let x=0; x<y; ++x) [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
    }
    if (dir > 0) m.forEach(row => row.reverse());
    else m.reverse();
  }

  playerReset(); update();
}

// === 3. Tic Tac Toe ===
function initTicTacToe() {
  const board = document.createElement('div');
  board.style.cssText = 'display:grid; grid-template-columns:repeat(3,80px); gap:5px; margin:20px auto; width:fit-content;';
  document.getElementById('game-content').appendChild(board);

  let cells = Array(9).fill(null);
  let player = 'X';

  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
  ];

  function checkWinner(b) {
    for (let combo of winCombos) {
      if (b[combo[0]] && b[combo[0]] === b[combo[1]] && b[combo[0]] === b[combo[2]]) return b[combo[0]];
    }
    return b.includes(null) ? null : 'tie';
  }

  function minimax(b, isMax) {
    const result = checkWinner(b);
    if (result === 'O') return 10;
    if (result === 'X') return -10;
    if (result === 'tie') return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i=0; i<9; i++) if (!b[i]) {
        b[i] = 'O'; best = Math.max(best, minimax(b, false)); b[i] = null;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i=0; i<9; i++) if (!b[i]) {
        b[i] = 'X'; best = Math.min(best, minimax(b, true)); b[i] = null;
      }
      return best;
    }
  }

  function aiMove() {
    let bestScore = -Infinity, move;
    for (let i=0; i<9; i++) {
      if (!cells[i]) {
        cells[i] = 'O';
        let score = minimax(cells, false);
        cells[i] = null;
        if (score > bestScore) { bestScore = score; move = i; }
      }
    }
    cells[move] = 'O';
    board.children[move].textContent = 'O';
    const result = checkWinner(cells);
    if (result) endGame('tictactoe', result === 'X' ? 100 : 0);
  }

  for (let i=0; i<9; i++) {
    const cell = document.createElement('div');
    cell.style.cssText = 'width:80px; height:80px; background:#222; display:flex; align-items:center; justify-content:center; font-size:2em; cursor:pointer; border-radius:10px;';
    cell.onclick = () => {
      if (cells[i] || player !== 'X') return;
      cells[i] = 'X'; cell.textContent = 'X';
      const result = checkWinner(cells);
      if (result) endGame('tictactoe', result === 'X' ? 100 : 0);
      else setTimeout(aiMove, 300);
    };
    board.appendChild(cell);
  }
}

// === 4. Flappy Bird ===
function initFlappy() {
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 480;
  document.getElementById('game-content').appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let bird = {y: 240, v:0}, pipes = [], score = 0, gravity = 0.5, jump = -10;
  pipes.push({x:320, top: Math.random()*200 + 50});

  canvas.onclick = () => bird.v = jump;

  function update() {
    bird.v += gravity; bird.y += bird.v;
    if (bird.y > 480 || bird.y < 0) endGame('flappy', score);

    pipes.forEach((p, i) => {
      p.x -= 2;
      if (p.x < -60) pipes.splice(i,1);
      if (p.x === 100) { score += 1; pipes.push({x:320, top: Math.random()*200 + 50}); }
      if (p.x < 80 && p.x > 20 && (bird.y < p.top || bird.y > p.top + 120)) endGame('flappy', score);
    });

    ctx.fillStyle = '#87CEEB'; ctx.fillRect(0,0,320,480);
    ctx.fillStyle = '#FF0'; ctx.fillRect(50, bird.y, 30, 30);
    ctx.fillStyle = '#0A0';
    pipes.forEach(p => {
      ctx.fillRect(p.x, 0, 50, p.top);
      ctx.fillRect(p.x, p.top + 120, 50, 480);
    });

    document.getElementById('game-score').textContent = `النقاط: ${score}`;
    window.gameLoop = requestAnimationFrame(update);
  }
  update();
}

// === End Game & Save High Score ===
function endGame(game, score) {
  if (score > highScores[game]) {
    highScores[game] = score;
    localStorage.setItem('highScores', JSON.stringify(highScores));
    document.getElementById('high-score').textContent = `أعلى درجة جديدة: ${score}! 🎉`;
  }
  setTimeout(() => {
    alert(`انتهت اللعبة! نقاطك: ${score}`);
    closeGame();
  }, 100);
}

function initGame(game) {
  if (game === 'snake') initSnake();
  else if (game === 'tetris') initTetris();
  else if (game === 'tictactoe') initTicTacToe();
  else if (game === 'flappy') initFlappy();
}