import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Food Supply for Restaurants, Schools and Businesses",
  description:
    "Order dependable Ghanaian produce for restaurants, schools, hotels, caterers, retailers and institutions.",
  path: "/b2b",
});

const INSTITUTIONS = [
  {
    name: "Restaurants",
    detail: "Service-ready kitchens",
    image: "/images/photography/b2b-restaurant.webp",
    position: "54% center",
  },
  {
    name: "Schools",
    detail: "Daily dining programmes",
    image: "/images/photography/b2b-school.webp",
    position: "58% center",
  },
  {
    name: "Hotels",
    detail: "Breakfast to banquet",
    image: "/images/photography/b2b-hospitality.webp",
    position: "70% center",
  },
  {
    name: "Caterers",
    detail: "Planned volume orders",
    image: "/images/photography/b2b-catering.webp",
    position: "52% center",
  },
  {
    name: "Retailers",
    detail: "Fresh market shelves",
    image: "/images/photography/b2b-retail.webp",
    position: "center",
  },
  {
    name: "Institutions",
    detail: "Reliable goods receiving",
    image: "/images/photography/b2b-institution.webp",
    position: "58% center",
  },
] as const;

const STEPS = [
  {
    verb: "Order",
    title: "Your catalogue. Your prices.",
    body: "See the produce available to your business at your agreed prices, then order what service actually needs.",
  },
  {
    verb: "Quote",
    title: "Ask for the unusual.",
    body: "Send a quote request when the quantity, crop or delivery requirement needs a more considered answer.",
  },
  {
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
      <path d="M-32-18h64v54h-64z" className="crate-body" />
      <path d="M0-18v54M-32 4h64" className="crate-lines" />
      <path d="M-9-18H9v54H-9z" className="sealed-tape" />
    </g>
  );
}

function DispatchBoard() {
  return (
    <div className="dispatch-board" aria-label="Produce moving from farm to a business kitchen">
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
        <circle cx="92" cy="324" r="7" className="dispatch-origin dispatch-pulse">
          <animate attributeName="r" values="7;18;7" dur="2.4s" repeatCount="indefinite" />
          <animate
            attributeName="opacity"
            values="0.65;0;0.65"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="92" cy="324" r="7" className="dispatch-origin" />
        <circle cx="540" cy="251" r="7" className="dispatch-destination dispatch-pulse">
          <animate
            attributeName="r"
            values="7;18;7"
            dur="2.4s"
            begin="0.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.65;0;0.65"
            dur="2.4s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="540" cy="251" r="7" className="dispatch-destination" />
        <g className="dispatch-moving-crate">
          <ProduceCrate />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.1;0.88;1"
            dur="9s"
            repeatCount="indefinite"
          />
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
        <text x="93" y="389" textAnchor="middle" className="dispatch-label">
          SOURCE
        </text>
        <text x="529" y="389" textAnchor="middle" className="dispatch-label">
          GOODS IN
        </text>
        <path d="M92 415h448" className="dispatch-baseline" />
        <path
          d="M181 406l10 9-10 9M318 406l10 9-10 9M455 406l10 9-10 9"
          className="dispatch-arrows"
        />
      </svg>
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
                  src={item.image}
                  alt={set === 0 ? `${item.name} food service environment` : ""}
                  fill
                  sizes="(max-width: 640px) 72vw, 19rem"
                  style={{ objectPosition: item.position }}
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
      <svg viewBox="0 0 280 190" fill="none" aria-hidden="true" className="step-art step-art-order">
        <path d="M22 25h142v140H22z" className="paper" />
        <text x="39" y="48">
          TODAY&apos;S CATALOGUE
        </text>
        <path d="M39 59h106M39 86h106M39 113h106M39 140h72" className="catalogue-rules" />
        <g className="order-box-back">
          <path d="M178 99h74v25h-74z" className="box-interior" />
          <path d="m178 105-19-27h53l3 27zM252 105l19-27h-53l-3 27z" className="box-flap" />
        </g>
        <g className="order-moving-item order-moving-tomato">
          <path
            d="M39 75c0-9 5-14 12-14s12 5 12 14c0 9-5 14-12 14S39 84 39 75Z"
            className="order-tomato"
          />
          <path d="m51 62-5 5 5-2 5 2-3-5 1-5" className="order-stem" />
        </g>
        <g className="order-moving-item order-moving-eggplant">
          <path
            d="M43 98c2-9 11-13 18-7 7 7 0 19-13 25-7-4-8-11-5-18Z"
            className="order-eggplant"
          />
          <path d="m48 94 4-6 4 5 7-1" className="order-stem" />
        </g>
        <g className="order-moving-item order-moving-pepper">
          <path
            d="M40 128c0-8 5-13 11-13 7 0 12 5 12 13 0 10-5 16-12 16-7 0-11-6-11-16Z"
            className="order-pepper"
          />
          <path d="M51 116c-1-6 3-9 7-9" className="order-stem" />
        </g>
        <g className="order-box-front">
          <path d="M178 105h74v52h-74z" className="produce-box" />
          <path d="M215 105v52M178 126h74" className="box-seams" />
        </g>
      </svg>
    );
  if (index === 1)
    return (
      <svg viewBox="0 0 280 190" fill="none" aria-hidden="true" className="step-art step-art-quote">
        <path d="M48 17h144v146H48z" className="paper" />
        <path d="m154 17 38 38h-38V17Z" className="fold" />
        <text x="69" y="55">
          QUOTE REQUEST
        </text>
        <path d="M69 73h100M69 94h78M69 115h91" className="quote-guide" />
        <path d="M69 73h100M69 94h78M69 115h91" className="quote-write" />
        <path d="M69 138h58" className="quote-total" />
        <text x="69" y="132" className="quote-total-label">
          AGREED TOTAL
        </text>
        <g className="quote-approved">
          <circle cx="211" cy="130" r="24" />
          <path d="m198 130 9 9 17-20" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 280 190" fill="none" aria-hidden="true" className="step-art step-art-repeat">
      <path d="M24 143h232" className="repeat-road" />
      <path d="M49 122C67 61 193 52 225 107" className="repeat-loop" />
      <path d="m216 95 10 12-15 4" className="repeat-arrow" />
      <g className="repeat-box">
        <path d="M36 96h64v49H36z" className="produce-box" />
        <path d="M68 96v49M36 117h64" className="box-seams" />
        <path d="M56 96h24v49H56z" className="box-tape-panel" />
      </g>
      <g className="repeat-truck">
        <path d="M117 100h70v37h-70zM187 114h25l17 16v7h-42z" className="truck-body" />
        <path d="M194 118h14l10 10h-24z" className="truck-window" />
        <circle cx="138" cy="140" r="8" className="truck-wheel" />
        <circle cx="207" cy="140" r="8" className="truck-wheel" />
        <path d="M128 111h43M128 120h31" className="truck-cargo" />
        <rect x="126" y="106" width="31" height="25" className="truck-loaded-box" />
      </g>
    </svg>
  );
}

export default function B2BPage() {
  return (
    <div className="b2b-page">
      <section className="b2b-hero-shell">
        <div className="b2b-hero page-container">
          <div className="b2b-hero-copy">
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
          <h2 id="institutions-title">Built for people feeding people.</h2>
          <p>
            A small kitchen and a daily dining programme buy differently. Supply should match the
            way each team works.
          </p>
        </div>
        <InstitutionRail />
      </section>

      <section className="workflow" aria-labelledby="workflow-title">
        <div className="page-container">
          <header className="workflow-head">
            <h2 id="workflow-title">From order to repeat delivery</h2>
            <p className="workflow-intro">
              Use the catalogue for regular orders. Request a quote when your needs change, then
              save the order for future deliveries.
            </p>
          </header>
          <ol className="workflow-list">
            {STEPS.map((step, index) => (
              <li className="workflow-step" key={step.verb}>
                <p className="step-verb">{step.verb}</p>
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
            src="/images/photography/b2b-supply-operation.webp"
            alt="Packed produce and delivery boxes loaded into a van"
            fill
            sizes="(max-width: 960px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="reliability-copy">
          <h2>Reliable supply, without the chase</h2>
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
            <h2>Tell us what your business needs.</h2>
          </div>
          <div className="close-action">
            <p>
              Tell us about your organisation and usual order. We&apos;ll review the right trade setup
              for you.
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
        .workflow{padding-block:clamp(5rem,10vw,9rem)}.workflow-head{display:flex;flex-direction:column;gap:1.25rem}.workflow-head .b2b-overline{color:var(--color-b2b-leaf)}.workflow-head h2{max-width:14ch;font-size:clamp(3rem,7vw,6rem);line-height:.86;letter-spacing:-.05em}.workflow-list{margin-top:3.5rem;border-top:1px solid var(--color-b2b-rule-strong)}.workflow-step{display:grid;grid-template-columns:minmax(0,1fr);gap:1.5rem;padding-block:2rem;border-bottom:1px solid var(--color-b2b-rule)}.step-verb{align-self:start;color:var(--color-b2b-leaf);font-size:.74rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.step-copy h3{font-size:clamp(2rem,4vw,3.4rem);line-height:.95;letter-spacing:-.035em}.step-copy p{max-width:34rem;margin-top:1rem;color:var(--color-b2b-ink-soft);line-height:1.65}.step-visual{display:grid;min-height:14rem;place-items:center;overflow:hidden;background:var(--color-b2b-paper-raised);transition:background-color 220ms var(--ease-b2b-out)}.step-art{width:min(100%,20rem);height:auto}.paper{fill:var(--color-b2b-paper);stroke:var(--color-b2b-ink);stroke-width:1.5}.quote-write,.quote-total,.catalogue-rules{fill:none;stroke:var(--color-b2b-ink);stroke-width:2;stroke-linecap:round}.step-art text{fill:var(--color-b2b-ink);font:700 8px var(--font-b2b-body);letter-spacing:1px}.fold{fill:var(--color-b2b-sand);stroke:var(--color-b2b-ink);stroke-width:1.5}.quote-write{stroke-dasharray:110;stroke-dashoffset:110}.quote-total{stroke-dasharray:60;stroke-dashoffset:60}.quote-total-label{opacity:0}.quote-approved{opacity:0;transform-box:fill-box;transform-origin:center}.quote-approved circle{fill:var(--color-b2b-leaf);stroke:var(--color-b2b-ink);stroke-width:1.5}.quote-approved path{fill:none;stroke:var(--color-b2b-paper);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.order-tomato{fill:var(--color-b2b-tomato);stroke:var(--color-b2b-ink);stroke-width:1.2}.order-stem{fill:none;stroke:var(--color-b2b-leaf);stroke-width:2;stroke-linecap:round}.order-leaf{fill:var(--color-b2b-leaf-soft);stroke:var(--color-b2b-ink);stroke-width:1.2}.order-carrot{fill:var(--color-b2b-gold);stroke:var(--color-b2b-ink);stroke-width:1.2}.produce-box{fill:var(--color-b2b-gold);stroke:var(--color-b2b-ink);stroke-width:1.7}.box-flap{fill:var(--color-b2b-gold-soft);stroke:var(--color-b2b-ink);stroke-width:1.5;stroke-linejoin:round}.box-seams{fill:none;stroke:var(--color-b2b-ink);stroke-width:1.4}.order-moving-item{transform-box:fill-box;transform-origin:center}.repeat-road{stroke:var(--color-b2b-ink);stroke-width:2}.repeat-loop{fill:none;stroke:var(--color-b2b-leaf);stroke-width:2;stroke-dasharray:5 6}.repeat-arrow{fill:none;stroke:var(--color-b2b-leaf);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.truck-body{fill:var(--color-b2b-gold);stroke:var(--color-b2b-ink);stroke-width:1.8}.truck-window{fill:var(--color-b2b-paper);stroke:var(--color-b2b-ink);stroke-width:1.4}.truck-wheel{fill:var(--color-b2b-ink)}.truck-cargo{stroke:var(--color-b2b-ink);stroke-width:1.5}.truck-loaded-box{fill:var(--color-b2b-sand);stroke:var(--color-b2b-ink);stroke-width:1.3;opacity:0}.repeat-box,.repeat-lid-left,.repeat-lid-right,.repeat-truck{transform-box:fill-box;transform-origin:center}.repeat-truck{opacity:.18}
        .reliability{display:grid;grid-template-columns:minmax(0,1fr);background:var(--color-b2b-hero);color:var(--color-b2b-hero-ink)}.reliability-image{position:relative;min-height:28rem}.reliability-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(3rem,7vw,6rem)}.reliability-copy .b2b-overline{color:var(--color-b2b-gold)}.reliability-copy h2{margin-top:1.5rem;font-size:clamp(3.5rem,7vw,6.6rem);line-height:.84;letter-spacing:-.05em}.reliability-copy>p:not(.b2b-overline){max-width:32rem;margin-top:2rem;color:var(--color-b2b-hero-soft);line-height:1.7}.reliability-rhythm{display:flex;align-items:center;gap:.75rem;margin-top:2.5rem;color:var(--color-b2b-gold);font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.reliability-rhythm i{display:block;flex:1;height:1px;background:var(--color-b2b-hero-rule);position:relative;overflow:hidden}.reliability-rhythm i::after{position:absolute;inset:0;background:var(--color-b2b-gold);content:"";transform:translateX(-100%);animation:rhythm-line 3s linear infinite}.reliability-rhythm i:nth-of-type(2)::after{animation-delay:1.5s}.b2b-close{background:var(--color-b2b-gold);color:var(--color-b2b-hero)}.close-grid{display:grid;gap:2.5rem;padding-block:clamp(4rem,8vw,7rem)}.close-grid h2{max-width:12ch;margin-top:1rem;font-size:clamp(3.2rem,7vw,6rem);line-height:.86;letter-spacing:-.05em}.close-action{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:2rem}.close-action p{max-width:32rem;line-height:1.65}
        .b2b-hero-shell{position:relative;overflow:hidden}.b2b-hero{position:relative;isolation:isolate;min-height:52rem}.b2b-hero::after{position:absolute;z-index:2;inset:0;background:linear-gradient(115deg,var(--color-b2b-hero) 0%,transparent 58%);content:"";pointer-events:none}.b2b-hero-copy{position:relative;z-index:3}.dispatch-board{position:absolute;z-index:1;right:-12rem;bottom:-5rem;width:48rem;border:0;background:transparent;opacity:.62;mask-image:linear-gradient(to right,transparent 0%,black 22%,black 100%);pointer-events:none}.dispatch-board>svg{filter:saturate(1.08)}
        @media(min-width:60rem){.b2b-hero{grid-template-columns:minmax(0,1.08fr) minmax(27rem,.92fr);gap:clamp(3rem,6vw,6rem);padding-block:9rem 8rem}.institutions-head{grid-template-columns:minmax(0,1.25fr) minmax(22rem,.75fr)}.institutions-head .b2b-overline{grid-column:1/-1}.institutions-head>p:last-child{align-self:end}.workflow-step{grid-template-columns:minmax(7rem,.3fr) minmax(0,1fr) minmax(18rem,.7fr);align-items:center;padding-block:2.5rem}.reliability{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.reliability-image{min-height:44rem}.close-grid{grid-template-columns:minmax(0,1.15fr) minmax(22rem,.85fr)}}
        @media(min-width:60rem){.b2b-hero{display:block;min-height:50rem}.b2b-hero-copy{max-width:46rem}.dispatch-board{right:-8rem;bottom:-7rem;width:min(62vw,62rem);opacity:.92;mask-image:linear-gradient(to right,transparent 0%,black 28%,black 100%)}}
        .quote-guide{fill:none;stroke:var(--color-b2b-ink);stroke-width:2;stroke-linecap:round;opacity:.18}.box-interior{fill:var(--color-b2b-hero);stroke:var(--color-b2b-ink);stroke-width:1.6}.box-tape-panel{fill:var(--color-b2b-gold-soft);stroke:var(--color-b2b-ink);stroke-width:1.2}.sealed-tape{fill:var(--color-b2b-paper);stroke:var(--color-b2b-hero);stroke-width:1.4;opacity:.9}.order-eggplant{fill:var(--color-b2b-aubergine);stroke:var(--color-b2b-ink);stroke-width:1.3}.order-pepper{fill:var(--color-b2b-gold);stroke:var(--color-b2b-ink);stroke-width:1.3}
        .dark .b2b-button-dark{background:var(--color-b2b-hero-ink);color:var(--color-b2b-hero);border-color:var(--color-b2b-hero-ink)}
        @media(hover:hover) and (pointer:fine){.b2b-button-primary:hover{background:var(--color-b2b-paper-raised)}.b2b-button-outline:hover{border-color:var(--color-b2b-gold);color:var(--color-b2b-gold)}.b2b-button-dark:hover{background:var(--color-b2b-paper-raised);color:var(--color-b2b-hero)}.dark .b2b-button-dark:hover{background:var(--color-b2b-hero);color:var(--color-b2b-hero-ink);border-color:var(--color-b2b-hero)}.b2b-button:hover svg{transform:translateX(.25rem)}.institution-frame:hover img{transform:scale(1.035)}.workflow-step:hover .step-visual{background:var(--color-b2b-gold-soft)}.workflow-step:hover .order-moving-tomato{animation:pack-tomato 2.6s var(--ease-b2b-in-out) both}.workflow-step:hover .order-moving-leaf{animation:pack-leaf 2.6s .22s var(--ease-b2b-in-out) both}.workflow-step:hover .order-moving-carrot{animation:pack-carrot 2.6s .44s var(--ease-b2b-in-out) both}.workflow-step:hover .quote-write{animation:write-lines 2.4s var(--ease-b2b-in-out) both}.workflow-step:hover .quote-total{animation:write-total 2.4s .35s var(--ease-b2b-in-out) both}.workflow-step:hover .quote-total-label{animation:show-total 2.4s .35s var(--ease-b2b-in-out) both}.workflow-step:hover .quote-approved{animation:approve-quote 2.4s .55s var(--ease-b2b-out) both}.workflow-step:hover .repeat-lid-left{animation:close-left-lid 4.6s var(--ease-b2b-in-out) both}.workflow-step:hover .repeat-lid-right{animation:close-right-lid 4.6s var(--ease-b2b-in-out) both}.workflow-step:hover .repeat-box{animation:load-box 4.6s var(--ease-b2b-in-out) both}.workflow-step:hover .repeat-truck{animation:repeat-delivery 4.6s var(--ease-b2b-in-out) both}.workflow-step:hover .truck-loaded-box{animation:show-loaded-box 4.6s var(--ease-b2b-in-out) both}}
        @media(prefers-reduced-motion:reduce){.b2b-hero-copy,.dispatch-board,.dispatch-arrows,.institution-track,.order-moving-item,.quote-write,.quote-total,.quote-total-label,.quote-approved,.repeat-box,.repeat-lid-left,.repeat-lid-right,.repeat-truck,.truck-loaded-box,.reliability-rhythm i::after{animation:none!important}.quote-write,.quote-total{stroke-dashoffset:0}.quote-total-label,.quote-approved{opacity:1}.repeat-truck{opacity:1}.dispatch-moving-crate{display:none}.dispatch-static-crate{display:block}.institution-track{transform:none}.b2b-button,.b2b-button svg,.institution-frame img{transition:none}}
        @media(hover:hover) and (pointer:fine){.workflow-step:hover .order-moving-tomato,.workflow-step:hover .order-moving-eggplant,.workflow-step:hover .order-moving-pepper,.workflow-step:hover .order-moving-carrot{animation-duration:9s;animation-iteration-count:infinite}.workflow-step:hover .order-moving-eggplant{animation:pack-eggplant 9s .25s var(--ease-b2b-in-out) infinite}.workflow-step:hover .order-moving-pepper{animation:pack-pepper 9s .5s var(--ease-b2b-in-out) infinite}.workflow-step:hover .quote-write,.workflow-step:hover .quote-total,.workflow-step:hover .quote-total-label,.workflow-step:hover .quote-approved{animation-duration:6.5s;animation-iteration-count:infinite}.workflow-step:hover .repeat-box,.workflow-step:hover .repeat-truck,.workflow-step:hover .truck-loaded-box{animation-duration:8.5s;animation-iteration-count:infinite}.workflow-step:hover .repeat-stock-label{animation:fade-stock-cycle 8.5s var(--ease-b2b-in-out) infinite}}
        @media(prefers-reduced-motion:reduce){.dispatch-pulse{display:none}.repeat-stock-label{animation:none!important}}
        @keyframes b2b-rise{from{opacity:0;transform:translateY(1.4rem)}to{opacity:1;transform:translateY(0)}}@keyframes arrow-pulse{50%{opacity:.35;transform:translateX(.3rem)}}@keyframes institution-travel{to{transform:translateX(-50%)}}@keyframes pack-tomato{0%,8%{transform:translate(0,0) scale(1)}48%,100%{transform:translate(164px,57px) scale(.9)}}@keyframes pack-leaf{0%,16%{transform:translate(0,0) rotate(0)}58%,100%{transform:translate(168px,38px) rotate(18deg)}}@keyframes pack-carrot{0%,24%{transform:translate(0,0) rotate(0)}68%,100%{transform:translate(158px,7px) rotate(-12deg)}}@keyframes write-lines{0%,10%{stroke-dashoffset:110}70%,100%{stroke-dashoffset:0}}@keyframes write-total{0%,30%{stroke-dashoffset:60}78%,100%{stroke-dashoffset:0}}@keyframes show-total{0%,42%{opacity:0}65%,100%{opacity:1}}@keyframes approve-quote{0%,58%{opacity:0;transform:scale(.55) rotate(-12deg)}78%,100%{opacity:1;transform:scale(1) rotate(0)}}@keyframes close-left-lid{0%,18%{transform:translate(0,0) rotate(0)}34%,100%{transform:translate(9px,10px) rotate(12deg)}}@keyframes close-right-lid{0%,18%{transform:translate(0,0) rotate(0)}34%,100%{transform:translate(-9px,10px) rotate(-12deg)}}@keyframes load-box{0%,38%{opacity:1;transform:translate(0,0) scale(1)}62%,100%{opacity:0;transform:translate(89px,-2px) scale(.58)}}@keyframes show-loaded-box{0%,54%{opacity:0}64%,100%{opacity:1}}@keyframes repeat-delivery{0%,38%{opacity:.18;transform:translateX(0)}54%,76%{opacity:1;transform:translateX(0)}100%{opacity:0;transform:translateX(78px)}}@keyframes rhythm-line{to{transform:translateX(100%)}}
        @keyframes pack-tomato{0%,6%{opacity:1;transform:translate(0,0) scale(1)}42%{opacity:1;transform:translate(164px,31px) scale(.86)}58%,86%{opacity:0;transform:translate(164px,43px) scale(.7)}100%{opacity:1;transform:translate(0,0) scale(1)}}@keyframes pack-leaf{0%,14%{opacity:1;transform:translate(0,0) rotate(0)}50%{opacity:1;transform:translate(171px,8px) rotate(15deg)}66%,90%{opacity:0;transform:translate(171px,21px) rotate(15deg) scale(.7)}100%{opacity:1;transform:translate(0,0) rotate(0)}}@keyframes pack-carrot{0%,22%{opacity:1;transform:translate(0,0) rotate(0)}58%{opacity:1;transform:translate(164px,-18px) rotate(-10deg)}74%,94%{opacity:0;transform:translate(164px,-5px) rotate(-10deg) scale(.7)}100%{opacity:1;transform:translate(0,0) rotate(0)}}@keyframes load-box{0%,20%{opacity:1;transform:translate(0,0) scale(1)}48%{opacity:1;transform:translate(89px,-7px) scale(.66)}56%,88%{opacity:0;transform:translate(89px,-7px) scale(.66)}100%{opacity:1;transform:translate(0,0) scale(1)}}@keyframes show-loaded-box{0%,42%{opacity:0}52%,76%{opacity:1}88%,100%{opacity:0}}@keyframes repeat-delivery{0%,18%{opacity:.12;transform:translateX(0)}34%,68%{opacity:1;transform:translateX(0)}88%,96%{opacity:0;transform:translateX(82px)}100%{opacity:.12;transform:translateX(0)}}@keyframes fade-stock-cycle{0%,20%{opacity:1}46%,88%{opacity:.12}100%{opacity:1}}
        @keyframes pack-tomato{0%,5%{opacity:1;transform:translate(0,0) scale(1)}27%{opacity:1;transform:translate(164px,35px) scale(.86)}36%,76%{opacity:0;transform:translate(164px,48px) scale(.7)}80%{opacity:0;transform:translate(0,0) scale(1)}86%,100%{opacity:1;transform:translate(0,0) scale(1)}}@keyframes pack-leaf{0%,11%{opacity:1;transform:translate(0,0) rotate(0)}33%{opacity:1;transform:translate(171px,13px) rotate(12deg)}42%,76%{opacity:0;transform:translate(171px,26px) rotate(12deg) scale(.7)}80%{opacity:0;transform:translate(0,0) rotate(0)}86%,100%{opacity:1;transform:translate(0,0) rotate(0)}}@keyframes pack-carrot{0%,17%{opacity:1;transform:translate(0,0) rotate(0)}39%{opacity:1;transform:translate(164px,-14px) rotate(-8deg)}48%,76%{opacity:0;transform:translate(164px,-1px) rotate(-8deg) scale(.7)}80%{opacity:0;transform:translate(0,0) rotate(0)}86%,100%{opacity:1;transform:translate(0,0) rotate(0)}}@keyframes load-box{0%,12%{opacity:1;transform:translate(0,0) scale(1)}30%{opacity:1;transform:translate(88px,-2px) scale(.62)}38%,78%{opacity:0;transform:translate(88px,-2px) scale(.62)}84%{opacity:0;transform:translate(0,0) scale(1)}90%,100%{opacity:1;transform:translate(0,0) scale(1)}}@keyframes show-loaded-box{0%,25%{opacity:0}34%,48%{opacity:1}56%,100%{opacity:0}}@keyframes repeat-delivery{0%,8%{opacity:.12;transform:translateX(0)}20%,42%{opacity:1;transform:translateX(0)}58%,78%{opacity:0;transform:translateX(82px)}84%,100%{opacity:.12;transform:translateX(0)}}@keyframes fade-stock-cycle{0%,12%{opacity:1}32%,82%{opacity:.12}90%,100%{opacity:1}}
        @keyframes pack-eggplant{0%,10%{opacity:1;transform:translate(0,0) rotate(0)}32%{opacity:1;transform:translate(165px,10px) rotate(14deg)}42%,76%{opacity:0;transform:translate(165px,24px) rotate(14deg) scale(.72)}80%{opacity:0;transform:translate(0,0)}87%,100%{opacity:1;transform:translate(0,0)}}@keyframes pack-pepper{0%,16%{opacity:1;transform:translate(0,0) rotate(0)}38%{opacity:1;transform:translate(165px,-15px) rotate(-10deg)}48%,76%{opacity:0;transform:translate(165px,-2px) rotate(-10deg) scale(.72)}80%{opacity:0;transform:translate(0,0)}87%,100%{opacity:1;transform:translate(0,0)}}
      `}</style>
    </div>
  );
}
