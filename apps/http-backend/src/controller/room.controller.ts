import { Response, Request } from "express";
import { createRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

export const roomController = {
  createRoom: async (req: Request, res: Response) => {
    try {
      const data = createRoomSchema.safeParse(req.body);

      if (!data.success) {
        return res.status(400).json({
          message: "incorrect inputs",
        });
      }

      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          message: "unauthorised",
        });
      }

      const slug =
        data.data.roomName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-") +
        "-" +
        Math.random().toString(36).substring(2, 7);

      const room = await prismaClient.room.create({
        data: {
          slug: slug,
          adminId: userId,
        },
      });

      return res.status(201).json({
        message: "Room created successfully",
        success: "true",
        roomId: room.id,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Failed to create room",
        success: "false",
      });
    }
  },
  getRoom: async(req:Request, res:Response)=>{
    try {
      const slug = req.params.slug as string;
      const room = await prismaClient.room.findUnique({
        where:{
          slug:slug
        }
      })
      if(!room){
        return res.status(404).json({
          message: "Room not found",
          success: "false",
        });
      }
      return res.status(200).json({
        message: "Room found successfully",
        success: "true",
        room,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to get room",
        success: "false",
      });
    }
  }
};