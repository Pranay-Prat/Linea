import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });
interface User{
  ws:WebSocket,
  rooms: string[],
  userId: string
}
const users:User[] = [];
function checkUser(token: string): string | null {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      typeof decoded === "string" ||
      !decoded ||
      !decoded.userId
    ) {
      return null;
    }

    return decoded.userId;
  } catch (err) {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;

  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";

  const userId = checkUser(token);

  if (userId==null) {
    ws.close();
    return;
  }
  users.push({
    ws,
    rooms:[],
    userId
  })

  ws.on("message", function message(data) {
    const parsedData = JSON.parse(data as unknown as string);
    if(parsedData.type==="join_room"){
      const user = users.find(x=>x.ws===ws);
      if(user){
        user.rooms.push(parsedData.roomId)
      }

    }
    if(parsedData.type==="leave_room"){
      const user = users.find(x=>x.ws===ws);
      if(user){
        user.rooms = user.rooms.filter(x=>x!==parsedData.roomId)
      }
    }
    if(parsedData.type==="chat"){
      const room = parsedData.roomId;
      users.forEach(user => {
        if(user.rooms.includes(room)){
          user.ws.send(JSON.stringify({type:"chat",message:parsedData.message}))
        }
      });
    }
  });
});