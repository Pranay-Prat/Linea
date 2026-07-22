import { Response, Request } from "express";
import { loginSchema, signupSchema } from "@repo/common/types";
import { COOKIE_OPTIONS, AUTH_COOKIE } from "../utils/helper";
import { authService } from "../services/auth.service";

export const authController = {
  userSignup: async (req: Request, res: Response) => {
    const data = signupSchema.safeParse(req.body);
    if (!data.success) {
      return res.status(400).json({
        message: "incorrect inputs",
        success: "false"
      });
    }

    const result = await authService.signup(data.data.email, data.data.name, data.data.password);
    
    if (result.error) {
      return res.status(result.status!).json({
        message: result.error,
        success: "false",
      });
    }

    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return res.status(200).json({
      message: "User created successfully",
      success: "true",
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
      },
    });
  },

  userLogin: async (req: Request, res: Response) => {
    const data = loginSchema.safeParse(req.body);
    if (!data.success) {
      return res.status(400).json({
        message: "incorrect inputs",
        success: "false"
      });
    }

    const result = await authService.login(data.data.email, data.data.password);

    if (result.error) {
      return res.status(result.status!).json({
        success: "false",
        message: result.error
      });
    }

    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "User logged in successfully",
      success: "true",
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
      },
    });
  },
};
