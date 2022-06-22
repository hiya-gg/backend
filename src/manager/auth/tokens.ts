import { User } from "@prisma/client";
import {
  createDecoder,
  createSigner,
  createVerifier,
  SignerOptions,
  VerifierOptions,
} from "fast-jwt";
import { TokenPayload } from "./types";
import config from "../../config";

const SIGN_OPTIONS: Partial<SignerOptions> = {
  iss: "api.hiya.gg",
  expiresIn: 24 * 60 * 60 * 1000,
};

const VERIFY_OPTIONS: Partial<VerifierOptions> = {
  allowedIss: ["api.hiya.gg"],
};

const decode = createDecoder();

const jwtSign = (payload: TokenPayload, options?: Partial<SignerOptions>) =>
  createSigner({ ...SIGN_OPTIONS, ...options, key: config.app.jwt.secret })(
    payload
  );

const jwtVerify = (token: string, options?: Partial<VerifierOptions>) =>
  createVerifier({ ...VERIFY_OPTIONS, ...options, key: config.app.jwt.secret })(
    token
  );

const jwtDecode = (token: string): TokenPayload => decode(token);

const createAccessToken = (user: User, scopes: string[]) =>
  jwtSign({
    access: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      scopes,
    },
    type: "access",
  });

const createRefreshToken = (user: User, accessToken: string) =>
  jwtSign(
    {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      refresh: {
        access: accessToken,
      },
      type: "refresh",
    } as TokenPayload,
    {
      expiresIn: 14 * 24 * 60 * 60 * 1000,
    }
  );

const validateAccessToken = (token: string): TokenPayload => {
  const payload = jwtVerify(token);
  if (!payload) {
    throw new Error("Invalid token");
  }

  if (payload.type !== "access") {
    throw new Error("Invalid token");
  }

  return payload;
};

const validateRefreshToken = (
  accessToken: string,
  refreshToken: string
): boolean => {
  const refreshPayload = jwtVerify(refreshToken);
  if (!refreshPayload) {
    throw new Error("Invalid token");
  }

  if (refreshPayload.type !== "refresh") {
    return false;
  }

  if (refreshPayload.refresh.access !== accessToken) {
    return false;
  }

  const accessPayload = jwtVerify(accessToken, { ignoreExpiration: true });
  if (!accessPayload) {
    throw new Error("Invalid token");
  }

  if (accessPayload.type !== "access") {
    return false;
  }

  if (accessPayload.user.id !== refreshPayload.user.id) {
    return false;
  }

  return accessPayload;
};

export {
  SIGN_OPTIONS,
  VERIFY_OPTIONS,
  createAccessToken,
  createRefreshToken,
  validateAccessToken,
  validateRefreshToken,
  jwtDecode,
};
