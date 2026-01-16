"""module doc"""
from .sortalgo import SortAlgo
from .bubbles import BubbleSort
from .selection import SelectionSort
from .quick import QuickSort
from .merge import MergeSort
from .shell import ShellSort

class SortFunc:
    """this is a doc string """
    def get_sorter(self, name: str) -> SortAlgo:# pylint: disable=too-few-public-methods
        """this is a doc string """
        name = name.lower()
        if name == 'bubble':
            return BubbleSort()
        elif name == 'selection':
            return SelectionSort()
        elif name == 'quick':
            return QuickSort()
        elif name == 'merge':
            return MergeSort()
        elif name == 'shell':
            return ShellSort()
        else:
            raise ValueError("Unknown algorithm name!")

SortFunction = SortFunc()
