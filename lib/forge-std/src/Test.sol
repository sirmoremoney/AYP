// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.9.0;

import {console2} from "./console2.sol";
import {Vm} from "./Vm.sol";

abstract contract Test {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    bool private _failed;

    function failed() public view returns (bool) {
        return _failed;
    }

    function fail() internal {
        _failed = true;
    }

    function assertTrue(bool condition) internal pure {
        require(condition, "Assertion failed");
    }

    function assertTrue(bool condition, string memory message) internal pure {
        require(condition, message);
    }

    function assertFalse(bool condition) internal pure {
        require(!condition, "Assertion failed");
    }

    function assertEq(uint256 a, uint256 b) internal pure {
        require(a == b, "Values not equal");
    }

    function assertEq(uint256 a, uint256 b, string memory message) internal pure {
        require(a == b, message);
    }

    function assertEq(address a, address b) internal pure {
        require(a == b, "Addresses not equal");
    }

    function assertEq(bool a, bool b) internal pure {
        require(a == b, "Booleans not equal");
    }

    function assertEq(bytes32 a, bytes32 b) internal pure {
        require(a == b, "Bytes32 not equal");
    }

    function makeAddr(string memory name) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(name)))));
    }
}
