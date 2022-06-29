interface TokenPayload {
  access?: {
    user: {
      id: string;
      username: string;
    };
    scopes?: string[];
  };

  refresh?: {
    user?: {
      id: string;
    };
  };

  pairId: string;
  type: "access" | "refresh";

  // JWT elements - only present after creation
  iss?: string; // Issuer
  iat?: number; // Issued at
  exp?: number; // Expiration
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  type: "Bearer";
}

export { TokenPayload, TokenResponse };
