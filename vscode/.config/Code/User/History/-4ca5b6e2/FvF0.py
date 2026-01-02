def is_array_sorted(l: list[int], asc: bool = True) -> bool:
    """Checks if the given array is sorted or not.

    Args:
        l (list[int]): Input array to check if it is sorted.
        asc (bool, optional): If the sorting order to be checked is ascending(True) or descending(False). Defaults to True. 

    Returns:
        bool: Returns True if the array is sorted else returns False.
    """
    if asc:
        for i in range(len(l) - 1):
            if l[i] > l[i + 1]:
                return False
    else:
        for i in range(len(l) - 1):
            if l[i] < l[i + 1]:
                return False
    
    return True


if __name__ == "__main__":
    import timeit
    
    N = 1_000_000
    
    l: list[int] = list(map(int, input("Enter array elements separated by space: ").split(" ")))
    
    print(f"Is array sorted? -> {is_array_sorted(l)}")
    execution_time = timeit.timeit("is_array_sorted(l)", globals=globals(), number=N)
    print(f"Execution time: {execution_time: .6f}")