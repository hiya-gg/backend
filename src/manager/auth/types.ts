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

// eslint-disable-next-line import/prefer-default-export
export { TokenPayload };
