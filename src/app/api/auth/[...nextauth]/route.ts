import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// 明文硬编码演示用户
const demoUsers = [
    { id: '1', username: 'client1', password: '123456', name: '演示用户' }
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
                // 明文比对账号密码
                const user = demoUsers.find(
                    u => u.username === credentials?.username && u.password === credentials?.password
                )
                return user ? { id: user.id, name: user.name } : null
            }
        })
    ],
    pages: { signIn: '/login' }, // 自定义登录页路径
    session: { strategy: 'jwt' }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }