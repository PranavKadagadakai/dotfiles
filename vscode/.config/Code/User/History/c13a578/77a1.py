def even_odd_lists(l: list[int]) -> tuple[list[int], list[int]]:
    """Separates even and odd numbers from a list.

    Args:
        l (list[int]): Input list of integers.

    Returns:
        tuple[list[int], list[int]]: A tuple containing two lists - the first with even numbers and the second with odd numbers.
    """
    even: list[int] = [num for num in l if num % 2 == 0]
    odd: list[int] = [num for num in l if num % 2 != 0]
    return even, odd