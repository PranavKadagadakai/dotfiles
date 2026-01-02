def remove_duplicates(arr: list[int]) -> list[int]:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list[int]): The input list from which to remove duplicates.

    Returns:
    list[int]: A new list with duplicates removed.
    """
    seen = set()
    result = []
    for item in arr:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

def remove_duplicates(arr: list[int]) -> list[int]:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list[int]): The input list from which to remove duplicates.

    Returns:
    list[int]: A new list with duplicates removed.
    """
    return list(dict.fromkeys(arr))

def remove_duplicates(arr: list[int]) -> list[int]:
    """
    Remove duplicates from a list while maintaining the original order.

    Parameters:
    arr (list[int]): The input list from which to remove duplicates.

    Returns:
    list[int]: A new list with duplicates removed.
    """
    return list(set(arr))