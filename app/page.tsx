import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Kustomoto
        </h1>
        <p className="max-w-md text-lg text-gray-600 dark:text-gray-400">
          Customize your motorcycle in 3D. Choose colors, materials, and make it
          yours.
        </p>
        <Link
          href="/configurator"
          className="rounded-full bg-blue-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
        >
          Start Customizing
        </Link>
      </main>
    </div>
  );
}
