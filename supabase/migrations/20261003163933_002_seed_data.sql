/*
# LabTrack AI - Seed Default Data

## Overview
Seeds default achievements, AI note templates, and sample data for demo purposes.

## Data Inserted
1. 8 default achievements (First Program, 5/10 Programs, First Quiz, Perfect Quiz, 7-Day Streak, Notebook Completed, etc.)
2. AI note templates for common programming topics (arrays, loops, functions, pointers, recursion, sorting, structures)
*/

-- ===================== ACHIEVEMENTS =====================
INSERT INTO achievements (name, description, icon, criteria, points) VALUES
('First Program', 'Complete your first program', 'check-circle', '{"type":"programs_completed","count":1}', 10),
('5 Programs Completed', 'Complete 5 programs', 'check-circle-2', '{"type":"programs_completed","count":5}', 25),
('10 Programs Completed', 'Complete 10 programs', 'award', '{"type":"programs_completed","count":10}', 50),
('First Quiz', 'Attempt your first quiz', 'brain', '{"type":"quizzes_attempted","count":1}', 10),
('Perfect Quiz', 'Score 100% on a quiz', 'sparkles', '{"type":"perfect_quiz","count":1}', 30),
('7 Day Streak', 'Maintain a 7-day coding streak', 'flame', '{"type":"streak","count":7}', 40),
('Practical Notebook Completed', 'Complete your practical notebook', 'book-open', '{"type":"notebook_completed","count":1}', 50),
('Helping Hand', 'Have a help request answered', 'heart', '{"type":"help_answered","count":1}', 10)
ON CONFLICT DO NOTHING;

-- ===================== AI NOTE TEMPLATES =====================
INSERT INTO ai_note_templates (topic, language, aim, theory, algorithm, explanation, viva_questions) VALUES
('Arrays', 'C',
'Write a C program to declare, initialize, and display a one-dimensional array.',
'An array is a collection of elements of the same data type stored in contiguous memory locations. Arrays allow efficient access to elements using an index. The first element is at index 0, and the last element is at index n-1 where n is the size of the array. Arrays are widely used in programs that require storing and processing multiple values of the same type.',
'1. Start the program.\n2. Declare an array of size n.\n3. Read n values into the array using a loop.\n4. Display the array elements using a loop.\n5. Stop the program.',
'The program demonstrates basic array operations. We declare an integer array, populate it with values from the user, and then print all values. This shows indexed access, sequential traversal, and the relationship between memory layout and array indexing.',
'["What is an array?","How is an array stored in memory?","What is the index of the first element in an array?","What is the difference between an array and a linked list?","Can we change the size of an array at runtime in C?"]'
),
('Loops', 'C',
'Write a C program to demonstrate the use of for, while, and do-while loops.',
'Loops are control structures that allow repeated execution of a block of code. C provides three loop types: for loop (counter-controlled), while loop (pre-test condition), and do-while loop (post-test condition). Loops are essential for iterating over arrays, processing repeated calculations, and implementing algorithms that require multiple passes.',
'1. Start the program.\n2. Use a for loop to iterate from 1 to 5 and print each number.\n3. Use a while loop to count down from 5 to 1.\n4. Use a do-while loop to print numbers 1 to 5.\n5. Stop the program.',
'The program demonstrates all three loop constructs in C. The for loop is used when the number of iterations is known. The while loop checks the condition before executing the body. The do-while loop executes the body at least once before checking the condition.',
'["What is the difference between while and do-while loops?","When should you use a for loop instead of a while loop?","Can a while loop execute zero times?","Can a do-while loop execute zero times?","What is an infinite loop?"]'
),
('Functions', 'C',
'Write a C program to demonstrate function declaration, definition, and calling.',
'A function is a self-contained block of code that performs a specific task. Functions promote code reusability, modularity, and readability. A function has three components: declaration (prototype), definition (body), and call (invocation). Functions can accept parameters and return values. C supports both call by value and call by reference (using pointers).',
'1. Start the program.\n2. Declare a function add(int, int) returning int.\n3. Define the function to return the sum of two numbers.\n4. In main(), call add() with two arguments.\n5. Print the result.\n6. Stop the program.',
'The program defines a function add() that takes two integer parameters and returns their sum. The main() function calls add() and prints the result. This demonstrates function declaration, definition, parameter passing, and return values.',
'["What is a function prototype?","What is the difference between call by value and call by reference?","What is a recursive function?","Can a function return multiple values in C?","What is the purpose of return type in a function?"]'
),
('Pointers', 'C',
'Write a C program to demonstrate the use of pointers to access and modify variables.',
'A pointer is a variable that stores the memory address of another variable. Pointers are one of the most powerful features of C, enabling dynamic memory allocation, call by reference, and efficient array handling. The & operator gives the address of a variable, and the * operator dereferences a pointer to access the value at that address.',
'1. Start the program.\n2. Declare an integer variable and a pointer to integer.\n3. Assign the address of the variable to the pointer using &.\n4. Access the value using * operator.\n5. Modify the value through the pointer.\n6. Print the values before and after modification.\n7. Stop the program.',
'The program demonstrates pointer basics. We declare an integer variable and a pointer, link them using the address-of operator, and then use the dereference operator to both read and modify the variable''s value through the pointer. This illustrates the direct relationship between pointers and memory addresses.',
'["What is a pointer?","What is the difference between & and * operators?","What is a null pointer?","What is pointer arithmetic?","What is a dangling pointer?"]'
),
('Recursion', 'C',
'Write a C program to calculate the factorial of a number using recursion.',
'Recursion is a technique where a function calls itself to solve a smaller instance of the same problem. Every recursive function must have a base case (stopping condition) to prevent infinite recursion. Recursion is particularly useful for problems that can be broken down into smaller, self-similar subproblems such as factorial, Fibonacci, tree traversal, and divide-and-conquer algorithms.',
'1. Start the program.\n2. Define a recursive function factorial(n).\n3. Base case: if n is 0 or 1, return 1.\n4. Recursive case: return n * factorial(n-1).\n5. In main(), read a number and call factorial().\n6. Print the result.\n7. Stop the program.',
'The program calculates factorial using recursion. The factorial function calls itself with n-1 until it reaches the base case of n=0 or n=1. Each recursive call adds to the call stack, and the results are multiplied as the stack unwinds. This demonstrates the principle of breaking a problem into smaller self-similar subproblems.',
'["What is recursion?","What is a base case in recursion?","What is the difference between recursion and iteration?","What is tail recursion?","What happens if there is no base case in a recursive function?"]'
),
('Sorting', 'C',
'Write a C program to sort an array using Bubble Sort.',
'Sorting is the process of arranging elements in a specific order (ascending or descending). Bubble Sort is a simple comparison-based sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The algorithm gets its name because smaller elements "bubble" to the top. Bubble Sort has a time complexity of O(n²) in the worst case.',
'1. Start the program.\n2. Read n elements into an array.\n3. For i = 0 to n-1:\n   a. For j = 0 to n-i-2:\n      i. If array[j] > array[j+1], swap them.\n4. Print the sorted array.\n5. Stop the program.',
'The program implements Bubble Sort. It compares adjacent elements and swaps them if they are in the wrong order. After each pass, the largest unsorted element is placed at its correct position. The process repeats until the entire array is sorted. This demonstrates a fundamental sorting algorithm and the concept of comparison-based sorting.',
'["What is Bubble Sort?","What is the time complexity of Bubble Sort?","What is the best case time complexity of Bubble Sort?","Is Bubble Sort stable?","What is the difference between Bubble Sort and Selection Sort?"]'
),
('Structures', 'C',
'Write a C program to demonstrate the use of structures to store and display student information.',
'A structure is a user-defined data type that groups related variables of different data types under a single name. Structures are used to represent records such as student information, employee details, or product specifications. Each member of a structure can be of a different data type. Structures are accessed using the dot operator (.) for direct access or arrow operator (->) for pointer access.',
'1. Start the program.\n2. Define a structure student with members: name, roll_no, marks.\n3. Declare a structure variable.\n4. Read student details from the user.\n5. Display the student information.\n6. Stop the program.',
'The program demonstrates C structures. We define a student structure with name, roll number, and marks, then create a variable of that type, populate it with user input, and display the information. This shows how structures group related data of different types into a single logical unit.',
'["What is a structure in C?","What is the difference between a structure and an array?","How do you access structure members?","What is a nested structure?","Can a structure contain a pointer to itself?"]'
)
ON CONFLICT DO NOTHING;