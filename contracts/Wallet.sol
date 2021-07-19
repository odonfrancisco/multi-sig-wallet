pragma solidity ^0.8.6;
// Julien said this is necessary for getTransfers() since it is returning an array of structs in Solidity ^0.6.0 
// but this is no longer necessary
// pragma  experimental ABIEncoderV2;

contract Wallet {
    // List of approvers
    address[] public approvers;
    uint public quorum;
    struct Transfer {
        uint id;
        uint amount;
        address payable to;
        uint approvals;
        bool sent;
    }
    Transfer[] public transfers;
    mapping(address => mapping(uint => bool)) public approvals;

     constructor(address[] memory _approvers, uint _quorum) {
        approvers = _approvers;
        quorum = _quorum;
    }

    // This function is to retrieve the Approvers array. the automatically created function approvers() only returns
    // // one lmnt from the array
    function getApprovers() external view returns(address[] memory){
        return approvers;
    }

    function getTransfers() external view returns(Transfer[] memory) {
        return transfers;
    }

    // Function to create transfer. Will be called by one of the approved addresses when they want to send an Eth transfer
    function createTransfer(uint amount, address payable to) external onlyApprover() {
        transfers.push(Transfer(
            transfers.length, 
            amount, 
            to, 
            0, 
            false
            ));
    }


    function approveTransfer(uint id) external onlyApprover() {
        // Check that transfer hasn't already been sent
        require(transfers[id].sent == false, 'transfer has already been sent');
        // Check that same address isn't trying to approve the transfer twice.
        require(approvals[msg.sender][id] == false, 'cannot approve transfer twice');

        approvals[msg.sender][id] = true;
        transfers[id].approvals++;

        if(transfers[id].approvals >= quorum){
            transfers[id].sent = true;
            address payable to = transfers[id].to;
            uint amount = transfers[id].amount;
            // NEED to add a check that there is enough balance in contract to send transaction
            to.transfer(amount);
        }
    }

    // This is the old way of receiving ether
    function sendEther() external payable {}

    // only need to send ether to this smart contract without targetting any function and this receive function will trigger
    receive() external payable {}

    modifier onlyApprover() {
        bool allowed = false;
        for(uint i=0; i < approvers.length; i++){
            if(approvers[i] == msg.sender){
                allowed = true;
            }
        }
        require(allowed, 'only approver allowed to call this function');
        _;
    }

}