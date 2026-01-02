def fibonacci(n: int, list: bool = False) -> int | list[int]:
    """Returns the n-th fibonacci number or a list of fibonacci numbers up to n

    Args:
        n (int): Input number
        list (bool, optional): If True, returns a list of fibonacci numbers up to n. Defaults to False.

    Returns:
        int | list[int]: n-th fibonacci number or a list of fibonacci numbers up to n
    """
    if n <= 0:
        return 0
    elif n == 1 or n == 2:
        return 1
    elif list:
        fib_list: list[int] = [1, 1]
        for _ in range(2, n):
            fib_list.append(fib_list[-1] + fib_list[-2])
        return fib_list
    else:
        a, b = 1, 1
        for _ in range(2, n):
            a, b = b, a + b
        return b
    