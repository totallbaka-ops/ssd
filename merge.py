"""goof"""
from typing import List
from .sortalgo import SortAlgo

# M-ER-GE _SO-RT
class MergeSort(SortAlgo):
    """this is a doc string """
    def sort(self, data: List[int], ascd: bool = True)-> List[int]:
        """this is a doc string """
        arr = data.copy()
        return self.mesort(arr, ascd)

    def mesort(self, arr: List[int], aced:bool) -> List[int]:
        """this is a doc string """
        if len(arr) <= 1:
            return arr
        mid = len(arr) // 2 #select a pivot point make two groups and then divide and CONQURE
        left = self.mesort(arr[:mid], aced)
        right = self.mesort(arr[mid:], aced)
        return self.group(left, right, aced)

    def group(self, left: List[int], right: List[int], aced:bool) -> List[int]:
        """this is a doc string """
        merged = []
        i = j = 0
        while i < len(left) and j < len(right):
            if (left[i] < right[j]) == aced:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged
