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

def count_char_occurrences(s: str, char: str | None = None, chars: list[str] | None = None) -> dict[str, int] | int | None:
    """Counts occurrences of a character in a string
    
    Args:
        s (str): Input string
        char (str, optional): Character whose occurrences are to be counted. Defaults to None.

    Returns:
        dict[str, int] | int: Count of occurrences of the character in the string or a dictionary with counts of all characters if char is None
    """
    counts: dict[str, int] = {}
    for ch in s:
        counts[ch] = counts.get(ch, 0) + 1
            
    if char is not None:
        if not isinstance(char, str):
            raise TypeError("Character must be a string.")
        if len(char) != 1:
            raise ValueError("Please provide a single character to count its occurrences.")
        return counts.get(char, 0)
        
    if chars is not None:
        if not all(isinstance(c, str) and len(c) == 1 for c in chars):
            raise ValueError("All items in 'chars' must be single-character strings.")
        result: dict[str, int] = {}
        for ch in chars:
            result[ch] = counts.get(ch, 0)
        return result
    
    return counts
    
    
    
if __name__ == "__main__":
    import timeit
    s = input("Enter the string to count character occurrences: ")
    char = input("Enter the character to count (leave blank for all characters): ") or None
    chars_input = input("Enter multiple characters to count (leave blank for all characters): ").strip()
    chars = list(set(chars_input)) if chars_input else None
    print(count_char_occurrences(s, char=char, chars=chars))
    execution_time = timeit.timeit(lambda: count_char_occurrences(s, char=char, chars=chars), number=1_000_000)
    print(f"Execution time: {execution_time} seconds")