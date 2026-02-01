// SuiIntents: Intent-Based Trading Protocol
// This module defines the core data structures for the intent system.

#[allow(unused_const, unused_field)]
module suiintents::intent {
    use sui::clock::{Self, Clock};
    use sui::balance::Balance;
    use sui::coin::{Self, Coin};
    use sui::event;
    use std::type_name::{Self, TypeName};
    
    // Error codes
    const E_INTENT_ALREADY_FILLED: u64 = 1;
    const E_INTENT_EXPIRED: u64 = 2;
    const E_INTENT_CANCELLED: u64 = 3;
    const E_NOT_CREATOR: u64 = 4;
    const E_BELOW_MIN_OUTPUT: u64 = 5;
    const E_INVALID_DEADLINE: u64 = 6;
    const E_NOT_PENDING: u64 = 7;
    
    // Status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_FILLED: u8 = 1;
    const STATUS_CANCELLED: u8 = 2;
    const STATUS_EXPIRED: u8 = 3;
    
    // Main Intent struct - represents a user's trading goal
    public struct Intent<phantom T> has key, store {
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
    
    // Dutch Auction for price discovery
    public struct DutchAuction has store, drop {
        start_rate: u64,
        end_rate: u64,
        start_time: u64,
        duration_ms: u64,
    }
    
    // Solver struct for registered solvers
    public struct Solver has key, store {
        id: UID,
        owner: address,
        stake: Balance<sui::sui::SUI>,
        reputation: u64,
        total_fills: u64,
        is_active: bool,
    }
    
    // Registry to track all intents
    public struct IntentRegistry has key {
        id: UID,
        total_intents: u64,
        filled_intents: u64,
        min_solver_stake: u64,
    }
    
    // Events - emitted for off-chain indexing
    public struct IntentCreated has copy, drop {
        intent_id: ID,
        creator: address,
        input_type: TypeName,
        input_amount: u64,
        output_type: TypeName,
        min_output: u64,
        start_rate: u64,
        deadline: u64,
    }
    
    public struct IntentFilled has copy, drop {
        intent_id: ID,
        solver: address,
        output_amount: u64,
        fill_rate: u64,
    }
    
    public struct IntentCancelled has copy, drop {
        intent_id: ID,
    }
    
    public struct IntentExpired has copy, drop {
        intent_id: ID,
    }
    
    // Initialize the registry when module is published
    fun init(ctx: &mut TxContext) {
        let registry = IntentRegistry {
            id: object::new(ctx),
            total_intents: 0,
            filled_intents: 0,
            min_solver_stake: 100_000_000_000,
        };
        transfer::share_object(registry);
    }
    
    public entry fun create_intent<T, U>(
        registry: &mut IntentRegistry,
        input_coin: Coin<T>,
        min_output: u64,
        start_rate: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let input_amount = coin::value(&input_coin);
        
        let input_balance = coin::into_balance(input_coin);
        
        let current_time = clock::timestamp_ms(clock);
        
        let deadline = current_time + duration_ms;
        
        let auction = DutchAuction {
            start_rate,
            end_rate: min_output,
            start_time: current_time,
            duration_ms,
        };
        
        let creator = tx_context::sender(ctx);
        
        let intent = Intent<T> {
            id: object::new(ctx),
            creator,
            input_balance,
            input_amount,
            output_type: type_name::get<U>(),
            min_output,
            deadline,
            status: STATUS_PENDING,
            auction,
        };
        
        let intent_id = object::id(&intent);
        
        registry.total_intents = registry.total_intents + 1;
        
        event::emit(IntentCreated {
            intent_id,
            creator,
            input_type: type_name::get<T>(),
            input_amount,
            output_type: type_name::get<U>(),
            min_output,
            start_rate,
            deadline,
        });
        
        transfer::share_object(intent);
    }
    
    // Calculate current auction rate based on elapsed time
    public fun get_current_rate(auction: &DutchAuction, current_time: u64): u64 {
        if (current_time <= auction.start_time) {
            return auction.start_rate
        };
        
        let elapsed = current_time - auction.start_time;
        
        if (elapsed >= auction.duration_ms) {
            return auction.end_rate
        };
        
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
    
    public fun get_auction<T>(intent: &Intent<T>): &DutchAuction {
        &intent.auction
    }
    
    public entry fun cancel_intent<T>(
        intent: Intent<T>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(intent.creator == tx_context::sender(ctx), E_NOT_CREATOR);
        assert!(intent.status == STATUS_PENDING, E_NOT_PENDING);
        
        let Intent {
            id,
            creator,
            input_balance,
            input_amount: _,
            output_type: _,
            min_output: _,
            deadline: _,
            status: _,
            auction: _,
        } = intent;
        
        let intent_id = object::uid_to_inner(&id);
        
        object::delete(id);
        
        let refund_coin = coin::from_balance(input_balance, ctx);
        transfer::public_transfer(refund_coin, creator);
        
        event::emit(IntentCancelled { intent_id });
    }
    
    public(package) fun release_escrow<T>(intent: Intent<T>): (ID, address, Balance<T>, u64) {
        let Intent {
            id,
            creator,
            input_balance,
            input_amount,
            output_type: _,
            min_output: _,
            deadline: _,
            status: _,
            auction: _,
        } = intent;
        
        let intent_id = object::uid_to_inner(&id);
        object::delete(id);
        
        (intent_id, creator, input_balance, input_amount)
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
