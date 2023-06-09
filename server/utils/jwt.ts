import { Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export const createJWT = ({
  payload,
}: {
  payload: { [key: string]: any };
}): string => {
  const token = jwt.sign(payload, process.env.JWT_SECRET!);

  return token;
};

export const isTokenValid = (token: string) =>
  jwt.verify(token, process.env.JWT_SECRET!) as { [key: string]: any };

export const attachCookiesToResponse = ({
  res,
  user,
  refreshToken,
}: {
  res: Response;
  user: {
    name: string | undefined;
    userId: string | undefined;
    role: string | undefined;
  };
  refreshToken?: string;
}) => {
  const accessTokenJWT = createJWT({ payload: { user } });
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const longerExp = 1000 * 60 * 60 * 24 * 30;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
  });
  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + longerExp),
  });
};
