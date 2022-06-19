/*
 * HiyaGG - Universal connections for all your accounts
 * Copyright (C) 2022 Zerite Development
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySensible from "@fastify/sensible";
import { bootstrap } from "fastify-decorators";
import * as process from "process";
import config from "../config";

// Configure fastify
const app = fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

// Configure plugins
app.register(fastifySwagger, {
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

app.register(fastifySensible);

// Configure route resolving
app.register(bootstrap, {
  directory: new URL("controllers", import.meta.url),
  mask: /\.controller\./,
});

// Set error handling
app.setErrorHandler(async (error) => ({
  success: false,
  error: error.message,
  code: error.statusCode ?? 400,
}));
app.setNotFoundHandler(async (request) => ({
  success: false,
  error: `${request.method}:${request.url} Not Found`,
}));

export default {
  start: async () => {
    try {
      await app.listen({
        host: config.app.fastify.host,
        port: config.app.fastify.port,
      });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  },
};
