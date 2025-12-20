// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

interface Vm {
    function prank(address msgSender) external;
    function startPrank(address msgSender) external;
    function stopPrank() external;
    function warp(uint256 newTimestamp) external;
    function roll(uint256 newBlockNumber) external;
    function deal(address account, uint256 newBalance) external;
    function expectRevert(bytes4 selector) external;
    function expectRevert(bytes memory message) external;
    function expectEmit(bool checkTopic1, bool checkTopic2, bool checkTopic3, bool checkData) external;
    function record() external;
    function accesses(address target) external returns (bytes32[] memory reads, bytes32[] memory writes);
    function label(address account, string calldata newLabel) external;
    function assume(bool condition) external pure;
    function envOr(string calldata key, bool defaultValue) external view returns (bool);
    function envOr(string calldata key, uint256 defaultValue) external view returns (uint256);
    function envOr(string calldata key, address defaultValue) external view returns (address);
    function envOr(string calldata key, string calldata defaultValue) external view returns (string memory);
}
