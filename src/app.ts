import * as express from "express";
import * as http from "http";
import * as history from "connect-history-api-fallback";

import "dotenv/config";
import SocketIOManager from "./routers/socket.index";

const app: express.Application = express();
const server: http.Server = http.createServer(app); // 서버 객체

app.use(history());
app.use(express.static("public"));
server.listen(3000, () => {
	console.log("start server");
});
SocketIOManager.start(server);

export default app;
