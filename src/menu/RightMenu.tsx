import { cn } from '../lib/ui-helpers/cn'
import React, { useState } from 'react'
import { UserMenu } from './user'
import {
  ArrowLeftCircle,
  ArrowUpRight,
  Grid2X2,
  Grid2X2X,
  HeadphoneOff,
  Headphones,
  HelpCircle,
  PlusCircle,
  Sunrise,
  Sunset
} from 'lucide-react'
import { AddTab } from './add'
import SpatialSound from '../lib/SpatialSounds'
import { World } from '../lib/World'
import { gui } from '../lib/config'
import { AboutPage } from './about'
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

  React.useEffect(() => {
    if(!isOpen) {
      setTimeout(() => {setPage(Tabs.MENU)},200)
      
    }
  },[isOpen])

  const onToggleDebug = () => {
    setDebug(!isDebug)
    World.instance.toggleDebug()
    World.instance.innerBoundingBoxHelper.visible = !isDebug
    World.instance.dayNightCycle.moonHelper!.visible = !isDebug
    World.instance.dayNightCycle.sunHelper!.visible = !isDebug

    gui.domElement.style.display = isDebug ? 'none' : 'block'
    document.getElementById('stats.fps')!.style.display = isDebug
      ? 'none'
      : 'block'
  }

  const onToggleMute = () => {
    setMuted(!muted)
    SpatialSound.listener.setMasterVolume(muted ? 1 : 0)
  }

  return (
    <>
    <div className="absolute top-6 right-6 z-10">
      {/* Menu Icon Button */}
      <div className="w-full flex items-end flex-row-reverse">
        <button
          onClick={toggleMenu}
          className="w-10 h-10 rounded-lg bg-black bg-opacity-50 backdrop-blur 
                    flex items-center justify-center text-white shadow-lg
                    hover:bg-opacity-70 focus:outline-none transition-all duration-300 cursor-pointer pointer-events-auto"
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
    </div>
   
      {/* Menu Panel */}
      <div
        className={cn(` absolute top-16 right-2 md:right-6 z-10
          mt-1 p-2 rounded-xl bg-black/50 backdrop-blur shadow-lg 
          transition-all duration-300 ease-out overflow-hidden
          ${
            isOpen
              ? ' w-[90%] md:w-72 opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none'
          },
          ${page == Tabs.WALLET ? 'md:w-120' : ''}
        `)}
      >
          {page != Tabs.MENU && (
            <ul className="">
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
            <ul className="">
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
                  <ArrowUpRight className="w-6 h-6" /> Benjythebee
                </a>
              </li>
              <li className="" key={'tools'}>
                <div className="border-white/50 border-t-1 flex items-center gap-2">
                  <button onClick={onToggleMute} className={'smallMenuButton'}>
                    {muted ? (
                      <HeadphoneOff className="w-6 h-6" />
                    ) : (
                      <Headphones className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    className={'smallMenuButton'}
                    onClick={() => {
                      onToggleDebug()
                    }}
                  >
                    {isDebug ? (
                      <Grid2X2X className="w-6 h-6" />
                    ) : (
                      <Grid2X2 className="w-6 h-6" />
                    )}
                  </button>

                  <button
                    className={'smallMenuButton'}
                    onClick={() => {
                      World.instance.dayNightCycle.setDay()
                    }}
                  >
                    <Sunrise className="w-6 h-6" />
                  </button>

                  <button
                    className={'smallMenuButton'}
                    onClick={() => {
                      World.instance.dayNightCycle.setNight()
                    }}
                  >
                    <Sunset className="w-6 h-6" />
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
    </>
  )
}

