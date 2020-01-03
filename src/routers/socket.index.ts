import { Server } from "http";
import * as SocketIO from "socket.io";

export type SocketRouter = (io: SocketIO.Server, socket: SocketIO.Socket) => void;

class SocketIOManager {
	io: SocketIO.Server;
	socketRouters: SocketRouter[];
	constructor() {
		this.socketRouters = [] as SocketRouter[];
	}
	use(socketRouter: SocketRouter) {
		this.socketRouters.push(socketRouter);
	}
	start(server: Server) {
		this.io = SocketIO(server, { origins: "*:*" });
		this.io.on("connection", socket => {
			this.socketRouters.forEach(socketRouter => socketRouter(this.io, socket));
		});
	}
}
const socketIOManager = new SocketIOManager();

export default socketIOManager;
