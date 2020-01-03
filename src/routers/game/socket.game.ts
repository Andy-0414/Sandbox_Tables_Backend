import { SocketRouter } from "../socket.index";
import { Socket } from "socket.io";

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
}

class RoomManager {
	static roomManager = new RoomManager();
	public rooms: Room[] = [];

	private constructor() {}

	findByRoomName(roomName: string): Room | undefined {
		return this.rooms.find(room => room.roomName == roomName);
	}
	findByRoomNameToIndex(roomName: string): number {
		return this.rooms.findIndex(room => room.roomName == roomName);
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
	}
	leaveRoom(roomName: string, socket: SocketIO.Socket): void {
		let roomIdx = this.findByRoomNameToIndex(roomName);
		if (roomIdx != -1) {
			let room = this.rooms[roomIdx];
			if (room.leaveUser(socket.id)) {
				this.rooms.splice(roomIdx, 1);
			}
		}
	}
}

const socketRouter: SocketRouter = (io: SocketIO.Server, socket: SocketIO.Socket): void => {};
export default socketRouter;
