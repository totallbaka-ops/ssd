"""Bro"""
import sys
from typing import List
from .factory import SortFunction

def read_input(file_path: str) -> List[int]:
    """this is a doc string """
    with open(file_path, 'r', encoding='utf-8') as file:
        text = file.read().strip()
    if not text:
        return []
    parts = text.split()
    data = []
    for p in parts:
        try:
            num = int(p)
        except ValueError:
            raise ValueError("Input file must contain integers only.")
        if num < -(2**31) or num > (2**31 - 1):
            raise ValueError("All numbers must be within INT32 range.")
        data.append(num)
    return data

def main():
    """this is a doc string """
    if len(sys.argv) < 2:
        print("Usage: python main.py <algorithm_name> [A|D]  (reads input.txt)", file=sys.stderr)
        sys.exit(1)

    algorithm = sys.argv[1]
    order = sys.argv[2] if len(sys.argv) > 2 else 'A'
    a = order != 'D'

    data = read_input("input.txt")
    if len(data) > 2 * 10**5:
        raise ValueError("List size must be less than 2*1e5.")

    sorter = SortFunction.get_sorter(algorithm)
    result = sorter.sort(data, ascd=a)

    print(' '.join(str(x) for x in result))

if __name__ == "__main__":
    main()
