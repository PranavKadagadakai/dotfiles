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