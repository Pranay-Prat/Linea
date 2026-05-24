import { prismaClient } from "@repo/db/client";
import { Response, Request } from "express";
export const chatController={
    getChats: async(req:Request,res:Response)=>{
        const roomId = Number(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId:roomId
            },
            orderBy:{
                id:"desc"
            },
            take:50
        })
        res.json({
            messages
        })
    }
}