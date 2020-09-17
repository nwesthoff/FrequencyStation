import express from "express";
import { Server } from "http";
import socketio from "socket.io";

const app = express();
const server = new Server(app);
const io = socketio(server);

io.origins("*:*");
io.on("connection", (socket) => {
  console.log(`User: ${socket.id} connected`);

  socket.on("response", (data) => {
    console.log(data);
    io.sockets.emit("message", data);
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`listening on *:${process.env.PORT || 5000}`);
});
