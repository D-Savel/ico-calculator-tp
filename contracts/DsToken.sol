// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DsToken is ERC20 {
    address private _tokenOwner;

    constructor(address owner_, uint256 initialSupply) ERC20("DsToken", "DST") {
        _mint(owner_, initialSupply);
        _tokenOwner = owner_;
        emit Transfer(address(0), owner_, initialSupply);
    }

    /// @notice Returns Tokens owner Address.
    function tokenOwner() public view returns (address) {
        return _tokenOwner;
    }
}
