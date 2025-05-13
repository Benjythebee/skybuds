import { ethers } from "hardhat";

async function main() {

	const [deployer] = await ethers.getSigners();

	console.log(
	"Deploying contracts with the account:",
	deployer.address
	);

	const SkybudsMetadata = await ethers.getContractFactory("SkyBudsMetadata");
	const metadataContract = await SkybudsMetadata.deploy();
  const address = await metadataContract.getAddress();
	console.log("SkyBudsMetadata deployed at:", address);

  const SkyBuds = await ethers.getContractFactory("SkyBuds");
  const skyBuds = await SkyBuds.deploy(address)
  const skyBudsAddress = await skyBuds.getAddress();
  console.log("SkyBuds deployed at:", skyBudsAddress);

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