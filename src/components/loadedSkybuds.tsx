import { Walker } from "lib/Walker";
import { ITEMS_LIST } from "lib/wearables/items";
import { WearableHat } from "lib/wearables/Wearable";
import React from "react";
import { useSceneContext } from "store/SceneContext";
import { useSkybuds } from "hooks/useSkybuds"
import { getAttribute } from "web3/utils";


export const LoadedSkyBuds = () => {

    const {world} = useSceneContext();

    const {data,isLoading} = useSkybuds('testnet');
    console.log('data',data)    
    React.useEffect(() => { 
        if(world && data.length){
            data.forEach((skyBud) => {

                const speed = (getAttribute<number>(skyBud,'Speed') ||20) / 100
                const laziness = (getAttribute<number>(skyBud,'Laziness') || 20) / 100
                const talkative = getAttribute<boolean>(skyBud,'Talkative') ?? false
                const color = getAttribute<string>(skyBud,'Color') || '#FF5500'
                const wearables = getAttribute<number[]>(skyBud,'Wearables') || []

                const walker = Walker.create(world,undefined,{
                    tokenId: parseInt(skyBud.tokenId),
                    name: skyBud.name,
                    image_url: skyBud.image,
                    creator: '0x0000',
                    description: skyBud.description,
                    talkative: talkative,
                    speed: speed,
                    laziness: laziness,
                    color: parseInt(color.replace('#','0x'),16),
                },false)

                if(!walker.hatWearables){
                    walker.hatWearables = {}
                }
                for(const wearableID of wearables){
                    const uint = wearableID as keyof typeof ITEMS_LIST
                    const wearable = ITEMS_LIST[uint]
                    walker.hatWearables[wearable.category]= new WearableHat(world.scene,walker,uint)
                }

            })
        }
    },[world,data])

    return <div />
}