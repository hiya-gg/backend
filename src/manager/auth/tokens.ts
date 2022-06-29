import { User } from "@prisma/client";
import { createDecoder, createSigner, createVerifier, SignerOptions, VerifierOptions } from "fast-jwt";
import { Snowflake } from "nodejs-snowflake";
import { TokenPayload, TokenResponse } from "./types";
import { app } from "../../config";

const SIGN_OPTIONS: Partial<SignerOptions> = {
  iss: "api.hiya.gg",
  expiresIn: 24 * 60 * 60 * 1000,
};

const VERIFY_OPTIONS: Partial<VerifierOptions> = {
  allowedIss: ["api.hiya.gg"],
};

const decode = createDecoder();

const SNOWFLAKE_EPOCH = new Date(2022, 0, 1).getTime();
const snowflake = new Snowflake({
  custom_epoch: SNOWFLAKE_EPOCH,
});

const jwtSign = (payload: TokenPayload, options?: Partial<SignerOptions>) =>
  createSigner({ ...SIGN_OPTIONS, ...options, key: app.jwt.secret })(payload);

const jwtVerify = (token: string, options?: Partial<VerifierOptions>): TokenPayload =>
  createVerifier({ ...VERIFY_OPTIONS, ...options, key: app.jwt.secret })(token);

const jwtDecode = (token: string): TokenPayload => decode(token);

const createAccessToken = (pairId: string, user: User, scopes: string[]) =>
  jwtSign({
    access: {
      user: {
        id: user.id,
        username: user.username,
      },
      scopes,
    },
    pairId,
    type: "access",
  });

const createRefreshToken = (pairId: string, user: User) =>
  jwtSign(
    {
      refresh: {
        user: {
          id: user.id,
        },
      },
      pairId,
      type: "refresh",
    } as TokenPayload,
    {
      expiresIn: 7 * 24 * 60 * 60 * 1000,
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

const createTokenPair = (user: User, scopes: string[]): TokenResponse => {
  const pairId = snowflake.getUniqueID().toString();
  const accessToken = createAccessToken(pairId, user, scopes);
  const refreshToken = createRefreshToken(pairId, user);

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60,
    type: "Bearer",
  };
};

const validateRefreshToken = (accessToken: string, refreshToken: string): TokenPayload => {
  const refreshPayload: TokenPayload = jwtVerify(refreshToken);
  if (!refreshPayload || refreshPayload.type !== "refresh") {
    throw new Error("Invalid token");
  }

  const accessPayload: TokenPayload = jwtVerify(accessToken, {
    ignoreExpiration: true,
  });

  if (
    !accessPayload ||
    refreshPayload.pairId !== accessPayload.pairId ||
    accessPayload.type !== "access" ||
    accessPayload.access?.user.id !== refreshPayload.refresh?.user?.id
  ) {
    throw new Error("Invalid token");
  }

  return accessPayload;
};

export {
  SIGN_OPTIONS,
  VERIFY_OPTIONS,
  createAccessToken,
  createRefreshToken,
  createTokenPair,
  validateAccessToken,
  validateRefreshToken,
  jwtDecode,
  jwtVerify,
  snowflake,
};
