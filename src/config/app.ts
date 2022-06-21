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

const optInt = (value: string | undefined) => {
  if (!value) return undefined;
  return parseInt(value, 10);
};

export default {
  fastify: {
    host: process.env.FASTIFY_HOST || "0.0.0.0",
    port: optInt(process.env.FASTIFY_PORT) || 3000,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "secret",
  },
};
