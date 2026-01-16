"""module doc"""
import sys
import os
from .sortalgo import SortAlgo
from .bubbles import BubbleSort
from .selection import SelectionSort
from .quick import QuickSort
from .merge import MergeSort
from .factory import SortFunction
from .shell import ShellSort
sys.path.insert(0, os.path.dirname(__file__))
