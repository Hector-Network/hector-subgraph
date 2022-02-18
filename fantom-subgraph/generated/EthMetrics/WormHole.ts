// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class WormHole extends ethereum.SmartContract {
  static bind(address: Address): WormHole {
    return new WormHole("WormHole", address);
  }

  get_virtual_price(): BigInt {
    let result = super.call(
      "get_virtual_price",
      "get_virtual_price():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_get_virtual_price(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "get_virtual_price",
      "get_virtual_price():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}