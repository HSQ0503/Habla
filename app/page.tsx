import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <Image
        src="/logo.png"
        alt="Habla"
        width={200}
        height={64}
        priority
      />
      <p className="mt-4 text-lg text-gray-600">
        IB Spanish speaking practice
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Log in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
