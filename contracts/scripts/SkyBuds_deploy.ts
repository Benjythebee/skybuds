import { ethers } from "hardhat";
import namesJSon from '../data/names.json';
import { NameStorage } from "../typechain-types";

async function setNamesForContract(contract:NameStorage){
	const chunkSize = 250;
	const names = namesJSon as string[];
	for(let i = 0; i <= names.length; i += chunkSize) {
		const chunk = names.slice(i, i + chunkSize);
		const arrayOfIndexes = chunk.map((name, index) => i + index);
		const tx = await contract.addNames(chunk,arrayOfIndexes);
		await tx.wait(1)
	}
}


async function main() {
	/**
	 *  Note that mainnet has alraedy been deployed
	 */

	const [deployer] = await ethers.getSigners();

	console.log(
	"Deploying contracts with the account:",
	deployer.address
	);

	const NameStorage = await ethers.getContractFactory("NameStorage");
	const nameStorageContract = await NameStorage.deploy();
	// const nameAddress = await ethers.getContractAt("NameStorage",'0x1e91b8E0ea42bfAf3A3c3633Dbe0d935D5aB1587')
	const nameAddress = await nameStorageContract.getAddress();

	await setNamesForContract(nameStorageContract)

	const SkybudsMetadata = await ethers.getContractFactory("SkyBudsMetadata");
	const metadataContract = await SkybudsMetadata.deploy(nameAddress);
	const address = await metadataContract.getAddress();

	const SkyBuds = await ethers.getContractFactory("SkyBuds");
	const skyBuds = await SkyBuds.deploy(address)
	const skyBudsAddress = await skyBuds.getAddress();
	console.log("SkyBuds deployed at:", skyBudsAddress);
	console.log("SkyBudsMetadata deployed at:", address);
	console.log("NameStorage deployed at:", nameAddress);

	SkybudsMetadata.connect(deployer)

	await metadataContract.transferOwnership(skyBudsAddress)
	console.log("SkyBudsMetadata ownership transferred to SkyBuds contract");

}

main()
  .then(() => process.exit(0))
  .catch(error => {
	console.error(error);
	process.exit(1);
  });