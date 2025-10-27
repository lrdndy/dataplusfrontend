// src/providers/SessionProvider.tsx
'use client'; // 关键：标记为客户端组件

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

// 定义Props类型，接收session和子组件
type Props = {
    children: React.ReactNode;
    session: Session | null; // 从服务器传递的session
};

// 包装NextAuth的SessionProvider，确保在客户端运行
export const SessionProvider = ({ children, session }: Props) => {
    return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
};
