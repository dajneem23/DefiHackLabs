# DeFi Hacks Reproduce - Foundry

**Reproduce DeFi hack incidents using Foundry.**

1 incidents included.

[Transaction debugging tools](https://github.com/SunWeb3Sec/DeFiHackLabs/#transaction-debugging-tools)

**Disclaimer:** This content serves solely as a proof of concept showcasing past DeFi hacking incidents. It is strictly intended for educational purposes and should not be interpreted as encouraging or endorsing any form of illegal activities or actual hacking attempts. The provided information is for informational and learning purposes only, and any actions taken based on this content are solely the responsibility of the individual. The usage of this information should adhere to applicable laws, regulations, and ethical standards.

## Getting Started

- Follow the [instructions](https://book.getfoundry.sh/getting-started/installation.html) to install [Foundry](https://github.com/foundry-rs/foundry).

- Clone and install dependencies:`git submodule update --init --recursive`

### OnChain transaction debugging

- Lesson 1: Tools ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/01_tools/en) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/01_tools) | [Vietnamese](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/01_tools/vi) | [Korean](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/01_tools/ko) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/01_tools/es) )
- Lesson 2: Warm up ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/02_warmup/en/) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/02_warmup/) | [Korean](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/02_warmup/ko) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/02_warmup/es) )
- Lesson 3: Write Your Own PoC (Price Oracle Manipulation) ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/03_write_your_own_poc/en/) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/03_write_your_own_poc/) | [Korean](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/03_write_your_own_poc/ko) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/03_write_your_own_poc/es) )
- Lesson 4: Write Your Own PoC (MEV Bot) ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/04_write_your_own_poc/en/) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/04_write_your_own_poc/) | [Korean](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/04_write_your_own_poc/kr/) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/04_write_your_own_poc/es) )
- Lesson 5: Rugpull Analysis ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/05_Rugpull/en/) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/05_Rugpull/) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/05_Rugpull/es) )
- Lesson 6: Write Your Own PoC (Reentrancy) ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/06_write_your_own_poc/en/) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/06_write_your_own_poc/) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/06_write_your_own_poc/es) )
- Lesson 7: Hack Analysis: Nomad Bridge, August 2022 ( [English](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/07_Analysis_nomad_bridge/en/) | [中文](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/07_Analysis_nomad_bridge/) | [Spanish](https://github.com/SunWeb3Sec/DeFiHackLabs/tree/main/academy/onchain_debug/07_Analysis_nomad_bridge/es) )

## Donate me

If you appreciate our work, please consider donating. Even a small amount helps me continue developing and improving our projects, and promoting web3 security.

- EVM Chains - 0x28f0fadea04381b1440a23ebb87565f32356ee77

## List of Past DeFi Incidents

List of vulnerabilities

[20210903]()
---

### View Gas Reports

Foundry also has the ability to [report](https://book.getfoundry.sh/forge/gas-reports) the `gas` used per function call which mimics the behavior of [hardhat-gas-reporter](https://github.com/cgewecke/hardhat-gas-reporter). Generally speaking if gas costs per function call is very high, then the likelihood of its success is reduced. Gas optimization is an important activity done by smart contract developers.

Every poc in this repository can produce a gas report like this:

```bash
forge test --gas-report --contracts <contract> -vvv
```

For Example:
Let us find out the gas used in the [Audius poc](src/test/2022-07/Audius_exp.sol)

**Execution**

```bash
forge test --gas-report --contracts ./src/test/Audius.exp.sol -vvv
```

_Demo_

![](./AudiusPocGasReport.gif)

### Bug Reproduce

Moved to [DeFiVulnLabs](https://github.com/SunWeb3Sec/DeFiVulnLabs)

### FlashLoan Testing

Moved to [DeFiLabs](https://github.com/SunWeb3Sec/DeFiLabs)
