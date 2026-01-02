def swap_by_arith_ops(a: int, b: int) -> None:
    """Swap numbers by arithmetic operations

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    
    a = a + b
    b = a - b
    a = a - b
    
def swap_by_XOR(a: int, b: int) -> None:
    """Swap numbers by XOR operations

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    
    a = a ^ b
    b = a ^ b
    a = a ^ b
    
def swap_by_tuple(a: int, b: int) -> None:
    """Swap numbers by using tuple

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    
    a, b = b, a
    
if __name__ == "__main__":
    import timeit
    
    # Number of times each function is tested
    N = 1_000_000_000

    # Measure execution time for each method
    time_arith = timeit.timeit("swap_by_arith_ops(10, 20)",
                               setup="from __main__ import swap_by_arith_ops",
                               number=N)

    time_xor = timeit.timeit("swap_by_XOR(10, 20)",
                             setup="from __main__ import swap_by_XOR",
                             number=N)

    time_tuple = timeit.timeit("swap_by_tuple(10, 20)",
                               setup="from __main__ import swap_by_tuple",
                               number=N)

    # Display results
    print(f"Execution time for {N:,} swaps:")
    print(f"→ Arithmetic operations: {time_arith:.6f} seconds")
    print(f"→ XOR operations:        {time_xor:.6f} seconds")
    print(f"→ Tuple unpacking:       {time_tuple:.6f} seconds")

    # Determine which method is fastest
    fastest = min(
        (time_arith, "Arithmetic"),
        (time_xor, "XOR"),
        (time_tuple, "Tuple"),
        key=lambda x: x[0]
    )
    print(f"\nFastest method: {fastest[1]} swapping")