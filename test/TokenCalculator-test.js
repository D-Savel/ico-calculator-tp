/* eslint-disable no-undef */
const { expect } = require('chai');

describe('TokenCalculator', function () {
  let DsToken, dsToken, TokenCalculator, tokenCalculator, calcOwner, tokenOwnerTest, eve;
  const INITIAL_SUPPLY = ethers.utils.parseEther('1000');
  const OPERATIONPRICE = 1;
  beforeEach(async function () {
    // dsToken deployment
    [tokenOwnerTest, dev, calcOwner, eve, bob] = await ethers.getSigners();
    DsToken = await ethers.getContractFactory('DsToken');
    dsToken = await DsToken.connect(dev).deploy(tokenOwnerTest.address, INITIAL_SUPPLY);
    await dsToken.deployed();
    await dsToken.connect(tokenOwnerTest).transfer(eve.address, 10000);
    // TokenCalculator Deployement
    TokenCalculator = await ethers.getContractFactory('TokenCalculator');
    tokenCalculator = await TokenCalculator.connect(dev).deploy(dsToken.address, calcOwner.address, OPERATIONPRICE);
    await tokenCalculator.deployed();
  });

  describe('TokenCalculator deployement', function () {
    it('Should assign token owner address', async function () {
      expect(await dsToken.tokenOwner()).to.equal(tokenOwnerTest.address);
      expect(await tokenCalculator.operationPrice()).to.equal(OPERATIONPRICE);
    });
    it(`Should fix the operation cost to ${OPERATIONPRICE} token`, async function () {
      expect(await tokenCalculator.operationPrice()).to.equal(OPERATIONPRICE);
    });
  });

  describe('TokenCalculator functions', function () {
    beforeEach(async function () {
      await dsToken.connect(eve).approve(tokenCalculator.address, 1000000000);
      await tokenCalculator.connect(eve).calculatorTokenCredit(5);
    });
    describe('Credit function', function () {
      it('Should change tokens balance, tokenCalculator smart contract balance and credit for user', async function () {
        const beforeEveBalance = await dsToken.balanceOf(eve.address);
        const beforeOwnerBalance = await dsToken.balanceOf(calcOwner.address);
        const beforeCalculatorTokenCredit = await tokenCalculator.calculatorTokenCreditOf(eve.address);
        await tokenCalculator.connect(eve).calculatorTokenCredit(5);
        expect(await dsToken.balanceOf(calcOwner.address)).to.equal(beforeOwnerBalance.add(5));
        expect(await dsToken.balanceOf(eve.address)).to.equal(beforeEveBalance.sub(5));
        expect(await tokenCalculator.calculatorTokenCreditOf(eve.address)).to.equal(beforeCalculatorTokenCredit.add(5));
      });
    });
    describe('Calculator function', function () {
      it('Should calc function return emit', async function () {
        expect(await tokenCalculator.connect(eve).add(10, 10))
          .to.emit(tokenCalculator, 'Add').withArgs(eve.address, 10, 10, 20);
        expect(await tokenCalculator.connect(eve).sub(5, 6))
          .to.emit(tokenCalculator, 'Sub').withArgs(eve.address, 5, 6, -1);
        expect(await tokenCalculator.connect(eve).mul(3, -6))
          .to.emit(tokenCalculator, 'Mul').withArgs(eve.address, 3, -6, -18);
        expect(await tokenCalculator.connect(eve).div(10, 2))
          .to.emit(tokenCalculator, 'Div').withArgs(eve.address, 10, 2, 5);
        expect(await tokenCalculator.connect(eve).modulo(10, 4))
          .to.emit(tokenCalculator, 'Mod').withArgs(eve.address, 10, 4, 2);
      });
      it('Should function div revert for 0 division or modulo', async function () {
        await expect(tokenCalculator.connect(eve).div(10, 0))
          .to.be.revertedWith('TokenCalculator: Can not divide by 0');
        await expect(tokenCalculator.connect(eve).modulo(10, 0))
          .to.be.revertedWith('TokenCalculator: Can not divide by 0');
      });
      it(`Should Calc function revert for user Calculator credit less than ${OPERATIONPRICE}`, async function () {
        // perform 5 operations to spend 5 tokens credit for eve
        await (tokenCalculator.connect(eve).div(10, 2));
        await (tokenCalculator.connect(eve).div(-1, -4));
        await (tokenCalculator.connect(eve).div(2, -1));
        await (tokenCalculator.connect(eve).div(4, 2));
        await (tokenCalculator.connect(eve).div(250, 22));
        await expect(tokenCalculator.connect(eve).div(1, 3))
          .to.be.revertedWith('TokenCalculator: Not enough Calculator credit to perform operation');
      });
      it('Should spend 1 token', async function () {
        await expect(tokenCalculator.connect(eve).div(10, 0))
          .to.be.revertedWith('TokenCalculator: Can not divide by 0');
        await expect(tokenCalculator.connect(eve).modulo(10, 0))
          .to.be.revertedWith('TokenCalculator: Can not divide by 0');
      });
    });
    describe('withdrawTokens', function () {
      beforeEach(async function () {
        await dsToken.connect(calcOwner).approve(tokenCalculator.address, INITIAL_SUPPLY);
      });
      it('should profit balance equal to 0 after withdraw', async function () {
        const beforeCalcOwnerBalance = await tokenCalculator.calculatorProfit();
        await tokenCalculator.connect(calcOwner).withdrawTokens();
        expect(await tokenCalculator.calculatorProfit()).to.equal(beforeCalcOwnerBalance.sub(5));
        expect(await tokenCalculator.calculatorProfit()).to.equal(0);
      });
      it('should tokens balance tokensowner increase of 5 after withdraw', async function () {
        const beforeTokenOwnerBalance = await dsToken.balanceOf(tokenOwnerTest.address);
        await tokenCalculator.connect(calcOwner).withdrawTokens();
        expect(await dsToken.balanceOf(tokenOwnerTest.address)).to.equal(beforeTokenOwnerBalance.add(5));
      });
      it('should revert for profit balance equal to 0', async function () {
        await tokenCalculator.connect(calcOwner).withdrawTokens();
        await expect(tokenCalculator.connect(calcOwner).withdrawTokens())
          .to.be.revertedWith('TokenCalculator: No profit to withdraw');
      });
      it('should revert for withdraw with address different of calcOwner', async function () {
        await expect(tokenCalculator.connect(eve).withdrawTokens())
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('should emit Withdrew event', async function () {
        expect(await tokenCalculator.connect(calcOwner).withdrawTokens())
          .to.emit(tokenCalculator, 'Withdrew').withArgs(calcOwner.address, 5);
      });
    });
  });
});
