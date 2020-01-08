import { Server } from "http";
import * as SocketIO from "socket.io";

import GameRouter from "./game/socket.game";

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
            console.log("CONNECT");
			this.socketRouters.forEach(socketRouter => socketRouter(this.io, socket));
		});
	}
}
const socketIOManager = new SocketIOManager();
socketIOManager.use(GameRouter);

export default socketIOManager;
