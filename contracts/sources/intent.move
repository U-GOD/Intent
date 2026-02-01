// SuiIntents: Intent-Based Trading Protocol
// 
// This module defines the core data structures for the intent system.
// An intent represents a user's high-level trading goal that solvers compete to fulfill.

module suiintents::intent {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use std::string::{Self, String};
    use std::type_name::{Self, TypeName};
    
    const E_INTENT_ALREADY_FILLED: u64 = 1;
    const E_INTENT_EXPIRED: u64 = 2;
    const E_INTENT_CANCELLED: u64 = 3;
    const E_NOT_CREATOR: u64 = 4;
    const E_BELOW_MIN_OUTPUT: u64 = 5;
    const E_INVALID_DEADLINE: u64 = 6;
    const E_NOT_PENDING: u64 = 7;
    
    
    const STATUS_PENDING: u8 = 0;
    const STATUS_FILLED: u8 = 1;
    const STATUS_CANCELLED: u8 = 2;
    const STATUS_EXPIRED: u8 = 3;
    
    
    struct Intent<phantom T> has key, store {
        id: UID,
        creator: address,
        input_balance: Balance<T>,
        input_amount: u64,
        output_type: TypeName,
        min_output: u64,
        deadline: u64,
        status: u8,
        auction: DutchAuction,
    }
    
    /// Dutch Auction configuration for price discovery.
    /// 
    /// The auction starts with a favorable rate for the user and gradually
    /// decreases until a solver finds it profitable to fill.
    struct DutchAuction has store, drop {
        start_rate: u64,
        end_rate: u64,
        start_time: u64,
        duration_ms: u64,
    }
    
    /// Solver struct representing a registered solver.
    struct Solver has key, store {
        id: UID,
        owner: address,
        stake: Balance<sui::sui::SUI>,
        reputation: u64,
        total_fills: u64,
        is_active: bool,
    }
    
    struct IntentRegistry has key {
        id: UID,
        total_intents: u64,
        filled_intents: u64,
        min_solver_stake: u64,
    }
    
    struct IntentCreated has copy, drop {
        intent_id: ID,
        creator: address,
        input_type: TypeName,
        input_amount: u64,
        output_type: TypeName,
        min_output: u64,
        start_rate: u64,
        deadline: u64,
    }
    
    struct IntentFilled has copy, drop {
        intent_id: ID,
        solver: address,
        output_amount: u64,
        fill_rate: u64,
    }
    
    struct IntentCancelled has copy, drop {
        intent_id: ID,
    }
    
    struct IntentExpired has copy, drop {
        intent_id: ID,
    }
    
    /// Initialize the intent registry when the module is published.
    /// This creates a shared IntentRegistry object that anyone can access.
    fun init(ctx: &mut TxContext) {
        let registry = IntentRegistry {
            id: object::new(ctx),
            total_intents: 0,
            filled_intents: 0,
            min_solver_stake: 100_000_000_000, // 100 SUI in MIST
        };

        transfer::share_object(registry);
    }
    
    public fun get_current_rate(auction: &DutchAuction, current_time: u64): u64 {
        if (current_time <= auction.start_time) {
            return auction.start_rate
        };
        
        let elapsed = current_time - auction.start_time;
        
        if (elapsed >= auction.duration_ms) {
            return auction.end_rate
        };
        
        // Linear interpolation between start and end rates
        // rate = start_rate - (start_rate - end_rate) * elapsed / duration
        let rate_diff = auction.start_rate - auction.end_rate;
        let decrease = (rate_diff * elapsed) / auction.duration_ms;
        
        auction.start_rate - decrease
    }
    
    public fun is_expired<T>(intent: &Intent<T>, clock: &Clock): bool {
        clock::timestamp_ms(clock) > intent.deadline
    }
    
    public fun is_pending<T>(intent: &Intent<T>): bool {
        intent.status == STATUS_PENDING
    }
    
    public fun get_creator<T>(intent: &Intent<T>): address {
        intent.creator
    }
    
    public fun get_min_output<T>(intent: &Intent<T>): u64 {
        intent.min_output
    }
    
    public fun get_input_amount<T>(intent: &Intent<T>): u64 {
        intent.input_amount
    }
    
    #[test_only]
    public fun create_test_registry(ctx: &mut TxContext): IntentRegistry {
        IntentRegistry {
            id: object::new(ctx),
            total_intents: 0,
            filled_intents: 0,
            min_solver_stake: 100_000_000_000,
        }
    }
}
