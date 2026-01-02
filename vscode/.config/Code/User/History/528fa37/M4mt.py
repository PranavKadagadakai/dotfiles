def count_vowels(s: str) -> int:
    """Count vowels in the String

    Args:
        s (str): Input String

    Returns:
        int: Count of vowels
    """
    vowels = "aeiouAEIOU"
    return sum(1 for char in s if char in vowels)

def count_consonants(s: str) -> int:
    """Count consonants in the String

    Args:
        s (str): Input String

    Returns:
        int: Count of consonants
    """
    consonants = "bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ"
    return sum(1 for char in s if char in consonants)

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
    
def reverse_string(s: str) -> str:
    """Reverses a string

    Args:
        s (str): String taken as input, which is to be reversed

    Returns:
        str: String returned after reversing the input string
    """
    
    return s[::-1]
    
if __name__ == "__main__":
    import timeit
    s = input("Enter the string to check palindrome: ")
    print(f"Entered string is palindrome? -> {is_palindrome(s)}")
    execution_time = timeit.timeit(lambda: is_palindrome(s), number=1)
    print(f"Execution time: {execution_time} seconds")