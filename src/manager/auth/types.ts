interface TokenPayload {
  user: {
    id: number;
    email: string;
    username: string;
  };
}

// eslint-disable-next-line import/prefer-default-export
export { TokenPayload };
