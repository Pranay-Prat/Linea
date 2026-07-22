import { prismaClient } from "@repo/db/client";

export const chatService = {
  getMessagesByRoomId: async (roomId: number, limit: number = 50) => {
    return await prismaClient.chat.findMany({
      where: {
        roomId
      },
      orderBy: {
        id: "desc"
      },
      take: limit
    });
  }
};
