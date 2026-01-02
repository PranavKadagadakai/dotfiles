def reverse_array_loop(l: list) -> list:
    """Reverses an array

    Args:
        l (list): Input list of integers.

    Returns:
        list: Reversed list of integers.
    """
    i: int; j: int = 0, len(l) - 1
    while i < j:
        l[i], l[j] = l[j], l[i]
        i += 1
        j -= 1
        
    return l

def reverse_array(l: list) -> list:
    """Reverses an array

    Args:
        l (list): Input list of integers.

    Returns:
        list: Reversed list of integers.
    """
    return l[::-1]

        
if __name__ == "__main__":
    import timeit
    
    N = 1_000_000
    
    l: list = list(map(int, input("Enter the array values separated by spaces: ")))
    print(f"Reversed Array by loop: {reverse_array_loop(l[:])}")
    execution_time = timeit.timeit("reverse_array_loop(l[:])", globals=globals(), number=N)
    print(f"Execution time: {execution_time: .6f}")
    print(f"Reversed Array: {reverse_array(l[:])}")
    execution_time = timeit.timeit("reverse_array(l[:])", globals=globals(), number=N)
    print(f"Execution time: {execution_time: .6f}")