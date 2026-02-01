// Solver Registry module for SuiIntents
// Manages solver registration, staking, and reputation

module suiintents::solver_registry {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    
    const E_INSUFFICIENT_STAKE: u64 = 100;
    const E_NOT_OWNER: u64 = 101;
    const E_SOLVER_NOT_ACTIVE: u64 = 102;
    const E_CANNOT_WITHDRAW_LOCKED: u64 = 103;
    
    // Minimum stake required to register as solver (100 SUI)
    const MIN_STAKE: u64 = 100_000_000_000;
    
    public struct Solver has key, store {
        id: UID,
        owner: address,
        stake: Balance<SUI>,
        reputation: u64,
        total_fills: u64,
        successful_fills: u64,
        is_active: bool,
    }
    
    public struct SolverRegistered has copy, drop {
        solver_id: ID,
        owner: address,
        stake_amount: u64,
    }
    
    public struct SolverStakeUpdated has copy, drop {
        solver_id: ID,
        new_stake: u64,
    }
    
    public struct SolverSlashed has copy, drop {
        solver_id: ID,
        slash_amount: u64,
        reason: u64,
    }
    
    // Register as a new solver with stake
    public entry fun register(
        stake: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        let stake_amount = coin::value(&stake);
        assert!(stake_amount >= MIN_STAKE, E_INSUFFICIENT_STAKE);
        
        let solver = Solver {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            stake: coin::into_balance(stake),
            reputation: 100, // Start with base reputation
            total_fills: 0,
            successful_fills: 0,
            is_active: true,
        };
        
        let solver_id = object::id(&solver);
        
        event::emit(SolverRegistered {
            solver_id,
            owner: tx_context::sender(ctx),
            stake_amount,
        });
        
        transfer::share_object(solver);
    }
    
    // Add more stake to an existing solver
    public entry fun increase_stake(
        solver: &mut Solver,
        additional_stake: Coin<SUI>,
        ctx: &TxContext,
    ) {
        assert!(solver.owner == tx_context::sender(ctx), E_NOT_OWNER);
        
        balance::join(&mut solver.stake, coin::into_balance(additional_stake));
        
        event::emit(SolverStakeUpdated {
            solver_id: object::id(solver),
            new_stake: balance::value(&solver.stake),
        });
    }
    
    // Withdraw stake (only if solver is not active in any fills)
    public entry fun withdraw_stake(
        solver: &mut Solver,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(solver.owner == tx_context::sender(ctx), E_NOT_OWNER);
        
        let remaining = balance::value(&solver.stake) - amount;
        assert!(remaining >= MIN_STAKE || !solver.is_active, E_CANNOT_WITHDRAW_LOCKED);
        
        let withdrawn = balance::split(&mut solver.stake, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, solver.owner);
        
        event::emit(SolverStakeUpdated {
            solver_id: object::id(solver),
            new_stake: balance::value(&solver.stake),
        });
    }
    
    // Deactivate solver
    public entry fun deactivate(
        solver: &mut Solver,
        ctx: &TxContext,
    ) {
        assert!(solver.owner == tx_context::sender(ctx), E_NOT_OWNER);
        solver.is_active = false;
    }
    
    // Reactivate solver
    public entry fun reactivate(
        solver: &mut Solver,
        ctx: &TxContext,
    ) {
        assert!(solver.owner == tx_context::sender(ctx), E_NOT_OWNER);
        assert!(balance::value(&solver.stake) >= MIN_STAKE, E_INSUFFICIENT_STAKE);
        solver.is_active = true;
    }
    
    // Record a successful fill (called by intent module)
    public(package) fun record_fill(solver: &mut Solver, success: bool) {
        solver.total_fills = solver.total_fills + 1;
        if (success) {
            solver.successful_fills = solver.successful_fills + 1;
            
            solver.reputation = solver.reputation + 1;
        };
    }
    
    // Slash solver stake for bad behavior
    public(package) fun slash(solver: &mut Solver, amount: u64, reason: u64): Balance<SUI> {
        let slash_amount = if (amount > balance::value(&solver.stake)) {
            balance::value(&solver.stake)
        } else {
            amount
        };
        
        event::emit(SolverSlashed {
            solver_id: object::id(solver),
            slash_amount,
            reason,
        });
        
        balance::split(&mut solver.stake, slash_amount)
    }
    
    // Getters
    public fun owner(solver: &Solver): address { solver.owner }
    public fun stake_amount(solver: &Solver): u64 { balance::value(&solver.stake) }
    public fun reputation(solver: &Solver): u64 { solver.reputation }
    public fun total_fills(solver: &Solver): u64 { solver.total_fills }
    public fun successful_fills(solver: &Solver): u64 { solver.successful_fills }
    public fun is_active(solver: &Solver): bool { solver.is_active }
    public fun min_stake(): u64 { MIN_STAKE }
    
    // Check if solver has sufficient stake
    public fun has_sufficient_stake(solver: &Solver): bool {
        balance::value(&solver.stake) >= MIN_STAKE && solver.is_active
    }
    
    #[test_only]
    public fun create_for_testing(stake: Coin<SUI>, ctx: &mut TxContext): Solver {
        Solver {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            stake: coin::into_balance(stake),
            reputation: 100,
            total_fills: 0,
            successful_fills: 0,
            is_active: true,
        }
    }
    
    #[test_only]
    public fun destroy_for_testing(solver: Solver) {
        let Solver { 
            id, 
            owner: _, 
            stake, 
            reputation: _, 
            total_fills: _, 
            successful_fills: _, 
            is_active: _ 
        } = solver;
        object::delete(id);
        balance::destroy_for_testing(stake);
    }
}
