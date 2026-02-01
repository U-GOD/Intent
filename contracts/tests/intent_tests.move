#[test_only]
module suiintents::intent_tests {
    use suiintents::intent::{
        Self,
        IntentRegistry,
        create_test_registry,
        destroy_test_registry,
        get_total_intents,
        get_filled_intents,
        get_min_solver_stake,
    };
    use sui::test_scenario::{Self as ts};
    
    const CREATOR: address = @0xCAFE;
    const SOLVER: address = @0xBEEF;
    
    #[test]
    fun test_registry_initialization() {
        let mut scenario = ts::begin(CREATOR);

        let registry = create_test_registry(ts::ctx(&mut scenario));

        assert!(get_total_intents(&registry) == 0, 0);
        assert!(get_filled_intents(&registry) == 0, 1);
        assert!(get_min_solver_stake(&registry) == 100_000_000_000, 2); // 100 SUI

        destroy_test_registry(registry);
        
        ts::end(scenario);
    }
}
