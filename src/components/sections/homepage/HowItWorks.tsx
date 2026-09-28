const HowItWorks = () => (
  <section className="py-20 max-w-7xl mx-auto px-4">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">How It Works</h2>
    <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">Three simple steps to sell your home — no agents, no repairs, no waiting.</p>
    <div className="grid md:grid-cols-3 gap-8">
      {[
        { num: "1", title: "Tell Us About Your Property", desc: "Enter your address and basic info. Takes 60 seconds." },
        { num: "2", title: "Get Your Cash Offer", desc: "We'll call you with a fair, no-obligation cash offer." },
        { num: "3", title: "Close on Your Timeline", desc: "Pick your closing date — as fast as 7 days. We handle everything." },
      ].map((s) => (
        <div key={s.num} className="relative bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">{s.num}</div>
          <h3 className="text-lg font-bold mb-2">{s.title}</h3>
          <p className="text-sm text-muted-foreground">{s.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default HowItWorks;
