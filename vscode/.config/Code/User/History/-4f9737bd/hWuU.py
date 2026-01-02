def reverse_string(s: str) -> str:
    """Reverses a string

    Args:
        s (str): String taken as input, which is to be reversed

    Returns:
        str: String returned after reversing the input string
    """
    
    return s[::-1]

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
    


if __name__ == "__main__":
    choice = int(input("Enter choice:\n1: reverse a string\n2: reverse an integer\n3: reverse a floating point number\n"))
    
    if choice == 1:
        s = input("Enter the string to be reversed: ")
        print(f"Reversed string: {reverse_string(s)}")
    elif choice == 2:
        i = int(input("Enter the integer to be reversed: "))
        print(f"Reversed integer: {reverse_int(i)}")
    elif choice == 3:
        f = float(input("Enter the floating point number to be reversed: "))
        print(f"Reversed floating point number: {reverse_float(f)}")
    else:
        print("Invalid choice!")