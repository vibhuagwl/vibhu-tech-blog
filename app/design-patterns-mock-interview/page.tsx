const qa = [
  {
    pattern:'Strategy',
    question:'Where have you used Strategy in a real Java backend?',
    answer:'In payment processing, I had one operation—process payment—but different algorithms for card, UPI, PayPal, and bank transfer. Strategy let me isolate each algorithm, test them independently, and add new methods without touching the main service flow.',
  },
  {
    pattern:'State',
    question:'State vs Strategy—how do you explain the difference?',
    answer:'Strategy is chosen because the algorithm varies. State is chosen because the object lifecycle changes what behavior is valid. In my repo, payment method selection is Strategy, but payment lifecycle transitions like CREATED to AUTHORIZED to SETTLED are State.',
  },
  {
    pattern:'Decorator',
    question:'Why did you use Decorator instead of adding code directly to the service?',
    answer:'Because logging, metrics, fraud, and retry are cross-cutting layers that change independently from the core payment logic. Decorator keeps the base processor focused and lets me compose behavior at runtime.',
  },
  {
    pattern:'Facade',
    question:'What problem does Facade solve in your payment example?',
    answer:'Clients should not orchestrate fraud, balance, payment gateway, notification, and audit calls manually. The facade gives one entry point, keeps orchestration consistent, and makes controllers simpler.',
  },
  {
    pattern:'Adapter',
    question:'What is a real Adapter example in backend systems?',
    answer:'A legacy payment gateway or bank SDK with the wrong request/response contract. I wrap it behind my internal PaymentGateway interface so the rest of the codebase does not leak vendor-specific shapes.',
  },
  {
    pattern:'Proxy',
    question:'How is Proxy different from Decorator in production?',
    answer:'Proxy controls access before the real object is reached—auth, rate limiting, caching, AOP, transactions. Decorator enriches business behavior around the core logic. Intent is the key difference.',
  },
  {
    pattern:'Chain of Responsibility',
    question:'Where does Chain of Responsibility appear in Spring?',
    answer:'Spring Security filters are a classic chain example. In my repo I use it for payment validation, where auth, amount, fraud, and account checks each get a chance to reject the request.',
  },
  {
    pattern:'Factory Method',
    question:'When do you choose Factory over Builder?',
    answer:'Factory when the implementation type changes, Builder when object construction is complex. In my repo, gateway provider selection is Factory; large transaction request creation is Builder.',
  },
  {
    pattern:'Observer',
    question:'What is the production version of Observer?',
    answer:'Application events, async listeners, or Kafka consumers. One payment-completed event can notify audit, reporting, notification, and fraud analytics without the payment service calling each one directly.',
  },
  {
    pattern:'Template Method',
    question:'Why not use Strategy instead of Template Method?',
    answer:'Template Method fits when the workflow skeleton is stable and only a few steps vary. Strategy fits when the whole algorithm is swappable. In payment flows, both can coexist.',
  },
  {
    pattern:'Command',
    question:'Why is Command useful for senior backend systems?',
    answer:'Because actions become queueable and retryable units. Create-payment, refund, retry, and cancel can all be represented uniformly and executed later or audited cleanly.',
  },
  {
    pattern:'Abstract Factory',
    question:'Where would Abstract Factory show up in real enterprise code?',
    answer:'Region-specific or tenant-specific service packs. India, Europe, and US banking integrations often need compatible account and payment services created together.',
  },
];

export const metadata={
  title:'Design Patterns Mock Interview',
  description:'Senior Java mock interview questions and model answers for design patterns, based on the real-world repository examples.',
};

export default function DesignPatternsMockInterviewPage(){
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-600 dark:text-slate-300">
          Mock interview
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.03em] text-slate-900 dark:text-white">
          Design patterns mock interview
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Practice like an interview: pattern name, realistic question, and a concise senior-level answer grounded in the repository examples.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">How to use this page</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
          <li>Read only the question first.</li>
          <li>Answer it aloud in 30–60 seconds.</li>
          <li>Then compare with the model answer.</li>
          <li>If you struggle, open the source repo or revision cards page.</li>
        </ol>
      </section>

      <section className="mt-10 space-y-5">
        {qa.map((item, index)=>(
          <article key={item.pattern} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-slate-600 dark:text-slate-300">Question {index+1} · {item.pattern}</div>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{item.question}</h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Model answer</div>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.answer}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
