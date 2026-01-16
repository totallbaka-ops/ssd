"""stop"""
from typing import List
from .sortalgo import SortAlgo
# BUBBLES
class BubbleSort(SortAlgo):# pylint: disable=too-few-public-methods
    """this is a doc string """
    def sort(self, data:List[int],ascd:bool=True)-> List[int]:
        """this is a doc string """
        arr = data.copy()
        n = len(arr)
        for i in range(n):
            for j in range(0, n-i-1):
                if (arr[j] > arr[j+1]) == ascd:
                    arr[j], arr[j+1] = arr[j+1], arr[j]        #swap
        return arr
