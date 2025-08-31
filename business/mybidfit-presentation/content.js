// MyBidFit Presentation Content
// Edit this file to update slide content - no code knowledge needed!
// Just change the text between the quotes and save

const presentationContent = {
  // Presentation metadata
  meta: {
    title: "MyBidFit - Win the Work You Were Built For",
    author: "Derek Johnson",
    company: "Ekow Solutions Group",
    contact: {
      email: "derek@mybidfit.com",
      phone: "404-245-7020"
    },
    branding: {
      primaryColor: "#1e3a8a", // Deep blue
      accentColor: "#3b82f6",  // Bright blue
      logoUrl: "assets/mybidfit-logo.svg"
    }
  },

  // Slide content - edit text here to update presentation
  slides: [
    {
      id: "title",
      type: "hero",
      title: "Win the work you were built for",
      subtitle: "CBE LIFT: Daraja Final Report | Ekow Solutions Group",
      author: "Derek Johnson",
      visual: "hero-gradient"
    },

    {
      id: "problem",
      type: "statement",
      title: "You can't get fired hiring... The Big Guys",
      content: [
        "Except,... he did. ~300M later, CTO out, org deflated",
        "The shift from massive multi-year service engagements has happened",
        "Customers want more specialization", 
        "Large consulting is getting lean, but losing talent",
        "The need will only intensify over the near future"
      ],
      visual: "impact-statement"
    },

    {
      id: "customer-pain",
      type: "pain-points",
      title: "Where my customers feel the pain",
      painPoints: [
        {
          category: "Prospecting",
          quote: "If you could help me find new opportunities, I'm in!",
          source: "Jonathan Williams, West Monroe",
          icon: "search"
        },
        {
          category: "Qualification", 
          quote: "I can make Salesforce do almost everything I need.",
          source: "David Paolini, Better World Analytics",
          icon: "filter"
        },
        {
          category: "Needs Assessment",
          quote: "Help me get to the places my buyers are, and I'll do the rest!",
          source: "Melanie Bashir, Amazon Recycling Partner", 
          icon: "target"
        },
        {
          category: "Proposal & Contracting",
          quote: "Getting contracts in order are the worst part of my job, every SOW is so unique and takes forever!",
          source: "Denise Reese, KPMG",
          icon: "document"
        },
        {
          category: "Solutioning",
          quote: "",
          source: "",
          icon: "lightbulb"
        },
        {
          category: "Close & Follow-up", 
          quote: "",
          source: "",
          icon: "handshake"
        }
      ],
      visual: "circular-diagram"
    },

    {
      id: "timing",
      type: "why-now",
      title: "Why MyBidFit is needed now",
      reasons: [
        "With the ability to build and connect being at hyper-speed, understanding Fit is more critical than ever",
        "The path for many small and especially diverse suppliers is experiencing increased friction", 
        "Partnerships are a critical ingredient to creating stability and scale needed to thrive in the enterprise"
      ],
      visual: "urgency-indicators"
    },

    {
      id: "target-customers",
      type: "audience",
      title: "Who needs it?",
      segments: [
        "Sales leaders at SMB Manage Service providers find themselves swimming against a tide of sameness and decreasing margins",
        "CEOs and Partnership development teams struggle to identify or distinguish potential partners",
        "Procurement buyers have niche purchase needs that are often difficult to source amidst the sea of spam"
      ],
      visual: "customer-segments"
    },

    {
      id: "solution",
      type: "product-demo",
      title: "What is it?",
      features: [
        "Dynamic Perspective-based discovery Platform – to show companies where their best opportunities are, as a function of their strength",
        "Makes 'fit' measurable and transparent", 
        "Facilitates strategic partnerships and brings new energy to business ecosystems"
      ],
      demoImage: "platform-screenshot",
      visual: "product-showcase"
    },

    {
      id: "where-when",
      type: "impact",
      title: "Where & When",
      message: {
        where: "Right here!",
        when: "Right now!"
      },
      visual: "call-to-action"
    },

    {
      id: "numbers",
      type: "metrics",
      title: "Game of Numbers", 
      // Note: Content missing from original - placeholder for key metrics
      metrics: [
        { label: "Total Addressable Market", value: "$2.4B", description: "SMB service providers" },
        { label: "Target Market Size", value: "12,000", description: "Atlanta MSPs and service SMBs" },
        { label: "Average Deal Size", value: "$2,200", description: "Annual subscription" }
      ],
      visual: "animated-counters"
    },

    {
      id: "channel-strategy", 
      type: "flow-diagram",
      title: "Channel Strategy",
      description: "To reach our customer, we plan to provide a SAAS product, with potential for immediate impact, through the following distribution channel:",
      channels: [
        { name: "MyBidFit", type: "source", revenue: "" },
        { name: "Direct Sales", type: "primary", revenue: "15%" },
        { name: "Affiliate/Referral partners", type: "secondary", revenue: "10%" },
        { name: "MSPs/Trade org/Chambers", type: "secondary", revenue: "10%" },
        { name: "SMB Sales leaders", type: "target", revenue: "10%" }
      ],
      visual: "channel-flow"
    },

    {
      id: "customer-journey",
      type: "journey-map", 
      title: "Customer Lifecycle Journey",
      description: "Here is an example of the typical lifecycle journey for our customer",
      journey: [
        "Local TAG or Chamber event",
        "Discovery call",
        "Custom Demo", 
        "Pilot Program",
        "Sale",
        "Strategic Consulting",
        "Sale w/ training",
        "QBRs, showcase new features",
        "Churn"
      ],
      metrics: {
        salesCycle: "3-6 months",
        ltv: "4 years"
      },
      visual: "journey-flow"
    },

    {
      id: "acquisition",
      type: "strategy",
      title: "Acquisition Strategy",
      description: "We plan to pursue for Sales leaders at Metro Atlanta MSPs and small service oriented SMBs to provide them with MyBidFit so they can transform their business from a commoditized IT response vehicle to a proactive strategic partner.",
      strategy: {
        phases: [
          "Phase 1: Founder-led sales targeting the Atlanta MSP community via local events and targeted outreach.",
          "Phase 2: Convert successful pilot customers into the first MSP reseller partners.", 
          "Phase 3 (Scale): Layer on broader partnerships like affiliate networks and trade organizations"
        ],
        metrics: {
          ltvCacRatio: "8.4 : 1",
          ltv: "$8,800",
          cac: "$1047", 
          paybackPeriod: "5.2 Months"
        },
        keyNeeds: [
          "Execute Beachhead Strategy: Focus on Atlanta MSP segment to maximize capital efficiency and accelerate market learning.",
          "Validate the Persona & Value Prop: Acquire the first 10-15 paying pilot customers to prove that MyBidFit solves the core business pains of the MSP or SMB Sales Leader.",
          "Founder-Led Sales: The founding team must lead the initial sales motion to ensure the market feedback loop is direct, unfiltered, and actionable for product development.",
          "Achieve Retention Targets: Deliver a strong onboarding and customer success experience to minimize churn, which is critical to validating the 4+ year LTV projection."
        ]
      },
      visual: "acquisition-plan"
    },

    {
      id: "roadmap",
      type: "timeline",
      title: "12-month targets & roadmap", 
      milestones: [
        { period: "Q3", targets: "10 pilots, 6 paid; 3 case studies; 1 MSP reseller partner." },
        { period: "Q4", targets: "20 net new, 12 paid; 3 partners; first affiliate cohort." },
        { period: "Q1–Q2 '26", targets: "60 net new, expand beyond ATL; churn < 6%; ARR milestones tied to partner lift." }
      ],
      revenue: {
        product: "$80k",
        services: "$40k", 
        timeframe: "next 12 months",
        location: "Atlanta"
      },
      visual: "roadmap-timeline"
    },

    {
      id: "ask",
      type: "investment-ask",
      title: "What we're asking for",
      asks: [
        {
          category: "Investment",
          description: "$500k, to support expansion of sales team and continued product development",
          icon: "dollar"
        },
        {
          category: "Introductions", 
          description: "Warm intros to MSP sales leaders and ATL trade orgs.",
          icon: "network"
        },
        {
          category: "Customer Discovery",
          description: "Connections to small business leaders to continue customer discovery to guide roadmap",
          icon: "users"
        },
        {
          category: "Alpha Testers",
          description: "Alpha testers to explore the core supplier features, even B2C companies qualify", 
          icon: "test"
        },
        {
          category: "Partnerships",
          description: "Partner conversations for co-selling and distribution.",
          icon: "handshake"
        }
      ],
      visual: "investment-cards"
    },

    {
      id: "thank-you",
      type: "contact",
      title: "Thank you",
      contact: {
        name: "Derek Johnson",
        email: "derek@mybidfit.com",
        phone: "404-245-7020"
      },
      visual: "elegant-close"
    }
  ]
};

// Export for use in presentation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = presentationContent;
}