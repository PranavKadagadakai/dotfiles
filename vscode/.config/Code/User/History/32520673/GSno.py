def remove_duplicates_loop(arr: list[int]) -> list[int]:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list[int]): The input list from which to remove duplicates.

    Returns:
    list[int]: A new list with duplicates removed.
    """
    seen = set()
    result = [seen.add(item) and item for item in arr if item not in seen]
    return result

def remove_duplicates_dict(arr: list[int]) -> list[int]:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list[int]): The input list from which to remove duplicates.

    Returns:
    list[int]: A new list with duplicates removed.
    """
    return list(dict.fromkeys(arr))

def remove_duplicates_set(arr: list[int]) -> list[int]:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list[int]): The input list from which to remove duplicates.

    Returns:
    list[int]: A new list with duplicates removed.
    """
    return list(set(arr))

if __name__ == "__main__":
    import timeit
    arr = list(map(int, input("Enter the list of numbers (space-separated): ").split()))
    
    N = 1_000_000
    
    print("Using set and loop:")
    print(remove_duplicates_loop(arr))
    print("Execution time:", timeit.timeit(lambda: remove_duplicates_loop(arr), number=N))

    print("\nUsing dict.fromkeys:")
    print(remove_duplicates_dict(arr))
    print("Execution time:", timeit.timeit(lambda: remove_duplicates_dict(arr), number=N))

    print("\nUsing set:")
    print(remove_duplicates_set(arr))
    print("Execution time:", timeit.timeit(lambda: remove_duplicates_set(arr), number=N))