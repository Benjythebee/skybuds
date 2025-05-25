// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UniqueNames
 * @dev A contract for managing unique names with random selection and one-time use
 */
contract NameStorage is Ownable {

    // Mapping to track used names for additional security
    mapping(uint256 => string) private namesList;

    constructor() Ownable(msg.sender) {
    }
    
    /**
     * @dev Add multiple names to the available names list
     * @param names Array of names to add
     */
    function addNames(string[] calldata names,uint256[] calldata indexes) external onlyOwner {

        require(names.length == indexes.length, "Names and indexes length mismatch");

        for (uint256 i = 0; i < names.length; i++) {
            string memory currentName = names[i];
            uint256 index = indexes[i];
            
            // Skip empty names
            if (bytes(currentName).length == 0) {
                continue;
            }
            
            namesList[index] = currentName;
        }
    }

    /**
     * @dev Get a random name and remove it from available names
     * @return name The selected name
     */
    function getNameForIndex(uint256 itemIndex) public view returns (string memory name) {
        return namesList[itemIndex-1];
    }

}