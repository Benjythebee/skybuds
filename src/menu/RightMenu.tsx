import { cn } from '../lib/ui-helpers/cn'
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { UserMenu } from './user'
import { ArrowLeftCircle, HelpCircle, PlusCircle } from 'lucide-react'
import { AddTab } from './add'
import { SiX } from '@icons-pack/react-simple-icons'
interface MenuOption {
  id: string
  label: string
  onClick: () => void
}

interface ChillMenuProps {
  onAddSkyBud?: () => void
  onViewSkyBuds?: () => void
  onAbout?: () => void
}

export enum Tabs {
  MENU = 'menu',
  ABOUT = 'about',
  WALLET = 'wallet',
  ADD = 'add'
}

export const RightMenu: React.FC<ChillMenuProps> = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState(Tabs.MENU)
  const { address } = useAccount()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="absolute top-6 right-6 z-10">
      {/* Menu Icon Button */}
      <div className="w-full flex items-end flex-row-reverse">
        <button
          onClick={toggleMenu}
          className="w-10 h-10 rounded-lg bg-black bg-opacity-50 backdrop-blur 
                    flex items-center justify-center text-white shadow-lg
                    hover:bg-opacity-70 focus:outline-none transition-all duration-300 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Menu Panel */}
      <div
        className={cn(`
          mt-1 p-2 rounded-xl bg-black/50 backdrop-blur shadow-lg 
          transition-all duration-300 ease-out overflow-hidden
          ${
            isOpen
              ? 'max-h-96 opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none'
          }
        `)}
      >
        {page != Tabs.MENU && (
          <ul className="w-40">
            <li
              onClick={() =>
                page == Tabs.ADD ? setPage(Tabs.WALLET) : setPage(Tabs.MENU)
              }
              className={`w-full cursor-pointer text-left px-4 py-2 rounded-lg text-white text-opacity-90 
                          hover:bg-black/50 transition-colors duration-200
                          text-lg font-light`}
            >
              <div className="flex items-center gap-2">
                <ArrowLeftCircle className="w-4 h-4" /> Back
              </div>
            </li>
          </ul>
        )}

        {page == Tabs.MENU && (
          <ul className="w-40">
            <li key={'about'}>
              <button
                onClick={() => {
                  setPage(Tabs.ABOUT)
                }}
                className={`w-full cursor-pointer text-left px-4 py-2 rounded-lg text-white text-opacity-90
                  hover:bg-black/50 hover:bg-opacity-10 transition-colors duration-200
                  text-lg font-light flex items-center gap-2`}
              >
                <HelpCircle className="w-6 h-6" /> About
              </button>
            </li>
            <li key={'add'}>
              <button
                onClick={() => {
                  setPage(Tabs.WALLET)
                }}
                className={`w-full cursor-pointer  text-left px-4 py-2 rounded-lg text-white text-opacity-90
                    hover:bg-black/50 hover:bg-opacity-10 transition-colors duration-200
                    text-lg font-light flex items-center gap-2`}
              >
                <PlusCircle className="w-6 h-6" /> Skybuds
              </button>
            </li>
            <li key={'twitter'}>
              <a
                href="https://x.com/benjythebee"
                target="_blank"
                className={`w-full cursor-pointer  text-left px-4 py-2 rounded-lg text-white text-opacity-90
                    hover:bg-black/50 hover:bg-opacity-10 transition-colors duration-200
                    text-lg font-light flex items-center gap-2`}
              >
                <SiX size={24} /> @Benjythebee
              </a>
            </li>
          </ul>
        )}

        {page == Tabs.ABOUT && <AboutPage />}
        {page == Tabs.WALLET && (
          <UserMenu setPage={setPage} closeMenu={() => setIsOpen(false)} />
        )}
        {page == Tabs.ADD && <AddTab setPage={setPage} />}
      </div>
    </div>
  )
}

const AboutPage = () => {
  return (
    <div className="max-h-64 overflow-y-scroll w-60 p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white">
      <h2 className="text-lg font-semibold mb-2">About</h2>
      <p className="text-sm text-gray-300 mb-4">
        Skybuds is a small personal project where you can see and add your own
        little character to a peaceful world.
        <br />
        This project was to demonstrate the use of web3 technologies and
        threeJS. And was built using React, TypeScript, and Tailwind CSS.
      </p>
      <ul className="space-y-2">
        <li className="text-sm text-gray-300">Version: 1.0.0</li>
        <li className="text-sm text-gray-300">
          Author:{' '}
          <a className="underline" href="https://x.com/benjythebee">
            Benjythebee
          </a>
        </li>
      </ul>
    </div>
  )
}

const web3MenuOptions = () => {
  const { address } = useAccount()

  if (address) {
    return <li className="text-white">Your SkyBuds</li>
  }
}
