def reverse_string(s: str) -> str:
    """Reverses a string

    Args:
        s (str): String taken as input, which is to be reversed

    Returns:
        str: String returned after reversing the input string
    """
    
    return s[::-1]

def reverse_int(i: int) -> int:
    """Reverses an integer
    
    Args:
        i (int): Integer taken as input, which is to be reversed
        
    Returns:
        int: Integer returned after reversing the input integer
    """
    
    x = 0
    
    while i:
        x = x * 10 + i % 10
        i //= 10
        
    return x