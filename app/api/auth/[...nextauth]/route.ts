import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// authOptions কে export করছি যাতে সার্ভার কম্পোনেন্টেও ব্যবহার করা যায়
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "ceo@deshiotati.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ডামি লগইন চেক (পরে এখানে আপনার আসল ডেটাবেস বা API কল বসবে)
        if (credentials?.email === "ceo@deshiotati.com" && credentials?.password === "123456") {
          return { 
            id: "1", 
            name: "Mr. Ullash Ahmed", 
            email: "ceo@deshiotati.com", 
            role: "Super Admin" // কাস্টম ফিল্ড
          };
        }
        // পাসওয়ার্ড ভুল হলে null রিটার্ন করবে, যা লগইন ফেইল করাবে
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login", // আমাদের কাস্টম লগইন পেজের লিংক
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // ৩০ দিন সেশন থাকবে
  },
  callbacks: {
    // সেশনে কাস্টম ডেটা (যেমন role) পাস করার জন্য
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fcom-super-secret-key-2026",
};

const handler = NextAuth(authOptions);

// App Router-এর নিয়ম অনুযায়ী GET এবং POST এক্সপোর্ট করতে হয়
export { handler as GET, handler as POST };