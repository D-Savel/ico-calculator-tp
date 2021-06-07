/* eslint-disable no-undef */
const { Contract } = require('@ethersproject/contracts');
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
      // approve eve address for tranfering tokens to TokenCalculator contract
      await dsToken.connect(tokenOwnerTest).approve(tokenCalculator.address, 1000000000);
      await dsToken.connect(eve).approve(tokenCalculator.address, 1000000000);
      console.log((await dsToken.balanceOf(eve.address)).toString(), 'eve balance');
      console.log(eve.address, 'eve');
      expect(await tokenCalculator.connect(eve).add(10, 10)).to.emit(tokenCalculator, 'Add').withArgs(10, 10, 20);
      expect(await tokenCalculator.connect(eve).sub(5, 6)).to.emit(tokenCalculator, 'Sub').withArgs(5, 6, -1);
      expect(await tokenCalculator.connect(eve).mul(3, -6)).to.emit(tokenCalculator, 'Mul').withArgs(3, -6, -18);
      expect(await tokenCalculator.connect(eve).div(10, 2)).to.emit(tokenCalculator, 'Div').withArgs(10, 2, 5);
      expect(await tokenCalculator.connect(eve).modulo(10, 4)).to.emit(tokenCalculator, 'Mod').withArgs(10, 4, 2);
    });
    it('Should function div revert for 0 division or modulo', async function () {
      await dsToken.connect(tokenOwnerTest).approve(tokenCalculator.address, 1000000000);
      await dsToken.connect(eve).approve(tokenCalculator.address, 1000000000);
      await expect(tokenCalculator.connect(eve).div(10, 0)).to.be.revertedWith('TokenCalculator: Can not divide by 0');
      await expect(tokenCalculator.connect(eve).modulo(10, 0)).to.be.revertedWith('TokenCalculator: Can not divide by 0');
    });
    it('Should change tokens balance user and tokenCalculator smart contract', async function () {
      let beforeEveBalance = await dsToken.balanceOf(eve.address);
      let beforeContractBalance = await dsToken.balanceOf(tokenCalculator.address);
      await dsToken.connect(tokenOwnerTest).approve(tokenCalculator.address, 1000000000);
      await dsToken.connect(eve).approve(tokenCalculator.address, 1000000000);
      await tokenCalculator.connect(eve).sub(5, 6);
      expect(await dsToken.balanceOf(tokenCalculator.address)).to.equal(1);
      expect(await dsToken.balanceOf(eve.address)).to.equal(9999);
    });
  });
});
