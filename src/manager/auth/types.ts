interface TokenPayload {
  access?: {
    user: {
      id: number;
      email: string;
      username: string;
    };
    scopes?: string[];
  };
  refresh?: {
    access: string;
  };
  type: "access" | "refresh";
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  type: "Bearer";
}

export { TokenPayload, TokenResponse };
