class Game {
  constructor(
    id
  ){
    this.id = id;
    this.currentPlayer = 'a';
    this.win = false;
    this.board = [];
    this.rows = 6;
    this.columns = 7;
    this.active_col = 3;
  }

  generateBoard() {
    let board = [];
    for(let i = 0; i < this.rows; i++){
      let row = [];
      for(let j = 0; j < this.columns; j++){
        row.push(0);
      }
      board.push(row);
    }
    this.board = board;
  }

  startGame() {
    this.generateBoard();
    this.active_col = 3
    this.currentPlayer = "a";
    this.win = false;
  }

  placeChip() {
    let t_y;
    let count = this.rows - 1;
    let board = [...this.board];
    while(count >= 0){
      if(!board[count][this.active_col]){
        t_y = count;
        break;
      } else {
        if(count == 0) return;
        count--;
      }
    }
    board[t_y][this.active_col] = this.currentPlayer;
    this.board = board;
    this.checkWin();
    if(!this.win)
      this.currentPlayer = this.currentPlayer == "a" ? "b" : "a";
  }

  checkVertical() {
    const board = [...this.board];
    for(let row = this.rows - 1; row >= 3; row--){
      for(let col = this.columns - 1; col >= 0; col--){
        let i = 0;
        const p = board[row][col];
        let common = 0;
        if(!p) continue;
        while(i < 4){
          if(board[row - i][col] == p) common++;
          i++;
        }
        if(common === 4) return true;
      }
    }
    return false;
  }
  
  checkHorizontal() {
    const board = [...this.board];
    for(let row = this.rows - 1; row >= 0; row--){
      for(let col = this.columns - 1; col >= 3; col--){
        let i = 0;
        const p = board[row][col];
        let common = 0;
        if(!p) continue;
        while(i < 4){
          if(board[row][col - i] == p) common++;
          i++;
        }
        if(common === 4) return true;
      }
    }
    return false;
  }
  
  checkDiagonalLeft() {
    const board = [...this.board];
    for(let row = this.rows - 1; row >= 3; row--){
      for(let col = this.columns - 1; col >= 3; col--){
        let i = 0;
        const p =  board[row][col];
        let common = 0;
        if(!p) continue;
        while(i < 4){
          if(board[row - i][col - i] == p) common++;
          i++; 
        }
        if(common === 4) return true;
      }
    }
    return false;
  }
  
  checkDiagonalRight() {
    const board = [...this.board];
    for(let row = this.rows - 1; row >= 3; row--){
      for(let col = this.columns - 4; col >= 0; col--){
        let i = 0;
        const p =  board[row][col];
        let common = 0;
        if(!p) continue;
        while(i < 4){
          if(board[row - i][col + i] == p) common++;
          i++; 
        }
        if(common === 4) return true;
      }
    }
    return false;
  }
  
  checkWin() {
    this.win = 
      this.checkVertical() || 
      this.checkHorizontal() ||
      this.checkDiagonalLeft() ||
      this.checkDiagonalRight();
  }
}

module.exports = Game;
