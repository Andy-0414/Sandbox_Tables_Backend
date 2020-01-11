import { SocketRouter } from "../socket.index";

type JoinRoomRequest = { roomName: string };
type PropRequest = { roomName: string; prop: any };
type SocketUser = { name: string; id: string };

class Room {
	public roomName: string;
	public users: SocketUser[] = [];
	public props: Object[] = [];

	constructor(roomName: string) {
		this.roomName = roomName || "none";
	}

	joinUser(socketId: string): void {
		this.users.push({
			name: "",
			id: socketId
		});
	}
	leaveUser(socketId: string): boolean {
		let idx = this.users.findIndex(user => user.id == socketId);
		if (idx != -1) this.users.splice(idx, 1);
		return this.users.length <= 0;
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
		this.leaveRoom(socket);
		if (room) {
			room.joinUser(socket.id);
		} else {
			room = new Room(roomName);
			room.joinUser(socket.id);
			this.rooms.push(room);
		}
		socket.join(roomName);
	}
	leaveRoom(socket: SocketIO.Socket): string | undefined {
		let roomIdx = this.rooms.findIndex(room => room.users.findIndex(user => user.id == socket.id) != -1);
		if (roomIdx != -1) {
			let room = this.rooms[roomIdx];
			socket.leave(room.roomName);
			if (room.leaveUser(socket.id)) {
				this.rooms.splice(roomIdx, 1);
			} else return room.roomName;
		}
	}
	getPublicRoomList(): any[] {
		return this.rooms.map(room => {
			return {
				roomName: room.roomName,
				userCount: room.users.length
			};
		});
	}
}

const roomManager = RoomManager.getRoomManager();

const socketRouter: SocketRouter = (io: SocketIO.Server, socket: SocketIO.Socket): void => {
	socket.on("game_getRooms", () => {
		roomManager.leaveRoom(socket);
		io.sockets.emit("game_getRooms", roomManager.getPublicRoomList());
	});
	socket.on("game_joinRoom", (data: JoinRoomRequest) => {
		roomManager.joinRoom(data.roomName, socket);
		socket.emit("game_joinRoom", roomManager.findByRoomName(data.roomName));
		io.sockets.emit("game_getRooms", roomManager.getPublicRoomList());
		io.sockets.in(data.roomName).emit("chat_sendMessage", { name: "system", message: `${socket.id} 님이 입장하였습니다.` });
	});
	socket.on("game_propCreate", (data: PropRequest) => {
		let room = roomManager.findByRoomName(data.roomName);
		if (room) {
			room.addProp(data.prop);
			io.sockets.in(data.roomName).emit("game_propCreate", data.prop);
		}
	});
	socket.on("game_propDelete", (data: PropRequest) => {
		let room = roomManager.findByRoomName(data.roomName);
		if (room) {
			room.deleteProp(data.prop);
			io.sockets.in(data.roomName).emit("game_propDelete", data.prop);
		}
	});
	socket.on("game_propUpdate", (data: PropRequest) => {
		let room = roomManager.findByRoomName(data.roomName);
		if (room) {
			room.updateProp(data.prop);
			socket.broadcast.in(data.roomName).emit("game_propUpdate", data.prop);
		}
	});
	socket.on("disconnect", () => {
		let roomName = roomManager.leaveRoom(socket);
		io.sockets.emit("game_getRooms", roomManager.getPublicRoomList());
		io.sockets.in(roomName).emit("chat_sendMessage", { name: "system", message: `${socket.id} 님이 퇴장하였습니다.` });
	});
};
export default socketRouter;
