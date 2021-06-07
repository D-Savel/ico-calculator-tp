//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "./DsToken.sol";
import "hardhat/console.sol";

contract TokenCalculator {
    /// @dev ERC20 token contract choose for TokenCalculator
    DsToken private _dsToken;

    mapping(address => uint256) private _calculatorCredit;
    address private _tokenContractAddress;
    address private _tokenOwner;
    int256 private _result;
    uint256 private _price = 1;

    event Add(int256 nb1, int256 nb2, int256 _result);
    event Sub(int256 nb1, int256 nb2, int256 _result);
    event Mul(int256 nb1, int256 nb2, int256 _result);
    event Div(int256 nb1, int256 nb2, int256 _result);
    event Mod(int256 nb1, int256 nb2, int256 _result);
    event Bought(address indexed sender, uint256 nbTokens);
    event Withdrew(address indexed sender, uint256 tokensAmount);

    /// @dev Construtor intancies the tokens owner (seller) and link to ERC20 (DsToken)
    /// @param tokenContractAddress_ the address of tokens owner in ERC20 contract
    constructor(address tokenContractAddress_) {
        _tokenContractAddress = tokenContractAddress_; //Token smartcontract address
        _dsToken = DsToken(tokenContractAddress_); // Token smartcontract link
        _tokenOwner = _dsToken.tokenOwner();
    }

    modifier Credited() {
        require(
            _dsToken.balanceOf(msg.sender) > 0,
            "TokenCalculator: Have at least 1 token credit to perform operation"
        );
        _;
    }

    function withdrawTokens() public {
        require(msg.sender == _tokenOwner, "TokenCalculator: Only tokensOwner can withdraw profit");
        require(address(this).balance != 0, "TokenCalculator: No profit to withdraw");
        uint256 tokensAmount = address(this).balance;
        _dsToken.transfer(msg.sender, tokensAmount);
        emit Withdrew(msg.sender, tokensAmount);
    }

    function add(int256 nb1, int256 nb2) public Credited returns (int256) {
        console.log(msg.sender, "msg.sender");
        _result = nb1 + nb2;
        _calculatorTokenCredit(msg.sender);
        emit Add(nb1, nb2, _result);
        return _result;
    }

    function sub(int256 nb1, int256 nb2) public Credited returns (int256) {
        _result = nb1 - nb2;
        _calculatorTokenCredit(msg.sender);
        emit Sub(nb1, nb2, _result);
        return _result;
    }

    function mul(int256 nb1, int256 nb2) public Credited returns (int256) {
        _result = nb1 * nb2;
        _calculatorTokenCredit(msg.sender);
        emit Mul(nb1, nb2, _result);
        return _result;
    }

    function div(int256 nb1, int256 nb2) public Credited returns (int256) {
        require(nb2 != 0, "TokenCalculator: Can not divide by 0");
        _result = nb1 / nb2;
        _calculatorTokenCredit(msg.sender);
        emit Div(nb1, nb2, _result);
        return _result;
    }

    function modulo(int256 nb1, int256 nb2) public Credited returns (int256) {
        require(nb2 != 0, "TokenCalculator: Can not divide by 0");
        _result = nb1 % nb2;
        _calculatorTokenCredit(msg.sender);
        emit Mod(nb1, nb2, _result);
        return _result;
    }

    function calculatorProfit() public view returns (uint256) {
        return address(this).balance;
    }

    function _calculatorTokenCredit(address sender) private Credited {
        _dsToken.transferFrom(sender, address(this), _price);
        emit Bought(sender, _price);
    }
}
