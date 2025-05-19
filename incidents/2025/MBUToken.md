# The Mobius Token Exploit
The Mobius Token Exploit was a smart contract vulnerability that led to a loss of $2.15 million on Binance Smart Chain (BSC), caused by improper handling of token decimal precision in the contract’s logic. Here’s a breakdown of what happened:

⸻

## 🧨 What Was the Exploit?

The Mobius smart contract had a deposit() function that:
 • Allowed users to deposit WBNB (Wrapped BNB).
 • Minted an equivalent amount of MBU tokens based on the BNB price in USDT.

The vulnerability was in how the contract calculated the number of tokens to mint.

⸻

## 🧮 The Core Problem: Decimal Mismanagement

 • The contract fetched the price of BNB using a function called getBNBPriceInUSDT.
 • This function returned the price with 18 decimal places, e.g., 656 * 10¹⁸ (which is a correct representation in Solidity).
 • However, the Mobius contract multiplied this already-scaled value by 10¹⁸ again, leading to a massive overestimation in the number of tokens to mint.

For example:
 • Actual price: 656 (in 18 decimals = 656 *10¹⁸)
 • Contract mistakenly calculated: 656* 10¹⁸ *10¹⁸ = 656* 10³⁶
 • This led to minting trillions of MBU tokens for just a tiny deposit (~$0.67 worth of WBNB).

⸻

## 🦹 How the Attacker Exploited It

 1. Funded wallet via Tornado Cash (a privacy protocol) with 10 BNB.
 2. Called the deposit() function with only 0.001 WBNB.
 3. Due to the faulty logic, the contract minted ~9.7 trillion MBU tokens.
 4. The attacker then sold these tokens on PancakeSwap (a DEX on BSC) and drained $2.15 million in value.

⸻

## 🛡️ How It Could’ve Been Prevented

 • Proper handling of decimal scaling.
 • Unit tests covering edge cases for price feeds and token minting logic.
 • Thorough smart contract audits to identify logic-level flaws before deployment.

⸻

## ⚠️ Key Takeaway

Even small mistakes like multiplying already-scaled values can lead to catastrophic financial losses in smart contracts. Always:
 • Validate oracle outputs and formats.
 • Audit minting logic rigorously.
 • Test precision handling carefully.

⸻

Let me know if you’d like a visual diagram of the exploit flow or a simplified code example showing how the bug happened.

Sure! Let’s break down the decimal mistake in the Mobius contract with a concrete example using numbers.

⸻

## 📌 The Goal

The Mobius smart contract wants to:
 • Let users deposit WBNB.
 • Mint equivalent MBU tokens based on the USD value of the deposit.

## 🧮 The Intended Calculation

Let’s say:
 • User deposits 0.001 WBNB.
 • BNB price is $656.
 • So, the deposit is worth:
0.001 * 656 = $0.656

If 1 MBU = 1 USD, the user should receive about 0.656 MBU tokens.

⸻

### ✅ Correct Way to Handle Decimals (Simplified)

Let’s say the oracle returns the price in 18 decimals:

```

uint256 bnbPrice = 656 * 1e18; // 656 * 10^18
```

To calculate the number of tokens to mint (simplified):

```
// Assume userDeposit = 0.001 * 1e18 = 1e15 (since WBNB also uses 18 decimals)
tokensToMint = (userDeposit * bnbPrice) / 1e18;
```

Plug in the numbers:

```
tokensToMint = (1e15 * 656e18) / 1e18 = 656e15 = 0.656 tokens
  ✅ Correct result
```

⸻

### ❌ What Mobius Did Wrong

They multiplied by 1e18 again, like this:

```

tokensToMint = userDeposit * bnbPrice * 1e18;
```

Plug in the numbers:

```
tokensToMint = 1e15 * 656e18 * 1e18 = 656e51 tokens
= 656 * 10^51 tokens
```



This led to trillions of tokens being minted for just $0.67.

⸻

# 🔁 Summary Table

| Step            | Correct Logic                                      | Exploited Logic                                     |
|-----------------|----------------------------------------------------|-----------------------------------------------------|
| Oracle price    | `656 * 1e18`                                       | `656 * 1e18`                                        |
| Deposit value   | `0.001 WBNB = 1e15`                                | `1e15`                                              |
| Tokens minted   | `(1e15 * 656e18) / 1e18 = 656e15`                  | `1e15 * 656e18 * 1e18 = 656e51`                     |
| Final result    | `~0.656 tokens`                                    | `~9.7 trillion tokens`                              |

⸻

# 🧠 Key Lesson

If a price feed already includes decimals (like 1e18), never multiply it again unless you’re normalizing it correctly. Always balance the math by keeping units aligned, like in physics or engineering.

Let me know if you want this in code or diagram form.
