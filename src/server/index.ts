/*
 * HiyaGG - Universal connections for all your accounts
 * Copyright (C) 2022 Zerite Development
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import Fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySensible from "@fastify/sensible";
import { bootstrap } from "fastify-decorators";
import * as process from "process";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyAuth from "@fastify/auth";
import { app } from "../config";
import { hiyaFastifyAuth, SIGN_OPTIONS, VERIFY_OPTIONS } from "../manager/auth";

// Configure fastify
const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },

  // Fix for TypeBox, see:
  // https://github.com/fastify/fastify/issues/3421#issuecomment-962469639
  ajv: {
    customOptions: {
      strict: "log",
      keywords: ["kind", "modifier"],
    },
  },
});

// Configure plugins
fastify.register(fastifySwagger, {
  routePrefix: "/swagger",
  exposeRoute: true,
  swagger: {
    info: {
      title: "HiyaGG API",
      description: "API for HiyaGG",
      version: "1.0.0",
    },
  },
});

fastify.register(fastifySensible);
fastify.register(fastifyAuth);

// Configure authentication
fastify.register(fastifyJwt, {
  secret: app.jwt.secret,
  sign: SIGN_OPTIONS,
  verify: VERIFY_OPTIONS,
  cookie: {
    cookieName: "token",
    signed: false,
  },
});

fastify.register(fastifyCookie, {
  secret: app.jwt.secret,
});

// Configure route resolving
fastify.register(bootstrap, {
  directory: new URL("controllers", import.meta.url),
  mask: /\.controller\./,
});

// Register custom plugins
fastify.register(hiyaFastifyAuth);

// Set error handling
fastify.setErrorHandler(async (error) => {
  if (process.env.NODE_ENV === "development") {
    fastify.log.error(error);
  }

  return {
    success: false,
    error: error.message,
    code: error.statusCode ?? 400,
  };
});
fastify.setNotFoundHandler(async (request) => {
  const url = new URL(request.url, `${request.protocol}://${request.hostname}`);
  return {
    success: false,
    error: `${request.method}:${url.pathname} Not Found`,
  };
});

const start = async () => {
  try {
    await fastify.listen({
      host: app.fastify.host,
      port: app.fastify.port,
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

export { start, fastify };
