// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DeTrustUSD is ERC20, Ownable {
	uint8 private constant TOKEN_DECIMALS = 6;

	constructor(address initialOwner, uint256 initialSupply) ERC20("DeTrust USD", "dUSD") Ownable(initialOwner) {
		_mint(initialOwner, initialSupply);
	}

	function mint(address to, uint256 amount) external onlyOwner {
		require(to != address(0), "Invalid recipient");
		_mint(to, amount);
	}

	function decimals() public pure override returns (uint8) {
		return TOKEN_DECIMALS;
	}
}