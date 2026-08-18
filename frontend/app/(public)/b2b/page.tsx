import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const INSTITUTIONS = [
  { name: "Restaurants", detail: "Service-ready kitchens", position: "8%" },
  { name: "Schools", detail: "Daily dining programmes", position: "25%" },
  { name: "Hotels", detail: "Breakfast to banquet", position: "42%" },
  { name: "Caterers", detail: "Planned volume orders", position: "58%" },
  { name: "Retailers", detail: "Fresh market shelves", position: "75%" },
  { name: "Institutions", detail: "Reliable goods receiving", position: "92%" },
] as const;

const STEPS = [
  {
    number: "01",
    verb: "Choose",
    title: "Your catalogue. Your prices.",
    body: "See the produce available to your business at your agreed prices, then order what service actually needs.",
  },
  {
    number: "02",
    verb: "Request",
    title: "Ask for the unusual.",
    body: "Send a quote request when the quantity, crop or delivery requirement needs a more considered answer.",
  },
  {
    number: "03",
    verb: "Repeat",
    title: "Set the rhythm once.",
    body: "Turn regular supply into a recurring delivery, so replenishment happens without starting from zero each week.",
  },
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 10h13M12 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProduceCrate({ className = "" }: { className?: string }) {
  return (
    <g className={className}>
      <circle cx="-14" cy="-13" r="10" className="produce-tomato" />
      <path d="M-14-23c2-6 7-8 12-7M-18-22l4 3 4-4" className="produce-stem" />
      <path d="M-2-4c-3-19 6-31 25-34 8 17 2 30-16 38" className="produce-leaf" />
      <path d="M6-1c-8-16-5-28 9-37 12 12 12 25 0 39" className="produce-leaf-alt" />
      <path d="M-29-4h58l-7 38h-44L-29-4Z" className="crate-body" />
      <path d="M-25 8h50M-23 20h46M-12-4l3 38M12-4 9 34" className="crate-lines" />
      <path d="M-20-4c2-23 10-34 20-34S18-27 20-4" className="crate-handle" />
    </g>
  );
}

function DispatchBoard() {
  return (
    <div className="dispatch-board" aria-label="Produce moving from farm to a business kitchen">
      <div className="dispatch-meta">
        <span>Today&apos;s supply route</span>
        <span>Farm → service</span>
      </div>
      <svg viewBox="0 0 620 470" fill="none" aria-hidden="true">
        <path
          d="M34 349V267l59-43 59 43v82M53 349v-62h80v62M70 258h47"
          className="dispatch-structure"
        />
        <path
          d="M474 282v78h110v-78M460 282h138l-23-38h-91l-24 38ZM500 360v-48h53v48"
          className="dispatch-structure"
        />
        <path d="M92 324C180 208 274 384 365 252S493 184 540 251" className="dispatch-route" />
        <circle cx="92" cy="324" r="7" className="dispatch-origin" />
        <circle cx="540" cy="251" r="7" className="dispatch-destination" />
        <g className="dispatch-moving-crate">
          <ProduceCrate />
          <animateMotion
            path="M92 324C180 208 274 384 365 252S493 184 540 251"
            dur="9s"
            repeatCount="indefinite"
            rotate="auto"
          />
        </g>
        <g transform="translate(355 252)" className="dispatch-static-crate">
          <ProduceCrate />
        </g>
        <text x="48" y="389" className="dispatch-label">
          SOURCE
        </text>
        <text x="476" y="389" className="dispatch-label">
          GOODS IN
        </text>
        <path d="M92 415h448" className="dispatch-baseline" />
        <path
          d="M181 406l10 9-10 9M318 406l10 9-10 9M455 406l10 9-10 9"
          className="dispatch-arrows"
        />
      </svg>
      <div className="dispatch-foot">
        <span>Catalogue</span>
        <span>Quote</span>
        <span>Repeat</span>
      </div>
    </div>
  );
}

function InstitutionRail() {
  return (
    <div className="institution-rail">
      <div className="institution-track">
        {[0, 1].map((set) => (
          <div className="institution-set" key={set} aria-hidden={set === 1}>
            {INSTITUTIONS.map((item) => (
              <figure className="institution-frame" key={`${set}-${item.name}`}>
                <Image
                  src="/images/b2b-institutions-v1.png"
                  alt={set === 0 ? `${item.name} food service environment` : ""}
                  fill
                  sizes="(max-width: 640px) 72vw, 19rem"
                  style={{ objectPosition: `${item.position} center` }}
                />
                <figcaption>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepArtifact({ index }: { index: number }) {
  if (index === 0)
    return (
      <svg viewBox="0 0 250 180" fill="none" aria-hidden="true" className="step-art step-art-order">
        <path d="M30 20h154v137H30z" className="paper" />
        <path d="M48 45h77M48 63h116M48 81h99" className="ink-line" />
        <path d="M48 111h12v12H48zM48 133h12v12H48z" className="tick-box" />
        <path d="m50 115 5 5 10-13M50 137l5 5 10-13" className="tick" />
        <path d="M137 104h74v52h-74z" className="price-tag" />
        <text x="149" y="135">
          YOUR PRICE
        </text>
      </svg>
    );
  if (index === 1)
    return (
      <svg viewBox="0 0 250 180" fill="none" aria-hidden="true" className="step-art step-art-quote">
        <path d="M48 17h144v146H48z" className="paper" />
        <path d="m154 17 38 38h-38V17Z" className="fold" />
        <path d="M69 73h100M69 94h78M69 115h91M69 136h56" className="quote-write" />
        <path d="M26 141c25-13 45-10 61 9" className="pencil-line" />
        <path d="m18 144 18-8-7 18-11-10Z" className="pencil" />
      </svg>
    );
  return (
    <svg viewBox="0 0 250 180" fill="none" aria-hidden="true" className="step-art step-art-repeat">
      <path d="M30 48h190v105H30zM30 75h190M68 31v34M182 31v34" className="calendar" />
      <path d="M68 97h30v30H68zM110 97h30v30h-30zM152 97h30v30h-30z" className="calendar-days" />
      <path d="m73 111 7 7 14-18M115 111l7 7 14-18" className="tick" />
      <path d="M158 112h18M167 103v18" className="plus" />
    </svg>
  );
}

export default function B2BPage() {
  return (
    <main className="b2b-page">
      <section className="b2b-hero-shell">
        <div className="b2b-hero page-container">
          <div className="b2b-hero-copy">
            <p className="b2b-overline">Legit Organic for business</p>
            <h1>Produce that keeps service moving.</h1>
            <p className="b2b-hero-lede">
              Wholesale ordering, agreed pricing and recurring supply for teams that cannot leave
              tomorrow&apos;s stock to chance.
            </p>
            <div className="b2b-actions">
              <Link href="/b2b/apply" className="b2b-button b2b-button-primary">
                Apply for trade access <ArrowIcon />
              </Link>
              <Link href="/b2b/dashboard" className="b2b-button b2b-button-outline">
                Open portal
              </Link>
            </div>
          </div>
          <DispatchBoard />
        </div>
      </section>

      <section className="institutions" aria-labelledby="institutions-title">
        <div className="page-container institutions-head">
          <p className="b2b-overline">Where the produce goes</p>
          <h2 id="institutions-title">Built for people feeding people.</h2>
          <p>
            From a single kitchen to a daily dining programme, the buying rhythm changes. The supply
            should adapt with it.
          </p>
        </div>
        <InstitutionRail />
      </section>

      <section className="workflow" aria-labelledby="workflow-title">
        <div className="page-container">
          <header className="workflow-head">
            <p className="b2b-overline">How business ordering works</p>
            <h2 id="workflow-title">
              One supply line.
              <br />
              Three ways to keep it moving.
            </h2>
            <p className="workflow-intro">
              Start with the catalogue, step outside it when the order needs a quote, then turn the
              reliable parts into a repeat delivery.
            </p>
          </header>
          <ol className="workflow-list">
            {STEPS.map((step, index) => (
              <li className="workflow-step" key={step.number}>
                <div className="step-number">
                  <span>{step.number}</span>
                  <span>{step.verb}</span>
                </div>
                <div className="step-copy">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
                <div className="step-visual">
                  <StepArtifact index={index} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="reliability">
        <div className="reliability-image">
          <Image
            src="/images/hero/4.webp"
            alt="Fresh produce being prepared for transport from a farm"
            fill
            sizes="(max-width: 960px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="reliability-copy">
          <p className="b2b-overline">From source to schedule</p>
          <h2>
            Less chasing.
            <br />
            More certainty.
          </h2>
          <p>
            Order from your catalogue, request a quote when the requirement changes, and set regular
            supply to repeat.
          </p>
          <div className="reliability-rhythm" aria-hidden="true">
            <span>Order</span>
            <i />
            <span>Prepare</span>
            <i />
            <span>Deliver</span>
          </div>
        </div>
      </section>

      <section className="b2b-close">
        <div className="page-container close-grid">
          <div>
            <p className="b2b-overline">Trade access</p>
            <h2>Tell us what your business needs.</h2>
          </div>
          <div className="close-action">
            <p>
              Share where you work, what you buy and how often. We&apos;ll use it to review the
              right business setup for you.
            </p>
            <Link href="/b2b/apply" className="b2b-button b2b-button-dark">
              Start your application <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        /* Hallmark · pre-emit critique: P5 H5 E5 S5 R4 V5 */
        /* Hallmark · macrostructure: Narrative Workflow · theme: Legit Organic · contrast: pass · responsive: pass */
        .b2b-page{background:var(--color-b2b-paper);color:var(--color-b2b-ink);overflow-x:clip}.b2b-page h1,.b2b-page h2,.b2b-page h3{font-family:var(--font-b2b-display);font-style:normal;font-weight:500;text-wrap:balance;overflow-wrap:anywhere;min-width:0}.b2b-page p{text-wrap:pretty}.b2b-overline{font-family:var(--font-b2b-body);font-size:var(--text-b2b-xs);font-weight:700;letter-spacing:.12em;text-transform:uppercase}.b2b-hero-shell{background:var(--color-b2b-hero);color:var(--color-b2b-hero-ink)}.b2b-hero{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-b2b-xl);align-items:center;padding-block:7.5rem 6rem}.b2b-hero-copy{animation:b2b-rise 700ms var(--ease-b2b-out) both}.b2b-hero .b2b-overline{color:var(--color-b2b-gold)}.b2b-hero h1{max-width:10ch;margin-top:var(--space-b2b-md);font-size:clamp(3.8rem,9vw,7.6rem);line-height:.82;letter-spacing:-.055em}.b2b-hero-lede{max-width:38rem;margin-top:var(--space-b2b-lg);color:var(--color-b2b-hero-soft);font-size:clamp(1rem,1.6vw,1.15rem);line-height:1.65}.b2b-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:var(--space-b2b-lg)}.b2b-button{display:inline-flex;min-height:3.35rem;align-items:center;justify-content:center;gap:.7rem;padding:.9rem 1.35rem;border:1px solid transparent;border-radius:0;font-family:var(--font-b2b-body);font-size:.88rem;font-weight:700;line-height:1;white-space:nowrap;transition:transform 150ms var(--ease-b2b-out),background-color 180ms var(--ease-b2b-out),color 180ms var(--ease-b2b-out),border-color 180ms var(--ease-b2b-out)}.b2b-button svg{width:1.1rem;height:1.1rem;transition:transform 180ms var(--ease-b2b-out)}.b2b-button-primary{background:var(--color-b2b-gold);color:var(--color-b2b-hero)}.b2b-button-outline{border-color:var(--color-b2b-hero-rule);color:var(--color-b2b-hero-ink)}.b2b-button-dark{background:var(--color-b2b-hero);color:var(--color-b2b-hero-ink)}.b2b-button:focus-visible{outline:3px solid var(--color-b2b-focus);outline-offset:3px}.b2b-button:active{transform:translateY(2px)}
        .dispatch-board{position:relative;overflow:hidden;border:1px solid var(--color-b2b-hero-rule);background:var(--color-b2b-hero-panel);animation:b2b-rise 750ms 120ms var(--ease-b2b-out) both}.dispatch-meta,.dispatch-foot{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.25rem;font-family:var(--font-b2b-body);font-size:.66rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.dispatch-meta{border-bottom:1px solid var(--color-b2b-hero-rule);color:var(--color-b2b-hero-soft)}.dispatch-foot{border-top:1px solid var(--color-b2b-hero-rule);color:var(--color-b2b-gold)}.dispatch-board>svg{display:block;width:100%;height:auto}.dispatch-structure{fill:none;stroke:var(--color-b2b-hero-ink);stroke-width:2;opacity:.7}.dispatch-route{stroke:var(--color-b2b-gold);stroke-width:2;stroke-dasharray:5 8}.dispatch-origin{fill:var(--color-b2b-leaf-soft)}.dispatch-destination{fill:var(--color-b2b-gold)}.crate-body{fill:var(--color-b2b-gold);stroke:var(--color-b2b-hero);stroke-width:2}.crate-lines,.crate-handle{fill:none;stroke:var(--color-b2b-hero);stroke-width:2}.produce-tomato{fill:var(--color-b2b-tomato);stroke:var(--color-b2b-hero);stroke-width:1.5}.produce-stem{fill:none;stroke:var(--color-b2b-leaf);stroke-width:2}.produce-leaf{fill:var(--color-b2b-leaf-soft);stroke:var(--color-b2b-hero);stroke-width:1.5}.produce-leaf-alt{fill:var(--color-b2b-aubergine);stroke:var(--color-b2b-hero);stroke-width:1.5}.dispatch-static-crate{display:none}.dispatch-label{fill:var(--color-b2b-hero-soft);font:700 11px var(--font-b2b-body);letter-spacing:2px}.dispatch-baseline,.dispatch-arrows{fill:none;stroke:var(--color-b2b-hero-rule);stroke-width:2}.dispatch-arrows{stroke:var(--color-b2b-gold);animation:arrow-pulse 1.8s var(--ease-b2b-in-out) infinite}
        .institutions{padding-block:clamp(5rem,9vw,8rem);background:var(--color-b2b-sand)}.institutions-head{display:grid;gap:1.25rem}.institutions-head .b2b-overline{color:var(--color-b2b-leaf)}.institutions-head h2{max-width:14ch;font-size:clamp(3rem,7vw,6.4rem);line-height:.86;letter-spacing:-.05em}.institutions-head>p:last-child{max-width:34rem;color:var(--color-b2b-ink-soft);line-height:1.65}.institution-rail{margin-top:3.5rem;overflow:hidden}.institution-track{display:flex;width:max-content;animation:institution-travel 42s linear infinite}.institution-set{display:flex}.institution-frame{position:relative;width:clamp(16rem,23vw,20rem);aspect-ratio:4/5;flex:none;overflow:hidden;border-right:1px solid var(--color-b2b-sand)}.institution-frame img{object-fit:cover;transition:transform 600ms var(--ease-b2b-out)}.institution-frame::after{position:absolute;inset:45% 0 0;background:linear-gradient(to bottom,transparent,var(--color-b2b-image-shade));content:""}.institution-frame figcaption{position:absolute;z-index:2;inset-inline:1.25rem;bottom:1.25rem;color:var(--color-b2b-hero-ink)}.institution-frame strong{display:block;font-family:var(--font-b2b-display);font-size:2.15rem;font-weight:500}.institution-frame span{display:block;margin-top:.2rem;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.institution-rail:hover .institution-track,.institution-rail:focus-within .institution-track{animation-play-state:paused}
        .workflow{padding-block:clamp(5rem,10vw,9rem)}.workflow-head{display:flex;flex-direction:column;gap:1.25rem}.workflow-head .b2b-overline{color:var(--color-b2b-leaf)}.workflow-head h2{max-width:14ch;font-size:clamp(3rem,7vw,6rem);line-height:.86;letter-spacing:-.05em}.workflow-list{margin-top:3.5rem;border-top:1px solid var(--color-b2b-rule-strong)}.workflow-step{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem;padding-block:2rem;border-bottom:1px solid var(--color-b2b-rule)}.step-number{display:flex;align-items:baseline;gap:1rem;font-size:.74rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.step-number span:first-child{color:var(--color-b2b-leaf);font-variant-numeric:tabular-nums}.step-copy h3{font-size:clamp(2rem,4vw,3.4rem);line-height:.95;letter-spacing:-.035em}.step-copy p{max-width:34rem;margin-top:1rem;color:var(--color-b2b-ink-soft);line-height:1.65}.step-visual{display:grid;min-height:12rem;place-items:center;overflow:hidden;background:var(--color-b2b-paper-raised)}.step-art{width:min(100%,18rem);height:auto}.paper{fill:var(--color-b2b-paper);stroke:var(--color-b2b-ink);stroke-width:1.5}.ink-line,.quote-write{stroke:var(--color-b2b-ink);stroke-width:2;stroke-linecap:round}.tick-box,.calendar,.calendar-days{stroke:var(--color-b2b-ink);stroke-width:1.7}.tick,.plus{fill:none;stroke:var(--color-b2b-leaf);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.price-tag{fill:var(--color-b2b-gold);stroke:var(--color-b2b-ink);stroke-width:1.5}.step-art text{fill:var(--color-b2b-ink);font:700 9px var(--font-b2b-body);letter-spacing:1px}.fold{fill:var(--color-b2b-sand);stroke:var(--color-b2b-ink);stroke-width:1.5}.quote-write{stroke-dasharray:110;animation:write-lines 3.6s var(--ease-b2b-in-out) infinite}.pencil-line{stroke:var(--color-b2b-leaf);stroke-width:2;stroke-dasharray:80;animation:draw-line 3.6s var(--ease-b2b-in-out) infinite}.pencil{fill:var(--color-b2b-gold);stroke:var(--color-b2b-ink);stroke-width:1.5}.calendar-days{fill:var(--color-b2b-paper)}
        .reliability{display:grid;grid-template-columns:minmax(0,1fr);background:var(--color-b2b-hero);color:var(--color-b2b-hero-ink)}.reliability-image{position:relative;min-height:28rem}.reliability-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(3rem,7vw,6rem)}.reliability-copy .b2b-overline{color:var(--color-b2b-gold)}.reliability-copy h2{margin-top:1.5rem;font-size:clamp(3.5rem,7vw,6.6rem);line-height:.84;letter-spacing:-.05em}.reliability-copy>p:not(.b2b-overline){max-width:32rem;margin-top:2rem;color:var(--color-b2b-hero-soft);line-height:1.7}.reliability-rhythm{display:flex;align-items:center;gap:.75rem;margin-top:2.5rem;color:var(--color-b2b-gold);font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.reliability-rhythm i{display:block;flex:1;height:1px;background:var(--color-b2b-hero-rule);position:relative;overflow:hidden}.reliability-rhythm i::after{position:absolute;inset:0;background:var(--color-b2b-gold);content:"";transform:translateX(-100%);animation:rhythm-line 3s linear infinite}.reliability-rhythm i:nth-of-type(2)::after{animation-delay:1.5s}.b2b-close{background:var(--color-b2b-gold);color:var(--color-b2b-hero)}.close-grid{display:grid;gap:2.5rem;padding-block:clamp(4rem,8vw,7rem)}.close-grid h2{max-width:12ch;margin-top:1rem;font-size:clamp(3.2rem,7vw,6rem);line-height:.86;letter-spacing:-.05em}.close-action{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:2rem}.close-action p{max-width:32rem;line-height:1.65}
        @media(min-width:60rem){.b2b-hero{grid-template-columns:minmax(0,1.08fr) minmax(27rem,.92fr);gap:clamp(3rem,6vw,6rem);padding-block:9rem 8rem}.institutions-head{grid-template-columns:minmax(0,1.25fr) minmax(22rem,.75fr)}.institutions-head .b2b-overline{grid-column:1/-1}.institutions-head>p:last-child{align-self:end}.workflow-step{grid-template-columns:minmax(7rem,.3fr) minmax(0,1fr) minmax(18rem,.7fr);align-items:center;padding-block:2.5rem}.reliability{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.reliability-image{min-height:44rem}.close-grid{grid-template-columns:minmax(0,1.15fr) minmax(22rem,.85fr)}}
        @media(hover:hover) and (pointer:fine){.b2b-button-primary:hover{background:var(--color-b2b-paper-raised)}.b2b-button-outline:hover{border-color:var(--color-b2b-gold);color:var(--color-b2b-gold)}.b2b-button-dark:hover{background:var(--color-b2b-paper-raised);color:var(--color-b2b-hero)}.b2b-button:hover svg{transform:translateX(.25rem)}.institution-frame:hover img{transform:scale(1.035)}.workflow-step:hover .step-visual{background:var(--color-b2b-gold-soft)}}
        @media(prefers-reduced-motion:reduce){.b2b-hero-copy,.dispatch-board,.dispatch-arrows,.institution-track,.quote-write,.pencil-line,.reliability-rhythm i::after{animation:none}.dispatch-moving-crate{display:none}.dispatch-static-crate{display:block}.institution-track{transform:none}.b2b-button,.b2b-button svg,.institution-frame img{transition:none}}
        @keyframes b2b-rise{from{opacity:0;transform:translateY(1.4rem)}to{opacity:1;transform:translateY(0)}}@keyframes arrow-pulse{50%{opacity:.35;transform:translateX(.3rem)}}@keyframes institution-travel{to{transform:translateX(-50%)}}@keyframes write-lines{0%,15%{stroke-dashoffset:110}50%,82%{stroke-dashoffset:0}100%{stroke-dashoffset:-110}}@keyframes draw-line{0%,18%{stroke-dashoffset:80}58%,84%{stroke-dashoffset:0}100%{stroke-dashoffset:-80}}@keyframes rhythm-line{to{transform:translateX(100%)}}
      `}</style>
    </main>
  );
}
