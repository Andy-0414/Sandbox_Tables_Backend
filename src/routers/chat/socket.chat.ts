import { SocketRouter } from "../socket.index";
type SendMessageRequest = { message: string; name: string; roomName: string };
const socketRouter: SocketRouter = (io: SocketIO.Server, socket: SocketIO.Socket): void => {
	socket.on("chat_sendMessage", (data: SendMessageRequest) => {
		io.sockets.in(data.roomName).emit("chat_sendMessage", { name: data.name, message: data.message });
	});
};
export default socketRouter;
