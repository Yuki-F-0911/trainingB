import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise } from "@/lib/dbConnect";
import UserModel, { IUser } from "@/models/User";
import mongoose, { models } from 'mongoose';
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    isAdmin?: boolean;
  }
  interface Session extends DefaultSession {
    user?: User & { id?: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください。");
        }

        const User = models.User as mongoose.Model<IUser> || mongoose.model<IUser>('User', UserModel.schema);

        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user) {
          throw new Error("指定されたメールアドレスのユーザーは見つかりません。");
        }
        if (!user.password) {
          throw new Error("パスワードが設定されていません。Googleログインなどをお試しください。");
        }

        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error("パスワードが正しくありません。");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: null,
          isAdmin: user.isAdmin
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        const u = user as IUser & { isAdmin?: boolean };
        if (u.isAdmin !== undefined) {
          token.isAdmin = u.isAdmin;
        }
      }
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.isAdmin !== undefined) {
          (session.user as any).isAdmin = token.isAdmin as boolean;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions; 