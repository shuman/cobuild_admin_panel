import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { serverApi } from "./server-api";
import { SESSION_MAX_AGE } from "./constants";
import type { User } from "@/types";

declare module "next-auth" {
  interface Session {
    apiToken: string;
    user: User;
    lastActivity: number;
  }
}

declare module "next-auth" {
  interface User {
    apiToken?: string;
    userData?: import("@/types").User;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    apiToken?: string;
    userData?: import("@/types").User;
    lastActivity?: number;
  }
}

function extractMinimalUser(fullUser: Record<string, unknown>): User {
  return {
    id: fullUser.id as string,
    name: fullUser.name as string,
    email: fullUser.email as string,
    phone: (fullUser.phone as string) || null,
    photo_path: (fullUser.photo_path as string) || null,
    is_admin: fullUser.is_admin as boolean,
    is_super_admin: fullUser.is_super_admin as boolean,
    is_verified: fullUser.is_verified as boolean,
    is_active: fullUser.is_active as boolean,
    last_login_at: (fullUser.last_login_at as string) || null,
    created_at: fullUser.created_at as string,
    updated_at: fullUser.updated_at as string,
  };
}

/** Decode 2FA completion payload: "base64(jwt).base64(userJson)" */
function decode2FAPayload(password: string): { jwt: string; user: Record<string, unknown> } {
  const dot = password.indexOf(".");
  if (dot === -1) throw new Error("Invalid 2FA payload");
  const jwt = Buffer.from(password.slice(0, dot), "base64").toString("utf8");
  const userJson = Buffer.from(password.slice(dot + 1), "base64").toString("utf8");
  const user = JSON.parse(userJson) as Record<string, unknown>;
  return { jwt, user };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // ── 2FA completion: client verified OTP and sends JWT + user (base64 encoded) ──
        if (email === "__2fa_verified__") {
          try {
            const { jwt, user } = decode2FAPayload(password);
            if (!user?.is_super_admin) {
              throw new Error("Access denied. SuperAdmin privileges required.");
            }
            const minimalUser = extractMinimalUser(user);
            return {
              id: minimalUser.id,
              name: minimalUser.name,
              email: minimalUser.email,
              apiToken: jwt,
              userData: minimalUser,
            };
          } catch (e) {
            const message = e instanceof Error ? e.message : "2FA completion failed";
            throw new Error(message);
          }
        }

        // ── Direct login: client already called /login and got token + user; we just create session ──
        if (email === "__direct_login__") {
          try {
            const { jwt, user } = decode2FAPayload(password);
            if (!user?.is_super_admin) {
              throw new Error("Access denied. SuperAdmin privileges required.");
            }
            const minimalUser = extractMinimalUser(user);
            return {
              id: minimalUser.id,
              name: minimalUser.name,
              email: minimalUser.email,
              apiToken: jwt,
              userData: minimalUser,
            };
          } catch (e) {
            const message = e instanceof Error ? e.message : "Direct login failed";
            throw new Error(message);
          }
        }

        // ── Fallback: server-side login (e.g. if someone calls signIn with raw email/password) ──
        try {
          const api = serverApi();
          const response = await api.post("/login", {
            login: email,
            password,
          });

          const data = response.data as Record<string, unknown>;

          if (data.requires_2fa === true) {
            throw new Error(
              JSON.stringify({
                requires_2fa: true,
                two_fa_token: data.two_fa_token,
              })
            );
          }

          const items = data.items as { user: Record<string, unknown>; token: string };
          if (!items?.user || !items?.token) {
            throw new Error("Invalid login response");
          }

          const fullUser = items.user;
          if (!fullUser.is_super_admin) {
            throw new Error("Access denied. SuperAdmin privileges required.");
          }

          const minimalUser = extractMinimalUser(fullUser);
          return {
            id: minimalUser.id,
            name: minimalUser.name,
            email: minimalUser.email,
            apiToken: items.token,
            userData: minimalUser,
          };
        } catch (error: unknown) {
          const err = error as { message?: string; response?: { data?: Record<string, unknown> } };
          if (typeof err.message === "string" && err.message.startsWith("{")) {
            throw error;
          }
          const data = err.response?.data;
          if (data?.requires_2fa === true) {
            throw new Error(
              JSON.stringify({
                requires_2fa: true,
                two_fa_token: data.two_fa_token,
              })
            );
          }
          const message =
            (data?.error as string) ||
            (data?.message as string) ||
            err.message ||
            "Login failed";
          throw new Error(message);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.apiToken = user.apiToken;
        token.userData = user.userData;
        token.lastActivity = Date.now();
      }
      if (trigger === "update") {
        token.lastActivity = Date.now();
      }
      if (token.lastActivity) {
        const elapsed = Date.now() - token.lastActivity;
        if (elapsed > SESSION_MAX_AGE * 1000) {
          return { ...token, apiToken: undefined, userData: undefined };
        }
      }
      token.lastActivity = Date.now();
      return token;
    },
    async session({ session, token }) {
      if (token.apiToken && token.userData) {
        session.apiToken = token.apiToken as string;
        (session as unknown as { user: User }).user = token.userData as User;
        session.lastActivity = token.lastActivity as number;
      }
      return session;
    },
  },
  trustHost: true,
});
