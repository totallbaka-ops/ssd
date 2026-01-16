"""dgdg"""
from abc import ABC, abstractmethod
from typing import List

class SortAlgo(ABC):# pylint: disable=too-few-public-methods
    @abstractmethod
    def sort(self, data: List[int], ascending: bool = True) -> List[int]:
        """Sorts the data and returns a new sorted list."""
        pass
