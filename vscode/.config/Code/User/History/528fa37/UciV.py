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