// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
contract MetadataEncoding {
    uint256 private constant MAX_WEARABLE_ID = 1000;
    uint256 private constant MAX_WEARABLES = 10;
    uint256 private constant BITS_PER_WEARABLE = 10; // 2^10 = 1024 > 1000
    
    // For 2 decimal places (0.00 to 1.00), we need 7 bits (2^7 = 128 > 101 values)
    uint256 private constant DECIMAL_PRECISION = 100; // For 2 decimal places
    uint256 private constant BITS_PER_DECIMAL = 7;
    // For color, we need 24 bits (RGB: 8 bits each)
    uint256 private constant BITS_PER_COLOR = 24;
    
    // Positions in the uint256
    uint256 private constant POSITION_WEARABLES = 0;
    uint256 private constant POSITION_TALKATIVE = BITS_PER_WEARABLE * MAX_WEARABLES;
    uint256 private constant POSITION_SPEED = POSITION_TALKATIVE + 1;
    uint256 private constant POSITION_LAZINESS = POSITION_SPEED + BITS_PER_DECIMAL;
    uint256 private constant POSITION_COLOR = POSITION_LAZINESS + BITS_PER_DECIMAL;
    
    // Masks for extracting values
    uint256 private constant MASK_WEARABLE = (1 << BITS_PER_WEARABLE) - 1;
    uint256 private constant MASK_TALKATIVE = 1;
    uint256 private constant MASK_DECIMAL = (1 << BITS_PER_DECIMAL) - 1;
    uint256 private constant MASK_COLOR = (1 << BITS_PER_COLOR) - 1;
    
    function encodeMetadata(
        uint256[] memory wearableIds,
        bool isTalkative,
        uint256 speed,
        uint256 laziness,
        string memory color
    ) internal pure returns (uint256) {
        require(wearableIds.length <= MAX_WEARABLES, "Too many wearables");
        
        // Validate all wearable IDs are within range
        for (uint256 i = 0; i < wearableIds.length; i++) {
            require(wearableIds[i] <= MAX_WEARABLE_ID, "Wearable ID out of range");
            require(wearableIds[i] > 0, "Wearable ID must be greater than 0");
        }
        
        // Validate speed and laziness are within range (0 to 1 with 2 decimal precision)
        require(speed>=0 && speed <= 100, "Speed out of range"); // 100 = 1.00
        require(laziness>=0 && laziness <= 100, "Laziness out of range"); // 100 = 1.00
        
        // Convert color from hex string to uint
        uint256 colorValue = hexStringToUint(color);
        require(colorValue <= MASK_COLOR, "Color value out of range");

        uint256 metadata = 0;
        
        // Encode wearable IDs
        for (uint256 i = 0; i < wearableIds.length; i++) {
            metadata |= wearableIds[i] << (POSITION_WEARABLES + i * BITS_PER_WEARABLE);
        }
        
        // Encode isTalkative
        if (isTalkative) {
            metadata |= uint256(1) << POSITION_TALKATIVE;
        }
        
        // Encode speed (0 to 100 representing 0.00 to 1.00)
        metadata |= speed << POSITION_SPEED;
        
        // Encode laziness (0 to 100 representing 0.00 to 1.00)
        metadata |= laziness << POSITION_LAZINESS;

        // Encode color (24-bit RGB value)
        metadata |= colorValue << POSITION_COLOR;
        
        return metadata;
    }
    
    function decodeMetadata(uint256 metadata) public pure returns (
        uint256[] memory wearableIds,
        bool isTalkative,
        uint256 speed,
        uint256 laziness,
        string memory color
    ) {
        wearableIds = new uint256[](MAX_WEARABLES);
        
        // Decode wearable IDs
        for (uint256 i = 0; i < MAX_WEARABLES; i++) {
            wearableIds[i] = (metadata >> (POSITION_WEARABLES + i * BITS_PER_WEARABLE)) & MASK_WEARABLE;
        }
        
        // Decode isTalkative
        isTalkative = ((metadata >> POSITION_TALKATIVE) & MASK_TALKATIVE) == 1;
        
        // Decode speed (0-100 representing 0.00-1.00)
        speed = (metadata >> POSITION_SPEED) & MASK_DECIMAL;
        
        // Decode laziness (0-100 representing 0.00-1.00)
        laziness = (metadata >> POSITION_LAZINESS) & MASK_DECIMAL;

        // Decode color (24-bit RGB value)
        uint256 colorValue = (metadata >> POSITION_COLOR) & MASK_COLOR;
        color = uintToHexString(colorValue);
    }
    // Helper function to convert a hex string to uint
    function hexStringToUint(string memory hexString) public pure returns (uint256) {
        bytes memory stringBytes = bytes(hexString);
        uint256 result = 0;
        
        // Remove '0x' or '#' prefix if present
        uint256 startIndex = 0;
        if (stringBytes.length >= 2) {
            if (stringBytes[0] == 0x30 && (stringBytes[1] == 0x78 || stringBytes[1] == 0x58)) {
                startIndex = 2;
            } else if (stringBytes[0] == 0x23) { // '#' character
                startIndex = 1;
            }
        }
        
        for (uint256 i = startIndex; i < stringBytes.length; i++) {
            uint8 byteValue = uint8(stringBytes[i]);
            uint8 digit;
            
            if (byteValue >= 48 && byteValue <= 57) {
                // '0' to '9'
                digit = byteValue - 48;
            } else if (byteValue >= 97 && byteValue <= 102) {
                // 'a' to 'f'
                digit = byteValue - 97 + 10;
            } else if (byteValue >= 65 && byteValue <= 70) {
                // 'A' to 'F'
                digit = byteValue - 65 + 10;
            } else {
                revert("Invalid hex character");
            }
            
            result = result * 16 + digit;
        }
        
        return result;
    }
    
    // Helper function to convert a uint to hex string
    function uintToHexString(uint256 value) public pure returns (string memory) {
        console.log("uintToHexString called with value: %s ", value);
        if (value == 0) {
            return "#000000";
        }
        
        // Convert to padded hex string
        bytes memory hexBytes = new bytes(6);
        for (uint256 i = 5; i >= 0; i--) {
            uint8 digit = uint8(value & 0xF);
            if (digit < 10) {
                hexBytes[i] = bytes1(digit + 48); // '0' to '9'
            } else {
                hexBytes[i] = bytes1(digit - 10 + 97); // 'a' to 'f'
            }
            value >>= 4;
            
            if (i == 0) break; // Prevent underflow
        }
        
        // Prepend # to create the color
        return string(abi.encodePacked("#", hexBytes));
    }
    
    // Helper functions to convert between decimal representation and human-readable format
    function toDecimalValue(uint256 value) internal pure returns (string memory) {
        // Convert a value like 42 to "0.42"
        uint256 integerPart = value / DECIMAL_PRECISION;
        uint256 fractionalPart = value % DECIMAL_PRECISION;
        
        // Format with leading zeros for fractional part
        string memory fractionalStr;
        if (fractionalPart < 10) {
            fractionalStr = string(abi.encodePacked("0", uint2str(fractionalPart)));
        } else {
            fractionalStr = uint2str(fractionalPart);
        }
        
        return string(abi.encodePacked(uint2str(integerPart), ".", fractionalStr));
    }
    
    // Helper function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 j = _i;
        uint256 len;
        
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i % 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }
    
    // Helper functions for individual field access
    function _hasWearable(uint256 metadata, uint256 wearableId) internal pure returns (bool) {
        require(wearableId <= MAX_WEARABLE_ID, "Wearable ID out of range");
        
        for (uint256 i = 0; i < MAX_WEARABLES; i++) {
            uint256 id = (metadata >> (POSITION_WEARABLES + i * BITS_PER_WEARABLE)) & MASK_WEARABLE;
            if (id == wearableId) {
                return true;
            }
        }
        
        return false;
    }
    
    function getWearableAt(uint256 metadata, uint256 index) internal pure returns (uint256) {
        require(index < MAX_WEARABLES, "Index out of range");
        
        return (metadata >> (POSITION_WEARABLES + index * BITS_PER_WEARABLE)) & MASK_WEARABLE;
    }
    
    function _getIsTalkative(uint256 metadata) internal pure returns (bool) {
        return ((metadata >> POSITION_TALKATIVE) & MASK_TALKATIVE) == 1;
    }
    
    function _getSpeed(uint256 metadata) internal pure returns (uint256) {
        return (metadata >> POSITION_SPEED) & MASK_DECIMAL;
    }
    

    function _getLaziness(uint256 metadata) internal pure returns (uint256) {
        return (metadata >> POSITION_LAZINESS) & MASK_DECIMAL;
    }
    
    function getColor(uint256 metadata) internal pure returns (uint256) {
        return (metadata >> POSITION_COLOR) & MASK_COLOR;
    }
    function getColorFormatted(uint256 metadata) internal pure returns (string memory) {
        uint256 colorValue = getColor(metadata);
        return uintToHexString(colorValue);
    }
    /**
    * Get all non-zero wearable IDs from metadata
    * @param metadata The encoded metadata
    * @return Array of non-zero wearable IDs
    */
    function getWearables(uint256 metadata) public pure returns (uint256[] memory) {
        uint256 count = 0;
        uint256[] memory allWearables = new uint256[](MAX_WEARABLES);
        
        // First pass: count non-zero wearables and populate temporary array
        for (uint256 i = 0; i < MAX_WEARABLES; i++) {
            uint256 id = (metadata >> (POSITION_WEARABLES + i * BITS_PER_WEARABLE)) & MASK_WEARABLE;
            if (id > 0) {
                allWearables[count] = id;
                count++;
            }
        }
        
        // Second pass: create correctly sized array and copy values
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allWearables[i];
        }
        
        return result;
    }
}