import { Response,Request } from "express"
import { JWT_SECRET } from "@repo/backend-common/config"
import jwt from "jsonwebtoken"
import {signupSchema} from "@repo/common/types"
export const authController={
    userSignup: async(req:Request,res:Response)=>{
        const data = signupSchema.safeParse(req.body);
        if(!data.success){
            res.status(400).json({
                message:"incorrect inputs"
            })
            return;
        }
    },
    userLogin: async(req:Request,res:Response)=>{

    }
}