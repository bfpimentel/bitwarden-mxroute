from abc import ABC, abstractmethod


class Provider(ABC):
    @abstractmethod
    def add(self, domain, destination, alias):
        pass

    @abstractmethod
    def get(self, domain):
        pass

    @abstractmethod
    def delete(self, alias):
        pass
