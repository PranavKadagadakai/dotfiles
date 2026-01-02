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

if __name__ == "__main__":
    import timeit
    
    N: int = 1_000_000
    
    setup_code = f"""
from __main__ import max_number
N = {N}
lst = list(range(N))
"""
    
    time_custom = timeit.timeit("max_number(list(range(N)))", setup="from __main__ import max_number", number=N)
    time_builtin = timeit.timeit("max(list(range(N)))", number=N)
    
    print(f"Custom max function time: {time_custom}")
    print(f"Built-in max function time: {time_builtin}")
    # print(f"Custom max function is {time_custom / time_builtin:.2f} times slower than built-in max function.")