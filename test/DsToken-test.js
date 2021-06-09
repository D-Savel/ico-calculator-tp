/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { expect } = require('chai');

describe('DsToken', function () {
  let DsToken, dsToken, dev, owner, alice, bob, charlie, dan, eve;
  const NAME = 'DsToken';
  const SYMBOL = 'DST';
  const INITIAL_SUPPLY = ethers.utils.parseEther('10000000000');

  beforeEach(async function () {
    [dev, owner, alice, bob, charlie, dan, eve] = await ethers.getSigners();
    DsToken = await ethers.getContractFactory('DsToken');
    dsToken = await DsToken.connect(dev).deploy(owner.address, INITIAL_SUPPLY);
    await dsToken.deployed();
  });

  describe('Deployement', function () {
    it('Has name DsToken', async function () {
      expect(await dsToken.name()).to.equal(NAME);
    });
    it('Has symbol DST', async function () {
      expect(await dsToken.symbol()).to.equal(SYMBOL);
    });
    it('mints initial Supply to owner', async function () {
      expect(await dsToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it('emits event Transfer when mint initial supply to owner at deployement', async function () {
      let receipt = await dsToken.deployTransaction.wait();
      let txHash = receipt.transactionHash;
      await expect(txHash)
        .to.emit(dsToken, 'Transfer')
        .withArgs(ethers.constants.AddressZero, owner.address, INITIAL_SUPPLY);
    });
  });
});
