import { cn } from '../lib/ui-helpers/cn'
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { UserMenu } from './user'
import { ArrowLeftCircle, BadgeCheck, Grid2X2, Grid2X2X, HeadphoneOff, Headphones, HelpCircle, PlusCircle } from 'lucide-react'
import { AddTab } from './add'
import SpatialSound from '../lib/SpatialSounds'
import { World } from '../lib/World'

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
  const [muted, setMuted] = useState(false)
  const [isDebug, setDebug] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const onToggleDebug = () => {
        setDebug(!isDebug)
      World.instance.toggleDebug()
      World.instance.innerBoundingBoxHelper.visible = !isDebug
      World.instance.dayNightCycle.moonHelper!.visible = !isDebug
      World.instance.dayNightCycle.sunHelper!.visible = !isDebug

      document.getElementById('gui_container')!.style.display = isDebug ? 'none' : 'block'
  }

  const onToggleMute = () => {
      setMuted(!muted)
      SpatialSound.listener.setMasterVolume(muted ? 1 : 0)
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
              ? 'max-h-[90%] md:max-h-96 opacity-100'
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
                <BadgeCheck className='w-6 h-6' /> Benjythebee
              </a>
            </li>
            <li className='' key={'tools'}>
                  <div className='border-white/50 border-t-1 flex items-center gap-2'>
                    <button
                      onClick={onToggleMute}
                      className={'smallMenuButton'}
                          >{muted?<HeadphoneOff className='w-6 h-6' />:<Headphones className='w-6 h-6'/>}</button>
                    <button
                    className={'smallMenuButton'}
                    onClick={()=>{
                      onToggleDebug()
                    }}>
                        {isDebug?<Grid2X2X className='w-6 h-6' />:<Grid2X2  className='w-6 h-6' />}
                    </button>
                  </div>
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
    <div className="w-[98%] md:w-72 h-100 md:max-h-72 overflow-y-scroll p-2 rounded-lg bg-black bg-opacity-50 backdrop-blur shadow-lg text-white">
      <h2 className="text-lg font-semibold mb-2">About</h2>
      <p className="text-sm text-gray-300 mb-4">
        Skybuds is a serene 3D world built around a floating island where digital life grows as visitors bring life to it.
        <br />
        <br />
        Visitors can create and accessorize and mint their own unique characters as NFTs, who then become permanent residents of the island. Watch as these little beings wander the landscape.
      <br />
      <br />
        Built with React, TypeScript, Three.js, and Tailwind CSS, Skybuds is a small personal project that blends interactive 3D experiences and web3 technology.
      </p>
      <ul className="space-y-2">
        <li className="text-sm text-gray-300">
          Author:{' '}
          <a className="underline" target="_blank" href="https://benjylarcher.com">
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
