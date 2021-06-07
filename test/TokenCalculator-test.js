/* eslint-disable no-undef */
const { expect } = require('chai');

describe('TokenCalculator', function () {
  let DsToken, dsToken, TokenCalculator, tokenCalculator, dev, tokenOwnerTest, eve;
  const INITIAL_SUPPLY = ethers.utils.parseEther('1000');

  beforeEach(async function () {
    // dsToken deployment
    [tokenOwnerTest, dev, eve, bob] = await ethers.getSigners();
    DsToken = await ethers.getContractFactory('DsToken');
    dsToken = await DsToken.connect(dev).deploy(tokenOwnerTest.address, INITIAL_SUPPLY);
    await dsToken.deployed();
    await dsToken.connect(tokenOwnerTest).transfer(eve.address, 10000);
    // TokenCalculator Deployement
    TokenCalculator = await ethers.getContractFactory('TokenCalculator');
    tokenCalculator = await TokenCalculator.connect(tokenOwnerTest).deploy(dsToken.address);
    await tokenCalculator.deployed();
  });

  describe('Calculator deployement', function () {
    it('Should assign token owner address', async function () {
      expect(await dsToken.tokenOwner()).to.equal(tokenOwnerTest.address);
    });
  });

  describe('Calculator functions', function () {
    it('Should calc function return emit', async function () {
      tokenCalculator.connect(eve);
      // approve eve address for tranfering tokens to TokenCalculator contract
      await dsToken.connect(eve).approve(tokenCalculator.address, 1000000000);
      console.log((await dsToken.balanceOf(eve.address)).toString(), 'eve balance');
      console.log(eve.address, 'eve');
      await expect(tokenCalculator.connect(eve).add(10, 10)).to.emit(tokenCalculator, 'Add').withArgs(eve.address, 10, 10, 20);
      await expect(tokenCalculator.sub(5, 6)).to.emit(tokenCalculator, 'Sub').withArgs(eve.address, 5, 6, 1);
      await expect(tokenCalculator.mul(3, -6)).to.emit(tokenCalculator, 'Mul').withArgs(eve.address, 3, -6, -18);
      await expect(tokenCalculator.div(10, 2)).to.emit(tokenCalculator, 'Add').withArgs(eve.address, 10, 2, 5);
      await expect(tokenCalculator.mod(10, 4)).to.emit(tokenCalculator, 'Add').withArgs(eve.address, 10, 4, 2);
    });
    it('Should function div revert for 0 division or modulo', async function () {
      await expect(tokenCalculator.div(10, 0)).to.be.revertedWith('TokenCalculator: Can not divide by 0');
      await expect(tokenCalculator.mod(10, 0)).to.be.revertedWith('TokenCalculator: Can not divide by 0');
    });
  });
});
