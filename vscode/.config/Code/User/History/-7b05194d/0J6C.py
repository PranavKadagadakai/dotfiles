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

if __name__ == "__main__":
    import timeit
    
    N: int = 1_000_000
    
    setup_code = f"""
from __main__ import min_number
N = {N}
lst = list(range(100))
"""
    
    time_custom = timeit.timeit("min_number(lst)", setup=setup_code, number=N)
    time_builtin = timeit.timeit("min(lst)", setup=setup_code, number=N)
    
    print(f"Custom min function time: {time_custom}")
    print(f"Built-in min function time: {time_builtin}")
    # print(f"Custom min function is {time_custom / time_builtin:.2f} times slower than built-in min function.")