const http = require('http');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');

const Game = require('./Game');

const server = http.createServer((req, res) => {
	if(req.method.toLowerCase() == 'get'){
	 	respondPage(req,res);
	} else if(req.method.toLowerCase() == 'post'){
    respondPost(req, res);
  }
});

const io = require('socket.io').listen(server);
io.origins(["http://localhost:8090"]);

let games = {}

const respondPage = (req, res) => {
	let filePath = req.url;
	if (filePath == '/') {
		filePath = '/index.html';
	}
	filePath = __dirname + '/client' + filePath;
	const extname = path.extname(filePath);
	let contentType = 'text/html';
	switch (extname) {
		case '.js':
		contentType = 'text/javascript';
		break;
		case '.css':
		contentType = 'text/css';
		break;
  }
	fs.exists(filePath, function(exists) {
		if (exists) {
		  fs.readFile(filePath, function(error, content) {
		      if (error) {
		          res.writeHead(500);
		          res.end();
		      }
		      else {                   
		          res.writeHead(200, { 'Content-Type': contentType });
		          res.end(content, 'utf8');                  
		      }
		  });
		}
	});
}

const respondPost = (req, res) => {
  if(req.url == "/checkGameExists"){
    const form = formidable.IncomingForm();
    form.parse(req, (err, fields) => {
      let exists = false;
      for(let game in games){
        if(game == fields.id) exists = true;
      }
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify({exists}), 'utf-8');
    });
  } else {
    res.end();
  }
}

io.on('connection', (socket) => {

  socket.on('/createGame', data => {
    const game = new Game(data.id);
    game.startGame();
    const g = {
      id: data.id,
      player_amt: 0,
      players: {
        "a": undefined,
        "b": undefined
      },
      game
    }
    games[data.id] = g;
  });

  socket.on('/getGameState', data => {
    let game = games[data.id];
    socket.emit("/receiveGameState/" + data.id, game.game);
  });

  socket.on('/setupPlayer', data =>{
    for(let game in games){
      if(game == data.id){
        let players = games[game].player_amt;
        if(players >= 2){
          socket.emit('/setupPlayerRespond/' + game, {player: 's'});
        } else {
          if(games[game].players.a == undefined) {
            socket.emit('/setupPlayerRespond/' + game, {player: 'a'});
            games[game].players.a = socket;
            games[game].player_amt++;
          } else if (games[game].players.b == undefined) {
            socket.emit('/setupPlayerRespond/' + game, {player: 'b'});
            games[game].players.b = socket;
            games[game].player_amt++;
          }
        }
      }
    }
  })

  socket.on('/updateGameState/moveLeft', data => {
    for(let game in games){
      if(game == data.id){
        let g = games[game].game;
        g.active_col = (g.active_col === 0) ? 
          0 : g.active_col - 1;
        games[game].game = g;
      }
    }
    io.emit('/receiveGameState/' + data.id, games[data.id].game);
  });

  socket.on('/updateGameState/moveRight', data => {
    for(let game in games){
      if(game == data.id){
        let g = games[game].game;
        g.active_col = (g.active_col === g.columns - 1) ? 
          g.columns - 1 : g.active_col + 1;
        games[game].game = g;
      }
    }
    io.emit('/receiveGameState/' + data.id, games[data.id].game);
  });

  socket.on('/updateGameState/placeChip', data => {
    for(let game in games){
      if(game == data.id){
        let g = games[game].game;
        g.placeChip();
        games[game].game = g;
      }
    }
    io.emit('/receiveGameState/' + data.id, games[data.id].game);
  });

  socket.on('/resetGame', data => {
    for(let game in games){
      if(game == data.id){
        let g = games[game].game;
        g.startGame();
        games[game].game = g;
      }
    }
    io.emit('/receiveGameState/' + data.id, games[data.id].game);
  })

  socket.on('disconnect', () => {
    for(let g in games){
      let game = games[g];
      if(game.players.a == socket) {
        game.players.a = undefined;
        game.player_amt--;
      }
      if(game.players.b == socket) {
        game.players.b = undefined;
        game.player_amt--;
      }
      if(game.player_amt == 0) {
        delete games[g];
      }
    }
  });

});

server.listen(8090);
console.log(`Server listening on 8090...`);

