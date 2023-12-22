const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const PORT = 8000;
const cors = require("cors");
app.use(cors());

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const userIdArr = {};
const userRoomIdArr = {};

const updateUserList = () => {
  io.emit("userList", userIdArr);
};

io.on("connection", (socket) => {
  console.log("socket id", socket.id);

  socket.on("entry", (res) => {
    if (Object.values(userIdArr).includes(res.userId)) {
      // 닉네임이 중복될 경우에
      socket.emit("error", {
        msg: "중복된 아이디가 존재하여 입장이 불가합니다.",
      });
    } else {
      // 닉네임이 중복되지 않을 경우에
      // 해당하는 단체방에 입장
      socket.join(res.roomId);
      userRoomIdArr[socket.id] = res.roomId;
      // 특정 방에 속한 모든 클라이언트에게 전달
      io.to(res.roomId).emit("notice", {
        msg: `${res.userId}님이 입장하셨습니다.`,
      });
      socket.emit("entrySuccess", { userId: res.userId });
      userIdArr[socket.id] = res.userId;
    }
    console.log(userIdArr);
    console.log(userRoomIdArr);
    updateUserList();
  });

  socket.on("disconnect", () => {
    if (userIdArr[socket.id]) {
      io.to(userRoomIdArr[socket.id]).emit("notice", {
        msg: `${userIdArr[socket.id]}님이 퇴장하셨습니다.`,
      });
      socket.leave(userRoomIdArr[socket.id]);
      delete userRoomIdArr[socket.id];
      delete userIdArr[socket.id];
    }
    console.log(userIdArr);
    updateUserList();
  });

  socket.on("sendMsg", (res) => {
    if (res.dm === "all")
      io.to(res.roomId).emit("chat", { userId: res.userId, msg: res.msg });
    else {
      io.to(res.dm).emit("chat", {
        userId: res.userId,
        msg: res.msg,
        dm: true,
      });
      socket.emit("chat", { userId: res.userId, msg: res.msg, dm: true });
    }
  });
});

server.listen(PORT, function () {
  console.log(`Sever Open: ${PORT}`);
});
