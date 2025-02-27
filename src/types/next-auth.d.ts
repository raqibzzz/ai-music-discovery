import 'next-auth';
// JWT is used in the module declaration, so we don't need to import it explicitly

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}