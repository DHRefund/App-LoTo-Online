// rooms/roomManager.js

const rooms = {};

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000); // Mã 6 chữ số
}

class Room {
  constructor(adminId) {
    this.roomId = generateRoomCode().toString();
    this.admin = adminId;
    this.players = [];
    this.isStarted = false;
    this.calledNumbers = [];
    this.interval = null;
  }

  addPlayer(socket, name) {
    this.players.push({
      id: socket.id,
      name,
      ready: false,
      //   socket,
    });
  }

  markReady(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (player) player.ready = true;
  }

  isAllReady() {
    return this.players.every((p) => p.ready);
  }

  startGame() {
    this.isStarted = true;
    this.calledNumbers = [];
  }

  startNumberCall(cb) {
    this.interval = setInterval(() => {
      const num = Math.floor(Math.random() * 90) + 1;
      if (!this.calledNumbers.includes(num)) {
        this.calledNumbers.push(num);
        cb(num);
      }
    }, 5000);
  }

  stopCalling() {
    clearInterval(this.interval);
  }

  removePlayer(playerId) {
    this.players = this.players.filter((p) => p.id !== playerId);
  }
}

const RoomManager = {
  joinRoom(roomId, socket, name) {
    if (!rooms[roomId]) {
      rooms[roomId] = new Room(socket.id);
    }
    rooms[roomId].addPlayer(socket, name);
    return true;
  },

  getRoom(roomId) {
    return rooms[roomId];
  },

  markReady(roomId, playerId) {
    const room = rooms[roomId];
    if (room) room.markReady(playerId);
  },

  startGame(roomId) {
    const room = rooms[roomId];
    if (room && room.isAllReady()) {
      room.startGame();
    }
  },

  startNumberCall(roomId, cb) {
    const room = rooms[roomId];
    if (room) room.startNumberCall(cb);
  },

  handleDisconnect(playerId) {
    for (let roomId in rooms) {
      const room = rooms[roomId];
      room.removePlayer(playerId);
      if (room.players.length === 0) {
        delete rooms[roomId];
      }
    }
  },
};

// Thêm các hàm tiện ích để lấy danh sách phòng và tổng số người chơi
RoomManager.getAllRooms = function () {
  return Object.entries(rooms).map(([roomId, room]) => ({
    roomId,
    playerCount: room.players.length,
    isStarted: room.isStarted,
  }));
};

RoomManager.getTotalPlayers = function () {
  let total = 0;
  for (let roomId in rooms) {
    total += rooms[roomId].players.length;
  }
  return total;
};

module.exports = RoomManager;
