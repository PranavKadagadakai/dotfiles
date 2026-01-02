def is_array_sorted(l: list[int]) -> bool:
    """Checks if the given array is sorted or not.

    Args:
        l (list[int]): Input array to check if it is sorted.

    Returns:
        bool: Returns True if the array is sorted else returns False.
    """
    for i in range(len(l) - 1):
        if l[i] > l[i + 1]:
            return False