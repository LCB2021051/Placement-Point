// server/socket.js
const { Server } = require("socket.io");

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const roomCodeMap = {}; // roomId → latest snapshot

  io.on("connection", (socket) => {
    console.log("🟢", socket.id, "connected");

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`🚪 ${socket.id} joined [${roomId}]`);

      if (roomCodeMap[roomId]) {
        // we already have a snapshot
        socket.emit("send-code", roomCodeMap[roomId]);
      } else {
        // ask someone in the room for code
        socket.to(roomId).emit("request-latest-code");
      }
    });

    socket.on("provide-code", ({ roomId, code }) => {
      if (!roomCodeMap[roomId]) roomCodeMap[roomId] = code;
      socket.to(roomId).emit("send-code", code);
    });

    socket.on("code-change", ({ roomId, code }) => {
      roomCodeMap[roomId] = code;
      socket.to(roomId).emit("code-sync", code);
    });
  });
}

module.exports = initSocket;
