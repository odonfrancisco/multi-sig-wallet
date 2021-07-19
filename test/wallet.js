const Wallet = artifacts.require('Wallet');
const {expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

// Truffle automatically passes an account array as parameter
contract('Wallet', (accounts) => {
    let wallet;
    // BeforeEach will be called before all the tests;
    beforeEach(async () => {
        wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2);
        await web3.eth.sendTransaction({from:accounts[0], to:wallet.address, value: 1000});

    });

    it('should have correct approvers & quorum', async () => {
        const approvers = await wallet.getApprovers();
        const quorum = await wallet.quorum();
        assert(approvers.length === 3);
        assert(approvers[0] === accounts[0]);
        assert(approvers[1] === accounts[1]);
        assert(approvers[2] === accounts[2]);
        // the quorum integer is wrapped by the BN.js library. 
        // Should NOT do quorum.toNumber() because sometimes we'll be dealing with HUGE numbers and it'll throw an error
        // // since many times i'll be handling numbers that are too big for javascript to handle.
        assert(quorum.toString() === '2');
    })

    // Test that transfer Struct was actually created inside the createTransfer function
    it('should successfully create transfer', async () => {
        await wallet.createTransfer(100000, accounts[6], {from: accounts[0]});
        const transfers = await wallet.getTransfers();

        assert(transfers.length === 1);
        // Fields of a Struct are not wrapped in BN.js objects, but are strings instead. so we can compare them to string equivalent of value
        assert(transfers[0].id === '0');
        assert(transfers[0].amount === '100000');
        assert(transfers[0].to === accounts[6]);
        assert(transfers[0].approvals === '0');
        assert(transfers[0].sent === false);
    })

    // Test what happens if you try to create a transfer from an address that aint an approver
    it('should NOT create transfer if unapproved address', async () => {
        // This is one way to try and test that we receive an error message from trying this.
        // try{
        //     await wallet.createTransfer(1000, accounts[6], {from: accounts[3]});
        // } catch(e) {
        //     console.log(e);
        //     assert(e == 'error message');
        // }

        await expectRevert(
            wallet.createTransfer(1000, accounts[6], {from: accounts[3]}),
            'only approver allowed' 

        )
    })

    // Test if you add approval but quorum is not met 
    
    // Test if you call approveTransfer but are not an approver
    // Test if you call approveTransfer even though transaction was already sent
    // Test if you try to call approveTransfer twice from same address

    it('should NOT send transfer if approved but quorum is not met', async () => {
        await wallet.createTransfer(10000, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});
        const transfers = await wallet.getTransfers();
        const balance = await web3.eth.getBalance(wallet.address);
        assert(!transfers[0].sent, 'transaction marked as sent');
        assert(transfers[0].approvals === '1', 'approvals was not incremented');
        assert(balance === '1000', 'balance of smartContract is not 1000');
    })

    // Test that approvals reached quorum and it transfers to recipient
    it('should send transfer if quorum reached', async () => {
        const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));
        await wallet.createTransfer(1000, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});
        const transfers = await wallet.getTransfers();
        const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[6]));

        assert(transfers[0].sent, 'transaction not marked as sent');
        assert(transfers[0].approvals == '2', 'approvals was not properly incremented to 2');
        // do NOT try doing this as regular practice. can fuck you up when working with numbers too large for js to handle.
        // assert(parseInt(balanceAfter) - parseInt(balanceBefore) === 1000, 'balance of accounts[6] does not reflect transfer')
        assert(balanceAfter.sub(balanceBefore).toNumber() === 1000); 
    })

    // Test if we try to approve transfer from unapproved address
    it('should NOT approve transfer if unapproved address', async () => {
        await wallet.createTransfer(1000, accounts[6], {from: accounts[0]});
        // This line expects the code inside it to fail
        await expectRevert(
            // trying to approve transfer from an unapproved address
            wallet.approveTransfer(0, {from: accounts[4]}),
            // line below needs to be the exact error message emitted by 'onlyApprovers()' modifier
            'only approver allowed to call this function'
        )
    })

    // Test if trying to approve transfer after transaction has been sent
    it('should NOT approve transfer if transaction has been sent', async () => {
        await wallet.createTransfer(1000, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[1]});
        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[2]}),
            'transfer has already been sent'
        )
    }) 
    
    // Test if same address calls approveTransfer twice
    it('should NOT approve transfer by same address twice', async () => {
        await wallet.createTransfer(1000, accounts[6], {from: accounts[0]});
        await wallet.approveTransfer(0, {from: accounts[0]});
        await expectRevert(
            wallet.approveTransfer(0, {from: accounts[0]}),
            'cannot approve transfer twice'
        )
    })

    
})