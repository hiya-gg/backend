import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { validateAccessToken } from "./tokens";
import { TokenPayload } from "./types";

const getAccessToken = (request: FastifyRequest) => {
  if (request.headers.authorization) {
    const [, accessToken] = request.headers.authorization.split(" ");
    return accessToken;
  }

  if (request.cookies.token) {
    try {
      const token = JSON.parse(request.cookies.token).accessToken;
      if (token) {
        return token;
      }
    } catch (e) {
      // ignore
    }

    return request.cookies.token;
  }

  return null;
};

const verifyScopes =
  (scopes: string[] | undefined) => async (request: FastifyRequest) => {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      throw new Error("No access token");
    }

    const token = validateAccessToken(accessToken);
    if (!scopes) {
      return;
    }

    const userScopes = token?.access?.scopes ?? [];
    if (!userScopes.length) {
      throw new Error("Invalid scopes");
    }

    if (userScopes.includes("*")) {
      return;
    }

    const missingScopes = scopes.filter((scope) => !userScopes.includes(scope));
    if (missingScopes.length) {
      throw new Error(`Missing scopes: ${missingScopes.join(", ")}`);
    }
  };

const getSession = (request: FastifyRequest): TokenPayload | undefined => {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return undefined;
  }

  return validateAccessToken(accessToken);
};

const hiyaFastifyAuth = fp(
  (fastify: FastifyInstance, options: any, next: () => void) => {
    fastify.decorateRequest("getSession", function decorator() {
      // @ts-ignore
      return getSession(this);
    });

    next();
  },
  {
    name: "hiya-fastify-auth",
    fastify: "4.x",
  }
);

// eslint-disable-next-line import/prefer-default-export
export { verifyScopes, getSession, hiyaFastifyAuth };
