// Program 1: Decision Table Approach for Solving Triangle Problem

/* Design and develop a program in a language of your choice to solve the triangle problem defined as follows:
Accept three integers which are supposed to be the three sides of a triangle and determine
if the three values represent an equilateral triangle, isosceles triangle, scalene triangle,
or they do not form a triangle at all. Assume that the upper limit for the size of any side is 10.
Derive test cases for your program based on boundary-value analysis, execute the test cases and discuss the results. */

#include <stdio.h>
#include <stdlib.h>

int isTriangle(int a, int b, int c)
{
    return ((a + b > c) && (a + c > b) && (b + c > a)) ? 1 : 0;
}

int main()
{
    int a, b, c, isLimitExceed = 0;

    do
    {
        printf("Enter the three sides of the triangle(a, b, c): ");
        scanf("%d %d %d", &a, &b, &c);

        printf("a=%d,\tb=%d,\tc=%d\n", a, b, c);

        if (a >= 1 && a <= 10)
        {
            printf("The triangle is invalid as the upper limit of any side of the triangle is 10.\n");
            isLimitExceed = 1;
        }
        if (b >= 1 && b <= 10)
        {
            printf("The triangle is invalid as the upper limit of any side of the triangle is 10.\n");
            isLimitExceed = 1;
        }
        if (c >= 1 && c <= 10)
        {
            printf("The triangle is invalid as the upper limit of any side of the triangle is 10.\n");
            isLimitExceed = 1;
        }
    } while (isLimitExceed);

    if (!isTriangle(a, b, c))
    {
        printf("The given sides do not form a triangle.\n");
        return 1;
    }
    if (a == b && b == c)
    {
        printf("Equilateral Triangle.\n");
    }
    else if (a == b || b == c || c == a)
    {
        printf("Isosceles Triangle.\n");
    }
    else
    {
        // if (a * a + b * b == c * c || a * a + c * c == b * b || b * b + c * c == a * a)
        // {
        //     printf("Right-angled Triangle.\n");
        // }
        // else
        // {
        //     printf("Scalene Triangle.\n");
        // }

        printf("Scalene Triangle.\n");
    }

    return 0;
}