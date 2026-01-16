// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// 仅导出 GET/POST 方法，不再导出 authOptions
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
