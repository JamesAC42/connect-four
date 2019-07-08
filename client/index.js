const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const params = {
  chipSize: 90,
  margin_x: 25,
  margin_y: 10,
  playerParams: {
    a: {
      name: "a",
      color: "rgb(255, 0, 102)"
    },
    b: {
      name: "b",
      color: "rgb(0, 230, 172)"
    }
  }
}

const socket = io('http://localhost:8090');

let Game = undefined;
let player;

const _height = (params.chipSize + params.margin_y) * 6;
const _width = (params.chipSize + params.margin_x) * 7;

canvas.height = _height;
canvas.width = _width;

function Point(x, y) {
  this.x = x;
  this.y = y;
}

const renderChip = (color, point, outline) => {
  ctx.fillStyle = color;
  const x = point.x + (params.chipSize / 2) + (params.margin_x / 2);
  const y = point.y + (params.chipSize / 2) + (params.margin_y / 2);
  ctx.beginPath();
  ctx.arc(x, y, params.chipSize / 2, 0, 2 * Math.PI);
  ctx.fill();
  if(outline){
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(230, 230, 255)";
    ctx.arc(x, y, params.chipSize / 2, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

const render = () => {
  ctx.clearRect(0,0, _width, _height);
  if(!Game) return;
  const board = Game.board;
  for(let row in board){
    for(let col in board[row]){
      const x = col * (params.chipSize + params.margin_x);
      const y = row * (params.chipSize + params.margin_y);
      const point = new Point(x, y);
      let color;
      let outline = false;
      if(!board[row][col]){
        const c = parseInt(col);
        const r = parseInt(row);
        if(c === Game.active_col){
          if(r == board.length - 1){
            color = params.playerParams[Game.currentPlayer].color;
            outline = true;
          } else {
            if(!board[r + 1][col]) {
              color = "rgb(50, 50, 82)";
            } else {
              color = params.playerParams[Game.currentPlayer].color;
              outline = true;
            }
          }
        } else {
          color = "rgb(36, 36, 63)"
        }
      } else {
        color = params.playerParams[board[row][col]].color;
      }
      renderChip(color, point, outline);
    }
  }
}

const handleKeyPress = (e) => {
  if(typeof(Game) == "undefined") return;
  if(Game.win) return;
  if(Game.currentPlayer != player) return;
  switch(e.which){
    case 37:
      socket.emit('/updateGameState/moveLeft', {id: Game.id});
      break;
    case 39:
      socket.emit('/updateGameState/moveRight', {id: Game.id});
      break;
    case 40:
    case 32:
      socket.emit('/updateGameState/placeChip', {id: Game.id});
      break;
    default:
      return;
  }
}

document.addEventListener("keydown", e => {
  handleKeyPress(e);
});

let joinID;
let createID;

const updateGame = (msg) => {
  Game = msg;
  const turnElement = document.getElementById("turn");
  let turnText;
  if(Game.win){
    if(Game.currentPlayer == "a") {
      turnText = "Red Wins";
    } else if(Game.currentPlayer == "b") {
      turnText = "Green Wins";
    }
    turnElement.className = "win-" + Game.currentPlayer;
  } else {
    if(Game.currentPlayer == player){
      turnText = "Your Turn";
    } else if(player == 's'){
      turnText = "Spectating";
    } else {
      turnText = "Opponent's Turn";
    }
    turnElement.className = '';
  }
  turnElement.innerHTML = turnText;
}

document.getElementById("join-input").addEventListener("keyup", e => {
  joinID = e.target.value;
});

document.getElementById("start-input").addEventListener("keyup", e => {
  createID = e.target.value;
});

const resetBtn = document.getElementById("reset-game");

document.getElementById("join-button").addEventListener("click", e => {
  if(!joinID) return;
  fetch('/checkGameExists', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json'
    },
    body: JSON.stringify({id: joinID})
  }).then(response => response.json())
  .then(res => {
    if(res.exists){
      socket.on("/setupPlayerRespond/" + joinID, msg => {
        player = msg.player;
        if(player !== 's'){
          resetBtn.className = '';
        }
      });
      socket.on("/receiveGameState/" + joinID, msg => updateGame(msg));
      socket.emit("/setupPlayer", {id: joinID});
      socket.emit('/getGameState', {id: joinID});
      document.getElementById("game-id").innerHTML = "ID: " + joinID;
      document.getElementById("start-dialogue").classList.add("start-dialogue-hidden");
    } else {
      document.getElementById("join-error").innerHTML 
        = "Game does not exist";
    }
  });
});

document.getElementById("start-button").addEventListener("click", e => {
  if(!createID) return;
  fetch('/checkGameExists', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json'
    },
    body: JSON.stringify({id: createID})
  }).then(response_check => response_check.json())
  .then(res_check => {
    if(res_check.exists){
      document.getElementById("start-error").innerHTML 
        = "Game already exists";
    } else {
      socket.on("/setupPlayerRespond/" + createID, msg => {
        player = msg.player;
        if(player !== 's'){
          resetBtn.className = '';
        }
      });
      socket.on("/receiveGameState/" + createID, msg => updateGame(msg));
      socket.emit("/createGame", {id: createID});
      socket.emit("/setupPlayer", {id: createID});
      socket.emit("/getGameState", {id: createID});
      document.getElementById("game-id").innerHTML = "ID: " + createID;
      document.getElementById("start-dialogue").classList.add("start-dialogue-hidden");
    }
  });
});

resetBtn.addEventListener("mouseenter", e => {
  document.getElementById("reset-img").src = "reset-dark.png";
});

resetBtn.addEventListener("mouseleave", e => {
  document.getElementById("reset-img").src = "reset.png";
});

resetBtn.addEventListener("click", e => {
  document.getElementById("reset-img").className = "spin";
  setTimeout(() => {
    document.getElementById("reset-img").className = "";
  }, 600);
  if(typeof(Game) !== undefined){
    socket.emit('/resetGame', {id: Game.id});
  }
});


const animate = () => {
  render();
  requestAnimationFrame(animate);
}

animate();