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

import { Controller, GET } from "fastify-decorators";
import { FastifyReply, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { createClient, services } from "../../manager/linking";
import { verifyScopes } from "../../manager/auth";
import { prisma } from "../../database";
import { fastify } from "../index";

const OAuthParams = Type.Object({
  id: Type.String(),
});
type OAuthParamsType = Static<typeof OAuthParams>;

const OAuthCodeQuery = Type.Object({
  code: Type.String(),
});
type OAuthCodeQueryType = Static<typeof OAuthCodeQuery>;

@Controller({ route: "/oauth" })
export default class OauthController {
  @GET({
    url: "/:id/authorize",
    options: {
      schema: {
        params: OAuthParams,
      },
    },
  })
  async authorizeHandler(
    request: FastifyRequest<{
      Params: OAuthParamsType;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id.toLowerCase();
    const service = services.find((s) => s.name.toLowerCase() === id);

    if (!service) {
      return fastify.httpErrors.notFound();
    }

    // TODO: State
    const client = createClient(service);
    const url = client.authorizeURL({
      redirect_uri: `${request.protocol}://${request.hostname}/oauth/${id}/callback`,
      scope: service.scopes,
    });

    return reply.redirect(url);
  }

  @GET({
    url: "/:id/callback",
    options: {
      schema: {
        params: OAuthParams,
        querystring: OAuthCodeQuery,
      },
      preHandler: fastify.auth([verifyScopes(["connections.link"])]),
    },
  })
  async callbackHandler(
    request: FastifyRequest<{
      Params: OAuthParamsType;
      Querystring: OAuthCodeQueryType;
    }>
  ) {
    const session = await request.getSession();

    const id = request.params.id.toLowerCase();
    const service = services.find((s) => s.name.toLowerCase() === id);

    if (!service) {
      return fastify.httpErrors.notFound();
    }

    let token;
    try {
      const client = createClient(service);
      token = await client.getToken({
        code: request.query.code,
        redirect_uri: `${request.protocol}://${request.hostname}/oauth/${id}/callback`,
      });

      if (!token || token.expired()) {
        return fastify.httpErrors.badRequest();
      }
    } catch (e) {
      return fastify.httpErrors.badRequest("Invalid code");
    }

    try {
      const connection = await service.connectionBuilder(
        token.token.access_token
      );

      await prisma.connection.upsert({
        create: {
          user: {
            connect: {
              id: session.access?.user.id,
            },
          },
          type: service.name,
          ...connection,
        },
        update: connection,
        where: {
          platformId: connection.platformId,
        },
      });

      return connection;
    } catch (e) {
      fastify.log.error(e);
      return fastify.httpErrors.internalServerError();
    }
  }
}
