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
    
    max = l[0]
    
    for i in range(len(l)):
        if l[i] > max:
            max = l[i]
    
    return max

def min_number(l: list) -> int:
    """Return the minimum number in a list.
    Args:
        l (list): List of integers.
    Returns:
        int: The minimum number in the list.
    """
    if not l:
        return None
    if len(l) == 1:
        return l[0]
    
    min = l[0]
    
    for i in range(len(l)):
        if l[i] < min:
            min = l[i]
    
    return min

def fibonacci(n: int, list: bool = False) -> int | list[int]:
    """Returns the n-th fibonacci number or a list of fibonacci numbers up to n

    Args:
        n (int): Input number
        list (bool, optional): If True, returns a list of fibonacci numbers up to n. Defaults to False.

    Returns:
        int | list[int]: n-th fibonacci number or a list of fibonacci numbers up to n
    """
    if n <= 0:
        return 0
    elif n == 1 or n == 2:
        return 1
    elif list:
        fib_list: list[int] = [1, 1]
        for _ in range(2, n):
            fib_list.append(fib_list[-1] + fib_list[-2])
        return fib_list
    else:
        a, b = 1, 1
        for _ in range(2, n):
            a, b = b, a + b
        return b
    