// sockets/socketHandlers.js
const RoomManager = require("../rooms/roomManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Người chơi kết nối:", socket.id);

    // Tham gia phòng
    socket.on("join_room", ({ roomId, playerName }) => {
      // console.log("Tham gia phòng:", roomId, playerName);
      // console.log("Tham gia phòng:", socket.id);
      const success = RoomManager.joinRoom(roomId, socket, playerName);
      if (success) {
        socket.join(roomId);
        io.to(roomId).emit("room_update", RoomManager.getRoom(roomId));
      } else {
        socket.emit("error", "Không thể tham gia phòng");
      }
    });

    // Người chơi sẵn sàng
    socket.on("player_ready", ({ roomId, playerId }) => {
      RoomManager.markReady(roomId, playerId);
      io.to(roomId).emit("room_update", RoomManager.getRoom(roomId));
    });

    // Admin bắt đầu game
    socket.on("start_game", ({ roomId }) => {
      const room = RoomManager.getRoom(roomId);
      if (room && room.admin === socket.id) {
        RoomManager.startGame(roomId);
        io.to(roomId).emit("game_started");

        // Phát số random mỗi 5s
        RoomManager.startNumberCall(roomId, (num) => {
          io.to(roomId).emit("new_number", num);
        });
      }
    });

    // Lấy danh sách phòng
    socket.on("get_rooms", () => {
      socket.emit("rooms_list", RoomManager.getAllRooms());
    });

    // Lấy tổng số người chơi online
    socket.on("get_online_count", () => {
      socket.emit("online_count", RoomManager.getTotalPlayers());
    });

    // Ngắt kết nối
    socket.on("disconnect", () => {
      RoomManager.handleDisconnect(socket.id);
      console.log("Người chơi ngắt kết nối:", socket.id);
    });
  });
};
