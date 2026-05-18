import Link from 'next/link';

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string, error_description?: string }> }) {
  const params = await searchParams;
  const errorMsg = params?.error_description || params?.error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
      <div className="text-center space-y-8 max-w-lg">
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-8 text-sm md:text-base shadow-lg shadow-red-500/10">
            <strong>Authentication Error: </strong> {errorMsg.replace(/\+/g, ' ')}
          </div>
        )}
        <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Jam/Sort
        </h1>
        <p className="text-xl text-gray-300">
          Match colors, clear the conveyor, and test your puzzle-solving skills!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/game"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            Play Now
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full font-bold text-lg transition-transform hover:scale-105"
          >
            Login / Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
