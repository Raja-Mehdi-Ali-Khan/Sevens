# RULES.md: 4-player Sevens (source of truth)

If code and this file disagree, this file wins. If this file is unclear, ask; do not guess.

## 1. Overview
- Exactly 4 players, one standard 52-card deck, no jokers.
- A game is **7 rounds**. In each round, players race to empty their hand by building each suit outward from its 7.
- The round winner scores 0. Everyone else scores penalty points for the cards left in hand.
- After round 7, the **lowest total wins**. Ties share the win.

## 2. Terms
| Term | Definition |
|---|---|
| Seat | Integer 0 to 3. Fixed for the whole game (assigned in join order). |
| Turn order | Seat 0 -> 1 -> 2 -> 3 -> 0. "The player on your right" is the next seat. |
| Suit codes | `H` hearts, `D` diamonds, `C` clubs, `S` spades |
| Rank | 1 to 13. Ace = 1 (always low), J = 11, Q = 12, K = 13. |
| CardId | `${rank}${suit}`, for example `7H`, `1S` (ace of spades), `13D` (king of diamonds) |
| Run | The contiguous ranks of one suit on the table, stored as `{ low, high }`. |
| Open suit | A suit whose 7 has been played. |

## 3. Round setup
1. Shuffle the full deck using the injected `Rng` (Fisher-Yates), deal 13 cards to each seat.
2. The seat holding `7H` (7 of hearts) takes the first turn. This is true in every round.
3. The table starts empty.

## 4. Turns
### 4.1 Legal moves
- **Empty table (first move of the round):** the only legal card is `7H`.
- **Otherwise,** a card `(suit s, rank r)` is legal if either:
  - `r == 7` and suit `s` is not yet open, or
  - suit `s` is open with run `{ low, high }` and (`r == low - 1` or `r == high + 1`).
- Ranks do not wrap: ace never follows king.
- Playing a card updates the run: a 7 creates `{7,7}`; otherwise `low` or `high` extends by 1.

### 4.2 Forced play and automatic turns
A player must play if they have at least one legal card, and may pass only when they have none. The engine reports one of three **turn plans** for the current seat:

| Legal cards | Turn plan | What happens |
|---|---|---|
| exactly 1 | `auto_play` | That card is played automatically. The player is not asked. |
| 0 | `auto_pass` | The turn is skipped. Everyone is told this seat had no playable card. |
| 2 or more | `await_choice` | The player picks one of their legal cards. The card goes to its position automatically. |

The round's first move (`7H`) is always `auto_play`.

### 4.3 After a turn
- If the player's hand is now empty, the round ends immediately (section 5).
- Otherwise the turn passes to the next seat.

A round cannot deadlock. While any card remains in a hand, at least one seat has a legal card.

### 4.4 Low-card hint
- After a seat finishes its own turn, if it has 1 to 3 cards left and the round is still in progress, record how many of its remaining cards are legal against the table immediately after that turn.
- This value is a snapshot. It is not recomputed when another seat plays or passes, so it can be out of date by design. It updates only after that seat's next turn ends.
- A pass with 1 to 3 cards remaining records 0, because passing is legal only when no card can be played.
- With 4 or more cards remaining, record no hint. If the turn ends the round, clear every hint.
- The hint is only a count. It never reveals which cards are legal.
- Every new round starts with no hints.

## 5. Round end and scoring
- The first player to empty their hand **wins the round and scores 0**.
- Every other player scores the sum of their remaining cards' rank values (A=1, 2 to 10 face value, J=11, Q=12, K=13).
- Round scores are added to each player's running **total**.
- If this was round 7, the game is over (section 6). Otherwise, start the next round from section 3 with a fresh shuffle.

## 6. Game end
After round 7, the seat(s) with the lowest total win. If several seats share the lowest total, all of them win. There is no tiebreaker.

## 7. Visibility
| Information | Visible to |
|---|---|
| Your own hand and which of your cards are playable | You only |
| Table runs, played cards, turn order, each seat's card count, passes, round scores, totals | Everyone |
| Each seat's low-card playable-count snapshot (count only; may be out of date by design) | Everyone |
| Another seat's cards | Nobody (until round scoring, only counts are shown) |

A pass is public by design: everyone learns that seat had no playable card.

## 8. Timing policies (server only, not engine rules)
Defaults, defined as constants in `apps/server/src/config.ts`:
- `AUTO_MOVE_DELAY_MS = 1000`: pause before an automatic play or pass, so players can see it.
- `TURN_TIMEOUT_MS = 30000`: for an `await_choice` turn, on timeout the server plays the legal card with the highest rank.
- `RECONNECT_WINDOW_MS = 60000`: after a disconnect, then a simple bot takes the seat (bot plays the highest-rank legal card).
- `NEXT_ROUND_DELAY_MS = 5000`: pause on the round summary before dealing the next round.

## 9. Out of scope for v1
5-player mode, spectators, accounts, chat, persistence, tiebreakers, custom rule variants.

## 10. Test vectors
**Scoring**
- `scoreHand([13H, 1S])` = 14
- `scoreHand([12D])` = 12
- `scoreHand([])` = 0

**Legality**
- Table `{ H: {7,7}, D: null, C: null, S: null }`, hand `[6H, 8H, 7S, 9D, 5H]` -> legal: `6H`, `8H`, `7S`. Not legal: `9D` (diamonds not open), `5H` (not adjacent).
- Table `{ D: {2,9} }` -> `1D` and `10D` are legal; `13D` is not.
- Table `{ S: {1,13} }` -> no further spade is legal.
- Empty table, seat holds `7H` -> legal is exactly `[7H]`; any other seat has no legal card.

**Turn plans**
- 1 legal card -> `auto_play`; 0 -> `auto_pass`; 3 legal cards -> `await_choice` with those 3.

**Low-card hints**
- Table `{ H: {7,7} }`, seat 1 holds `[6H, 8H, 13S, 2D]` and plays `6H` -> remaining `[8H, 13S, 2D]`, hint `1` (`8H` is legal; `13S` and `2D` are not).
- Stale snapshot: table `{ H: {7,7}, D: {7,7} }`, seat 1 holds `[6H, 2D, 13S, 9D]` and plays `6H` -> hint `0` (`9D` needs `8D` first). Seat 2 then plays `8D`; seat 1's hint remains `0` although a live count would now be `1`. At seat 1's next turn it auto-plays `9D`; remaining `[2D, 13S]` -> recomputed hint `0`.
- A seat with 4 or more cards after its turn -> no hint (`null`).
- A pass with 2 cards left -> hint `0`.
- Starting a new round -> all hints are `null`.

**Invariants (must hold after every move in every test)**
- Hands plus table always contain exactly 52 unique cards.
- Each hand starts a round with 13 cards.
- Exactly one seat has an empty hand when a round ends, and that seat's round score is 0.
- Totals equal the sum of that seat's round scores so far.
