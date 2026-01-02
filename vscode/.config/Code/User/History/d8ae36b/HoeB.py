def swap_by_arith_ops(a: int, b: int) -> None:
    """Swap numbers by arithmetic operations

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    a = a + b
    b = a - b
    a = a - b