import { Response, Request } from "express";
import { chatService } from "../services/chat.service";

export const chatController = {
  getChats: async (req: Request, res: Response) => {
    try {
      const roomId = Number(req.params.roomId);
      const messages = await chatService.getMessagesByRoomId(roomId);

      res.json({
        messages
      });

    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch chats"
      });
    }
  }
};