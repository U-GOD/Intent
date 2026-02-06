// Intent Registry module for SuiIntents
// Core module managing intent lifecycle

#[allow(unused_const, unused_field)]
module suiintents::intent {
    use sui::clock::{Self, Clock};
    use sui::balance::Balance;
    use sui::coin::{Self, Coin};
    use sui::event;
    use std::type_name::{Self, TypeName};
    use suiintents::dutch_auction::{Self, DutchAuction};
    
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
    
    // Registry to track all intents
    public struct IntentRegistry has key, store {
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
        start_amount: u64,
        deadline: u64,
    }
    
    public struct IntentFilled has copy, drop {
        intent_id: ID,
        solver: address,
        output_amount: u64,
        fill_amount: u64,
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
    
    // Create a new intent
    public entry fun create_intent<T, U>(
        registry: &mut IntentRegistry,
        input_coin: Coin<T>,
        start_amount: u64,
        end_amount: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let input_amount = coin::value(&input_coin);
        let input_balance = coin::into_balance(input_coin);
        let current_time = clock::timestamp_ms(clock);
        let deadline = current_time + duration_ms;
        
        // Create Dutch Auction using the module
        let auction = dutch_auction::new(
            start_amount,
            end_amount,
            current_time,
            duration_ms,
        );
        
        let creator = tx_context::sender(ctx);
        
        let intent = Intent<T> {
            id: object::new(ctx),
            creator,
            input_balance,
            input_amount,
            output_type: type_name::get<U>(),
            min_output: end_amount, // Min output is the auction end price
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
            min_output: end_amount,
            start_amount,
            deadline,
        });
        
        transfer::share_object(intent);
    }
    
    // Solver fills an intent by providing the output tokens
    public entry fun fill_intent<T, U>(
        registry: &mut IntentRegistry,
        intent: Intent<T>,
        output_coin: Coin<U>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let current_time = clock::timestamp_ms(clock);
        let solver = tx_context::sender(ctx);
        
        assert!(intent.status == STATUS_PENDING, E_NOT_PENDING);
        assert!(current_time <= intent.deadline, E_INTENT_EXPIRED);
        
        // Calculate required output based on current auction price
        let required_output = dutch_auction::get_current_price(
            &intent.auction, 
            current_time
        );
        
        let output_amount = coin::value(&output_coin);
        
        // CRITICAL FIX: Assert output meets the CURRENT auction price, not just min_output
        assert!(output_amount >= required_output, E_BELOW_MIN_OUTPUT);
        
        // Also implicitly satisfies min_output since required >= end_amount (min_output)
        
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
        
        let input_coin = coin::from_balance(input_balance, ctx);
        transfer::public_transfer(input_coin, solver);
        transfer::public_transfer(output_coin, creator);
        
        registry.filled_intents = registry.filled_intents + 1;
        
        event::emit(IntentFilled {
            intent_id,
            solver,
            output_amount,
            fill_amount: required_output, // Log the required amount at fill time
        });
    }
    
    // Cancel an intent and refund tokens to creator
    public entry fun cancel_intent<T>(
        intent: Intent<T>,
        _clock: &Clock,
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
    
    // Release escrow (package internal)
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
    
    // Intent getters
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
    
    // Registry getters
    public fun get_total_intents(registry: &IntentRegistry): u64 {
        registry.total_intents
    }
    
    public fun get_filled_intents(registry: &IntentRegistry): u64 {
        registry.filled_intents
    }
    
    public fun get_min_solver_stake(registry: &IntentRegistry): u64 {
        registry.min_solver_stake
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
    
    #[test_only]
    public fun destroy_test_registry(registry: IntentRegistry) {
        let IntentRegistry { id, total_intents: _, filled_intents: _, min_solver_stake: _ } = registry;
        object::delete(id);
    }
    
    #[test_only]
    public fun create_test_auction(
        start_rate: u64,
        end_rate: u64,
        start_time: u64,
        duration_ms: u64,
    ): DutchAuction {
        dutch_auction::create_for_testing(start_rate, end_rate, start_time, duration_ms)
    }
}
