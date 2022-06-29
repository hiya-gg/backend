import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { validateAccessToken } from "./tokens";
import { TokenPayload } from "./types";
import { isInvalidated } from "./accounts";

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

const getSession = async (request: FastifyRequest): Promise<TokenPayload | undefined> => {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return undefined;
  }

  const token = validateAccessToken(accessToken);
  if (await isInvalidated(accessToken)) {
    return undefined;
  }

  return token;
};

const verifyScopes = (scopes: string[] | undefined) => async (request: FastifyRequest) => {
  if (!scopes) {
    return;
  }

  const token = await getSession(request);
  if (!token) {
    throw new Error("Unauthorized");
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
