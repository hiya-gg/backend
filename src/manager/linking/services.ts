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

import { AuthorizationCode } from "simple-oauth2";
import { ServiceMetadata } from "./types";
import DISCORD_SERVICE from "./service/discord";
import GITHUB_SERVICE from "./service/github";

const services: ServiceMetadata[] = [DISCORD_SERVICE, GITHUB_SERVICE];

const createClient = (service: ServiceMetadata) =>
  new AuthorizationCode(service.config);

export { DISCORD_SERVICE, services, createClient };
