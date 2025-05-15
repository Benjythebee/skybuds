import ExpandableSliderButton from 'components/ExpandableSlider'
import { CharacterState, Walker } from 'lib/Walker'
import { CircleCheck, Shirt, Trash2, X } from 'lucide-react'
import React, { useCallback } from 'react'
import { useSceneContext } from 'store/SceneContext'
import { Color, Vector3 } from 'three'
import { useWearableOverlayStore, WearablesGrid } from './WearableOverlay'
import {  usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import SkybudsABI from '../web3/SkyBudsABI.json'
import {  useSkyBudMetadata } from 'hooks/useSkyBudMetadata'
import { getAttribute } from 'web3/utils'


export const Overlay: React.FC<any> = () => {
  const { world, screenshotManager } = useSceneContext()
  const { isOpen, setOpen } = useWearableOverlayStore()
  const [walker, setWalker] = React.useState<Walker | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const [creator, setCreator] = React.useState<string>('')
  const [imageUrl, setImageUrl] = React.useState<string>('')
  const [talkative, setTalkative] = React.useState<boolean>(false)
  const [speed, setSpeed] = React.useState<number>(0)
  const [tokenId, setTokenId] = React.useState<number>(0)
  const [laziness, setLaziness] = React.useState<number>(0)
  const [name, setName] = React.useState<string>('')

  const [selectingColor, setSelectingColor] = React.useState<boolean>(false)
  const [color, setColor] = React.useState<Color>(new Color(0xffffff))

  const {  data: hash, error, isPending,writeContract } = useWriteContract()

  const {data,isLoading:IsLoadingMintedMetadata} = useSkyBudMetadata(tokenId)

  const {
    data:txReceipt,
    isLoading:isMinting,
    isSuccess,
  } = useWaitForTransactionReceipt({
    hash: hash as any,
    query: { enabled: !!hash },
  })

  const wagmiClient = usePublicClient()
  const onMint = async (imageUrl:string) => {
    const parameters = {
      wearables: walker!.hatWearables?Object.values(walker!.hatWearables).map((wearable) => wearable.wearableData.index):[],
      laziness: Math.max(0,Math.min(100,Math.floor(laziness*100))),
      speed: Math.max(0,Math.min(100,Math.floor(speed*100))),
      talkative: talkative? 1:0,
      color: color.getHexString(),
    }
    const args = [
          parameters.wearables,
          parameters.laziness,
          parameters.speed,
          parameters.talkative,
          parameters.color,
          imageUrl,
        ]
      console.log('Minting with parameters:', args)
    console.log('Minting with parameters:', args)
    try{
      const tx = await wagmiClient?.estimateContractGas({
        address: (import.meta.env.VITE_DEPLOYED_SKYBUDS || '0x') as `0x${string}`,
        abi: SkybudsABI.abi,
        functionName: 'mint',
        args,
      })
      console.log(tx)
    }catch(e){
      console.error(e)
    }

    writeContract({
      address:(import.meta.env.VITE_DEPLOYED_SKYBUDS||'0x') as `0x${string}`,
      abi:SkybudsABI.abi,
      functionName:'mint',
      args,
    },{
      onSuccess:(data)=> {
        console.log('Minting transaction sent:', data)
      },
      onError:(error) => {
        console.error('Error minting:', error)
      },  
      onSettled:(data) => {
        console.log('Minting transaction settled:', data)
      }
    })
  }

  const onMintedSuccess = async (tokenId:number,creator:string) => {
    // Set all the info on the walker
    if(!walker) return
    walker.walkerInfo.tokenId = tokenId
    walker.walkerInfo.creator = creator
    setCreator(creator)
    setTokenId(tokenId)
    // This will trigger the metadata to be fetched by the useSkyBudMetadata hook
  }

  React.useEffect(()=>{
      if(isSuccess && txReceipt){
        const id =  Number.parseInt(
						txReceipt.logs[1]?.topics[3] || '0x00',
						16,
					)
          onMintedSuccess(id,txReceipt.from)
        
      }
  },[isSuccess, txReceipt])

  React.useEffect(() => {
  
    if (data) {



      if(tokenId == parseInt(data.tokenId)){
        setName(data.name)
        setImageUrl(data.image)

        const talkative = getAttribute<boolean>(data,'Talkative')
        const speed = getAttribute<number>(data,'Speed')|| 0 / 100
        const laziness = getAttribute<number>(data,'Laziness')|| 0 / 100
        const color = getAttribute<string>(data,'Color') || '0xffffff'
        setTalkative(!!talkative)
        setSpeed(speed)
        setLaziness(laziness)
        const newColor = new Color(color)
        setColor(newColor)


        if (walker) {
          walker.walkerInfo.talkative = !!talkative
          walker.walkerInfo.laziness = laziness
          walker.walkerInfo.speed = speed
          walker.walkerInfo.color = parseInt(color.replace('#', '0x'),16)
          //@ts-ignore
          walker.mesh.material.color = newColor
        }
      }

    }
  }, [data])

  const onClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSelectingColor(false)
      }
    },
    [selectingColor, setSelectingColor]
  )

  React.useEffect(() => {
    const onSelected = (walker: Walker) => {
      setWalker(walker)
      setTokenId(walker.walkerInfo.tokenId)
      setName(walker.walkerInfo.name)
      setCreator(walker.isMinted ? walker.walkerInfo.creator : 'unknown')
      setImageUrl(walker.walkerInfo.image_url || '')
      setTalkative(walker.walkerInfo.talkative)
      setSpeed(walker.walkerInfo.speed)
      setLaziness(walker.walkerInfo.laziness)
      setColor(new Color(walker.walkerInfo.color))
    }

    const onUnselected = () => {
      setWalker(null)
    }

    Walker.events.on('walkerSelected', onSelected)
    Walker.events.on('walkerUnselected', onUnselected)

    document.addEventListener('click', onClickOutside)

    return () => {
      Walker.events.off('walkerSelected', onSelected)
      Walker.events.off('walkerUnselected', onUnselected)
      document.removeEventListener('click', onClickOutside)
    }
  }, [])

  const deselect = () => {
    setSelectingColor(false)
    Walker.unFocusWalker()
    setOpen(false)
    setWalker(null)
  }

  const removeWalker = () => {
    if (!walker) return
    deselect()

    Walker.removeWalker(walker.id)
  }

  const screenshotAndMint = async () => {
    if (!walker) return

    // Temporarily move the walker to a point on the map
    const middlePoint = new Vector3(0, 1, 0).add(new Vector3(0, 0.1, 2))
    const prevPos = walker.object.position.clone()
    walker.paused = true
    walker.object.position.copy(middlePoint)
    Walker.animationManager.pauseAnimationAtFrame(
      walker,
      CharacterState.WAVING,
      1.5
    )
    let dayTime = world.dayNightCycle.getTimeOfDay()
    world.dayNightCycle.setTimeOfDay(0.52)
    setTimeout(async () => {
      walker.forceUpdateWearables()
      // Make walker face the camera
      const prevDirection = walker.direction.clone()
      Walker.hideAllWalkers([walker])
      const url = await screenshotManager.takeScreenshotOfCharacter(
        walker,
        512,
        512,
        true
      )
      Walker.showAllWalkers()
      Walker.animationManager.continueAnimation(walker)
      walker.object.position.copy(prevPos)
      walker.direction.copy(prevDirection)
      walker.paused = false
      world.dayNightCycle.setTimeOfDay(dayTime)
      if (!url) return
      setImageUrl('data:image/jpg;base64,' + url)

      onMint(url)
    })
  }

  return (
    <div
      ref={ref}
      className="BottomOverlay absolute bottom-10 flex justify-end items-center pointer-events-none z-[11] flex-col-reverse lg:flex-row gap-2"
    >
      <div className="w-10 lg:w-50"></div>
      <div
        ref={ref}
        className="OVERLAYContainer w-[28%] min-w-[383px] h-[150px] flex gap-1 grow items-center justify-end pointer-events-none z-[11]"
      >
        <div className="flex gap-2 justify-center">
          <div
            data-active={!!walker}
            className=" pointer-events-none flex invisible data-[active=true]:pointer-events-auto data-[active=true]:visible  relative bg-black/40 backdrop-blur-md p-4 rounded gap-2 text-white"
          >
            <div
              className="group absolute top-0 -right-2 w-8 h-8 cursor-pointer hover:font-bold"
              onClick={() => {
                deselect()
              }}
            >
              <X className="w-6 h-6 text-white group-hover:stroke-3 " />
            </div>
            <div>
              {imageUrl ? (
                <div className="w-16 h-16 lg:w-32 lg:h-32 rounded-lg flex items-center justify-center relative">
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full rounded-lg"
                  />
                  {!walker?.isMinted && (
                    <button
                      className="bottom-0 absolute left-1/2 -translate-x-1/2 text-xs px-2 py-1 bg-gray-800 rounded-md cursor-pointer"
                      onClick={() => {
                        setImageUrl('')
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 lg:w-32 lg:h-32 rounded-lg bg-gray-800 flex items-center justify-center relative">
                  <div
                    style={{ backgroundColor: '#' + color.getHexString() }}
                    className="rounded-lg w-full h-full flex text-center justify-center items-center cursor-pointer"
                    onClick={() =>
                      !walker?.isMinted && setSelectingColor(!selectingColor)
                    }
                  >
                    <span className="text-white text-sm lg:text-md mix-blend-difference ">
                      Click to pick a color
                    </span>
                  </div>

                  <div
                    className="absolute -top-1/2 -left-1/2 w-16 h-16 lg:h-32 lg:w-32 rounded-lg items-center justify-center flex-col"
                    style={{ display: !selectingColor ? 'none' : 'flex' }}
                  >
                    Pick a color:
                    <input
                      type="color"
                      value={'#' + color.getHexString()}
                      className="w-[80%] h-[80%] rounded-lg cursor-pointer "
                      onChange={(e) => {
                        if (!walker) return
                        const color = e.target.value.replace('#', '0x')
                        walker.walkerInfo.color = parseInt(color, 16)
                        const newColor = new Color(walker.walkerInfo.color)
                        setColor(newColor)
                        //@ts-ignore
                        walker.mesh.material.color = newColor
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center items-start gap-1">
              <h2 className="text-lg font-bold">{name}</h2>
              <p className=''>
                Creator: {walker?.isMinted ? <a target={'_blank'} className='cursor-pointer underline' href={`https://opensea.io/${creator.toString()}`}>{creator.toString().slice(0,8)+'...'}</a> : 'unknown'}
              </p>
              <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                <span className="text-sm text-gray-400">Talkative</span>
                <span className="text-sm">
                  {/**
                   * Checkbox
                   */}
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={talkative}
                    onChange={(e) => {
                      if (!walker) return
                      walker.walkerInfo.talkative = e.target.checked
                      setTalkative(e.target.checked)
                    }}
                  />
                </span>
                <span className="text-sm text-gray-400 flex items-center">
                  Speed
                </span>
                <div className="text-sm flex items-center gap-2 justify-between relative">
                  {speed}

                  {!walker?.isMinted && (
                    <ExpandableSliderButton
                      className="absolute left-[50%]"
                      initialValue={speed}
                      onSliderChange={(v) => {
                        if (!walker) return
                        walker.updateSpeed(v)
                        setSpeed(v)
                      }}
                    />
                  )}
                </div>
                <span className="text-sm flex items-center text-gray-400">
                  Laziness
                </span>
                <div className="text-sm flex items-center gap-2 justify-between relative">
                  {laziness}

                  {!walker?.isMinted && (
                    <ExpandableSliderButton
                      className="absolute left-[50%]"
                      initialValue={laziness}
                      onSliderChange={(v) => {
                        if (!walker) return
                        walker.walkerInfo.laziness = v
                        setLaziness(v)
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {isMinting && (
            <div className="pointer-events-none data-[active=true]:pointer-events-auto gap-2 data-[active=true]:visible bg-black/40 backdrop-blur-md flex items-center justify-center">
              <div className="text-white text-lg font-bold">
                <CircleCheck className="animate-spin" />
              </div>
            </div>
          )}
          {!isMinting && (<div
            data-active={!!walker}
            className=" pointer-events-none data-[active=true]:pointer-events-auto flex flex-col gap-2 data-[active=true]:visible invisible"
          >
            <button
              className="cursor-pointer flex gap-1 items-center text-black font-bold bg-blue-500 hover:bg-blue-800 rounded-lg px-4 py-2"
              onClick={() => {
                setOpen(!isOpen)
              }}
            >
              <Shirt className="w-4 h-4" /> Wearables
            </button>
            <button
              className="cursor-pointer flex gap-1 items-center text-black font-bold bg-purple-500 hover:bg-purple-800 rounded-lg px-4 py-2"
              onClick={() => {
                screenshotAndMint()
              }}
            >
              <CircleCheck className="w-4 h-4" /> Mint
            </button>
            {/* <button
              className="cursor-pointer flex gap-1 items-center text-black font-bold bg-gray-500 hover:bg-gray-800 rounded-lg px-2 py-2"
              onClick={() => {
                removeWalker()
              }}
            >
              <Trash2 className="w-4 h-4" /> Trash
            </button>*/}
          </div> )}
        </div>
      </div>
      <WearablesGrid />
    </div>
  )
}
