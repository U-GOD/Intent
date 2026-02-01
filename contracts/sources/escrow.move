// Escrow module for SuiIntents
// Handles secure token custody for intents

module suiintents::escrow {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    
    // Escrow struct holds tokens locked for an intent
    public struct Escrow<phantom T> has store {
        balance: Balance<T>,
        owner: address,
    }
    
    // Create a new escrow from a coin
    public fun create<T>(coin: Coin<T>, owner: address): Escrow<T> {
        Escrow {
            balance: coin::into_balance(coin),
            owner,
        }
    }
    
    // Create escrow from existing balance
    public fun from_balance<T>(balance: Balance<T>, owner: address): Escrow<T> {
        Escrow {
            balance,
            owner,
        }
    }
    
    // Get the amount held in escrow
    public fun value<T>(escrow: &Escrow<T>): u64 {
        balance::value(&escrow.balance)
    }
    
    // Get the owner of the escrow
    public fun owner<T>(escrow: &Escrow<T>): address {
        escrow.owner
    }
    
    // Release escrow to a recipient (consumes the escrow)
    public fun release<T>(escrow: Escrow<T>, ctx: &mut TxContext): Coin<T> {
        let Escrow { balance, owner: _ } = escrow;
        coin::from_balance(balance, ctx)
    }
    
    // Release escrow balance directly (for internal use)
    public fun release_balance<T>(escrow: Escrow<T>): Balance<T> {
        let Escrow { balance, owner: _ } = escrow;
        balance
    }
    
    // Refund escrow back to owner
    public fun refund<T>(escrow: Escrow<T>, ctx: &mut TxContext) {
        let Escrow { balance, owner } = escrow;
        let coin = coin::from_balance(balance, ctx);
        transfer::public_transfer(coin, owner);
    }
    
    #[test_only]
    public fun create_for_testing<T>(coin: Coin<T>, owner: address): Escrow<T> {
        create(coin, owner)
    }
    
    #[test_only]
    public fun destroy_for_testing<T>(escrow: Escrow<T>): Balance<T> {
        release_balance(escrow)
    }
}
