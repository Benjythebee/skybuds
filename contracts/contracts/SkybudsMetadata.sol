// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MetadataEncoding.sol"; // Make sure the path is correct
import "@openzeppelin/contracts/utils/Base64.sol";

contract SkyBudsMetadata is MetadataEncoding,Ownable {
    // Struct to hold both encoded metadata and URI
    struct SkyBudData {
        uint256 encodedMetadata;
        string base64Uri;
        bool exists;
    }
    
    // Mapping from tokenId to SkyBudData
    mapping(uint256 => SkyBudData) private _tokenMetadata;
    
    // Event emitted when metadata is updated
    event MetadataUpdated(uint256 indexed tokenId, uint256 encodedMetadata, string base64Uri);

    constructor() Ownable(msg.sender) {
    }


    // Check if token exists
    modifier tokenExists(uint256 tokenId) {
        require(_tokenMetadata[tokenId].exists, "SkyBudsMetadata: Token does not exist");
        _;
    }
    
    // Set metadata for a token
    function setMetadata(
        uint256 tokenId,
        uint256[] memory wearableIds,
        bool isTalkative_,
        uint256 speed,
        uint256 laziness,
        string memory color,
        string memory base64Uri
    ) public onlyOwner() {
        // Encode the metadata using the inherited function
        uint256 encodedMetadata = encodeMetadata(wearableIds, isTalkative_, speed, laziness, color);
        
        // Store the metadata and URI
        _tokenMetadata[tokenId] = SkyBudData({
            encodedMetadata: encodedMetadata,
            base64Uri: base64Uri,
            exists: true
        });

        emit MetadataUpdated(tokenId, encodedMetadata, base64Uri);
    }
    
    /**
    * Converts an array of wearable IDs to a JSON array string
    * @param wearableIds Array of wearable IDs
    * @return JSON array as string (e.g., "[42,123,456]")
    */
    function stringifyWearableIds(uint256[] memory wearableIds) internal pure returns (string memory) {
        // Handle empty array
        if (wearableIds.length == 0) {
            return "[]";
        }
        
        // Start with opening bracket
        string memory result = "[";
        
        // Add first element without preceding comma
        result = string(abi.encodePacked(result, uint2str(wearableIds[0])));
        
        // Add remaining elements with commas
        for (uint256 i = 1; i < wearableIds.length; i++) {
            result = string(abi.encodePacked(result, ",", uint2str(wearableIds[i])));
        }
        
        // Add closing bracket
        result = string(abi.encodePacked(result, "]"));
        
        return result;
    }
    // Generate JSON metadata for a token
    function generateTokenURI(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
        SkyBudData storage data = _tokenMetadata[tokenId];
        
        // Decode metadata
        bool isTalkative_ = isTalkative(tokenId);
        string memory speedValue = uint2str(getSpeed(tokenId));
        string memory lazinessValue = uint2str(getLaziness(tokenId));
        string memory colorValue = getColorFormatted(data.encodedMetadata);
        uint256[] memory wearableIds = getWearables(data.encodedMetadata);
        string memory wearableIdsJson = stringifyWearableIds(wearableIds);
        
        // Convert tokenId to string
        string memory tokenIdString = uint2str(tokenId);

            // Generate attributes array
        string memory attributes = string(abi.encodePacked(
            '{"trait_type":"Talkative","value":', isTalkative_ ? 'true' : 'false', '},',
            '{"trait_type":"Speed","value":', speedValue, '},',
            '{"trait_type":"Laziness","value":', lazinessValue, '},',
            '{"trait_type":"Color","value":"', colorValue, '"},',
            '{"trait_type":"Wearables","value":', wearableIdsJson, '}'
        ));

        // Build the JSON string using abi.encodePacked
        bytes memory json = bytes(string(
            abi.encodePacked(
                '{"name":"SkyBud #', tokenIdString, '",',
                '"description":"my little dude",',
                '"tokenId":"', tokenIdString, '",',
                '"image":"data:image/jpg;base64,', data.base64Uri, '",',
                '"external_url":"https://skybuds.benjylarcher.com/",',
                '"attributes":[', attributes, ']}'
            )
        ));

        // Encode the JSON string in Base64
        string memory base64Json = Base64.encode(json);
        // Return the full token URI
        return string(abi.encodePacked("data:application/json;base64,", base64Json));

    }

    // Set metadata directly with encoded data
    function setEncodedMetadata(
        uint256 tokenId,
        uint256 encodedMetadata,
        string memory base64Uri
    ) private onlyOwner() {
        // Store the metadata and URI
        _tokenMetadata[tokenId] = SkyBudData({
            encodedMetadata: encodedMetadata,
            base64Uri: base64Uri,
            exists: true
        });
        
        emit MetadataUpdated(tokenId, encodedMetadata, base64Uri);
    }
    
    // Get the full metadata for a token
    function getMetadata(uint256 tokenId) public view tokenExists(tokenId) returns (
        uint256 encodedMetadata,
        string memory base64Uri,
        uint256[] memory wearableIds,
        bool isTalkative_,
        uint256 speed,
        uint256 laziness,
        string memory color
    ) {
        SkyBudData storage data = _tokenMetadata[tokenId];
        encodedMetadata = data.encodedMetadata;
        base64Uri = data.base64Uri;
        
        // Decode the metadata using the inherited function
        (wearableIds, isTalkative_, speed, laziness, color) = decodeMetadata(encodedMetadata);
    }
    
    // Get just the encoded metadata
    function getEncodedMetadata(uint256 tokenId) public view tokenExists(tokenId) returns (uint256) {
        return _tokenMetadata[tokenId].encodedMetadata;
    }
    
    // Get just the base64 URI
    function getBase64Uri(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
        return _tokenMetadata[tokenId].base64Uri;
    }
    
    // Check if a token has a specific wearable
    function hasWearable(uint256 tokenId, uint256 wearableId) public view tokenExists(tokenId) returns (bool) {
        return hasWearable(_tokenMetadata[tokenId].encodedMetadata, wearableId);
    }
    
    // Get the isTalkative property for a token
    function isTalkative(uint256 tokenId) public view tokenExists(tokenId) returns (bool) {
        return _getIsTalkative(_tokenMetadata[tokenId].encodedMetadata);
    }
    
    // Get the speed property for a token
    function getSpeed(uint256 tokenId) public view tokenExists(tokenId) returns (uint256) {
        return _getSpeed(_tokenMetadata[tokenId].encodedMetadata);
    }
    
    // Get the speed property formatted as a string (e.g., "0.42")
    function getSpeedFormatted(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
        return getSpeedFormatted(_tokenMetadata[tokenId].encodedMetadata);
    }
    
    // Get the laziness property for a token
    function getLaziness(uint256 tokenId) public view tokenExists(tokenId) returns (uint256) {
        return _getLaziness(_tokenMetadata[tokenId].encodedMetadata);
    }
    
    // Get the laziness property formatted as a string (e.g., "0.75")
    function getLazinessFormatted(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
        return getLazinessFormatted(_tokenMetadata[tokenId].encodedMetadata);
    }

    // Get the color property for a token
    function getColorHex(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
        return getColorFormatted(_tokenMetadata[tokenId].encodedMetadata);
    }
    
    // Update the wearables for a token
    function updateWearables(uint256 tokenId, uint256[] memory wearableIds) public tokenExists(tokenId) {
        SkyBudData storage data = _tokenMetadata[tokenId];
        
        // Decode current metadata
        (, bool isTalkative_, uint256 speed, uint256 laziness, string memory color) = decodeMetadata(data.encodedMetadata);
        
        // Re-encode with new wearables
        uint256 newEncodedMetadata = encodeMetadata(wearableIds, isTalkative_, speed, laziness, color);
        
        // Update storage
        data.encodedMetadata = newEncodedMetadata;
        
        emit MetadataUpdated(tokenId, newEncodedMetadata, data.base64Uri);
    }


    // Update the base64 URI for a token
    function updateBase64Uri(uint256 tokenId, string memory base64Uri) public tokenExists(tokenId) {
        SkyBudData storage data = _tokenMetadata[tokenId];
        data.base64Uri = base64Uri;
        
        emit MetadataUpdated(tokenId, data.encodedMetadata, base64Uri);
    }
    
    // Check if a token exists
    function tokenDataExists(uint256 tokenId) public view returns (bool) {
        return _tokenMetadata[tokenId].exists;
    }
    
    // Delete a token's metadata
    function deleteTokenMetadata(uint256 tokenId) public tokenExists(tokenId) {
        delete _tokenMetadata[tokenId];
    }
}