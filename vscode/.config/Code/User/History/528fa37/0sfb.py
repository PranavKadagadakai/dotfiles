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

def reverse_words(s: str) -> str:
    """Reverses the words in a string

    Args:
        s (str): String taken as input, which is to be reversed

    Returns:
        str: String returned after reversing the words in the input string
    """
    
    words: list[str] = s.split()
    words.reverse()
    return ' '.join(words)

def reverse_each_word(s: str) -> str:
    """Reverses each word in a string

    Args:
        s (str): String taken as input, which is to be reversed

    Returns:
        str: String returned after reversing each word in the input string
    """
    
    words: list[str] = s.split()
    reversed_words: list[str] = [word[::-1] for word in words]
    return ' '.join(reversed_words)

def count_char_occurrences(s: str, char: str | None = None, chars: list[str] | None = None) -> dict[str, int] | int | None:
    """Counts occurrences of a character in a string
    
    Args:
        s (str): Input string
        char (str, optional): Character whose occurrences are to be counted. Defaults to None.
        chars (list[str], optional): List of characters whose occurrences are to be counted. Defaults to None.

    Returns:
        dict[str, int] | int: Count of occurrences of the character or characters in the string or a dictionary with counts of all characters if char and chars is None
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
    
def string_length(s: str) -> int:
    """Returns the length of a string

    Args:
        s (str): Input string

    Returns:
        int: Length of the input string
    """
    return sum(1 for _ in s)

def swap_char_case(s: str) -> str:
    """Swaps the character's case.

    Args:
        s (str): Input string.

    Returns:
        str: Returned string after swapping the case.
    """
    l: list[str] = []
    for ch in s:
        if not ch.isalpha(): 
            l.append(ch)
            continue
        if ch.islower():
            l.append(str(ch - 32))
        elif ch.isupper():
            l.append(str(ch + 32))
            
    return l.join("")
    

if __name__ == "__main__":
    import timeit
    s = input("Enter the string to reverse words: ")
    print("Reversing words in the string...")
    print(reverse_words(s))
    execution_time = timeit.timeit(lambda: reverse_words(s), number=1_000_000)
    print(f"Execution time: {execution_time} seconds")
    print("Reversing each word in the string...")
    print(reverse_each_word(s))
    execution_time = timeit.timeit(lambda: reverse_each_word(s), number=1_000_000)
    print(f"Execution time: {execution_time} seconds")