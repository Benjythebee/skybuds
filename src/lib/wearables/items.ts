
export const ITEMS_LIST = {
        1:{
            category: 'Hats',
            bone: 'head',
            name: 'Spinny boy',
            url: '/assets/propeller_hat.glb',
            imageUrl: '/assets/propeller_hat.png',
            scale: 0.1,
            positionNudge: { x: 0, y: 0.15, z: 0.15 }
        },
        2:{
            category: 'Hats',
            bone: 'head',
            name: 'Top hat',
            url: '/assets/top_hat.glb',
            imageUrl: '/assets/top_hat.png',
            scale: 1.1,
            positionNudge: { x: 0, y: 0.22, z: 0.12 }
        },
        3:{
            category: 'Hats',
            bone: 'head',
            name: 'Wizard Hat',
            url: '/assets/wizard_hat.glb',
            imageUrl: '/assets/wizard_hat.png',
            scale: 1.1,
            positionNudge: { x: 0, y: 0.19, z: 0.10 }
        },
        4:{
            category: 'Hats',
            bone: 'head',
            name: 'Cowboy Hat',
            url: '/assets/cowboy_hat.glb',
            imageUrl: '/assets/cowboy_hat.png',
            scale: 1.1,
            positionNudge: { x: 0, y: 0.15, z: 0.13 }
        },
        5:{
            category: 'Hats',
            bone: 'head',
            name: 'Baseball Hat',
            url: '/assets/baseball_hat.glb',
            imageUrl: '/assets/baseball_hat.png',
            scale: 1,
            positionNudge: { x: 0, y: 0.15, z: 0.1 }
        },
        6:{
            category: 'Hats',
            bone: 'head',
            name: 'Frog Hat',
            url: '/assets/frog_hat.glb',
            imageUrl: '/assets/frog_hat.png',
            scale: 1.1,
            positionNudge: { x: 0, y: 0.13, z: 0.13 }
        },
        7:{
            category: 'Hats',
            bone: 'head',
            name: 'Bear Hat',
            url: '/assets/bear_hat.glb',
            imageUrl: '/assets/bear_hat.png',
            scale: 1.1,
            positionNudge: { x: 0, y: 0.13, z: 0.10 }
        },
        8: {
            category: 'Glasses',
            bone: 'head',
            name: 'Square Glasses',
            url: '/assets/glasses.glb',
            imageUrl: '/assets/glasses.png',
            scale: 1,
            positionNudge: { x: 0, y: 0.1, z: 0.1 }
        },
        9: {
            category: 'Glasses',
            bone: 'head',
            name: 'Blue SunGlasses',
            url: '/assets/blue_sunglasses.glb',
            imageUrl: '/assets/blue_sunglasses.png',
            scale: 1,
            positionNudge: { x: 0, y: 0.1, z: 0.1 }
        },
        10: {
            category: 'Glasses',
            bone: 'head',
            name: 'Pixel Sunglasses',
            url: '/assets/pixel_sunglasses.glb',
            imageUrl: '/assets/pixel_sunglasses.png',
            scale: 1,
            positionNudge: { x: 0, y: 0.1, z: 0.1 }
        },
        11:{
            category: 'Backpack',
            bone: 'chest',
            name: 'Orange Backpack',
            url: '/assets/backpack_orange.glb',
            imageUrl: '/assets/backpack_orange.png',
            scale: 1,
            positionNudge: { x: 0, y: -0.2, z: 0.1 },
            rotationNudge: { x: -0.5, y: 0, z: 0 }
        },
        12:{
            category: 'Backpack',
            bone: 'chest',
            name: 'Fushia Backpack',
            url: '/assets/backpack_fushia.glb',
            imageUrl: '/assets/backpack_fushia.png',
            scale: 1,
            positionNudge: { x: 0, y: -0.2, z: 0.1 },
            rotationNudge: { x: -0.5, y: 0, z: 0 }
        },
        13:{
            category: 'Accessories',
            bone: 'neck',
            name: 'Red Bowtie',
            url: '/assets/bowtie.glb',
            imageUrl: '/assets/bowtie.png',
            scale: 1,
            positionNudge: { x: 0, y: -0.34, z: 0.05 }
        }
} as const

export type WearableID = keyof typeof ITEMS_LIST
export type WearableType = (typeof ITEMS_LIST)[keyof typeof ITEMS_LIST]
export type WearableWithIndex = (WearableType&{index:WearableID})


export const ITEMS_BY_CATEGORY = Object.entries(ITEMS_LIST).reduce<Record<string,(WearableWithIndex)[]>>((acc, [key,_item]) => {
    let item = _item as WearableWithIndex
    const category = item.category as string
    if (!acc[category]) {
        acc[category] = []
    }
    item.index=parseInt(key) as WearableID
    acc[category].push(item)
    return acc
},{})