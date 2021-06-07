// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./DsToken.sol";

/// @title Ico
/// @author D.Savel
/// @notice Contract use for ico of ERC20 (Dstoken.sol) with 2 weeks delay
/// @dev This contract connect to Dstoken.sol ERC20 contract.

contract Ico {
    // library usage
    using Address for address payable;

    /// @dev ERC20 contract choose for ICO
    DsToken private _dsToken;

    address private _tokenContractAddress;
    address private _tokenOwner;
    uint256 private _rate = 10**9; // 1 ETHER = 1 x 10^9 DST Tokens - 1000000000
    uint256 private _icoDelay = (block.timestamp) + 2 weeks;

    event Bought(address indexed buyer, uint256 nbTokens, uint256 etherAmount);
    event Withdrew(address indexed recipient, uint256 etherAmount);

    /// @dev Construtor intancies the tokens owner (seller) and link to ERC20 (DsToken)
    /// @param tokenContractAddress_ the address of tokens owner in ERC20 contract
    constructor(address tokenContractAddress_) {
        _tokenContractAddress = tokenContractAddress_; //Token smartcontract address
        _dsToken = DsToken(tokenContractAddress_); // Token smartcontract link
        _tokenOwner = _dsToken.tokenOwner();
    }

    /// @dev ICO smart contract use buyTokens() function for external payable function
    receive() external payable {
        buyTokens();
    }

    /** @notice Public payable function to buy tokens, this function is callable only :
     * for address different of tokens owner /
     * if ether amount for buying tokens is above 0 ether /
     * if number of tokens remaining is above the buyer demande /
     * if ico delay is not over.
     * @dev buyTokens call transferFrom function from ERC20 DsToken contract
     * it tranfers bought tokens from tokens owner to buyer
     */
    function buyTokens() public payable returns (bool) {
        require(msg.sender != _tokenOwner, "ICO: owner can not buy his tokens");
        require(msg.value * _rate < tokensRemainingIco(), "ICO: not enough tokens remaining to sell");
        require(icoTimeRemaining() != 0, "ICO: ico is over, you can not buy tokens anymore");
        uint256 nbTokens = msg.value * _rate;
        _dsToken.transferFrom(_tokenOwner, msg.sender, nbTokens);
        emit Bought(msg.sender, nbTokens, msg.value);
        return true;
    }

    /** @notice Public function to withdraw profit for tokens owner, this function is callable only :
     * for tokens owner /
     * if ether balance of ico smart contract is above 0 /
     * if ico delay is over.
     * @dev withdrawProfit call sendValue function from Address.sol import from Open zeppzelin for address payable
     */
    function withdrawProfit() public {
        require(msg.sender == _tokenOwner, "ICO: Only tokensOwner can withdraw profit");
        require(address(this).balance != 0, "ICO: No profit to withdraw");
        require(block.timestamp > _icoDelay, "ICO: Ico is not  over, can not withdraw profit ");
        uint256 icoEtherAmount = address(this).balance;
        payable(msg.sender).sendValue(icoEtherAmount);
        emit Withdrew(msg.sender, icoEtherAmount);
    }

    /// @notice Returns the amount of tokens allowance for spender
    /// @param spender the address for which is return the allowance amount
    /// @dev function allowance called from ERC20 DsToken contract
    function allowances(address spender) public view returns (uint256) {
        address tokenOwner_ = tokenOwner();
        return _dsToken.allowance(tokenOwner_, spender);
    }

    /// @notice Returns the amount of tokens for an address
    /// @param account_ the address to return tokens balance
    /// @dev function balanceOf called from ERC20 DsToken contract
    function tokensBalanceOf(address account_) public view returns (uint256) {
        return _dsToken.balanceOf(account_);
    }

    /// @notice Returns the amount of tokens remaining for ico.
    /// @dev function balanceOf called from ERC20 DsToken contract
    function tokensRemainingIco() public view returns (uint256) {
        return _dsToken.balanceOf(_tokenOwner);
    }

    /// @notice Returns the initial delay for ico.
    function icoDelay() public view returns (uint256) {
        return _icoDelay;
    }

    /// @notice Returns the delay remaining for ico in seconds.
    function icoTimeRemaining() public view returns (uint256) {
        return (_icoDelay > block.timestamp ? (_icoDelay - block.timestamp) : 0);
    }

    /// @notice Returns the amount of Ether owned by seller for ico.
    function profit() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Returns ERC20 Token contract Address.
    function tokenContractAddress() public view returns (address) {
        return _tokenContractAddress;
    }

    /// @notice Returns Tokens owner Address.
    function tokenOwner() public view returns (address) {
        return _tokenOwner;
    }
}
