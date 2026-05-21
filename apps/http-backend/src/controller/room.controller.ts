import { Response,Request } from "express"
import { createRoomSchema } from "@repo/common/types"
export const roomController={
    createRoom:(req:Request,res:Response)=>{
        const data = createRoomSchema.safeParse(req.body);
        if(!data.success){
            res.status(400).json({
                message:"incorrect inputs"
            })
            return;
        }

    }
}