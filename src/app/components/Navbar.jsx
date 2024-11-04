'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-[#C7092C] p-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold font-outfit">
          Asset Management
        </Link>
        <div>
          {session ? (
            <>
              <span className="text-white mr-4 font-poppins">{session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-white text-[#C7092C] px-4 py-2 rounded hover:bg-white/95 hover:text-[#C7092C]/95 font-poppins"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-white">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
