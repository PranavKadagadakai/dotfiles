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

def reverse_float(f: float) -> float:
    """Reverses a floating point number
    
    Args:
        f (float): Floating point number taken as input, which is to be reversed
        
    Returns:
        float: Floating point number returned after reversing the input floating point number
    """
    
    t: str = str(f)
    f = float(reverse_string(t))
    
    return f