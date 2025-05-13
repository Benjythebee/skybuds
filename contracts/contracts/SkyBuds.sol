// contracts/SkyBuds.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SkybudsMetadata.sol";

contract SkyBuds is ReentrancyGuard,ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    SkyBudsMetadata public contractSkybudsMetadata;

    uint256 public constant MAX_TOKENS = 2000;


    constructor(address _addressContractMetadata) Ownable(msg.sender) ReentrancyGuard() ERC721("SkyBuds", "SKB") {
        setMetadataContractAddress(_addressContractMetadata);

    }

    function setMetadataContractAddress(address _addressContractMetadata) public onlyOwner {
		contractSkybudsMetadata = SkyBudsMetadata(_addressContractMetadata);
	}

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(contractSkybudsMetadata != SkyBudsMetadata(address(0)), "Metadata contract not set");
        require(tokenId <=_nextTokenId-1, "URI query for nonexistent token");

        return contractSkybudsMetadata.generateTokenURI(tokenId);
    }


    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

        // Allows minting of a new NFT 
    function mint( 
    uint256[] calldata wearables,
    uint256  laziness, 
    uint256  speed,  
    uint256  isTalkative, 
    string memory color, 
    string calldata base64uri
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        require(tokenId <= MAX_TOKENS, "Max tokens minted");
        
        require(bytes(base64uri).length > 0, "Base64 URI cannot be empty");

        
        contractSkybudsMetadata.setMetadata(
            tokenId,
            wearables,
            isTalkative==1,
            speed,
            laziness,
            color,
            base64uri
        );

        _safeMint(msg.sender, tokenId);


        return tokenId;
    }

    function updateWearables(uint256 tokenId, uint256[] calldata wearableIds) public {
        require(tokenId <= _nextTokenId-1, "Wearable update for nonexistent token");
        require(ownerOf(tokenId) == msg.sender, "Only the owner can update wearables");

        contractSkybudsMetadata.updateWearables(tokenId, wearableIds);
    }

    function updateBase64Uri(uint256 tokenId, string memory base64Uri) public onlyOwner() {
        require(tokenId <= _nextTokenId-1, "Wearable update for nonexistent token");
        require(ownerOf(tokenId) == msg.sender, "Only the owner can update wearables");
        require(bytes(base64Uri).length > 0, "Base64 URI cannot be empty");

        contractSkybudsMetadata.updateBase64Uri(tokenId, base64Uri);
    }

    function updateMetadata(
        uint256 tokenId,
        uint256[] calldata wearables,
        uint256 laziness,
        uint256 speed,
        uint256 isTalkative,
        string memory color,
        string calldata base64uri
    ) public {
        require(tokenId <= _nextTokenId-1, "Metadata update for nonexistent token");
        require(ownerOf(tokenId) == msg.sender, "Only the owner can update metadata");

        contractSkybudsMetadata.setMetadata(
            tokenId,
            wearables,
            isTalkative==1,
            speed,
            laziness,
            color,
            base64uri
        );
    }   
}