import { Response, Request } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";
import { loginSchema, signupSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
export const authController = {
  userSignup: async (req: Request, res: Response) => {
    const data = signupSchema.safeParse(req.body);
    if (!data.success) {
      return res.status(400).json({
        message: "incorrect inputs",
        success:"false"
      });
    }
    const isExist = await prismaClient.user.findUnique({
      where: {
        email: data.data.email,
      },
    });
    if (isExist) {
      return res.status(422).json({
        message: "User already exists",
        success: "false",
      });
    }
    const user = await prismaClient.user.create({
      data: {
        email: data.data.email,
        name: data.data.name,
        password: data.data.password,
      },
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "3d",
    });
    return res.status(200).json({
      message: "User created successfully",
      success: "true",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  },
  userLogin: async (req: Request, res: Response) => {
    const data= loginSchema.safeParse(req.body);
    if(!data.success){
        return res.status(400).json({
            message:"incorrect inputs",
            success:"false"
        })
    }

    const user = await prismaClient.user.findUnique({
        where:{
            email:data.data.email
        }
    })
    if(!user){
        return res.status(401).json({
            success:"false",
            message:"User not found"
        })
    }
    const token = jwt.sign({userId:user.id},JWT_SECRET,{expiresIn:"3d"})
    return res.status(200).json({
      message: "User logged in successfully",
      success: "true",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });



  },
};
