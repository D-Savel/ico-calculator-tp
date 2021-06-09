//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "./DsToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenCalculator is Ownable {
    /// @dev ERC20 token contract choose for TokenCalculator
    DsToken private _dsToken;

    mapping(address => uint256) private _calculatorCredit;
    address private _tokenContractAddress;
    address private _tokenOwner;
    int256 private _result;
    uint256 private _operationPrice;

    event Add(address sender, int256 nb1, int256 nb2, int256 _result);
    event Sub(address sender, int256 nb1, int256 nb2, int256 _result);
    event Mul(address sender, int256 nb1, int256 nb2, int256 _result);
    event Div(address sender, int256 nb1, int256 nb2, int256 _result);
    event Mod(address sender, int256 nb1, int256 nb2, int256 _result);
    event Bought(address indexed sender, uint256 nbTokens);
    event Withdrew(address indexed sender, uint256 tokensAmount);

    /// @dev Construtor intancies the token ERC20 contract address,
    // owner for Calculator smartcontract and price for 1 operation
    /// @param tokenContractAddress_ the address of token ERC20 contract
    /// @param calculatorOwner_ owner of the TokenCalculator contract
    /// @param operationPrice_ owner of the TokenCalculator contract
    constructor(
        address tokenContractAddress_,
        address calculatorOwner_,
        uint256 operationPrice_
    ) Ownable() {
        _tokenContractAddress = tokenContractAddress_; //Token smartcontract address
        _dsToken = DsToken(tokenContractAddress_); // Token smartcontract link
        _tokenOwner = _dsToken.tokenOwner();
        transferOwnership(calculatorOwner_);
        _operationPrice = operationPrice_;
    }

    modifier Credited() {
        require(
            _calculatorCredit[msg.sender] >= _operationPrice,
            "TokenCalculator: Not enough Calculator credit to perform operation"
        );
        _;
    }

    /**
     * @notice Called for withdraw tokens to ERC20 tokens owner
     * @dev Calls transferFrom function from ERC20 : Token
     */
    function withdrawTokens() public onlyOwner {
        require(calculatorProfit() != 0, "TokenCalculator: No profit to withdraw");
        uint256 tokensAmount = calculatorProfit();
        _dsToken.transferFrom(owner(), _tokenOwner, tokensAmount);
        emit Withdrew(msg.sender, tokensAmount);
    }

    /**
     * @notice function called to perform addition operation,
     *  decreases user credit of operation price
     * @param nb1 first number to perform operation
     * @param nb2 second number to perform operation
     */
    function add(int256 nb1, int256 nb2) public Credited returns (int256) {
        _result = nb1 + nb2;
        _calculatorCredit[msg.sender] -= _operationPrice;
        emit Add(msg.sender, nb1, nb2, _result);
        return _result;
    }

    /**
     * @notice function called to perform substraction operation,
     *  decreases user credit of operation price
     * @param nb1 first number to perform operation
     * @param nb2 second number to perform operation
     */
    function sub(int256 nb1, int256 nb2) public Credited returns (int256) {
        _result = nb1 - nb2;
        _calculatorCredit[msg.sender] -= _operationPrice;
        emit Sub(msg.sender, nb1, nb2, _result);
        return _result;
    }

    /**
     * @notice function called to perform multiplication operation,
     *  decreases user credit of operation price
     * @param nb1 first number to perform operation
     * @param nb2 second number to perform operation
     */
    function mul(int256 nb1, int256 nb2) public Credited returns (int256) {
        _result = nb1 * nb2;
        _calculatorCredit[msg.sender] -= _operationPrice;
        emit Mul(msg.sender, nb1, nb2, _result);
        return _result;
    }

    /**
     * @notice function called to perform division operation,
     *  decreases user credit of operation price
     * @param nb1 first number to perform operation
     * @param nb2 second number to perform operation
     */
    function div(int256 nb1, int256 nb2) public Credited returns (int256) {
        require(nb2 != 0, "TokenCalculator: Can not divide by 0");
        _result = nb1 / nb2;
        _calculatorCredit[msg.sender] -= _operationPrice;
        emit Div(msg.sender, nb1, nb2, _result);
        return _result;
    }

    /**
     * @notice function called to perform modulo operation,
     *  decreases user credit of operation price
     * @param nb1 first number to perform operation
     * @param nb2 second number to perform operation
     */
    function modulo(int256 nb1, int256 nb2) public Credited returns (int256) {
        require(nb2 != 0, "TokenCalculator: Can not divide by 0");
        _result = nb1 % nb2;
        _calculatorCredit[msg.sender] -= _operationPrice;
        emit Mod(msg.sender, nb1, nb2, _result);
        return _result;
    }

    /// @notice function called to add tokens credit for user in Calculator contract
    /// @param nbTokens tokens amount to add at Calculator credit for user
    function calculatorTokenCredit(uint256 nbTokens) public {
        _dsToken.transferFrom(msg.sender, owner(), nbTokens);
        _calculatorCredit[msg.sender] += nbTokens;
        emit Bought(msg.sender, nbTokens);
    }

    /// @notice Returns user credit for Calculator
    /// @param account user address
    function calculatorTokenCreditOf(address account) public view returns (uint256) {
        return _calculatorCredit[account];
    }

    /// @notice Returns profit for Calculator owner feeds with users credit
    function calculatorProfit() public view returns (uint256) {
        // return tokens amount balance for TokenCalculator smart contract;
        return _dsToken.balanceOf(owner());
    }

    /// @notice Returns price for 1 operation with calculator
    function operationPrice() public view returns (uint256) {
        return _operationPrice;
    }
}
