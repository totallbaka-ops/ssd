"""module doc"""
from typing import List
from .sortalgo import SortAlgo

class ShellSort(SortAlgo):  # pylint: disable=too-few-public-methods
    """Shell sort algorithm class."""

    def sort(self, data: List[int], ascd: bool = True) -> List[int]:
        """Sort the list using the Shell Sort algorithm.

        Args:
            data (List[int]): Input list of integers.
            ascd (bool): Sort in ascending order (default True).

        Returns:
            List[int]: Sorted list.
        """
        arr = data.copy()
        n = len(arr)
        gap = n // 2

        while gap > 0:
            for i in range(gap, n):
                temp = arr[i]
                j = i

                # For ascending: arr[j - gap] > temp
                # For descending: arr[j - gap] < temp
                while j >= gap and ((arr[j - gap] > temp) == ascd):
                    arr[j] = arr[j - gap]
                    j -= gap

                arr[j] = temp

            gap //= 2

        return arr
