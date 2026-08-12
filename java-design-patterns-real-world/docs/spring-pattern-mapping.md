# Spring Pattern Mapping

- Spring singleton-scoped beans relate to Singleton because the container manages one shared instance per context.
- `BeanFactory` and `ApplicationContext` relate to Factory because creation is delegated to the container.
- HTTP clients and third-party wrappers often act like Adapter because they translate external contracts.
- Spring AOP and transactional proxies relate to Proxy because calls are intercepted before reaching the target.
- Spring Security filter chains resemble Chain of Responsibility because requests move through ordered handlers.
- `ApplicationEventPublisher` relates to Observer because one event can notify many listeners.
- Transaction templates and abstract support classes often reflect Template Method by fixing a workflow skeleton.
- Dependency injection frequently supports Strategy and Factory by selecting implementations through composition.
