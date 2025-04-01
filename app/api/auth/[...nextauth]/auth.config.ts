import { JWT } from "next-auth/jwt";
import { SessionStrategy } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectToDatabase();

        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        console.log('[Auth] Finding user with email:', credentials.email);
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          console.log('[Auth] User not found');
          throw new Error("ユーザーが見つかりません");
        }

        console.log('[Auth] User found:', user.email);
        console.log('[Auth] Comparing password for user:', user.email);
        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log('[Auth] Password validation result:', isValid);

        if (!isValid) {
          console.log('[Auth] Password incorrect for user:', user.email);
          throw new Error("パスワードが正しくありません");
        }

        console.log('[Auth] Password correct for user:', user.email);
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isAI: user.isAI,
          aiPersonality: user.aiPersonality,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.isAI = user.isAI;
        token.aiPersonality = user.aiPersonality;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.isAI = token.isAI;
        session.user.aiPersonality = token.aiPersonality;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 