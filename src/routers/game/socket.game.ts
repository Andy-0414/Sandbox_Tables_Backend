import { SocketRouter } from "../socket.index";

type JoinRoomRequest = { roomName: string };
type PropRequest = { roomName: string; prop: any };

class Room {
	public roomName: string;
	public users: Set<string> = new Set<string>();
	public props: Object[] = [];

	constructor(roomName: string) {
		this.roomName = roomName || "none";
	}

	joinUser(socketId: string): void {
		this.users.add(socketId);
	}
	leaveUser(socketId: string): boolean {
		this.users.delete(socketId);
		return this.users.size <= 0;
	}

	addProp(prop: any) {
		this.props.push(prop);
	}
	updateProp(prop: any) {
		let propIdx = this.props.findIndex((_prop: any) => _prop._id == prop._id);
		this.props[propIdx] = prop;
	}
	deleteProp(prop: any) {
		let propIdx = this.props.findIndex((_prop: any) => _prop._id == prop._id);
		this.props.splice(propIdx, 1);
	}
}

class RoomManager {
	private static roomManager = new RoomManager();
	public static getRoomManager(): RoomManager {
		return this.roomManager;
	}

	public rooms: Room[] = [];
	private constructor() {}

	findByRoomName(roomName: string): Room | undefined {
		return this.rooms.find(room => room.roomName == roomName);
	}
	joinRoom(roomName: string, socket: SocketIO.Socket): void {
		let room = this.findByRoomName(roomName);
		if (room) {
			room.joinUser(socket.id);
		} else {
			room = new Room(roomName);
			room.joinUser(socket.id);
			this.rooms.push(room);
		}
		socket.join(roomName);
	}
	leaveRoom(socket: SocketIO.Socket): void {
		let roomIdx = this.rooms.findIndex(room => room.users.has(socket.id));
		if (roomIdx != -1) {
			let room = this.rooms[roomIdx];
			if (room.leaveUser(socket.id)) {
				this.rooms.splice(roomIdx, 1);
			}
		}
		socket.leaveAll();
	}
}

const roomManager = RoomManager.getRoomManager();

const socketRouter: SocketRouter = (io: SocketIO.Server, socket: SocketIO.Socket): void => {
	socket.on("game_joinRoom", (data: JoinRoomRequest) => {
		roomManager.joinRoom(data.roomName, socket);
		socket.emit("game_joinRoom", roomManager.findByRoomName(data.roomName));
	});
	socket.on("game_propCreate", (data: PropRequest) => {
		roomManager.findByRoomName(data.roomName).addProp(data.prop);
		io.sockets.in(data.roomName).emit("game_propCreate", data.prop);
	});
	socket.on("game_propUpdate", (data: PropRequest) => {
		roomManager.findByRoomName(data.roomName).updateProp(data.prop);
		socket.broadcast.in(data.roomName).emit("game_propUpdate", data.prop);
	});
	socket.on("disconnect", () => {
		roomManager.leaveRoom(socket);
	});
};
export default socketRouter;
