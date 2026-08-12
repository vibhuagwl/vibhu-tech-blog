# Memory Stories

Factory
-> I do not know which payment gateway I need; factory decides.

Strategy
-> I know the operation, but I can swap the algorithm.

Adapter
-> The old API speaks a different language; adapter translates.

Decorator
-> I already have payment processing; I want to add logging/fraud/retry.

Facade
-> Five services are complicated; give the client one door.

Proxy
-> Before reaching the real service, I need security/cache/logging.

Chain
-> Let each validator get a chance to reject the request.

State
-> Payment behaves differently depending on its lifecycle.

Observer
-> Payment completed once; many systems need to know.

Command
-> Turn an action into an object so I can queue/retry/undo it.

Singleton
-> One config source should speak for the whole app.

Abstract Factory
-> A region pack should create matching services together.

Builder
-> Too many knobs? Build step by step.

Prototype
-> If the template is expensive, clone it.

Bridge
-> Two dimensions vary; separate them.

Composite
-> Treat one product and a bundle the same.

Flyweight
-> Share immutable metadata instead of copying it everywhere.

Interpreter
-> Business wants simple rules evaluated at runtime.

Iterator
-> Traverse cleanly without leaking the collection.

Mediator
-> Too many services talk directly; give them a coordinator.

Memento
-> Take a snapshot before changing something risky.

Template Method
-> The workflow stays the same; only steps vary.

Visitor
-> Accounts stay stable; operations keep changing.
