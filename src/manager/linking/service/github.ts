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

import centra from "centra";
import { getClientOptions, ServiceMetadata } from "../types";

interface GitHubUser {
  name: string;
  id: number;
  html_url: string;
  avatar_url: string;
  login: string;

  company?: string;
  blog?: string;
  location?: string;
  bio?: string;
}

const GITHUB_SERVICE: ServiceMetadata = {
  name: "github",
  scopes: ["read:user"],
  config: {
    client: getClientOptions("github"),
    auth: {
      tokenHost: "https://github.com",
      authorizePath: "/login/oauth/authorize",
      tokenPath: "/login/oauth/access_token",
    },
  },
  connectionBuilder: async (token: string) => {
    const user: GitHubUser = await centra("https://api.github.com/user")
      .header("Authorization", `token ${token}`)
      .header("User-Agent", "HiyaGG Backend/1.0 (https://hiya.gg)")
      .send()
      .then((res) => res.json());

    return {
      username: user.login,
      platformId: user.id.toString(),
      metadata: {
        name: user.name,
        url: user.html_url,
        avatar: user.avatar_url,
        login: user.login,

        company: user.company,
        website: user.blog,
        location: user.location,
        bio: user.bio,
      },
    };
  },
};

export default GITHUB_SERVICE;
