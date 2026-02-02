// DeepBook Adapter for SuiIntents
// Helper functions for DeepBook integration

#[allow(unused_const)]
module suiintents::deepbook_adapter {
    
    const BPS_DENOMINATOR: u64 = 10000; // 100% in basis points
    
    // Default slippage: 50 bps = 0.5%
    const DEFAULT_SLIPPAGE_BPS: u64 = 50;
    
    public fun calculate_min_output(expected_output: u64, slippage_bps: u64): u64 {
        expected_output - (expected_output * slippage_bps / BPS_DENOMINATOR)
    }
    
    public fun calculate_expected_output(input_amount: u64, rate_bps: u64): u64 {
        (input_amount * rate_bps) / BPS_DENOMINATOR
    }
    
    public fun meets_min_output(actual_output: u64, min_output: u64): bool {
        actual_output >= min_output
    }
    
    public fun default_slippage(): u64 {
        DEFAULT_SLIPPAGE_BPS
    }
    
    #[test]
    fun test_calculate_min_output() {
        assert!(calculate_min_output(1000, 100) == 990, 0);
        assert!(calculate_min_output(1000, 50) == 995, 1);
        assert!(calculate_min_output(10000, 200) == 9800, 2);
    }
    
    #[test]
    fun test_calculate_expected_output() {
        assert!(calculate_expected_output(1000, 10000) == 1000, 0);
        assert!(calculate_expected_output(1000, 9500) == 950, 1);
        assert!(calculate_expected_output(1000, 10500) == 1050, 2);
    }
}
