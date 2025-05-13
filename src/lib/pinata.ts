import { PinataSDK, UploadOptions } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: "amaranth-grieving-sparrow-539.mypinata.cloud",
});


export const pinImage = async (base64: string) => {

    const options:UploadOptions = {
        metadata: {
            name: "SkyBuds",
        }
    };
    try {
        const result = await pinata.upload.public.base64(base64, options);
        return `https://ipfs.io/ipfs/${result.cid}`;
    } catch (error) {
        console.error("Error pinning image:", error);
        throw error;
    }
}

export const pinJsonFile = async (json: any) => {
    const options:UploadOptions = {
        metadata: {
            name: "SkyBuds metadata",
        }
    };
    try {
        const result = await pinata.upload.public.json(json, options);
        return `https://ipfs.io/ipfs/${result.cid}`;
    } catch (error) {
        console.error("Error pinning JSON:", error);
        throw error;
    }
}