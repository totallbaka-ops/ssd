import random
from src.factory import sort_function

sorts = ['bubble', 'selection', 'quick', 'merge']


def generate_random_list(size: int):
    return [random.randint(-(2**31), 2**31 - 1) for _ in range(size)]


def test_correctness_small():
    data = [5, 2, 9, 1, 5, 6]
    print(f"\ntest_small-------------->                  1\n")
    for name in sorts:
        sorter = sort_function.get_sorter(name)
        asc = sorter.sort(data, ascd=True)
        desc = sorter.sort(data, ascd=False)

       # print(f"{asc}\n{desc}")
        print(f"{name} sort: asc = {'T' if asc == sorted(data) else 'F'}")
        print(f"{name} sort: desc = {'T' if desc == sorted(data, reverse=True) else 'F'}")

        assert asc == sorted(data)
        assert desc == sorted(data, reverse=True)


def test_empty_and_single():
    print(f"\ntest_empty_and_single-------------->       2\n")
    for name in sorts:
        sorter = sort_function.get_sorter(name)

        #print(f"\ntest_empty_and_single\n")
        print(f"{name} sort: asc = {'T' if sorter.sort([], ascd=True) == [] else 'F'}")
        print(f"{name} sort: desc = {'T' if sorter.sort([1], ascd=True) == [1] else 'F'}")

        assert sorter.sort([], ascd=True) == []
        assert sorter.sort([1], ascd=True) == [1]


def test_random():
    data = generate_random_list(100)
    print(f"\ntest_random 100-------------->             3\n")
    for name in sorts:
        sorter = sort_function.get_sorter(name)
        asc = sorter.sort(data, ascd=True)
        desc = sorter.sort(data, ascd=False)

       # print(f"\ntest_random 100\n")
        print(f"{name} sort: asc = {'T' if asc == sorted(data) else 'F'}")
        print(f"{name} sort: desc = {'T' if desc == sorted(data, reverse=True) else 'F'}")

        assert asc == sorted(data)
        assert desc == sorted(data, reverse=True)