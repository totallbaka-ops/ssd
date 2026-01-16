"""module doc"""
from typing import List
from .sortalgo import SortAlgo

class SelectionSort(SortAlgo):# pylint: disable=too-few-public-methods
    def sort(self, data: List[int], ascd: bool = True) -> List[int]:
        """this is a doc string """
        arr = data.copy()
        n = len(arr)
        for i in range(n):
            idx = i
            for j in range(i+1, n):
                if (arr[j] < arr[idx]) == ascd:
                    idx = j
            arr[i], arr[idx] = arr[idx], arr[i]
        return arr
