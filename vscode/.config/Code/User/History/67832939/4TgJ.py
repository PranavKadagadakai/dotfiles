import timeit

def is_palindrome(s: str) -> bool:
    """Checks if a string is a palindrome

    Args:
        s (str): Input sting to be checked if a palindrome

    Returns:
        bool: Returns true if the input string is a palindrome
    """
    if s.lower() == s[::-1].lower():
        return True
    else:
        return False
    
if __name__ == "__main__":
    s = input("Enter the string to check palindrome: ")
    print(f"Entered string is palindrome? -> {is_palindrome(s)}")
    execution_time = timeit.timeit(lambda: is_palindrome(s), number=1)
    print(f"Execution time: {execution_time} seconds")