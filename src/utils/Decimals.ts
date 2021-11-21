import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const DEFAULT_DECIMALS = 18;

export function toDecimal(
    value: BigInt,
    decimals: number = DEFAULT_DECIMALS,
): BigDecimal {
    let precision = BigInt.fromI32(10)
        .pow(<u8>decimals)
        .toBigDecimal();

    return value.divDecimal(precision);
}