"""module doc"""
from typing import List
from .sortalgo import SortAlgo

class QuickSort(SortAlgo):
    """this is a doc string """
    def sort(self, data: List[int], ascd: bool = True) -> List[int]:
        """this is a doc string """
        arr = data.copy()
        self.quick(arr, 0, len(arr)-1, ascd)
        return arr

    def quick(self, arr: List[int], low: int, high: int, ascd: bool) -> None:
        """this is a doc string """
        if low < high:
            p = self.divide(arr, low, high, ascd)
            self.quick(arr, low, p-1, ascd)
            self.quick(arr, p+1, high, ascd)

    def divide(self, arr: List[int], low: int, high: int, ascd : bool) -> None:
        """ #break in half and sort each half """
        pivot = arr[high]
        i = low - 1
        for j in range(low,high):
            if (arr[j] < pivot) == ascd:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        arr[i+1], arr[high] = arr[high], arr[i+1]
        return i+1
    