import * as express from "express";
import * as http from "http";

import "dotenv/config";
import SocketIOManager from "./routers/socket.index";

const app: http.Server = http.createServer(express()); // 서버 객체

app.listen(3000, () => {
	console.log("start server");
});
SocketIOManager.start(app);

export default app;
