import { login, signup, loginAsGuest } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, error_description?: string }> }) {
    const params = await searchParams;
    const errorMsg = params?.error_description || params?.error;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
            <div className="w-full max-w-sm bg-gray-800 rounded-xl p-8 shadow-xl">
                <h1 className="text-2xl font-bold text-center mb-6">Jam/Sort</h1>

                <form className="flex flex-col gap-4" suppressHydrationWarning>
                    <div suppressHydrationWarning>
                        <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div suppressHydrationWarning>
                        <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-md text-sm font-semibold text-center mb-2">
                            {errorMsg.replace(/\+/g, ' ')}
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button formAction={login} className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-md font-semibold transition-colors">
                            Log in
                        </button>
                        <button formAction={signup} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-md font-semibold transition-colors">
                            Sign up
                        </button>
                    </div>
                </form>

                <div className="my-6 flex items-center justify-center w-full">
                    <div className="w-full h-[1px] bg-gray-600 flex-1"></div>
                    <span className="px-4 text-xs text-gray-400 uppercase font-bold">Or</span>
                    <div className="w-full h-[1px] bg-gray-600 flex-1"></div>
                </div>

                <form>
                    <button formAction={loginAsGuest} className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-md font-bold transition-colors">
                        Play as Guest
                    </button>
                </form>
            </div>
        </div>
    )
}
