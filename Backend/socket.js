function setupSocket(io) {
    io.on("connection", (socket) => {
      console.log("New client connected");
  
      socket.on("join_room", (chatId) => {
        socket.join(chatId);
      });
  
      socket.on("send_message", (data) => {
        io.to(data.chat_id).emit("receive_message", data);
      });
  
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  }
  
  module.exports = setupSocket;
  