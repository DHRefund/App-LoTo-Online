import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const SOCKET_URL = "https://app-loto-online.onrender.com"; // Đổi nếu backend chạy cổng khác

function App() {
  const [step, setStep] = useState("join"); // join | waiting | playing
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [room, setRoom] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef(null);

  // Kết nối socket
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("room_update", (roomData) => {
      setRoom(roomData);
      setIsAdmin(roomData?.admin === socket.id);
      setPlayerId(socket.id);
      setIsReady(roomData?.players?.find((p) => p.id === socket.id)?.ready || false);
      if (roomData.isStarted) setStep("playing");
      else setStep("waiting");
    });

    socket.on("game_started", () => {
      setStep("playing");
      setCurrentNumber(null);
      setCalledNumbers([]);
    });

    socket.on("new_number", (num) => {
      setCurrentNumber(num);
      setCalledNumbers((prev) => [...prev, num]);
    });

    socket.on("rooms_list", (list) => {
      setRoomsList(list);
    });
    socket.on("online_count", (count) => {
      setOnlineCount(count);
    });

    socket.on("error", (msg) => {
      alert(msg);
    });

    // Lấy danh sách phòng và số người online khi vào trang join
    socket.emit("get_rooms");
    socket.emit("get_online_count");

    // Cập nhật định kỳ mỗi 3s
    const interval = setInterval(() => {
      socket.emit("get_rooms");
      socket.emit("get_online_count");
    }, 3000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // Tham gia phòng
  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomId || !playerName) return alert("Nhập tên và mã phòng!");
    socketRef.current.emit("join_room", { roomId, playerName });
  };

  // Đánh dấu sẵn sàng
  const handleReady = () => {
    socketRef.current.emit("player_ready", { roomId, playerId });
    setIsReady(true);
  };

  // Admin bắt đầu game
  const handleStartGame = () => {
    socketRef.current.emit("start_game", { roomId });
  };

  // Header
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h2>Game Loto Online</h2>
      <div style={{ fontWeight: "bold" }}>🟢 Đang online: {onlineCount}</div>
    </div>
  );

  // Giao diện nhập phòng
  if (step === "join") {
    return (
      <div className="container">
        {header}
        <form onSubmit={handleJoin} style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Tên của bạn"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <input type="text" placeholder="Mã phòng (6 số)" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <button type="submit">Vào phòng / Tạo phòng</button>
        </form>
        <div style={{ marginTop: 24 }}>
          <h3>Danh sách phòng hiện có:</h3>
          {roomsList.length === 0 && <div>Chưa có phòng nào.</div>}
          <ul>
            {roomsList.map((r) => (
              <li key={r.roomId} style={{ marginBottom: 8 }}>
                <b>Phòng:</b> {r.roomId} | <b>Người chơi:</b> {r.playerCount} | <b>Trạng thái:</b>{" "}
                {r.isStarted ? "Đang chơi" : "Chờ"}
                {!r.isStarted && (
                  <button style={{ marginLeft: 12 }} onClick={() => setRoomId(r.roomId)}>
                    Chọn
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Giao diện chờ trong phòng
  if (step === "waiting") {
    return (
      <div className="container">
        {header}
        <h2>Phòng: {roomId}</h2>
        <h3>Người chơi:</h3>
        <ul>
          {room?.players?.map((p) => (
            <li key={p.id}>
              {p.name} {p.id === room.admin && <b>(Admin)</b>} {p.ready ? "✅" : "❌"}
            </li>
          ))}
        </ul>
        <div>
          {!isReady && <button onClick={handleReady}>Sẵn sàng</button>}
          {isAdmin && room?.players?.length > 1 && room?.players?.every((p) => p.ready) && (
            <button onClick={handleStartGame}>Bắt đầu game</button>
          )}
        </div>
        <p>Chờ admin bắt đầu game...</p>
      </div>
    );
  }

  // Giao diện chơi game
  if (step === "playing") {
    return (
      <div className="container">
        {header}
        <h2>Phòng: {roomId}</h2>
        <h3>
          Số vừa gọi: <span style={{ color: "red", fontSize: 32 }}>{currentNumber || "..."}</span>
        </h3>
        <h4>Các số đã gọi:</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {calledNumbers.map((num, idx) => (
            <span key={idx} style={{ border: "1px solid #ccc", padding: 4, borderRadius: 4 }}>
              {num}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default App;
