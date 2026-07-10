import Link from "next/link";
import { LessonCard } from "@/components/lesson-card";
import { lessonSummaries } from "@/content/lessons";

const categories = [
  { icon: "◫", title: "Frontend & web", detail: "Browsers, DNS, CDNs and request lifecycles", tone: "blue" },
  { icon: "⌁", title: "Backend & data", detail: "APIs, caching, databases and async work", tone: "violet" },
  { icon: "⇧", title: "Deploy & scale", detail: "CI/CD, containers, replicas and telemetry", tone: "orange" },
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero shell">
        <div className="hero__copy">
          <div className="eyebrow"><span /> Visual systems learning</div>
          <h1>See how software<br /><em>actually works.</em></h1>
          <p className="hero__lead">Trace real requests across frontend, backend, data, infrastructure, and production—one clear step at a time.</p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/architect/">Design a stack <span aria-hidden="true">→</span></Link>
            <Link className="button button--ghost" href="/learn/">Browse all lessons</Link>
          </div>
          <dl className="hero__stats">
            <div><dt>06</dt><dd>guided systems</dd></div>
            <div><dt>20</dt><dd>core concepts</dd></div>
            <div><dt>03</dt><dd>levels of depth</dd></div>
          </dl>
        </div>

        <div className="hero-map" aria-label="Example sign-in architecture">
          <div className="hero-map__chrome">
            <span>LIVE SYSTEM MAP</span>
            <span className="live-dot">STEP 03 / 05</span>
          </div>
          <div className="hero-map__canvas">
            <div className="map-node map-node--browser"><span>01</span><strong>Browser</strong><small>Client</small></div>
            <div className="map-line map-line--one"><span /></div>
            <div className="map-node map-node--api"><span>02</span><strong>Auth API</strong><small>Service</small></div>
            <div className="map-line map-line--two"><span /></div>
            <div className="map-node map-node--identity is-active"><span>03</span><strong>Identity</strong><small>Verify</small></div>
            <div className="map-line map-line--three"><span /></div>
            <div className="map-node map-node--database"><span>04</span><strong>User DB</strong><small>Data</small></div>
            <div className="hero-map__pulse"><span>ACTIVE FLOW</span><strong>Verifying identity</strong><small>The service checks a secure password verifier.</small></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Topics covered">
        <span>FOLLOW THE FLOW</span><i /><span>INSPECT EVERY LAYER</span><i /><span>LEARN THE TRADE-OFFS</span><i /><span>BUILD BETTER MENTAL MODELS</span>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div><span className="section-index">01 / START HERE</span><h2>Learn through real scenarios.</h2></div>
          <p>Not a wall of definitions. Every lesson begins with a familiar action and reveals the system behind it.</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <article className={`category-card category-card--${category.tone}`} key={category.title}>
              <span className="category-card__icon" aria-hidden="true">{category.icon}</span>
              <h3>{category.title}</h3><p>{category.detail}</p><span className="category-card__arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--ink">
        <div className="shell">
          <div className="section-heading section-heading--light">
            <div><span className="section-index">02 / GUIDED FLOWS</span><h2>Start with the whole picture.</h2></div>
            <Link className="text-link" href="/learn/">View all lessons <span>→</span></Link>
          </div>
          <div className="lesson-grid">
            {lessonSummaries.slice(0, 3).map((lesson, index) => <LessonCard lesson={lesson} index={index + 1} key={lesson.slug} dark />)}
          </div>
        </div>
      </section>

      <section className="section shell closing-cta">
        <div><span className="section-index">NO BLACK BOXES</span><h2>Understand the system.<br />Then change it with confidence.</h2></div>
        <Link className="button button--primary" href="/learn/">Choose your first flow <span>→</span></Link>
      </section>
    </main>
  );
}
