// contracts/SkyBuds.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage, ERC721 } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SkyBuds is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    // Mapping to track if a name is already taken
    mapping(bytes32 => bool) private nameExists;

    // Base URI required to interact with IPFS
    string private _baseURIExtended;

    constructor() Ownable(msg.sender) ERC721("SkyBuds", "SKB") {
        _setBaseURI("ipfs://");
    }
        // Sets the base URI for the collection
    function _setBaseURI(string memory baseURI) private {
        _baseURIExtended = baseURI;
    }

    // Overrides the default function to enable ERC721URIStorage to get the updated baseURI
    function _baseURI() internal view override returns (string memory) {
        return _baseURIExtended;
    }

    // Function to check if a name is already taken
    function isNameTaken(string memory name) public view returns (bool) {
        return nameExists[keccak256(abi.encodePacked(name))];
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

        // Allows minting of a new NFT 
    function mint(string memory name, string memory metadataURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(!isNameTaken(name), "Name already taken");

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        nameExists[keccak256(abi.encodePacked(name))] = true;
        return tokenId;
    }
}