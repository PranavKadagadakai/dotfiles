def reverse_array(l: list) -> list:
    """Reverses an array

    Args:
        l (list): Input list of integers.

    Returns:
        list: Reversed list of integers.
    """
    start = 0
    end = len(l) - 1
    i: int; j: int = start, end
    while start < end:
        l[i], l[j] = l[j], l[i]
        i += 1
        j -= 1
        
if __name__ == "__main__":
    import timeit
    
    N = 1_000_000
    
    l: list = list(map(int, input("Enter the array values separated by spaces: ")))
    print(f"Reversed Array: {reverse_array(l)}")
    execution_time = timeit.timeit("reverse_array(l)", globals=globals(), number=N)
    print("Execution time: {execution_time: .6f}")