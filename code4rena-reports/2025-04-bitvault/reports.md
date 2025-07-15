- Medium Risk Findings (2)
  - [M-01] The current implementation is incompatible with WBTC as collateral token
  - [M-02] Non-whitelisted owner can also hold/own a troveNFT

# Summary

The C4 analysis yielded an aggregated total of 2 unique vulnerabilities. Of these vulnerabilities, 0 received a risk rating in the category of HIGH severity and 2 received a risk rating in the category of MEDIUM severity.

Additionally, C4 analysis included 0 reports detailing issues with a risk rating of LOW severity or non-critical.

All of the issues presented here are linked back to their original finding, which may include relevant context from the judge and BitVault team.

### Scope

The code under review can be found within the C4 BitVault repository, and is composed of 6 smart contracts written in the Solidity programming language and includes 3269 lines of Solidity code.

#### [M-01] The current implementation is incompatible with WBTC as collateral token

Submitted by zanderbyte, also found by 0xDemon, araj, Fortis_audits, and TheSchnilch

<https://github.com/code-423n4/2025-04-bitvault/blob/04694fc83f4183e4c57a52599be624fb4aadc013/contracts/src/TroveManager.sol#L360>

<https://github.com/code-423n4/2025-04-bitvault/blob/04694fc83f4183e4c57a52599be624fb4aadc013/contracts/src/TroveManager.sol#L421>

<https://github.com/code-423n4/2025-04-bitvault/blob/04694fc83f4183e4c57a52599be624fb4aadc013/contracts/src/TroveManager.sol#L989>

<https://github.com/code-423n4/2025-04-bitvault/blob/04694fc83f4183e4c57a52599be624fb4aadc013/contracts/src/TroveManager.sol#L1133>

Finding description and impact
The original Liquity V2 code is designed to work with collateral tokens that have 18 decimal places (WETH, rETH, wstETH). BitVault, however, intends to use WBTC and other BTC-like tokens as collateral, which only have 8 decimal places.

This difference in the decimal precision introduces a lot of issues across the entire system, as many core calculations - such as collateral ratios, interest accruals, redemptions, and liquidations - are written with the assumption of 18-digit precision. The problem is systemic and scattered across many parts of the codebase. While not all instances are immediately exploitable, the cumulative effect will lead to incorrect behaviour, wrong calculations, broken incentives, and a lot of issues.

Due to the scope of this issue, I highlight a few cases in this report. However, the full impact requires a detailed audit of the whole system to ensure it correctly accounts for 8 decimal collateral assets.

Example 1: Incorrect gas compensation cap for liquidations During liquidation, the total funds the liquidator receives are: WETH gas compensation + min (0.5% of Trove’s collateral, 2 units of collateral token) The following function determines the collateral portion of the compensation:

    // Return the amount of Coll to be drawn from a trove's collateral and sent as gas compensation.

    function _getCollGasCompensation(uint256 _entireColl) internal pure returns (uint256) {

        return LiquityMath._min(_entireColl / COLL_GAS_COMPENSATION_DIVISOR, COLL_GAS_COMPENSATION_CAP);

    }

With constants defined as:

// Fraction of collateral awarded to liquidator

uint256 constant COLL_GAS_COMPENSATION_DIVISOR = 200; // dividing by 200 yields 0.5%

uint256 constant COLL_GAS_COMPENSATION_CAP = 2 ether; // Max coll gas compensation capped at 2 ETH
As we can observe, the cap here is in 2e18, meaning the liquidator can exceed the cap of 2 units of collateral token.

Example 2: In TroveManager we have the following function, in which I highlight the decimal precision of the parameters:

```solidity
    function _getCollPenaltyAndSurplus(

        uint256 _collToLiquidate, // 8 decimals

        uint256 _debtToLiquidate, // 18 decimals

        uint256 _penaltyRatio, // most likely 8 decimals

        uint256 _price // unclear, assume 18 or 8 decimals

    ) internal pure returns (uint256 seizedColl, uint256 collSurplus) {

        uint256 maxSeizedColl = (_debtToLiquidate * (DECIMAL_PRECISION + _penaltyRatio)) / _price;

        if (_collToLiquidate > maxSeizedColl) {

            seizedColl = maxSeizedColl;

            collSurplus = _collToLiquidate - maxSeizedColl;

        } else {

            seizedColl = _collToLiquidate;

            collSurplus = 0;

        }

    }
```

Since \_collToLiquidate is in 8 decimals (WBTC), and maxSeizedColl is computed using 18-decimal debt and price values, the comparison is unreliable. The if condition can never be true.

Example 3: Redistribution rewards calculation fails due to decimal mismatch In \_getLatestTroveData, redistribution gains are calculated as:

trove.redistBoldDebtGain = (stake \* (L_boldDebt - rewardSnapshots[_troveId].boldDebt)) / DECIMAL_PRECISION;

trove.redistCollGain = (stake \* (L_coll - rewardSnapshots[_troveId].coll)) / DECIMAL_PRECISION;
<br>
However:

stake is in 8 decimals (WBTC),
L_boldDebt and L_coll are updated respectively with 18 decimal and 8 decimal values (see TroveManager::\_redistributeDebtAndColl())
DECIMAL_PRECISION is 1e18
Result:
trove.redistBoldDebtGain results in values with 8 decimal precision, which may still work but significantly reduces the granularity. trove.redistCollGain becomes effectively zero, since the numerator ends up far smaller than the 1e18 divisor (e.g., (e.g., 1e8 \* 1e8 / 1e18 = 0.01).)

These are just a few examples where the precision mismatch leads to broken calculations. Fully enumerating all such cases would make the report overly lengthy, but these are sufficient to demonstrate the associated risks.

Additionally, many other calculations rely heavily on consistent decimal precision across components like oracle prices and collateral ratios. Without further clarification from the team on how these values are standardized across the system, it’s difficult to assess the full scope of potential issues.

Recommended mitigation steps
The fix here is not straightforward, since it heavily depends on other values, contracts outside the scope of this audit, and system assumptions. Since WBTC uses 8 decimals, all relevant calculations, constants, and contract interactions should be reviewed and updated to properly support tokens with 8-decimal precision.

RedVeil (BitVault) acknowledged

#### [M-02] Non-whitelisted owner can also hold/own a troveNFT

Submitted by araj, also found by 0xDemon and gesha17

- <https://github.com/code-423n4/2025-04-bitvault/blob/04694fc83f4183e4c57a52599be624fb4aadc013/contracts/src/BorrowerOperations.sol#L228>

- <https://github.com/code-423n4/2025-04-bitvault/blob/04694fc83f4183e4c57a52599be624fb4aadc013/contracts/src/TroveManager.sol#L1314>

Finding description and impact
When a user opens a trove, troveNFT is minted to owner and it requires the owner to be whitelisted i.e. non-whitelisted owners are not allowed to mint/own the troveNFT.

```solidity
    function openTrove(

        address _owner,

        uint256 _ownerIndex,

        uint256 _collAmount,

        uint256 _boldAmount,

        uint256 _upperHint,

        uint256 _lowerHint,

        uint256 _annualInterestRate,

        uint256 _maxUpfrontFee,

        address _addManager,

        address _removeManager,

        address _receiver

    ) external override returns (uint256) {

        _requireValidAnnualInterestRate(_annualInterestRate);


        IWhitelist _whitelist = whitelist;

        if (address(_whitelist) != address(0)) {

@> \_requireWhitelisted(\_whitelist, \_owner);

            _requireWhitelisted(_whitelist, msg.sender);

            if (_receiver != address(0)) {

                _requireWhitelisted(whitelist, _receiver);

            }

        }

....

    }
    function onOpenTrove(

        address _owner,

        uint256 _troveId,

        TroveChange memory _troveChange,

        uint256 _annualInterestRate

    ) external {

....

        // mint ERC721

@> troveNFT.mint(\_owner, \_troveId);

....

    }
```

However, this whitelist requirement can be bypassed because troveNFTs are transferable and a whitelisted owner can transfer his troveNFT to a non-whitelisted owner, bypassing the whitelist requirement

# Recommended mitigation steps

Override the transferFrom() of troveNFT.sol and add this \_requireWhitelisted() for receiver

# RedVeil (BitVault) confirmed
