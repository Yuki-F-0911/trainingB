import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise } from "@/lib/dbConnect";
import UserModel, { IUser } from "@/models/User"; // Your User model
import bcrypt from "bcryptjs"; // Use bcryptjs to match the User model
import mongoose, { models } from 'mongoose'; // Import mongoose and models
import { DefaultSession, DefaultUser } from "next-auth"; // Import original types
import { DefaultJWT } from "next-auth/jwt"; // Import original type

// 仮のユーザーデータは削除
// const users = [...];

// NextAuth の型を拡張して isAdmin を含める (Userモデルに合わせて調整)
declare module "next-auth" {
  interface User extends DefaultUser {
    isAdmin?: boolean;
    // id は DefaultUser に含まれているので不要
  }
  interface Session extends DefaultSession {
    user?: User & { id?: string | null }; // Session の user に id を追加
  }
}
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    isAdmin?: boolean; // isAdmin を含める場合
  }
}

const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
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
        // Connect Mongoose explicitly if needed, though adapter handles clientPromise
        // await dbConnect(); // dbConnect is the mongoose connector

        // Use the existing User model fetched via mongoose
        const User = models.User as mongoose.Model<IUser> || mongoose.model<IUser>('User', UserModel.schema); // Ensure model is registered

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

        // Return the essential user info needed by NextAuth
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: null, // Or user.image if available
          isAdmin: user.isAdmin // Include isAdmin if needed for session/token
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Customize user profile data from Google
      profile(profile) {
        // Map Google profile to the structure NextAuth adapter expects
        return {
          id: profile.sub, // Use Google's unique ID
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // isAdmin: false, // Default isAdmin for new Google users if needed
        }
      }
    }),
    // ...add more providers here if needed
  ],
  session: {
    // Use JSON Web Tokens for session management
    strategy: "jwt",
    // maxAge: 30 * 24 * 60 * 60, // Optional: Session expiry (30 days)
    // updateAge: 24 * 60 * 60, // Optional: Update JWT on background refresh (24 hours)
  },
  pages: {
    signIn: '/login', // Redirect users to /login page for sign-in
    signOut: '/', // Redirect users to homepage after sign-out
    error: '/login', // Redirect errors back to login page with ?error=
    // verifyRequest: '/auth/verify-request', // (Optional) Page for email verification link sent
    // newUser: null, // Default behavior after signup (usually redirect to '/')
  },
  callbacks: {
    // Modify the JWT token before it is saved
    async jwt({ token, user, account }) {
      if (user) { // When user object is passed (e.g., on sign in)
        token.id = user.id;
        // Cast user to include potentially custom fields like isAdmin
        const u = user as IUser & { isAdmin?: boolean };
        if (u.isAdmin !== undefined) {
            token.isAdmin = u.isAdmin;
        }
      }
      // Pass Google access token if needed
      if (account?.provider === "google") {
         token.accessToken = account.access_token;
      }
      return token;
    },
    // Modify the session object before it is returned to the client
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.isAdmin !== undefined) {
           // Explicitly cast session.user to allow adding isAdmin
           (session.user as any).isAdmin = token.isAdmin as boolean;
        }
      }
      return session;
    },
    // Control redirects after sign-in/sign-out etc.
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default redirect to homepage for other cases (e.g., sign-in success)
      return baseUrl;
    }
  },
  // A secret is used to encrypt the JWT & sign cookies. Generate one with `openssl rand -base64 32`
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug messages in development for easier troubleshooting
  debug: process.env.NODE_ENV === 'development',
};

// Initialize NextAuth.js with the options
const handler = NextAuth(authOptions);

// Export the handler for GET and POST requests
export { handler as GET, handler as POST }; 