/* eslint-disable no-undef */
const { expect } = require('chai');

describe('Ico', function () {
  let DsToken, dsToken, Ico, ico, dev, tokenOwnerTest, icoOwner, alice, bob;
  const INITIAL_SUPPLY = ethers.utils.parseEther('1000');
  const RATE = 10 ** 9;

  beforeEach(async function () {
    // dsToken deployment
    [tokenOwnerTest, icoOwner, dev, alice, bob] = await ethers.getSigners();
    DsToken = await ethers.getContractFactory('DsToken');
    dsToken = await DsToken.connect(dev).deploy(tokenOwnerTest.address, INITIAL_SUPPLY);
    await dsToken.deployed();

    // ico deployment
    Ico = await ethers.getContractFactory('Ico');
    ico = await Ico.connect(icoOwner).deploy(dsToken.address);
    await ico.deployed();
  });

  describe('Ico deployement', function () {
    it('should ico tokenOwner be dsToken tokenOwner ', async function () {
      expect(await dsToken.tokenOwner()).to.equal(tokenOwnerTest.address);
    });
    it('should ico tokenContractAddress be dsToken contract address', async function () {
      expect(await ico.tokenContractAddress()).to.equal(dsToken.address);
    });
    it('should ico end be equal to 2 weeks', async function () {
      await ethers.provider.send('evm_increaseTime', [1209600]); // 2 weeks= 1209600 seconds
      await ethers.provider.send('evm_mine');
      expect(await ico.icoTimeRemaining()).to.equal(0);
    });
    it('should ico is not over before to 2 weeks', async function () {
      await ethers.provider.send('evm_increaseTime', [1209598]); // 2 weeks= 1209600 seconds
      await ethers.provider.send('evm_mine');
      expect(await ico.icoTimeRemaining()).to.be.within(1, 5);
    });
  });

  describe('Ico function', function () {
    beforeEach(async function () {
      // approve smartcontract address for buying tokens
      await dsToken.connect(tokenOwnerTest).approve(ico.address, INITIAL_SUPPLY);
    });
    describe('buyTokens', function () {
      it('should tokens buyer balance increase bought tokens amount', async function () {
        await ico.connect(alice).buyTokens({ value: 1000 });
        expect(await ico.tokensBalanceOf(alice.address)).to.equal(1000 * RATE);
      });
      it('should tokens owner balance decrease bought tokens amount', async function () {
        const currentTokenOwnerBalance = await ico.tokensBalanceOf(tokenOwnerTest.address);
        await ico.connect(alice).buyTokens({ value: 1000 });
        expect(await ico.tokensBalanceOf(tokenOwnerTest.address)).to.equal(currentTokenOwnerBalance.sub(1000 * RATE));
      });
      it('should profit balance increase ether amount of tokens buyer', async function () {
        await ico.connect(bob).buyTokens({ value: 10000 });
        expect(await ico.profit()).to.equal(10000);
      });
      it('should Ether balance buyer decrease of 10000 after tokens buying', async function () {
        expect(await ico.connect(alice).buyTokens({ value: 10000 })).to.changeEtherBalance(alice, -10000);
      });
      it('should revert for tokenOwner', async function () {
        await expect(ico.connect(tokenOwnerTest).buyTokens({ value: 200 }))
          .to.be.revertedWith('ICO: owner can not buy his tokens');
      });
      it('should revert in case of insuffisant tokens remaining to sell', async function () {
        const currentTokenOwnerBalance = await ico.tokensBalanceOf(tokenOwnerTest.address);
        await expect(ico.connect(bob).buyTokens({ value: currentTokenOwnerBalance.add(1000) }))
          .to.be.revertedWith('ICO: not enough tokens remaining to sell');
      });
      it('should revert for ico time is over', async function () {
        await ethers.provider.send('evm_increaseTime', [1210000]); // 2 weeks= 1209600 seconds
        await ethers.provider.send('evm_mine');
        await expect(ico.connect(bob).buyTokens({ value: 1000 }))
          .to.be.revertedWith('ICO: ico is over, you can not buy tokens anymore');
      });
      it('should emit Bought event', async function () {
        expect(await ico.connect(bob).buyTokens({ value: 500 }))
          .to.emit(ico, 'Bought').withArgs(bob.address, 500 * RATE, 500);
      });
    });
    describe('receive funtion', async function () {
      it('should change Ether balance for tokens buyer and profit(ico address)', async function () {
        expect(await alice.sendTransaction({ to: ico.address, value: 10000 })).to.changeEtherBalance(
          ico, 10000);
        expect(await alice.sendTransaction({ to: ico.address, value: 10000 })).to.changeEtherBalance(
          alice, -10000);
      });
    });
    describe('withdraw', function () {
      it('should profit balance equal to 0 after withdraw', async function () {
        await ico.connect(alice).buyTokens({ value: 10000 });
        await ico.connect(bob).buyTokens({ value: 5000 });
        await ethers.provider.send('evm_increaseTime', [1210000]); // 2 weeks= 1209600 seconds
        await ethers.provider.send('evm_mine');
        await ico.connect(tokenOwnerTest).withdrawProfit();
        expect(await ico.profit()).to.equal(0);
      });
      it('should Ether balance tokensowner equal to 15000 after withdraw', async function () {
        await ico.connect(alice).buyTokens({ value: 10000 });
        await ico.connect(bob).buyTokens({ value: 5000 });
        await ethers.provider.send('evm_increaseTime', [1210000]); // 2 weeks= 1209600 seconds
        await ethers.provider.send('evm_mine');
        expect(await ico.connect(tokenOwnerTest).withdrawProfit()).to.changeEtherBalance(tokenOwnerTest, 10000 + 5000);
      });
      it('should revert for profit balance equal to 0', async function () {
        await ethers.provider.send('evm_increaseTime', [1210000]); // 2 weeks= 1209600 seconds
        await ethers.provider.send('evm_mine');
        await expect(ico.connect(tokenOwnerTest).withdrawProfit())
          .to.be.revertedWith('ICO: No profit to withdraw');
      });
      it('should revert for withdraw with address different of tokensOwner', async function () {
        await ethers.provider.send('evm_increaseTime', [1210000]); // 2 weeks= 1209600 seconds
        await ethers.provider.send('evm_mine');
        await expect(ico.connect(bob).withdrawProfit())
          .to.be.revertedWith('ICO: Only tokensOwner can withdraw profit');
      });
      it('should emit Withdrew event', async function () {
        await ico.connect(alice).buyTokens({ value: 10000 });
        await ico.connect(bob).buyTokens({ value: 5000 });
        await ethers.provider.send('evm_increaseTime', [1210000]); // 2 weeks= 1209600 seconds
        await ethers.provider.send('evm_mine');
        expect(await ico.connect(tokenOwnerTest).withdrawProfit())
          .to.emit(ico, 'Withdrew').withArgs(tokenOwnerTest.address, 10000 + 5000);
      });
    });
  });
});
