import asyncio
from autobahn.asyncio.wamp import ApplicationSession, ApplicationRunner
from crepinator import Crepinator


class Component(ApplicationSession):
    @asyncio.coroutine
    def onJoin(self, details):
        c = Crepinator()
        asyncio.async(c.mainloop())

        def print_pancake(data):
            asyncio.async(c.enqueue(data))
            return True

        yield from self.register(lambda: True, 'ping')
        yield from self.register(print_pancake, 'print')
        print("Ready 2go")


if __name__ == '__main__':
    ApplicationRunner("ws://localhost:8080/ws", "crepinator").run(Component)
