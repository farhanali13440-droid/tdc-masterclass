import { createFileRoute } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Activity,
  Apple,
  Brain,
  Check,
  Clock3,
  Croissant,
  Drumstick,
  Eye,
  Footprints,
  Globe,
  HeartPulse,
  Leaf,
  MessageCircle,
  MonitorPlay,
  Nut,
  Scale,
  Stethoscope,
  Timer,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";

import bodyDiagram from "@/assets/body-diagram.png";
import foodPlate from "@/assets/food-plate.jpg";
import heroImage from "@/assets/hero-diabetes.jpg";
import storyImage from "@/assets/story-ahmed.jpg";
import walkingFamily from "@/assets/walking-family.jpg";
import {
  CtaButton,
  Eyebrow,
  Section,
  SectionHeading,
  TdcLogo,
  UrduLine,
} from "@/components/tdc/brand";
import { SiteFooter, SiteHeader, StickyMobileCta } from "@/components/tdc/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diabetes Control Masterclass | The Diabetes Centre Pakistan" },
      {
        name: "description",
        content:
          "Join The Diabetes Centre Pakistan's Diabetes Control Masterclass and learn about diabetes, blood sugar, nutrition, food choices, exercise and healthier lifestyle strategies.",
      },
      {
        property: "og:title",
        content: "Diabetes Control Masterclass | The Diabetes Centre Pakistan",
      },
      {
        property: "og:description",
        content:
          "A live online masterclass on diabetes, food, blood sugar, exercise and healthier daily choices. Registration PKR 499.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Diabetes Control Masterclass",
          description:
            "A live online educational masterclass on diabetes, food, blood sugar, exercise and healthier lifestyle choices.",
          provider: {
            "@type": "Organization",
            name: "The Diabetes Centre Pakistan",
          },
          offers: {
            "@type": "Offer",
            price: "499",
            priceCurrency: "PKR",
            category: "Registration",
          },
        }),
      },
    ],
  }),
  component: SalesPage,
});

const eventDetails = [
  { icon: MonitorPlay, label: "Format", value: "Live Masterclass" },
  { icon: Globe, label: "Platform", value: "Online" },
  { icon: Clock3, label: "Duration", value: "To be announced" },
  { icon: Stethoscope, label: "Hosted by", value: "The Diabetes Centre Pakistan" },
  { icon: Wallet, label: "Registration Fee", value: "PKR 499" },
];

const painPoints = [
  {
    icon: HeartPulse,
    title: "Worry about complications",
    body: "You have heard how diabetes can affect the eyes, kidneys, heart and feet — and it worries you.",
  },
  {
    icon: Utensils,
    title: "Confusion about food",
    body: "Rice or roti? Fruit or no fruit? Everyone gives different advice and none of it feels reliable.",
  },
  {
    icon: Stethoscope,
    title: "Feeling dependent on medication",
    body: "You take your medicines, but you never learned what else influences your blood sugar.",
  },
  {
    icon: TrendingUp,
    title: "Blood sugar keeps moving up",
    body: "Your readings and reports keep drifting in the wrong direction and you don't know why.",
  },
  {
    icon: Scale,
    title: "Weight that won't settle",
    body: "Weight gain around the waist makes daily control feel even harder.",
  },
  {
    icon: Brain,
    title: "Uncertainty about the future",
    body: "You think about your family and wonder what your health will look like in ten years.",
  },
  {
    icon: Activity,
    title: "No clear method",
    body: "Nobody ever sat you down and explained how diabetes, food and movement actually connect.",
  },
];

const storyTimeline = [
  {
    step: "01",
    title: "A routine camp",
    body: "Mr. Ahmed, 42, an office worker, gets his blood sugar checked at a health camp. The reading is 280 mg/dL.",
  },
  {
    step: "02",
    title: "The dismissal",
    body: "He assumes it is a mistake — maybe he ate something sweet, maybe the machine was wrong. He goes back to his routine.",
  },
  {
    step: "03",
    title: "The diagnosis",
    body: "Later he learns the truth: Type 2 Diabetes. The number was not a mistake. It was a message.",
  },
  {
    step: "04",
    title: "The turning point",
    body: "Knowing changes everything, because now something can actually be done differently.",
  },
];

const organs = [
  { icon: Eye, name: "Eyes", body: "Vision can be affected over time when blood sugar stays high." },
  { icon: Activity, name: "Kidneys", body: "The kidneys filter blood every day and can be placed under strain." },
  { icon: HeartPulse, name: "Heart", body: "Long-term high blood sugar is linked to increased cardiovascular risk." },
  { icon: Footprints, name: "Feet", body: "Nerve and circulation changes can make foot problems more likely." },
  { icon: Brain, name: "Brain", body: "Overall vascular health can affect the brain as well." },
];

const shifts = [
  { from: "Confusion", to: "Knowledge" },
  { from: "Poor habits", to: "Better habits" },
  { from: "Fear", to: "Control" },
  { from: "Inactivity", to: "Movement" },
  { from: "Unbalanced food", to: "Better food choices" },
];

const modules = [
  { n: "01", title: "Understanding Diabetes", body: "Understand diabetes and the different types of diabetes." },
  { n: "02", title: "The Science of Diabetes", body: "Understand the relationship between insulin, blood sugar and diabetes." },
  { n: "03", title: "The Science of Food", body: "Learn how carbohydrates, protein and fats work." },
  { n: "04", title: "Food & Blood Sugar", body: "Understand how different foods can affect blood sugar levels." },
  { n: "05", title: "Fast Carbs vs Slow Carbs", body: "Understand simple and complex carbohydrate sources." },
  { n: "06", title: "Understanding Your Plate", body: "Explore practical food choices and macronutrients." },
  { n: "07", title: "Science of Exercise", body: "Understand the importance of movement and exercise in diabetes management." },
  { n: "08", title: "Science of Healthy Eating", body: "Understand healthier approaches to eating and blood sugar management." },
  { n: "09", title: "Intermittent Fasting", body: "Introduce the concept of eating and fasting windows as presented in the masterclass." },
];

const macros = [
  {
    icon: Croissant,
    name: "Carbohydrates",
    body: "The macronutrient with the most direct effect on blood sugar. The masterclass explains simple (fast) and complex (slow) carbohydrate sources.",
  },
  {
    icon: Drumstick,
    name: "Protein",
    body: "Understand the role protein plays in the plate and how it fits into everyday meals.",
  },
  {
    icon: Nut,
    name: "Fats",
    body: "Learn how fats work as a macronutrient and how they belong in a balanced plate.",
  },
];

const foods = [
  { group: "Mostly carbohydrate", items: ["Rice", "Wheat / roti", "Potato"], icon: Croissant },
  { group: "Mostly protein", items: ["Eggs", "Chicken", "Fish"], icon: Drumstick },
  { group: "Fibre-rich choices", items: ["Vegetables", "Fruits"], icon: Leaf },
  { group: "Fats & mixed", items: ["Nuts", "Seeds"], icon: Nut },
];

const audiences = [
  "People living with diabetes",
  "People concerned about their blood sugar",
  "People who want to understand diabetes better",
  "People struggling with everyday food choices",
  "People who want to understand healthy eating",
  "People who want to learn about lifestyle and diabetes management",
];

const takeaways = [
  "A better understanding of diabetes",
  "A better understanding of food and blood sugar",
  "An understanding of macronutrients",
  "An understanding of healthier food choices",
  "An understanding of exercise and movement",
  "Better awareness of diabetes complications",
  "Practical knowledge for making better daily choices",
];

const included = [
  { icon: MonitorPlay, title: "Live Masterclass", body: "Attend the live online session hosted by TDC." },
  { icon: Stethoscope, title: "Diabetes education", body: "What diabetes is and how the types differ." },
  { icon: Utensils, title: "Food & blood sugar education", body: "How different foods can affect your readings." },
  { icon: Apple, title: "Macronutrient education", body: "Carbohydrates, protein and fats explained simply." },
  { icon: Activity, title: "Exercise education", body: "Why movement matters in diabetes management." },
  { icon: Leaf, title: "Healthy eating education", body: "Healthier approaches to everyday eating." },
  { icon: Check, title: "Practical control knowledge", body: "Turning understanding into daily choices." },
  { icon: Users, title: "The masterclass experience", body: "Access to the full masterclass session." },
];

const programFeatures = [
  { icon: Stethoscope, label: "Doctors" },
  { icon: Apple, label: "Nutritionists" },
  { icon: Activity, label: "Lifestyle coaches" },
  { icon: Users, label: "Doctor consultation" },
  { icon: MessageCircle, label: "Counseling" },
  { icon: Timer, label: "Weekly counseling sessions" },
  { icon: HeartPulse, label: "Medical-team support" },
  { icon: MessageCircle, label: "WhatsApp support" },
  { icon: MonitorPlay, label: "Virtual meetups" },
];

const faqs = [
  {
    q: "What is the Diabetes Control Masterclass?",
    a: "It is a live online educational masterclass by The Diabetes Centre Pakistan covering diabetes, the science of food, blood sugar, exercise, healthy eating and practical strategies for better daily control.",
  },
  {
    q: "Who should attend?",
    a: "People living with diabetes, people concerned about their blood sugar, and anyone who wants to understand diabetes, food and lifestyle better.",
  },
  {
    q: "Is this suitable for people with Type 2 diabetes?",
    a: "Yes. The masterclass covers diabetes and its types, and the education is relevant for people living with Type 2 diabetes as well as those who want to understand their risk better.",
  },
  {
    q: "Will this masterclass replace my doctor's treatment?",
    a: "No. This is an educational masterclass and does not replace individual medical diagnosis, treatment or medical advice. Continue to follow your own healthcare professional's guidance.",
  },
  {
    q: "Will I be told to stop my medication?",
    a: "No. Any change to prescribed medication should only be made under appropriate medical supervision by your treating healthcare professional.",
  },
  {
    q: "What will I learn?",
    a: "Understanding diabetes and its types, the relationship between insulin and blood sugar, the science of food, how foods affect blood sugar, fast vs slow carbohydrates, understanding your plate, the science of exercise, healthy eating and the concept of intermittent fasting as presented in the masterclass.",
  },
  {
    q: "How much does registration cost?",
    a: "Registration is PKR 499.",
  },
  {
    q: "How do I register?",
    a: "Fill in your registration details, pay the registration fee through Easypaisa, upload your payment screenshot and submit the registration form. TDC will verify the payment and provide the next instructions.",
  },
];

function SalesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 sm:pb-0">
        {/* HERO */}
        <section className="relative overflow-hidden bg-soft-gradient px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
            <div className="reveal flex flex-col items-start gap-6">
              <Eyebrow>Live Health Education Masterclass</Eyebrow>
              <h1 className="text-balance text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl lg:text-6xl">
                Diabetes Control <span className="text-gradient-brand">Masterclass</span>
              </h1>
              <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Understand your diabetes. Learn how food, lifestyle and daily choices affect your
                blood sugar — and discover practical strategies to take control of your health.
              </p>
              <UrduLine>اپنی صحت کو سمجھیے، اپنی زندگی کو بہتر بنائیے۔</UrduLine>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <CtaButton event="hero">JOIN THE MASTERCLASS — PKR 499</CtaButton>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-2">
                <TdcLogo />
                <span className="text-sm font-semibold text-muted-foreground">
                  A masterclass by The Diabetes Centre Pakistan
                </span>
              </div>

            </div>
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-brand-gradient opacity-15 blur-2xl" />
              <img
                src={heroImage}
                alt="A man with diabetes sitting with a glucose meter and a balanced plate of food at a clinic"
                width={1600}
                height={1200}
                className="aspect-4/3 w-full rounded-[2rem] object-cover shadow-float"
              />
            </div>
          </div>
        </section>

        {/* EVENT DETAILS */}
        <Section tone="plain">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <Eyebrow>Masterclass Details</Eyebrow>
                <h2 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">
                  Diabetes Control Masterclass
                </h2>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {eventDetails.map((item) => (
                    <div
                      key={item.label}
                      className="flex min-w-0 items-start gap-3 rounded-2xl bg-tint p-4"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background text-brand">
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd className="text-sm font-bold text-navy">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Date, time and duration will be confirmed by The Diabetes Centre Pakistan.
                </p>
              </div>
              <div className="lg:w-64">
                <CtaButton event="details" className="w-full">
                  Reserve My Seat — PKR 499
                </CtaButton>
              </div>
            </div>
          </div>
        </Section>

        {/* PAIN AWARENESS */}
        <Section tone="tint">
          <SectionHeading
            eyebrow="The Honest Question"
            title="Are You Really in Control of Your Diabetes?"
            intro="Diabetes does not have to control every decision about food, lifestyle and daily life. But control begins with understanding."
          />
          <UrduLine className="-mt-6 mb-10 text-center">
            اپنی زندگی کا کنٹرول دوبارہ اپنے ہاتھ میں لیجیے!
          </UrduLine>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((point) => (
              <li
                key={point.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-3xl border border-border bg-card p-5 shadow-card"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-tint text-brand">
                  <point.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-navy">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex justify-center">
            <CtaButton event="pain">Join the Diabetes Control Masterclass</CtaButton>
          </div>
        </Section>

        {/* STORY */}
        <Section>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
            <img
              src={storyImage}
              alt="A man in his forties holding a medical report and looking thoughtfully out of a window"
              width={1408}
              height={1008}
              loading="lazy"
              className="aspect-4/3 w-full rounded-[2rem] object-cover shadow-card"
            />
            <div>
              <SectionHeading
                eyebrow="A Familiar Story"
                title="When Life Suddenly Changed"
                align="left"
              />
              <ol className="space-y-4">
                {storyTimeline.map((item) => (
                  <li key={item.step} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                    <div className="flex flex-col items-center">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground">
                        {item.step}
                      </span>
                      <span className="mt-1 w-px flex-1 bg-border" />
                    </div>
                    <div className="min-w-0 pb-4">
                      <h3 className="text-base font-bold text-navy">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <blockquote className="mt-4 rounded-3xl bg-tint p-6 text-lg font-bold leading-snug text-navy">
                “The day you know, is the day you can change everything.”
              </blockquote>
            </div>
          </div>
        </Section>

        {/* PRICE OF IGNORING */}
        <Section tone="navy">
          <SectionHeading
            variant="inverse"
            eyebrow="Why It Matters"
            title="The Price of Ignoring Diabetes"
            intro="Mrs. Farah knew her sugar was high. Life was busy, so the reports were set aside for another day. Over time, uncontrolled diabetes can increase the risk of serious complications."
          />
          <UrduLine variant="inverse" className="-mt-8 mb-10 text-center">
            آج کی لاپرواہی کل کا پچھتاوا نہ بن جائے۔
          </UrduLine>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {organs.map((organ) => (
              <li
                key={organ.name}
                className="rounded-3xl bg-navy-foreground/10 p-5 ring-1 ring-navy-foreground/15 backdrop-blur-sm"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy-foreground/15">
                  <organ.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold">{organ.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-navy-foreground/80">{organ.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-navy-foreground/75">
            Educational information only — this is not a prediction about any individual.
          </p>
        </Section>

        {/* MOMENT OF CHOICE */}
        <Section tone="tint">
          <SectionHeading
            eyebrow="Every Day, Many Times"
            title="The Moment of Choice"
            intro="Every meal and every lifestyle decision can become an opportunity to make a healthier choice."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {shifts.map((shift) => (
              <div
                key={shift.from}
                className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-5 text-center shadow-card"
              >
                <span className="text-sm font-semibold text-muted-foreground line-through">
                  {shift.from}
                </span>
                <span className="text-brand" aria-hidden="true">
                  ↓
                </span>
                <span className="text-base font-extrabold text-navy">{shift.to}</span>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-2xl font-extrabold text-navy sm:text-3xl">
            Your next choice matters.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaButton event="choice">Join the Diabetes Control Masterclass</CtaButton>
          </div>
        </Section>

        {/* CURRICULUM */}
        <Section id="curriculum">
          <SectionHeading
            eyebrow="The Curriculum"
            title="What You'll Learn Inside the Diabetes Control Masterclass"
            intro="Nine focused modules that take you from understanding diabetes to understanding your plate, your movement and your daily choices."
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <li
                key={module.n}
                className="group rounded-3xl border border-border bg-card p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="text-4xl font-extrabold text-tint-strong transition-colors group-hover:text-brand/30">
                  {module.n}
                </span>
                <h3 className="mt-2 text-lg font-bold text-navy">{module.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{module.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* MACROS + FOOD */}
        <Section tone="tint">
          <SectionHeading
            eyebrow="The Science of Food"
            title="Three Macronutrients. One Plate."
            intro="Before you can manage blood sugar, it helps to know what is actually on your plate."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {macros.map((macro) => (
              <div key={macro.name} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground">
                  <macro.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy">{macro.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{macro.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            <img
              src={foodPlate}
              alt="Everyday Pakistani foods including roti, rice, lentils, chicken, fish, vegetables, eggs, nuts and seeds"
              width={1408}
              height={1008}
              loading="lazy"
              className="aspect-4/3 w-full rounded-[2rem] object-cover shadow-card"
            />
            <div>
              <h3 className="text-2xl font-extrabold text-navy">Everyday foods, explained</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The masterclass walks through familiar foods and where they sit on the plate — so
                the next decision feels informed instead of confusing.
              </p>
              <Accordion type="single" collapsible className="mt-6">
                {foods.map((food) => (
                  <AccordionItem key={food.group} value={food.group} className="border-border">
                    <AccordionTrigger className="text-left text-base font-bold text-navy hover:no-underline">
                      <span className="flex min-w-0 items-center gap-3">
                        <food.icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                        {food.group}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex flex-wrap gap-2">
                        {food.items.map((item) => (
                          <li
                            key={item}
                            className="rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-navy shadow-card"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Section>

        {/* ORGANS DIAGRAM */}
        <Section>
          <SectionHeading
            eyebrow="Diabetes & Your Body"
            title="How Diabetes Can Affect Your Body"
            intro="Understanding where diabetes can have an impact makes daily choices feel meaningful — not frightening."
          />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
            <div className="space-y-4">
              {organs.slice(0, 2).map((organ) => (
                <OrganCard key={organ.name} {...organ} />
              ))}
            </div>
            <img
              src={bodyDiagram}
              alt="Illustration of a human body highlighting the eyes, brain, heart, kidneys and feet"
              width={912}
              height={1200}
              loading="lazy"
              className="mx-auto h-auto w-56 sm:w-64 lg:w-72"
            />
            <div className="space-y-4">
              {organs.slice(2).map((organ) => (
                <OrganCard key={organ.name} {...organ} />
              ))}
            </div>
          </div>
        </Section>

        {/* BIG QUESTION */}
        <Section tone="navy">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow variant="inverse">The Big Question</Eyebrow>
            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
              Do You Want To Live This Life In The Future?
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-navy-foreground/85 sm:text-lg">
              Delaying action today can have consequences tomorrow. The first step is understanding
              what you can do differently.
            </p>
            <UrduLine variant="inverse" className="mt-6">
              پہلا قدم آج ہی اٹھائیے۔
            </UrduLine>
            <div className="mt-8 flex justify-center">
              <CtaButton event="big-question" variant="light">
                Take The First Step — Join The Masterclass
              </CtaButton>
            </div>
          </div>
        </Section>

        {/* SOLUTION */}
        <Section tone="tint">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <SectionHeading
                align="left"
                eyebrow="The Solution"
                title="You Don't Need More Confusion. You Need Better Understanding."
                intro="The Diabetes Control Masterclass is designed to educate you — clearly and practically — about the things that shape your blood sugar every single day."
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  "Diabetes",
                  "Food",
                  "Blood sugar",
                  "Exercise",
                  "Lifestyle",
                  "Healthy eating",
                  "Practical control strategies",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
                    <Check className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0 text-sm font-semibold text-navy">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <img
              src={walkingFamily}
              alt="A Pakistani family walking together in a park in the evening"
              width={1408}
              height={1008}
              loading="lazy"
              className="aspect-4/3 w-full rounded-[2rem] object-cover shadow-card"
            />
          </div>
        </Section>

        {/* WHY TDC */}
        <Section>
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
              <div className="rounded-3xl bg-tint p-8">
                <TdcLogo />
              </div>
              <div>
                <Eyebrow>Why The Diabetes Centre</Eyebrow>
                <h2 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">
                  A healthcare organisation focused on diabetes care and education
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  The Diabetes Control Masterclass is created and hosted by The Diabetes Centre
                  Pakistan, whose work centres on diabetes care, patient education and helping
                  people understand how food, movement and lifestyle influence blood sugar.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  [Editable placeholder: add TDC's organisation details, team and credentials here.]
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* WHO IT'S FOR */}
        <Section tone="tint">
          <SectionHeading eyebrow="Who It's For" title="Who Should Attend?" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => (
              <li
                key={audience}
                className="flex items-start gap-3 rounded-3xl border border-border bg-card p-5 shadow-card"
              >
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <span className="min-w-0 text-sm font-semibold text-navy">{audience}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            This masterclass is educational and is not a substitute for medical treatment.
          </p>
        </Section>

        {/* TAKEAWAYS */}
        <Section>
          <SectionHeading
            eyebrow="The Transformation"
            title="What You'll Walk Away With"
            intro="Not a list of rules — an understanding you can actually use."
          />
          <ul className="mx-auto grid max-w-3xl gap-3">
            {takeaways.map((item) => (
              <li
                key={item}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-primary-foreground">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-sm font-semibold text-navy sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 90-DAY BRIDGE */}
        <Section tone="tint">
          <div className="rounded-[2rem] border border-brand/20 bg-card p-6 shadow-card sm:p-10">
            <Eyebrow>Next Step — Optional</Eyebrow>
            <h2 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">
              Ready To Go Beyond The Masterclass?
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
              The Diabetes Centre Pakistan also offers a structured 90-Day Low-Carb Program with a
              medical team. It is a separate programme — not part of this masterclass registration.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {programFeatures.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-3 rounded-2xl bg-tint p-3"
                >
                  <feature.icon className="h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <span className="min-w-0 text-sm font-semibold text-navy">{feature.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Details of the 90-day programme are shared separately by the TDC team. Today's
              registration is only for the Diabetes Control Masterclass (PKR 499).
            </p>
          </div>
        </Section>

        {/* WHAT'S INCLUDED */}
        <Section>
          <SectionHeading
            eyebrow="What's Included"
            title="Your Diabetes Control Masterclass Registration Includes"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {included.map((item) => (
              <li key={item.title} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tint text-brand">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* OFFER */}
        <Section tone="tint" id="offer">
          <SectionHeading
            eyebrow="Your Registration"
            title="Take The First Step Towards Better Diabetes Control"
          />
          <div className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-float">
            <div className="bg-brand-gradient p-6 text-center text-navy-foreground">
              <p className="text-sm font-bold uppercase tracking-[0.18em]">
                Diabetes Control Masterclass
              </p>
              <p className="mt-3 text-5xl font-extrabold">PKR 499</p>
              <p className="mt-2 text-sm text-navy-foreground/85">Registration fee</p>
            </div>
            <div className="space-y-4 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Live masterclass access
                </span>
                <span className="text-sm font-bold text-navy">Included</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Full nine-module curriculum
                </span>
                <span className="text-sm font-bold text-navy">Included</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  Masterclass registration
                </span>
                <span className="text-sm font-bold text-brand">PKR 499</span>
              </div>
              <CtaButton event="offer" className="w-full">
                JOIN THE MASTERCLASS FOR PKR 499
              </CtaButton>
              <p className="text-center text-sm text-muted-foreground">
                Secure your registration today.
              </p>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq">
          <SectionHeading eyebrow="Questions" title="Frequently Asked Questions" />
          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-border">
                <AccordionTrigger className="text-left text-base font-bold text-navy hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        {/* FINAL CTA */}
        <Section tone="navy">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <div className="rounded-3xl bg-background/95 px-6 py-4">
              <TdcLogo />
            </div>
            <h2 className="text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
              Take Control. Take The First Step.
            </h2>
            <p className="text-pretty text-base leading-relaxed text-navy-foreground/85 sm:text-lg">
              Your health deserves more than guesswork. Start by understanding diabetes, food,
              blood sugar and lifestyle.
            </p>
            <CtaButton event="final" variant="light">
              JOIN DIABETES CONTROL MASTERCLASS — PKR 499
            </CtaButton>
          </div>
        </Section>
      </main>
      <StickyMobileCta />
      <SiteFooter />
    </div>
  );
}

function OrganCard({
  icon: Icon,
  name,
  body,
}: {
  icon: typeof Eye;
  name: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-3xl border border-border bg-card p-5 shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-tint text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-navy">{name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
