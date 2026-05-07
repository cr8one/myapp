import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email as string
        const ipAddress = request?.headers?.get("x-forwarded-for") ?? request?.headers?.get("x-real-ip") ?? null
        const userAgent = request?.headers?.get("user-agent") ?? null
        const user = await prisma.user.findUnique({
          where: { email },
        })
        if (!user) {
          await prisma.loginLog.create({
            data: { email, status: "failed", ipAddress, userAgent },
          })
          return null
        }
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) {
          await prisma.loginLog.create({
            data: { email, userId: user.id, status: "failed", ipAddress, userAgent },
          })
          return null
        }
        await prisma.loginLog.create({
          data: { email, userId: user.id, status: "success", ipAddress, userAgent },
        })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
