// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library console2 {
    address constant CONSOLE_ADDRESS = address(0x000000000000000000636F6e736F6c652e6c6f67);

    function log(string memory message) internal view {
        (bool ignored,) = CONSOLE_ADDRESS.staticcall(abi.encodeWithSignature("log(string)", message));
        ignored;
    }

    function log(string memory message, uint256 value) internal view {
        (bool ignored,) = CONSOLE_ADDRESS.staticcall(abi.encodeWithSignature("log(string,uint256)", message, value));
        ignored;
    }

    function log(string memory message, address value) internal view {
        (bool ignored,) = CONSOLE_ADDRESS.staticcall(abi.encodeWithSignature("log(string,address)", message, value));
        ignored;
    }
}
