def count_vowels(s: str) -> int:
    """Count vowels in the String

    Args:
        s (str): Input String

    Returns:
        int: Count of vowels
    """
    vowels: set[str] = set("aeiouAEIOU")
    return sum(char.isalpha() and char in vowels for char in s)

def count_consonants(s: str) -> int:
    """Count consonants in the String

    Args:
        s (str): Input String

    Returns:
        int: Count of consonants
    """
    vowels: set[str] = set("aeiouAEIOU")
    return sum(char.isalpha() and char not in vowels for char in s)

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

def count_char_occurrences(s: str, char=None: str | None) -> dict[str, int] | int:
    """Counts occurrences of a character in a string
    
    Args:
        s (str): Input string
        char (str, optional): Character whose occurrences are to be counted. Defaults to None.

    Returns:
        dict[str, int] | int: Count of occurrences of the character in the string or a dictionary with counts of all characters if char is None
    """
    if not char:
        counts: dict[str, int] = {}
        for ch in s:
            if ch in counts: counts[ch] += 1
        else:
            counts[ch] = 1
            
        return counts
    
    if len(char) != 1:
        raise ValueError("Please provide a single character to count its occurrences.")
    
    return sum(1 for ch in s if ch == char)
    
if __name__ == "__main__":
    import timeit
    s = input("Enter the string to check palindrome: ")
    print(f"Entered string is palindrome? -> {is_palindrome(s)}")
    execution_time = timeit.timeit(lambda: is_palindrome(s), number=1)
    print(f"Execution time: {execution_time} seconds")