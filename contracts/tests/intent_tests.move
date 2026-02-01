#[test_only]
module suiintents::intent_tests {
    use suiintents::intent;
    
    const CREATOR: address = @0xCAFE;
    const SOLVER: address = @0xBEEF;
    
    #[test]
    fun test_module_compiles() {
        assert!(true, 0);
    }
}
