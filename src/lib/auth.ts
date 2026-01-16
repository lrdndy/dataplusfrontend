// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User } from 'next-auth' // 导入User类型
import CredentialsProvider from 'next-auth/providers/credentials'

// 1. 定义包含privilege的自定义用户类型（局部生效）
interface CustomUser extends User {
    username: string; // 新增：用户名
    password: string; // 新增：密码
    privilege: boolean; // 已有：权限字段
}

// 明文演示用户（符合CustomUser类型）
const demoUsers: CustomUser[] = [
    { id: '1', username: 'client1', password: '123456', name: '图南', privilege: true },
    { id: '2', username: 'shihezi', password: '262626', name: '⽯⽿⼭', privilege: false },
]

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: '账号密码登录',
            credentials: {
                username: { label: '用户名', type: 'text' },
                password: { label: '密码', type: 'password' }
            },
            async authorize(credentials) {
                // 2. 查找用户并断言为CustomUser（明确包含privilege）
                const user = demoUsers.find(
                    u => u.username === credentials?.username && u.password === credentials?.password
                ) as CustomUser | undefined;

                if (user) {
                    return user; // 返回CustomUser类型，包含privilege
                }
                return null;
            }
        })
    ],
    pages: { signIn: '/login' },
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user }) {
            // 3. 处理user时，断言为CustomUser（确保能访问privilege）
            if (user) {
                token.privilege = (user as CustomUser).privilege;
            }
            return token;
        },
        async session({ session, token }) {
            // 4. 给session.user添加privilege（临时扩展类型）
            session.user = {
                ...session.user,
                privilege: token.privilege as boolean // 从token取privilege
            } as User & { privilege: boolean }; // 断言为“User+privilege”类型
            return session;
        }
    }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }