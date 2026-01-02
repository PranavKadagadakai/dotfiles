def swap_by_arith_ops(a: int, b: int) -> None:
    """Swap numbers by arithmetic operations

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    
    a = a + b
    b = a - b
    a = a - b
    
def swap_by_XOR(a: int, b: int) -> None:
    """Swap numbers by XOR operations

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    
    a = a ^ b
    b = a ^ b
    a = a ^ b
    
def swap_by_tuple(a: int, b: int) -> None:
    """Swap numbers by using tuple

    Args:
        a (int): Integer to be swapped
        b (int): Integer to be swapped
    """
    
    a, b = b, a
    
def reverse_int(i: int) -> int:
    """Reverses an integer
    
    Args:
        i (int): Integer taken as input, which is to be reversed
        
    Returns:
        int: Integer returned after reversing the input integer
    """
    
    x = 0
    
    while i:
        x = x * 10 + i % 10
        i //= 10
        
    return x

def reverse_float(f: float) -> float:
    """Reverses a floating point number
    
    Args:
        f (float): Floating point number taken as input, which is to be reversed
        
    Returns:
        float: Floating point number returned after reversing the input floating point number
    """
    
    t: str = str(f)
    f = float(reverse_string(t))
    
    return f

def max_number(l: list) -> int:
    """Return the maximum number in a list.
    Args:
        l (list): List of integers.
    Returns:
        int: The maximum number in the list.
    """
    if not l:
        return None
    if len(l) == 1:
        return l[0]
    
    max = l[0]
    
    for i in range(len(l)):
        if l[i] > max:
            max = l[i]
    
    return max

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
    
def factorial_loop(n: int) -> int:
    """Returns the factorial of a number using loop

    Args:
        n (int): Input number

    Returns:
        int: Factorial of the input number
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    result: int = 1
    for i in range(2, n + 1):
        result *= i
    return result

def factorial_recursion(n: int) -> int:
    """Returns the factorial of a number using recursion

    Args:
        n (int): Input number

    Returns:
        int: Factorial of the input number
    """
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n == 0 or n == 1:
        return 1
    return n * factorial_recursion(n - 1)

def is_prime(n: int) -> bool:
    """Checks if a number is prime

    Args:
        n (int): Input number

    Returns:
        bool: True if the number is prime, False otherwise
    """
    if n <= 1: return False
    else:
        for i in range(2, int(n**0.5) + 1):
            if n % i == 0:
                return False
    
    return True

def sum_of_digits(n: int) -> int:
    """Returns the sum of digits of a number

    Args:
        n (int): Input number

    Returns:
        int: Sum of digits of the input number
    """
    total: int = 0
    while n > 0:
        total += n % 10
        n //= 10

    return total

if __name__ == "__main__":
    import timeit
    N = 1_000_000
    print(timeit.timeit("factorial_loop(10)", globals=globals(), number=N))
    print(timeit.timeit("factorial_recursion(10)", globals=globals(), number=N))