'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false) // 新增加载状态
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('') // 清空之前的错误

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError(result.error || '登录失败，请检查用户名和密码')
            } else {
                router.push('/')
                router.refresh() // 刷新页面确保登录状态生效
            }
        } catch (err) {
            setError('服务器异常，请稍后再试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            {/* 装饰元素 - 增强视觉层次 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* 标题区域 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                        dataplus
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">数据驱动决策的智能平台</p>
                </div>

                {/* 登录表单卡片 */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl">
                    <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-6 text-center">账户登录</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300 text-sm flex items-center">
                            <span className="mr-2">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 用户名输入框 */}
                        <div className="space-y-2">
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                用户名
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 disabled:opacity-70"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* 密码输入框 */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                密码
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 disabled:opacity-70"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* 登录按钮 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    <span>登录中...</span>
                                </>
                            ) : (
                                <span>登录</span>
                            )}
                        </button>
                    </form>

                    {/* 底部辅助信息 */}
                    <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        <p>© 2025 dataplus. 保留所有权利</p>
                    </div>
                </div>
            </div>
        </div>
    )
}