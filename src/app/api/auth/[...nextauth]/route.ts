import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import UserModel, { IUser } from "@/models/User";

// 仮のユーザーデータは削除
// const users = [...];

// NextAuth の型を拡張して isAdmin を含める
declare module "next-auth" {
  interface User extends DefaultUser {
    isAdmin?: boolean;
    id?: string;
  }
  interface Session extends DefaultSession {
    user?: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    isAdmin?: boolean;
    id?: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error("Credentials missing");
          return null;
        }

        await dbConnect();

        try {
          // データベースからメールアドレスでユーザーを検索 (パスワードも取得)
          const user = await UserModel.findOne({ email: credentials.email }).select('+password').exec() as IUser | null;

          if (!user) {
            console.log("User not found for email:", credentials.email);
            return null; // ユーザーが見つからない
          }

          // 取得したユーザーのパスワードと入力されたパスワードを比較
          const isPasswordMatch = await user.comparePassword(credentials.password);

          if (!isPasswordMatch) {
            console.log("Password mismatch for user:", user.email);
            return null; // パスワードが一致しない
          }

          console.log("Authentication successful for user:", user.email);
          // 認証成功：セッションに含める情報を返す
          return {
            id: user._id.toString(), // Mongoose の _id を文字列に変換
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
          };
        } catch (error) {
          console.error("Error during authorization:", error);
          return null; // エラー発生時
        }
      },
    }),
  ],
  // セッション管理の設定 (JWTを使用)
  session: {
    strategy: "jwt",
  },
  // JWT コールバック: authorize から返された user 情報を token に追加
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.isAdmin !== undefined) {
          token.isAdmin = user.isAdmin;
        }
      }
      return token;
    },
    // session コールバック: token の情報を session オブジェクトに追加
    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      if (session.user && token.id && typeof token.isAdmin === 'boolean') {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  // ログインページのカスタムパス (必要に応じて設定)
  // pages: {
  //   signIn: '/auth/signin',
  // },
  // 環境変数からシークレットを取得
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 