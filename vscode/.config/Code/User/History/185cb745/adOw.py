def max_number(l: list) -> int:
    """Return the maximum number in a list.
    Args:
        l (list): List of integers.
    Returns:
        int: The maximum number in the list.
    """
    if not l:
        return None
    if len(l) == 1:
        return l[0]
    
    max = -1
    
    for i in range(1, len(l)):
        if l[i] > max:
            max = l[i]
    
    return max