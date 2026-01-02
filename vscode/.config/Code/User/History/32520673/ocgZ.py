def remove_duplicates(arr: list) -> list:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list): The input list from which to remove duplicates.

    Returns:
    list: A new list with duplicates removed.
    """
    seen = set()
    result = []
    for item in arr:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result